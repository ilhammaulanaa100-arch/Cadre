"""Generate the project-owned T3-03 handset fixture.

The outer dimensions follow Apple's published iPhone 17 Pro Max technical
specification. Camera and control geometry is intentionally simplified. This is
a renderer-development fixture, not a production-quality Apple asset.
"""

from pathlib import Path
import math

import bpy


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "fixtures" / "models" / "iphone-17-pro-max-dev.glb"

WIDTH = 0.078
HEIGHT = 0.1634
DEPTH = 0.00875
SCREEN_WIDTH = 0.073
SCREEN_HEIGHT = SCREEN_WIDTH * (2868 / 1320)


def material(name: str, color: tuple[float, float, float, float], metallic=0.0, roughness=0.4):
    result = bpy.data.materials.new(name)
    result.diffuse_color = color
    result.use_nodes = True
    principled = result.node_tree.nodes.get("Principled BSDF")
    principled.inputs["Base Color"].default_value = color
    principled.inputs["Metallic"].default_value = metallic
    principled.inputs["Roughness"].default_value = roughness
    return result


def rounded_box(name: str, dimensions, location, bevel: float, assigned_material):
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    modifier = obj.modifiers.new(name="Rounded edges", type="BEVEL")
    modifier.width = bevel
    modifier.segments = 5
    modifier.limit_method = "ANGLE"
    obj.data.materials.append(assigned_material)
    return obj


def cylinder(name: str, radius: float, depth: float, location, assigned_material):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=48,
        radius=radius,
        depth=depth,
        location=location,
        rotation=(math.pi / 2, 0, 0),
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(assigned_material)
    bevel = obj.modifiers.new(name="Edge bevel", type="BEVEL")
    bevel.width = 0.00025
    bevel.segments = 3
    return obj


def screen_plane(assigned_material):
    half_width = SCREEN_WIDTH / 2
    half_height = SCREEN_HEIGHT / 2
    # Keep the textured surface just above the front-glass shell to avoid
    # z-fighting or being occluded after Blender-to-glTF axis conversion.
    y = -(DEPTH / 2 + 0.00072)
    vertices = [
        (-half_width, y, -half_height),
        (half_width, y, -half_height),
        (half_width, y, half_height),
        (-half_width, y, half_height),
    ]
    mesh = bpy.data.meshes.new("ScreenMesh")
    mesh.from_pydata(vertices, [], [(0, 1, 2, 3)])
    mesh.update()

    uv_layer = mesh.uv_layers.new(name="UVMap")
    for loop, uv in zip(mesh.polygons[0].loop_indices, ((0, 0), (1, 0), (1, 1), (0, 1))):
        uv_layer.data[loop].uv = uv

    obj = bpy.data.objects.new("Screen", mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(assigned_material)
    obj["surfaceId"] = "main-screen"
    return obj


def main():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)

    orange = material("NeutralBody", (0.72, 0.22, 0.055, 1), metallic=0.72, roughness=0.25)
    dark_glass = material("FrontGlass", (0.004, 0.006, 0.012, 1), metallic=0.0, roughness=0.12)
    screen = material("ScreenMaterial", (0.07, 0.12, 0.32, 1), metallic=0.0, roughness=0.18)
    lens = material("CameraGlass", (0.01, 0.016, 0.025, 1), metallic=0.35, roughness=0.08)
    ring = material("CameraRing", (0.58, 0.16, 0.04, 1), metallic=0.8, roughness=0.22)

    body = rounded_box(
        "DeviceBody",
        (WIDTH, DEPTH, HEIGHT),
        (0, 0, 0),
        0.0055,
        orange,
    )
    body["source"] = "Apple published outer dimensions; simplified project-owned geometry"

    rounded_box(
        "FrontGlass",
        (WIDTH - 0.0014, 0.00055, HEIGHT - 0.0014),
        (0, -(DEPTH / 2 + 0.0002), 0),
        0.005,
        dark_glass,
    )
    screen_plane(screen)

    plateau = rounded_box(
        "CameraPlateau",
        (0.037, 0.0013, 0.039),
        (-0.017, DEPTH / 2 + 0.00055, 0.052),
        0.004,
        orange,
    )
    plateau["detail"] = "simplified"

    for index, (x, z) in enumerate(
        ((-0.026, 0.061), (-0.010, 0.061), (-0.026, 0.044)),
        start=1,
    ):
        cylinder(
            f"CameraRing{index}",
            0.0062,
            0.0017,
            (x, DEPTH / 2 + 0.0015, z),
            ring,
        )
        cylinder(
            f"CameraLens{index}",
            0.0048,
            0.00185,
            (x, DEPTH / 2 + 0.00165, z),
            lens,
        )

    rounded_box(
        "SideButton",
        (0.0007, 0.0014, 0.027),
        (WIDTH / 2 + 0.00025, 0, 0.026),
        0.0003,
        orange,
    )

    bpy.context.scene["fixtureName"] = "iPhone 17 Pro Max development fixture"
    bpy.context.scene["fixtureStatus"] = "technical-proof-only"
    bpy.context.scene["coordinateConvention"] = "exported glTF Y-up, meters"

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(OUTPUT),
        export_format="GLB",
        export_yup=True,
        export_apply=True,
        export_extras=True,
        export_materials="EXPORT",
    )
    print(f"Generated {OUTPUT}")


if __name__ == "__main__":
    main()
