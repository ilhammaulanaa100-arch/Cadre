"""Generate Forma's original foldable mockup model from Blender primitives.

No downloaded product geometry, textures, UVs, or animation data are used.
Dimensions are in metres. The editable source and animated GLB are regenerated
from this script with Blender 5.2.
"""
from pathlib import Path
import hashlib
import json
import math
import sys
import bpy
from mathutils import Vector, Matrix

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets/devices/iphone-duo"
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)

def rgba(value):
    value = value.lstrip("#")
    return tuple(int(value[i:i+2], 16) / 255 for i in (0, 2, 4)) + (1,)

def mat(name, color, metal=0, rough=.32):
    item = bpy.data.materials.new(name)
    item.diffuse_color = rgba(color)
    item.use_nodes = True
    p = item.node_tree.nodes.get("Principled BSDF")
    p.inputs["Base Color"].default_value = rgba(color)
    p.inputs["Metallic"].default_value = metal
    p.inputs["Roughness"].default_value = rough
    return item

frame = mat("DuoSidewall", "#d7d8d5", .76, .25)
rim = mat("DuoPolishedTrim", "#e7e8e5", .84, .2)
glass = mat("DuoRearCeramic", "#eeefec", .08, .3)
black = mat("BlackSeal", "#06090d", .05, .58)
screen = mat("ScreenInnerMaterial", "#132b3f", 0, .27)
outer = mat("ScreenOuterMaterial", "#182c3c", 0, .22)
camera_ring = mat("CameraRing", "#87929c", .9, .17)
lens = mat("CameraOptic", "#07111d", .35, .09)
lens_depth = mat("LensDepth", "#1d344e", .3, .09)
flash = mat("FlashGlass", "#ece4d1", .02, .22)
antenna = mat("AntennaBand", "#151b25", 0, .6)
hinge_mat = mat("DuoHinge", "#b9bcb9", .82, .22)
deck_mat = mat("DuoCameraDeck", "#e5e6e2", .22, .28)

root = bpy.data.objects.new("iPhoneDuo", None)
bpy.context.collection.objects.link(root)
left = bpy.data.objects.new("DuoLeftPivot", None)
right = bpy.data.objects.new("DuoRightPivot", None)
for pivot in (left, right):
    bpy.context.collection.objects.link(pivot)
    pivot.parent = root
    pivot.location = (0, 0, 0)

def box(name, dims, location, material, parent, bevel=0, segments=8):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dims
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material)
    if bevel:
        modifier = obj.modifiers.new("Precision radii", "BEVEL")
        modifier.width = bevel
        modifier.segments = segments
        modifier.affect = "EDGES"
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=modifier.name)
        normal = obj.modifiers.new("Weighted face normals", "WEIGHTED_NORMAL")
        bpy.ops.object.modifier_apply(modifier=normal.name)
    obj.parent = parent
    obj.matrix_parent_inverse = parent.matrix_world.inverted()
    return obj

def cylinder(name, radius, depth, location, material, parent, axis="Z", vertices=48):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location)
    obj = bpy.context.object
    obj.name = name
    if axis == "Y": obj.rotation_euler[0] = math.pi/2
    elif axis == "X": obj.rotation_euler[1] = math.pi/2
    obj.data.materials.append(material)
    for poly in obj.data.polygons: poly.use_smooth = True
    obj.parent = parent
    obj.matrix_parent_inverse = parent.matrix_world.inverted()
    return obj

def outline(x0,x1,y0,y1,left_radius,right_radius):
    pts=[]
    for cx,cy,r,start in ((x1-right_radius,y0+right_radius,right_radius,-90),
                          (x1-right_radius,y1-right_radius,right_radius,0),
                          (x0+left_radius,y1-left_radius,left_radius,90),
                          (x0+left_radius,y0+left_radius,left_radius,180)):
        for step in range(9):
            angle=math.radians(start+90*step/8)
            pts.append((cx+r*math.cos(angle),cy+r*math.sin(angle)))
    return pts

