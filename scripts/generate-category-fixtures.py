"""Generate project-owned tablet/laptop geometry for Stage 4 renderer proofs.

Run with Blender: blender -b --python scripts/generate-category-fixtures.py
These are deliberately generic development fixtures, not product replicas.
"""

from pathlib import Path
import bpy

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "fixtures" / "models"


def material(name, color, metallic=0, roughness=0.4):
    item = bpy.data.materials.new(name)
    item.diffuse_color = (*color, 1)
    item.use_nodes = True
    shader = item.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1)
    shader.inputs["Metallic"].default_value = metallic
    shader.inputs["Roughness"].default_value = roughness
    return item


def box(name, dimensions, location, bevel, assigned):
    bpy.ops.mesh.primitive_cube_add(location=location)
    item = bpy.context.object
    item.name = name
    item.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    item.data.materials.append(assigned)
    if bevel:
        modifier = item.modifiers.new("Soft edges", "BEVEL")
        modifier.width = bevel
        modifier.segments = 4
        modifier.limit_method = "ANGLE"
    return item


def screen(width, height, y, z, assigned):
    # Blender Z-up/Y-front maps to glTF Y-up/Z-front on export.
    mesh = bpy.data.meshes.new("ScreenMesh")
    mesh.from_pydata([
        (-width / 2, y, z - height / 2),
        (width / 2, y, z - height / 2),
        (width / 2, y, z + height / 2),
        (-width / 2, y, z + height / 2),
    ], [], [(0, 1, 2, 3)])
    mesh.update()
    uv = mesh.uv_layers.new(name="UVMap")
    for loop, value in zip(mesh.polygons[0].loop_indices, ((0, 0), (1, 0), (1, 1), (0, 1))):
        uv.data[loop].uv = value
    item = bpy.data.objects.new("Screen", mesh)
    bpy.context.collection.objects.link(item)
    item.data.materials.append(assigned)
    item["surfaceId"] = "main-screen"


def export(name):
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"{name}-dev.glb"
    bpy.ops.export_scene.gltf(filepath=str(path), export_format="GLB", export_yup=True,
                              export_apply=True, export_extras=True, export_materials="EXPORT")
    print(f"Generated {path}")


def clear():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for item in list(bpy.data.materials):
        bpy.data.materials.remove(item)


def tablet():
    clear()
    body = material("SlateBody", (0.24, 0.30, 0.36), metallic=0.75)
    glass = material("FrontGlass", (0.025, 0.030, 0.038), roughness=0.14)
    display = material("ScreenMaterial", (0.08, 0.11, 0.24), roughness=0.2)
    box("DeviceBody", (0.178, 0.007, 0.250), (0, 0, 0), 0.008, body)
    box("FrontGlass", (0.176, 0.0006, 0.248), (0, -0.0037, 0), 0.007, glass)
    screen(0.162, 0.233, -0.0041, 0, display)
    bpy.context.scene["fixtureStatus"] = "technical-proof-only"
    export("tablet")


def laptop():
    clear()
    body = material("LaptopShell", (0.49, 0.52, 0.56), metallic=0.8)
    glass = material("DisplayBezel", (0.025, 0.028, 0.034), roughness=0.15)
    keys = material("Keyboard", (0.11, 0.12, 0.14), roughness=0.55)
    display = material("ScreenMaterial", (0.08, 0.11, 0.24), roughness=0.2)
    # Display pivot is at the origin. Base extends toward the viewer.
    box("DisplayShell", (0.302, 0.006, 0.191), (0, 0, 0), 0.006, body)
    box("DisplayBezel", (0.298, 0.0005, 0.187), (0, -0.0033, 0), 0.004, glass)
    screen(0.280, 0.1575, -0.0037, 0.001, display)
    box("KeyboardBase", (0.304, 0.188, 0.006), (0, -0.091, -0.099), 0.004, body)
    box("KeyboardDeck", (0.270, 0.115, 0.0004), (0, -0.084, -0.0957), 0.002, keys)
    bpy.context.scene["fixtureStatus"] = "technical-proof-only"
    export("laptop")


tablet()
laptop()
