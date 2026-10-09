import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const release = JSON.parse(await readFile(join(root, "packages/catalog/src/render-release.json"), "utf8"));
const evidence = join(root, "docs/evidence/t4-03");
await mkdir(evidence, { recursive: true });
const scene = {
  schemaVersion: 1, draftId: "018f47a4-7b5f-7d60-9f52-751d7c29a201", revision: 0,
  templateId: "single-device", templateVersion: "1.0.0",
  instances: [{
    instanceId: "device-primary", deviceId: "iphone-18-pro-max", deviceVersion: "1.2.0", materialVariantId: "burgundy",
    transform: { position: [0, 0, 0], quaternion: [0, 0, 0, 1], scale: [1, 1, 1] },
    screen: { surfaceId: "main-screen", imageRef: { kind: "local", blobId: "fixture-screen-main" }, fit: "fill",
      cropRect: { x: 0, y: 0, width: 1, height: 1 }, paddingColor: "#101116" },
  }],
  camera: { presetId: "editor-front", projection: "perspective", position: [0, 0, 0.36], target: [0, 0, 0], fovDegrees: 32 },
  appearance: { background: { kind: "solid", color: "#ececf1" }, lightingPresetId: "studio-soft", lightingPresetVersion: "1.0.0",
    shadow: { presetId: "soft", opacity: 0.45 } },
  motion: { presetId: "none", presetVersion: 1, durationSeconds: 4, amplitudeDegrees: 0, direction: "clockwise" },
  frame: { playheadSeconds: 0 },
};
const screenshot = "assets/fixtures/screens/dashboard-dark.png";
const run = (jobPath, outputPath) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [join(root, "scripts/render-local-worker.mjs"), jobPath, outputPath], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
  let stdout = "", stderr = "";
  child.stdout.on("data", chunk => { stdout += chunk; });
  child.stderr.on("data", chunk => { stderr += chunk; });
  child.on("exit", code => code === 0 ? resolve(stdout.trim()) : reject(new Error(stderr || `Worker exited ${code}`)));
});
const singleJob = join(evidence, "single-job.json");
await writeFile(singleJob, JSON.stringify({ rendererRelease: release.rendererRelease, scene, images: { "fixture-screen-main": screenshot }, width: 1200, height: 1200 }, null, 2));
console.log(await run(singleJob, join(evidence, "single.png")));

const duoScene = structuredClone(scene);
duoScene.templateId = "iphone-duo";
duoScene.camera.position = [0, 0, 0.43];
duoScene.appearance.shadow = { presetId: "none", opacity: 0 };
duoScene.instances[0].transform.position = [-0.05, 0, -0.004];
duoScene.instances[0].transform.scale = [0.78, 0.78, 0.78];
duoScene.instances.push(structuredClone(duoScene.instances[0]));
duoScene.instances[1].instanceId = "device-secondary";
duoScene.instances[1].materialVariantId = "glacier-blue";
duoScene.instances[1].transform.position = [0.05, 0, 0];
duoScene.instances[1].screen.imageRef.blobId = "fixture-screen-second";
duoScene.instances[1].screen.cropRect = { x: 0.2, y: 0, width: 0.8, height: 1 };
const duoJob = join(evidence, "duo-job.json");
await writeFile(duoJob, JSON.stringify({ rendererRelease: release.rendererRelease, scene: duoScene, images: { "fixture-screen-main": screenshot, "fixture-screen-second": screenshot }, width: 1200, height: 1200 }, null, 2));
console.log(await run(duoJob, join(evidence, "duo.png")));
const single = await readFile(join(evidence, "single.png"));
const duo = await readFile(join(evidence, "duo.png"));
if (single.equals(duo)) throw new Error("Single and Duo outputs are identical");
