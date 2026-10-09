"use client";

import { Canvas, useLoader, useThree } from "@react-three/fiber";
import {
  forwardRef,
  Suspense,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import {
  ACESFilmicToneMapping,
  AnimationMixer,
  LoopOnce,
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  PerspectiveCamera,
  PMREMGenerator,
  SRGBColorSpace,
  CanvasTexture,
  Vector2,
  type Material,
} from "three";
import type { SceneDocument } from "@mockup-3d/contracts";
import { evaluateSceneAtTime } from "@mockup-3d/scene-domain";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export interface CaptureOptions {
  readonly height: number;
  readonly width: number;
  readonly watermark?: boolean;
}

export interface MockupCanvasHandle {
  capturePng(options: CaptureOptions): Promise<Blob>;
}

export interface RenderModelInput {
  readonly instanceId: string;
  readonly modelUrl: string;
  readonly screenNodeName?: string;
  readonly materialPalette?: Readonly<Record<string, string>>;
  readonly screenCanvas: HTMLCanvasElement;
  readonly additionalScreenCanvases?: Readonly<Record<string, HTMLCanvasElement>>;
  readonly foldAngleDegrees?: number;
}

export interface MockupCanvasProps {
  readonly className?: string;
  readonly models: readonly RenderModelInput[];
  readonly onReady?: () => void;
  readonly onContextLost?: () => void;
  readonly document: SceneDocument;
}

const CaptureBridge = forwardRef<MockupCanvasHandle, object>(function CaptureBridge(_, ref) {
  const { camera, gl, scene, size } = useThree();

  useImperativeHandle(
    ref,
    () => ({
      async capturePng({ height, width, watermark: includeWatermark = false }) {
        if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
          throw new TypeError("Capture dimensions must be positive integers");
        }

        const previousPixelRatio = gl.getPixelRatio();
        const previousSize = gl.getSize(new Vector2());
        const perspectiveCamera = camera instanceof PerspectiveCamera ? camera : null;
        const previousAspect = perspectiveCamera?.aspect;
        const watermark = camera.getObjectByName("preview-watermark");
        const watermarkWasVisible = watermark?.visible;

        let dataUrl: string;
        try {
          if (watermark) watermark.visible = includeWatermark;
          gl.setPixelRatio(1);
          gl.setSize(width, height, false);
          if (perspectiveCamera) {
            perspectiveCamera.aspect = width / height;
            perspectiveCamera.updateProjectionMatrix();
          }
          gl.render(scene, camera);
          dataUrl = gl.domElement.toDataURL("image/png");
        } finally {
          if (watermark && watermarkWasVisible !== undefined) watermark.visible = watermarkWasVisible;
          gl.setPixelRatio(previousPixelRatio);
          gl.setSize(previousSize.x || size.width, previousSize.y || size.height, false);
          if (perspectiveCamera && previousAspect !== undefined) {
            perspectiveCamera.aspect = previousAspect;
            perspectiveCamera.updateProjectionMatrix();
          }
          gl.render(scene, camera);
        }

        return fetch(dataUrl).then((response) => response.blob());
      },
    }),
    [camera, gl, scene, size.height, size.width],
  );

  return null;
});

function PreviewWatermark() {
  const { camera, invalidate, scene, size } = useThree();
  const aspect = size.width / Math.max(1, size.height);
  const texture = useMemo(() => {
    const canvas = window.document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = Math.round(1024 / aspect);
    const context = canvas.getContext("2d")!;
    const extent = Math.hypot(canvas.width, canvas.height);
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate(-Math.PI / 7);
    context.font = "600 38px Arial, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.lineWidth = 2;
    for (let y = -extent; y <= extent; y += 195) {
      for (let x = -extent; x <= extent; x += 350) {
        context.strokeStyle = "rgba(24, 28, 43, 0.32)";
        context.strokeText("FORMA PREVIEW", x + (Math.round(y / 195) % 2) * 175, y);
        context.fillStyle = "rgba(255, 255, 255, 0.48)";
        context.fillText("FORMA PREVIEW", x + (Math.round(y / 195) % 2) * 175, y);
      }
    }
    const result = new CanvasTexture(canvas);
    result.colorSpace = SRGBColorSpace;
    return result;
  }, [aspect]);

  useLayoutEffect(() => {
    const distance = 0.05;
    const fov = camera instanceof PerspectiveCamera ? camera.fov : 32;
    const viewHeight = 2 * Math.tan(fov * Math.PI / 360) * distance;
    const watermark = new Mesh(
      new PlaneGeometry(viewHeight * aspect, viewHeight),
      new MeshBasicMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }),
    );
    watermark.name = "preview-watermark";
    watermark.visible = false;
    watermark.position.z = -distance;
    watermark.renderOrder = 1000;
    const attachedCamera = !camera.parent;
    if (attachedCamera) scene.add(camera);
    camera.add(watermark);
    invalidate();
    return () => {
      camera.remove(watermark);
      if (attachedCamera) scene.remove(camera);
      watermark.geometry.dispose();
      (watermark.material as MeshBasicMaterial).dispose();
      texture.dispose();
      invalidate();
    };
  }, [aspect, camera, invalidate, scene, texture]);

  return null;
}