def panel(name,x0,x1,y0,y1,z,depth,material,parent,left_radius,right_radius):
    pts=outline(x0,x1,y0,y1,left_radius,right_radius)
    count=len(pts)
    verts=[(x,y,z-depth/2) for x,y in pts]+[(x,y,z+depth/2) for x,y in pts]
    faces=[tuple(reversed(range(count))),tuple(range(count,2*count))]
    faces += [(i,(i+1)%count,(i+1)%count+count,i+count) for i in range(count)]
    mesh=bpy.data.meshes.new(name+"Mesh")
    mesh.from_pydata(verts,[],faces)
    mesh.update()
    obj=bpy.data.objects.new(name,mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(material)
    obj.parent=parent
    obj.matrix_parent_inverse=parent.matrix_world.inverted()
    return obj

def surface(name, x0, x1, y0, y1, z, material, parent, u0=0, u1=1, reverse=False, left_radius=.0004, right_radius=.0004):
    # Flat replacement surface with rounded external corners and stable UVs.
    pts=outline(x0,x1,y0,y1,left_radius,right_radius)
    verts=[(x,y,z) for x,y in pts]
    faces=[tuple(range(len(pts)))] if not reverse else [tuple(reversed(range(len(pts))))]
    mesh = bpy.data.meshes.new(name + "Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(material)
    obj.parent = parent
    obj.matrix_parent_inverse = parent.matrix_world.inverted()
    uv = mesh.uv_layers.new(name="UVMap")
    for poly in mesh.polygons:
        for li in poly.loop_indices:
            vertex = mesh.loops[li].vertex_index
            x,y=pts[vertex]
            u=(x-x0)/(x1-x0)
            uv.data[li].uv = (u0+(u1-u0)*u,(y-y0)/(y1-y0))
    return obj

def folding_inner_screen():
    """One connected, UV-mapped display with authored fold morphs."""
    columns, rows = 32, 8
    x0, x1, y0, y1, z = -.0796, .0796, -.0554, .0554, .00316
    vertices = [(x0 + (x1-x0)*i/columns, y0 + (y1-y0)*j/rows, z)
                for j in range(rows+1) for i in range(columns+1)]
    faces = [(j*(columns+1)+i, j*(columns+1)+i+1,
              (j+1)*(columns+1)+i+1, (j+1)*(columns+1)+i)
             for j in range(rows) for i in range(columns)]
    mesh = bpy.data.meshes.new("ScreenInnerMesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new("ScreenInner", mesh)
    bpy.context.collection.objects.link(obj)
    obj.parent = root
    mesh.materials.append(screen)
    uv = mesh.uv_layers.new(name="UVMap")
    for polygon in mesh.polygons:
        for loop_index in polygon.loop_indices:
            index = mesh.loops[loop_index].vertex_index
            x, y, _ = vertices[index]
            uv.data[loop_index].uv = ((x-x0)/(x1-x0), (y-y0)/(y1-y0))
    obj.shape_key_add(name="Basis")
    for key_name, angle, offset in (("FoldClosed", math.pi, .00565),
                                    ("FoldHalf", math.pi/2, .002825)):
        key = obj.shape_key_add(name=key_name)
        for index, (x, y, original_z) in enumerate(vertices):
            # The left half follows its chassis; the center columns bridge the
            # two halves so the display remains one connected surface.
            turned = Vector((x*math.cos(angle)+original_z*math.sin(angle),
                             y, -x*math.sin(angle)+original_z*math.cos(angle)+offset))
            original = Vector((x, y, original_z))
            blend = max(0.0, min(1.0, (.0018-x)/.0036))
            key.data[index].co = original.lerp(turned, blend)
    for frame_number, closed, half in ((1, 1, 0), (24, 0, 1), (48, 0, 0)):
        for key_name, value in (("FoldClosed", closed), ("FoldHalf", half)):
            key = obj.data.shape_keys.key_blocks[key_name]
            key.value = value
            key.keyframe_insert(data_path="value", frame=frame_number)
    return obj

HALF_W = .0823
HEIGHT = .1178
THICK = .0052
for side, pivot, cx in (("Left",left,-HALF_W/2),("Right",right,HALF_W/2)):
    x0,x1=(-HALF_W+.00015,-.0002) if side=="Left" else (.0002,HALF_W-.00015)
    lr,rr=(.008,.0006) if side=="Left" else (.0006,.008)
    panel(side+"TitaniumFrame",x0,x1,-HEIGHT/2,HEIGHT/2,0,THICK,frame,pivot,lr,rr)
    panel(side+"FrontRim",x0+.00025,x1-.00025,-HEIGHT/2+.00025,HEIGHT/2-.00025,.00258,.00027,rim,pivot,max(.0003,lr-.0003),max(.0003,rr-.0003))
    panel(side+"InnerBlackGlass",x0+.00055,x1-.00055,-HEIGHT/2+.00055,HEIGHT/2-.00055,.00281,.00028,black,pivot,max(.0002,lr-.00055),max(.0002,rr-.00055))
    panel(side+"RearCeramic",x0+.00055,x1-.00055,-HEIGHT/2+.00055,HEIGHT/2-.00055,-.00275,.00024,glass,pivot,max(.0002,lr-.00055),max(.0002,rr-.00055))

folding_inner_screen()

# Outer display is on the left half's reverse face. Folding makes it face forward.
panel("OuterDisplayBezel",-.0790,-.0033,-.0562,.0562,-.00304,.00020,black,left,.007,.007)
surface("ScreenOuter", -.0782,-.0041,-.0531,.0531,-.00325,outer,left,1,0,True,left_radius=.0063,right_radius=.0063)
cylinder("OuterSelfieCamera", .00134, .00012, (-.0412,.0486,-.00314), lens, left)

# Rear camera deck sits on the other half, exposed on the back when folded.
box("RearCameraIsland", (.0303,.0235,.00155), (.0558,.0392,-.00365), deck_mat, right, .0060)
box("CameraIslandGlass", (.0291,.0223,.00020), (.0558,.0392,-.00453), glass, right, .0056)
for i, x in enumerate((.0476,.0641)):
    cylinder(f"RearLensRing{i+1}", .0062, .00113, (x,.0395,-.00522), camera_ring, right)
    cylinder(f"RearLensWell{i+1}", .00532, .00119, (x,.0395,-.00586), black, right)
    cylinder(f"RearLensOptic{i+1}", .00433, .00048, (x,.0395,-.00649), lens_depth, right)
    cylinder(f"RearLensCore{i+1}", .00245, .00028, (x,.0395,-.00678), lens, right)
cylinder("RearFlash", .00152, .00035, (.0558,.0293,-.00471), flash, right)
cylinder("RearMicrophone", .00052, .00022, (.0558,.0493,-.00470), black, right)

# Fine frame details: antenna breaks, right-side controls, USB-C and speaker.
for y in (-.047,.047):
    for pivot,x in ((left,-.08175),(right,.08175)):
        box("AntennaBreak", (.00018,.00115,.0040), (x,y,0), antenna, pivot, .00008)
box("PowerTouchID", (.00085,.0145,.0012), (.0824,.019,0), rim, right, .00036)
box("VolumeUp", (.00075,.0084,.0011), (-.0823,.025,0), rim, left, .00035)
box("VolumeDown", (.00075,.0084,.0011), (-.0823,.013,0), rim, left, .00035)
box("ActionButton", (.00075,.0055,.001), (-.0823,.043,0), rim, left, .00033)
box("USBPort", (.0102,.0002,.00225), (.042,-.0590,0), black, right, .0007)
for x in (.021,.025,.029,.055,.059,.063):
    cylinder("SpeakerPerforation", .00033, .00022, (x,-.0590,0), black, right, axis="Y", vertices=16)

# Central polished hinge with paired seams, visible in side and oblique views.
cylinder("TitaniumHingeSpine", .00252, HEIGHT-.0025, (0,0,0), hinge_mat, root, axis="Y", vertices=64)
for x in (-.00185,.00185):
    box("HingeJoint", (.00055,HEIGHT-.005,.0037), (x,0,0), frame, root, .00024)

left["foldAngleDegrees"] = 180
left["closedRotationYDegrees"] = 180
root["modelUnits"] = "metres"
root["innerSurface"] = "ScreenInner, connected morphing UV canvas"
root["outerSurface"] = "ScreenOuter"

# An open state is the editable Blender and GLB default. All poses are samples
# of the same authored chassis and continuous inner display.
left.rotation_euler[1] = math.pi
left.keyframe_insert(data_path="rotation_euler", frame=1)
left.location.z = .00565
left.keyframe_insert(data_path="location", frame=1)
left.rotation_euler[1] = math.pi/2
left.keyframe_insert(data_path="rotation_euler", frame=24)
left.location.z = .002825
left.keyframe_insert(data_path="location", frame=24)
left.rotation_euler[1] = 0
left.keyframe_insert(data_path="rotation_euler", frame=48)
left.location.z = 0
left.keyframe_insert(data_path="location", frame=48)
for action in bpy.data.actions:
    for fc in action.fcurves if hasattr(action,"fcurves") else []:
        for key in fc.keyframe_points: key.interpolation = "BEZIER"
bpy.context.scene.frame_set(48)
bpy.context.scene.render.engine = "CYCLES"
bpy.context.scene.cycles.samples = 16
bpy.context.scene.render.film_transparent = True
bpy.context.scene.render.resolution_x = 900
bpy.context.scene.render.resolution_y = 900
bpy.context.scene.render.resolution_percentage = 100
bpy.context.scene.world.color = (.17,.17,.17)

# The sample screen was created for this repository; uploaded screenshots
# replace it independently on the outer and inner surfaces in Forma.
sample_image = bpy.data.images.load(str(ROOT / "assets/fixtures/screens/dashboard-dark.png"), check_existing=True)
for material in (screen, outer):
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    principled = nodes.get("Principled BSDF")
    texture = nodes.new("ShaderNodeTexImage")
    texture.image = sample_image
    links.new(texture.outputs["Color"], principled.inputs["Base Color"])
    links.new(texture.outputs["Color"], principled.inputs["Emission Color"])
    principled.inputs["Emission Strength"].default_value = .7

def area(name, location, power, size):
    data = bpy.data.lights.new(name,"AREA")
    data.energy = power
    data.shape = "DISK"
    data.size = size
    obj = bpy.data.objects.new(name,data)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (Vector((0,0,0))-obj.location).to_track_quat("-Z","Y").to_euler()
area("SoftboxMain",(-.18,.22,.24),5,.28)
area("SoftboxRim",(.20,.09,-.23),3,.21)

def proof(name, eye, frame, scale=.265, folder="renders"):
    bpy.context.scene.frame_set(frame)
    cam_data=bpy.data.cameras.new(name)
    cam=bpy.data.objects.new(name,cam_data)
    bpy.context.collection.objects.link(cam)
    cam.location=eye
    forward=(Vector((0,0,0))-cam.location).normalized()
    right=forward.cross(Vector((0,1,0))).normalized()
    up=right.cross(forward).normalized()
    cam.rotation_euler=Matrix(((right.x,up.x,-forward.x),(right.y,up.y,-forward.y),(right.z,up.z,-forward.z))).to_euler()
    cam_data.type="ORTHO"
    cam_data.ortho_scale=scale
    bpy.context.scene.camera=cam
    (OUT/folder).mkdir(exist_ok=True)
    bpy.context.scene.render.filepath=str(OUT/folder/(name+".png"))
    bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(cam,do_unlink=True)

if "--no-renders" not in sys.argv:
    proof("open-front",(.045,.025,.30),48)
    proof("open-back",(-.045,.025,-.30),48)
    proof("closed-front",(.035,.02,.28),1)
    proof("closed-back",(-.035,.02,-.28),1)
    proof("half-open-side",(.22,.015,.12),24)
    bpy.context.scene.render.resolution_x = 400
    bpy.context.scene.render.resolution_y = 400
    bpy.context.scene.cycles.samples = 12
    for name, angles in (("front", (0,0,0)), ("perspective", (8,-28,-6)),
                         ("lean", (24,18,12)), ("back", (0,180,0)),
                         ("left-side", (0,82,0)), ("right-side", (0,-82,0)),
                         ("floating", (-12,-24,-22))):
        root.rotation_euler = tuple(math.radians(value) for value in angles)
        proof(name, (0,0,.35), 48, .225, "previews")
    root.rotation_euler = (0,0,0)
bpy.context.scene.frame_set(48)
bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end = 48
bpy.context.scene.render.fps = 24
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/"iphone-duo.blend"))
bpy.ops.object.select_all(action="DESELECT")
root.select_set(True)
for child in root.children_recursive:
    child.select_set(True)
bpy.context.view_layer.objects.active = root
bpy.ops.export_scene.gltf(filepath=str(OUT/"iphone-duo.glb"), export_format="GLB",
                          use_selection=True, export_yup=False, export_animations=True,
                          export_animation_mode="SCENE", export_frame_range=True,
                          export_cameras=False, export_lights=False,
                          export_anim_scene_split_object=False,
                          export_anim_slide_to_zero=True)
blob = (OUT/"iphone-duo.glb").read_bytes()
(OUT/"asset-info.json").write_text(json.dumps({"sha256": hashlib.sha256(blob).hexdigest(),
                                                "bytes": len(blob)}, indent=2) + "\n")
print("Saved original procedural Duo", len(blob))