function CameraRig({ document }: { document: SceneDocument }) {
  const { camera, invalidate, scene, size } = useThree();
  const background = document.appearance.background;
  const from = background.kind === "solid" ? background.color : background.from;
  const to = background.kind === "solid" ? background.color : background.to;
  const angle = background.kind === "solid" ? 0 : background.angleDegrees;
  const gradient = background.kind === "linear-gradient";
  const aspect = size.width / Math.max(1, size.height);

  useLayoutEffect(() => {
    if (!gradient) {
      scene.background = new Color(from);
      invalidate();
      return;
    }
    const canvas = window.document.createElement("canvas");
    canvas.width = Math.round(512 * aspect);
    canvas.height = 512;
    const context = canvas.getContext("2d")!;
    const radians = angle * Math.PI / 180;
    const dx = Math.sin(radians), dy = -Math.cos(radians);
    const length = Math.abs(canvas.width * dx) + Math.abs(canvas.height * dy);
    const fill = context.createLinearGradient(
      canvas.width / 2 - dx * length / 2, canvas.height / 2 - dy * length / 2,
      canvas.width / 2 + dx * length / 2, canvas.height / 2 + dy * length / 2,
    );
    fill.addColorStop(0, from);
    fill.addColorStop(1, to);
    context.fillStyle = fill;
    context.fillRect(0, 0, canvas.width, canvas.height);
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    scene.background = texture;
    invalidate();
    return () => { scene.background = null; texture.dispose(); };
  }, [angle, aspect, from, gradient, invalidate, scene, to]);

  useLayoutEffect(() => {
    camera.position.set(...document.camera.position);
    camera.lookAt(...document.camera.target);
    if (camera instanceof PerspectiveCamera && document.camera.projection === "perspective") camera.fov = document.camera.fovDegrees;
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, document, invalidate, scene]);
  return null;
}

function StudioEnvironment() {
  const { gl, scene, invalidate } = useThree();
  useLayoutEffect(() => {
    const room = new RoomEnvironment();
    const generator = new PMREMGenerator(gl);
    const environment = generator.fromScene(room, 0.04);
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.32;
    room.dispose();
    generator.dispose();
    invalidate();
    return () => { scene.environment = null; environment.dispose(); };
  }, [gl, scene, invalidate]);
  return null;
}

function FixtureModel({ modelUrl, screenNodeName = "Screen", materialPalette, screenCanvas, additionalScreenCanvases, foldAngleDegrees, document, instanceId }: RenderModelInput & { document: SceneDocument }) {
  const { invalidate } = useThree();
  const gltf = useLoader(GLTFLoader, modelUrl);
  const instance = document.instances.find(item => item.instanceId === instanceId);
  if (!instance) throw new Error(`Scene is missing instance ${instanceId}`);
  const styleId = instance.materialVariantId;
  const styled = useMemo(() => {
    const model = cloneSkeleton(gltf.scene);
    const materials: Material[] = [];
    const palette = styleId === "silver" ? { body: "#aeb5c0", ring: "#959daa" } : styleId === "graphite" ? { body: "#343943", ring: "#535b66" } : null;
    model.traverse(child => {
      if (!(child instanceof Mesh) || child.name.startsWith("Screen")) return;
      const delicateSurface = child.name.startsWith("CameraGlass") || child.name.startsWith("AppleEmblem") || child.name === "FlashCover";
      child.castShadow = !delicateSurface;
      child.receiveShadow = !delicateSurface;
      const source = child.material;
      const clone = (material: Material) => {
        // The island and aperture are light-absorbing masks. Keep them black
        // under the studio's bright reflection cards, including PNG capture.
        const copy = material.name === "LensAperture"
          ? new MeshBasicMaterial({ color: "#030407", toneMapped: false })
          : material.clone();
        if (palette && copy instanceof MeshStandardMaterial) {
          if (material.name === "NeutralBody") copy.color.set(palette.body);
          if (material.name === "CameraRing") copy.color.set(palette.ring);
        }
        if (instance.deviceId === "iphone-duo" && copy instanceof MeshStandardMaterial) {
          if (styleId === "night-sky") {
            if (["DuoRearCeramic", "DuoCameraIsland", "DuoCameraDeck"].includes(material.name)) copy.color.set("#1e242f");
            if (["DuoPolishedTrim", "DuoHinge", "DuoSidewall", "DuoMetalTrim"].includes(material.name)) copy.color.set("#3c414b");
          }
          if (styleId === "night-sky" && material.name === "DuoRearEmblem") copy.color.set("#323946");
          if (styleId === "star-white" && material.name === "DuoRearEmblem") copy.color.set("#d5d5d3");
          if (copy.transparent) copy.depthWrite = false;
        }
        if (copy instanceof MeshStandardMaterial && materialPalette?.[material.name]) {
          copy.color.set(materialPalette[material.name]!);
          if (copy.normalMap) copy.normalScale.multiplyScalar(0.35);
        }
        if (copy instanceof MeshStandardMaterial && ["SapphireGlass", "OpticalCoating", "LensAperture"].includes(material.name)) {
          copy.envMapIntensity = 0.08;
          if (copy instanceof MeshPhysicalMaterial) copy.specularIntensity = 0.08;
        }
        if (copy instanceof MeshPhysicalMaterial && material.name === "LensCover") {
          // A thin optical coating keeps the sub-millimeter internal optics
          // sharp. Screen-space transmission blurs this tiny cavity in WebGL.
          // The source GLB retains physically transmissive glass for Blender.
          copy.transmission = 0;
          copy.transparent = true;
          copy.opacity = 0.14;
          copy.depthWrite = false;
          copy.color.set("#5b6b85");
          copy.envMapIntensity = 0.5;
          copy.specularIntensity = 0.35;
        }
        if (copy instanceof MeshStandardMaterial && material.name === "CameraBarrel") {
          copy.envMapIntensity = 0.2;
          if (copy instanceof MeshPhysicalMaterial) copy.specularIntensity = 0.1;
        }
        if (copy instanceof MeshPhysicalMaterial && material.name === "LensCoating") {
          copy.envMapIntensity = 0.18;
          copy.specularIntensity = 0.2;
          copy.clearcoat = 0.2;
          copy.clearcoatRoughness = 0.12;
        }
        materials.push(copy);
        return copy;
      };
      child.material = Array.isArray(source) ? source.map(clone) : clone(source);
    });
    return { model, materials };
  }, [gltf.scene, styleId, materialPalette, instance.deviceId]);
  const model = styled.model;
  const foldMixer = useMemo(() => {
    if (foldAngleDegrees === undefined || !gltf.animations.length) return null;
    const mixer = new AnimationMixer(model);
    const clip = gltf.animations[0]!;
    return { mixer, duration: clip.duration };
  }, [model, gltf.animations, foldAngleDegrees === undefined]);
  const blurUniforms = useRef<{ value: number }[]>([]);
  useLayoutEffect(() => {
    if (!foldMixer || foldAngleDegrees === undefined) return;
    const progress = Math.max(0, Math.min(1, foldAngleDegrees / 180));
    // Do not advance a wall-clock mixer: a saved angle must render identically
    // in the live preview, paused state and PNG export.
    const action = foldMixer.mixer.clipAction(gltf.animations[0]!);
    action.reset().setLoop(LoopOnce, 1).play();
    action.clampWhenFinished = true;
    foldMixer.mixer.setTime(progress * foldMixer.duration);
    model.updateMatrixWorld(true);
    for (const uniform of blurUniforms.current) uniform.value = Math.pow(Math.max(0, Math.sin(Math.PI * progress)), 0.75);
    invalidate();
  }, [foldMixer, foldAngleDegrees, gltf.animations, model, invalidate]);
  useLayoutEffect(() => () => { foldMixer?.mixer.stopAllAction(); foldMixer?.mixer.uncacheRoot(model); }, [foldMixer, model]);
  useLayoutEffect(() => () => { styled.materials.forEach(material => material.dispose()); }, [styled]);
  const transform = evaluateSceneAtTime(document, document.frame.playheadSeconds)
    .instances.find(item => item.instanceId === instanceId)!.transform;

  const bindings = useMemo(() => ({ [screenNodeName]: screenCanvas, ...additionalScreenCanvases }), [screenNodeName, screenCanvas, additionalScreenCanvases]);
  useLayoutEffect(() => {
    blurUniforms.current = [];
    const resources: { material: MeshBasicMaterial; texture: CanvasTexture }[] = [];
    const blurTextures: CanvasTexture[] = [];
    const found = new Set<string>();
    model.traverse(child => {
      if (child instanceof Mesh && bindings[child.name]) {
        const texture = new CanvasTexture(bindings[child.name]);
        texture.colorSpace = SRGBColorSpace;
        texture.flipY = false;
        const material = new MeshBasicMaterial({ color: "white", map: texture, side: DoubleSide, toneMapped: false });
        if (foldAngleDegrees !== undefined) {
          const amount = { value: Math.pow(Math.max(0, Math.sin(Math.PI * foldAngleDegrees / 180)), 0.75) };
          blurUniforms.current.push(amount);
          const original = bindings[child.name]!;
          const levels = [0.008, 0.017, 0.026].map(radius => {
            const canvas = window.document.createElement("canvas");
            canvas.width = Math.min(1024, original.width);
            canvas.height = Math.round(canvas.width * original.height / original.width);
            const context = canvas.getContext("2d")!;
            context.filter = `blur(${radius * canvas.width}px)`;
            context.drawImage(original, 0, 0, canvas.width, canvas.height);
            const result = new CanvasTexture(canvas);
            result.colorSpace = SRGBColorSpace; result.flipY = false;
            blurTextures.push(result);
            return result;
          });
          material.onBeforeCompile = shader => {
            shader.uniforms.duoFoldBlur = amount;
            levels.forEach((level, index) => { shader.uniforms[`duoBlur${index + 1}`] = { value: level }; });
            shader.fragmentShader = "uniform float duoFoldBlur; uniform sampler2D duoBlur1; uniform sampler2D duoBlur2; uniform sampler2D duoBlur3;\n" + shader.fragmentShader;
            shader.fragmentShader = shader.fragmentShader.replace("#include <map_fragment>", `
              #ifdef USE_MAP
                float level = duoFoldBlur * 3.0;
                vec4 duoColor;
                if (level < 1.0) duoColor = mix(texture2D(map, vMapUv), texture2D(duoBlur1, vMapUv), level);
                else if (level < 2.0) duoColor = mix(texture2D(duoBlur1, vMapUv), texture2D(duoBlur2, vMapUv), level - 1.0);
                else duoColor = mix(texture2D(duoBlur2, vMapUv), texture2D(duoBlur3, vMapUv), level - 2.0);
                float edge = smoothstep(0.0, 0.10, vMapUv.y) * smoothstep(0.0, 0.10, 1.0 - vMapUv.y);
                float shade = mix(1.0, ${child.name === "ScreenOuter" ? "0.72" : "0.48"} * mix(0.22, 1.0, edge), duoFoldBlur);
                diffuseColor *= vec4(duoColor.rgb * shade, 1.0);
              #endif
            `);
          };
          material.customProgramCacheKey = () => `duo-fold-${child.name}`;
        }
        child.material = material;
        resources.push({ material, texture });
        found.add(child.name);
      }
    });
    for (const name of Object.keys(bindings)) if (!found.has(name)) throw new Error(`Model is missing the required "${name}" mesh`);
    invalidate();
    return () => { resources.forEach(({ material, texture }) => { material.dispose(); texture.dispose(); }); blurTextures.forEach(texture => texture.dispose()); };
  }, [invalidate, model, bindings]);

  return <primitive object={model} position={transform.position} quaternion={transform.quaternion} scale={transform.scale} />;
}

function DeviceShadow({ document }: { document: SceneDocument }) {
  const shadow = document.appearance.shadow;
  const preset = shadow?.presetId ?? "none";
  const opacity = shadow?.opacity ?? 0;
  const transform = evaluateSceneAtTime(document, document.frame.playheadSeconds).instances[0]!.transform;
  const texture = useMemo(() => {
    if (preset === "none") return null;
    const canvas = window.document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 512;
    const context = canvas.getContext("2d")!;
    const radius = preset === "hug" ? 170 : preset === "spread" ? 250 : 210;
    context.translate(128, 256);
    context.scale(0.5, 1);
    const fill = context.createRadialGradient(0, 0, 0, 0, 0, radius);
    fill.addColorStop(0, "rgba(8, 12, 26, 0.50)");
    fill.addColorStop(0.42, "rgba(8, 12, 26, 0.33)");
    fill.addColorStop(1, "rgba(8, 12, 26, 0)");
    context.fillStyle = fill;
    context.fillRect(-256, -256, 512, 512);
    const result = new CanvasTexture(canvas);
    result.colorSpace = SRGBColorSpace;
    return result;
  }, [preset]);
  useLayoutEffect(() => () => { texture?.dispose(); }, [texture]);
  if (!texture || opacity <= 0) return null;
  const spread = preset === "spread" ? 1.25 : preset === "hug" ? 0.88 : 1;
  const scale = transform.scale[0] * spread;
  // A folded/rotated Duo extends behind the flat phone's shadow plane. Keep
  // this decorative shadow behind its entire body to avoid slicing the screen.
  const shadowDepth = document.instances.some(instance => instance.deviceId === "iphone-duo") ? -0.16 * scale : -0.03;
  const [lightX, lightY] = shadow?.lightPosition ?? [-0.55, -0.55];
  const position: [number, number, number] = [transform.position[0] - lightX * 0.028 * scale, transform.position[1] + lightY * 0.028 * scale, shadowDepth];
  return <mesh position={position} scale={[0.15 * scale, 0.245 * scale, 1]} renderOrder={-1}>
    <planeGeometry args={[1, 1]} />
    <meshBasicMaterial map={texture} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
  </mesh>;
}

function ReadySignal({ onReady, models }: { onReady?: () => void; models: readonly RenderModelInput[] }) {
  useLayoutEffect(() => { onReady?.(); }, [onReady, models]);
  return null;
}

function ContextWatch({ onContextLost }: { onContextLost?: () => void }) {
  const { gl } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => { event.preventDefault(); onContextLost?.(); };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl, onContextLost]);
  return null;
}

export const MockupCanvas = forwardRef<MockupCanvasHandle, MockupCanvasProps>(
  function MockupCanvas({ className, models, onReady, onContextLost, document }, ref) {
    return (
      <div className={className}>
        <Canvas
          shadows
          camera={{ far: 5, fov: 32, near: 0.01, position: [0, 0, 0.36] }}
          dpr={[1, 2]}
          frameloop="demand"
          gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
          onCreated={({ gl }) => {
            gl.outputColorSpace = SRGBColorSpace;
            gl.toneMapping = ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.05;
          }}
        >
          <ContextWatch onContextLost={onContextLost} />
          <ambientLight intensity={0.3} />
          <directionalLight intensity={2.5} position={[(document.appearance.shadow?.lightPosition?.[0] ?? -0.55) * 0.32, -(document.appearance.shadow?.lightPosition?.[1] ?? -0.55) * 0.4, 0.26]} castShadow
            shadow-mapSize={[2048, 2048]} shadow-camera-left={-0.13} shadow-camera-right={0.13}
            shadow-camera-top={0.14} shadow-camera-bottom={-0.14} shadow-camera-near={0.01}
            shadow-camera-far={0.8} shadow-bias={-0.00005} shadow-normalBias={0.00008} />
          <directionalLight intensity={0.7} position={[0.2, 0.06, -0.22]} />
          <CameraRig document={document} />
          <PreviewWatermark />
          <Suspense fallback={null}>
            <StudioEnvironment />
            <DeviceShadow document={document} />
            {models.map(model => <FixtureModel key={model.instanceId} {...model} document={document} />)}
            <ReadySignal onReady={onReady} models={models} />
          </Suspense>
          <CaptureBridge ref={ref} />
        </Canvas>
      </div>
    );
  },
);
