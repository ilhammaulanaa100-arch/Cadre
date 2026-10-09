"""Forma iPhone 18 Pro Max reference model. Run with Blender --background --python.

Meters; Blender Z-up, front -Y. Exported glTF Y-up, front +Z.
Outer dimensions from Apple; small details reconstructed from supplied images.
No manufacturer's CAD was supplied. Finish lineup follows Apple Indonesia; RGB values are visual estimates.
"""
from pathlib import Path
import math
import json
import hashlib
import random
import bpy
import bmesh
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/devices/iphone-18-pro-max'
RENDERS = OUT / 'renders'
W, H, D = .078, .1634, .00875
SW, SH = .073, .073 * 2868 / 1320
PALETTES = {
    'burgundy': {'FrameMetal': '#63333f', 'BackGlass': '#48232e', 'CameraDeck': '#542a36', 'LensRing': '#72424e', 'AppleInlay': '#603441', 'PanelSeam': '#3b2029', 'AntennaPolymer': '#3a2c31'},
    'glacier-blue': {'FrameMetal': '#8c9eaf', 'BackGlass': '#a5b3c2', 'CameraDeck': '#91a2b3', 'LensRing': '#a7b7c7', 'AppleInlay': '#718294', 'PanelSeam': '#728292', 'AntennaPolymer': '#71808f'},
    'silver': {'FrameMetal': '#bfc2c4', 'BackGlass': '#d1d2d1', 'CameraDeck': '#bcbfbf', 'LensRing': '#d0d2d3', 'AppleInlay': '#939798', 'PanelSeam': '#939797', 'AntennaPolymer': '#9a9d9f'},
    'black': {'FrameMetal': '#292a2c', 'BackGlass': '#1c1d1f', 'CameraDeck': '#242527', 'LensRing': '#3a3b3d', 'AppleInlay': '#37383a', 'PanelSeam': '#131416', 'AntennaPolymer': '#191a1c'},
}

def rgba(hex):
    channels = [int(hex[i:i+2], 16) / 255 for i in (1, 3, 5)]
    return tuple(c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4 for c in channels) + (1,)

def material(name, color, metal=0, rough=.3):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = rgba(color)
    mat.use_nodes = True
    p = mat.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = rgba(color)
    p.inputs['Metallic'].default_value = metal
    p.inputs['Roughness'].default_value = rough
    p.inputs['Specular IOR Level'].default_value = .22 if metal < .2 else .5
    return mat

def outline(w, h, r, steps=20):
    points = []
    for cx, cz, start in [(w/2-r, h/2-r, 0), (-w/2+r, h/2-r, 90), (-w/2+r, -h/2+r, 180), (w/2-r, -h/2+r, 270)]:
        for j in range(steps+1):
            a = math.radians(start + 90*j/steps)
            points.append((cx + r*math.cos(a), cz + r*math.sin(a)))
    return points

def mesh_object(name, verts, faces, mat):
    mesh = bpy.data.meshes.new(name+'Mesh')
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    return obj

def microfinish(mats):
    """Packed tangent-normal map shared by Blender/glTF, not Blender-only noise."""
    size=256
    rng=random.Random(18)
    noise=[rng.random() for _ in range(size*size)]
    image=bpy.data.images.new('Anodized micrograin',width=size,height=size,alpha=False)
    image.colorspace_settings.name='Non-Color'
    pixels=[]
    for z in range(size):
        for x in range(size):
            dx=(noise[z*size+(x+1)%size]-noise[z*size+(x-1)%size])*.16
            dy=(noise[((z+1)%size)*size+x]-noise[((z-1)%size)*size+x])*.16
            normal=Vector((dx,dy,1)).normalized()
            pixels.extend((normal.x*.5+.5,normal.y*.5+.5,normal.z*.5+.5,1))
    image.pixels.foreach_set(pixels); image.pack()
    for name in ['FrameMetal','BackGlass','CameraDeck']:
        mat=mats[name]; nodes=mat.node_tree.nodes; links=mat.node_tree.links
        tex=nodes.new('ShaderNodeTexImage'); tex.image=image; tex.extension='REPEAT'; tex.label='Subtle anodized grain'
        normal=nodes.new('ShaderNodeNormalMap'); normal.inputs['Strength'].default_value=.28 if name=='FrameMetal' else .45
        links.new(tex.outputs['Color'],normal.inputs['Color'])
        links.new(normal.outputs['Normal'],nodes.get('Principled BSDF').inputs['Normal'])

def turned(name, profile, loc, mat):
    """Closed lathed section: real annular housing or recessed lens barrel."""
    count=96
    verts=[(r*math.cos(2*math.pi*i/count),y,r*math.sin(2*math.pi*i/count)) for r,y in profile for i in range(count)]
    faces=[]
    for k in range(len(profile)):
        for i in range(count):
            faces.append((k*count+i,k*count+(i+1)%count,((k+1)%len(profile))*count+(i+1)%count,((k+1)%len(profile))*count+i))
    obj=mesh_object(name,verts,faces,mat); obj.location=loc
    bm=bmesh.new(); bm.from_mesh(obj.data); bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces)); bm.to_mesh(obj.data); bm.free()
    for p in obj.data.polygons: p.use_smooth=True
    return obj

def dome(name,radius,sag,loc,mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=64,ring_count=24,location=loc)
    obj=bpy.context.object; obj.name=name; obj.scale=(radius,sag,radius)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    obj.data.materials.append(mat)
    for p in obj.data.polygons: p.use_smooth=True
    return obj

def shell(name, w, h, depth, radius, loc, mat, bevel=.00025):
    # Independent outline and edge radii: thin glass keeps rounded corners.
    edge = min(bevel, depth*.49)
    profiles = []
    for i in range(5):
        a = math.pi/2 * i/4
        profiles.append((-depth/2+edge-edge*math.cos(a), edge-edge*math.sin(a)))
    for i in range(5):
        a = math.pi/2 * i/4
        profiles.append((depth/2-edge+edge*math.sin(a), edge-edge*math.cos(a)))
    vertices = []
    for y, inset in profiles:
        vertices.extend((x, y, z) for x,z in outline(w-2*inset,h-2*inset,max(radius-inset,.00001)))
    n = len(vertices)//len(profiles)
    faces = [tuple(range(n)), tuple(reversed(range((len(profiles)-1)*n,len(profiles)*n)))]
    for k in range(len(profiles)-1):
        for i in range(n):
            j=(i+1)%n
            faces.append((k*n+i,(k+1)*n+i,(k+1)*n+j,k*n+j))
    obj=mesh_object(name,vertices,faces,mat)
    obj.location=loc
    for p in obj.data.polygons: p.use_smooth=p.index>1
    uv=obj.data.uv_layers.new(name='UVMap')
    for loop in obj.data.loops:
        v=obj.data.vertices[loop.vertex_index].co
        uv.data[loop.index].uv=(v.x/.024+.5,v.z/.024+.5)
    return obj

def disc(name, radius, depth, loc, mat, axis='Y'):
    rotation = (math.pi/2,0,0) if axis=='Y' else (0,0,0)
    bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=radius,depth=depth,location=loc,rotation=rotation)
    obj=bpy.context.object
    obj.name=name
    obj.data.materials.append(mat)
    bevel=obj.modifiers.new('Machined bevel','BEVEL'); bevel.width=min(depth*.22,.00018); bevel.segments=3
    for p in obj.data.polygons: p.use_smooth=len(p.vertices)==4
    return obj

def screen(mat):
    points=outline(SW,SH,.0088,32)
    obj=mesh_object('Screen',[(0,-D/2-.00046,0)]+[(x,-D/2-.00046,z) for x,z in points],[(0,i+1,(i+1)%len(points)+1) for i in range(len(points))],mat)
    uv=obj.data.uv_layers.new(name='UVMap')
    for polygon in obj.data.polygons:
        for li in polygon.loop_indices:
            v=obj.data.vertices[obj.data.loops[li].vertex_index].co
            uv.data[li].uv=(v.x/SW+.5,v.z/SH+.5)
    obj['surfaceId']='main-screen'
    obj['pixelDimensions']=[1320,2868]
    return obj

def logo(mat):
    # Small recessed emblem, authored as a closed smooth silhouette, not a decal.
    curve=bpy.data.curves.new('EmblemOutline','CURVE'); curve.dimensions='2D'; curve.resolution_u=16; curve.fill_mode='BOTH'
    pts=[(281,567),(270,564),(262,564),(253,570),(248,581),(248,593),(252,607),(259,619),(268,625),(280,622),(292,624),(301,621),(309,611),(314,601),(307,597),(302,591),(301,585),(303,578),(309,573),(313,571),(306,566),(298,563),(289,564)]
    spline=curve.splines.new('BEZIER'); spline.bezier_points.add(len(pts)-1)
    for p,(x,z) in zip(spline.bezier_points,pts):
        p.co=(-(x-281)*.0002381,(593-z)*.0002381,0); p.handle_left_type='AUTO'; p.handle_right_type='AUTO'
    spline.use_cyclic_u=True
    obj=bpy.data.objects.new('AppleEmblem',curve); bpy.context.collection.objects.link(obj)
    obj.rotation_euler=(math.pi/2,0,0); obj.location=(0,D/2+.00062,-.018); obj.data.materials.append(mat)
    bpy.context.view_layer.objects.active=obj; obj.select_set(True); bpy.ops.object.convert(target='MESH'); obj.select_set(False)
    leaf=curve=bpy.data.curves.new('EmblemLeaf','CURVE'); curve.dimensions='2D'; curve.resolution_u=16; curve.fill_mode='BOTH'
    spline=curve.splines.new('BEZIER'); spline.bezier_points.add(3)
    for p,(x,z) in zip(spline.bezier_points,[(282,559),(285,549),(297,542),(294,553)]):
        p.co=(-(x-281)*.0002381,(593-z)*.0002381,0); p.handle_left_type='AUTO'; p.handle_right_type='AUTO'
    spline.use_cyclic_u=True
    obj=bpy.data.objects.new('AppleEmblemLeaf',curve); bpy.context.collection.objects.link(obj)
    obj.rotation_euler=(math.pi/2,0,0); obj.location=(0,D/2+.00062,-.018); obj.data.materials.append(mat)
    bpy.context.view_layer.objects.active=obj; obj.select_set(True); bpy.ops.object.convert(target='MESH'); obj.select_set(False)

def build():
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
    mats={name:material(name,color,.58 if name in ('FrameMetal','LensRing') else .12,.3 if name in ('FrameMetal','LensRing') else .42) for name,color in PALETTES['burgundy'].items() if name != 'AntennaPolymer'}
    microfinish(mats)
    black=material('CeramicBezel','#09090b',.12,.19)
    gasket=material('Gasket','#1e151c',.05,.42)
    glass=material('SapphireGlass','#090d13',0,.16)
    optic=material('OpticalCoating','#101627',.05,.22)
    iris=material('LensAperture','#030407',.08,.3)
    flash=material('FlashDiffuser','#f8ecda',.08,.26)
    antenna=material('AntennaPolymer',PALETTES['burgundy']['AntennaPolymer'],0,.58)
    mats['AntennaPolymer']=antenna
    barrel=material('CameraBarrel','#101013',.08,.34)
    coating=material('LensCoating','#152032',.38,.12)
    coating.node_tree.nodes.get('Principled BSDF').inputs['Coat Weight'].default_value=.7
    cover=material('LensCover','#e2e8ee',0,.055)
    cp=cover.node_tree.nodes.get('Principled BSDF')
    cp.inputs['Transmission Weight'].default_value=1
    cp.inputs['IOR'].default_value=1.46
    cp.inputs['Specular IOR Level'].default_value=.5
    flashmetal=material('FlashMetal','#a3a4a0',.7,.24)
    screenmat=material('ScreenMaterial','#182134',0,.5)
    nodes=screenmat.node_tree.nodes; links=screenmat.node_tree.links
    tex=nodes.new('ShaderNodeTexImage'); tex.image=bpy.data.images.load(str(ROOT/'assets/fixtures/screens/dashboard-dark.png')); tex.image.pack()
    p=nodes.get('Principled BSDF'); links.new(tex.outputs['Color'],p.inputs['Base Color']); links.new(tex.outputs['Color'],p.inputs['Emission Color']); p.inputs['Emission Strength'].default_value=.8
    emission=nodes.new('ShaderNodeEmission'); links.new(tex.outputs['Color'],emission.inputs['Color']); links.new(emission.outputs[0],nodes.get('Material Output').inputs['Surface'])

    shell('UnibodyFrame',W,H,D,.0115,(0,0,0),mats['FrameMetal'],.0016)
    shell('FrontSeal',W-.00075,H-.00075,.00018,.0111,(0,-D/2-.00002,0),gasket,.00005)
    shell('FrontCeramic',W-.00115,H-.00115,.00038,.0109,(0,-D/2-.00017,0),black,.00014)
    screen(screenmat)
    shell('DynamicIsland',.0135,.0046,.00014,.0023,(0,-D/2-.00057,SH/2-.0058),iris,.00003)
    disc('FrontCamera',.00113,.00009,(.00365,-D/2-.00069,SH/2-.0058),glass)
    disc('FrontCameraCoating',.00048,.00010,(.00365,-D/2-.00075,SH/2-.0058),optic)
    shell('Earpiece',.013,.00038,.0001,.00018,(0,-D/2-.00039,H/2-.00118),iris,.00002)
    shell('RearFrameLip',W-.00045,H-.00045,.0011,.0113,(0,D/2-.00025,0),mats['FrameMetal'],.0005)
    # Reference: distinct lower glass panel, starting 5 mm below the camera deck.
    shell('RearGlassSeal',.0706,.1107,.00024,.0095,(0,D/2+.00024,-.0232),mats['PanelSeam'],.00007)
    shell('RearCeramicPanel',.0700,.1101,.00042,.0092,(0,D/2+.00037,-.0232),mats['BackGlass'],.00018)
    # Rolled shoulder, inset face and a narrow highlight lip instead of one slab.
    shell('CameraShoulder',.0732,.0416,.0025,.0105,(0,D/2+.00065,.0574),mats['FrameMetal'],.00115)
    shell('CameraPlateauSeam',.0703,.0396,.00125,.0098,(0,D/2+.00146,.0575),mats['PanelSeam'],.00055)
    shell('CameraPlateau',.0697,.0388,.00155,.0095,(0,D/2+.00162,.0576),mats['CameraDeck'],.00070)
    deck=D/2+.002395
    for index,(x,z,focal) in enumerate([(.0245,.0680,.00205),(.0245,.0481,.00235),(.0061,.0580,.00345)],1):
        # Annular metal mount with a black, recessed cavity. No painted donut.
        turned(f'LensMount{index}',[(.0080,0),(.0085,.0002),(.00875,.0006),(.00875,.00125),(.0085,.0015),(.00765,.0015),(.00765,0)],(x,deck-.0001,z),mats['LensRing'])
        turned(f'LensRing{index}',[(.00805,.00128),(.00825,.00144),(.00818,.00165),(.0080,.00173),(.0075,.00173),(.00740,.00150),(.0075,.00128)],(x,deck,z),barrel)
        turned(f'LensBarrel{index}',[(.00748,.00155),(.00730,.00156),(.0064,.0012),(.0053,.00065),(.0040,.00025),(.0040,-.00010),(.00748,-.00010)],(x,deck,z),barrel)
        disc(f'LensWell{index}',.0053,.00012,(x,deck+.00022,z),iris)
        for j in range(3):
            r=.0046+j*.00065
            turned(f'OpticalBaffle{index}_{j}',[(r,.00048+j*.00017),(r+.00013,.00055+j*.00017),(r,.00062+j*.00017),(r-.00007,.00055+j*.00017)],(x,deck,z),barrel)
        dome(f'LensOptic{index}',focal,.00042,(x,deck+.00057,z),coating)
        disc(f'Aperture{index}',focal*.33,.000035,(x,deck+.0010,z),iris)
        dome(f'CameraGlass{index}',.00735,.00036,(x,deck+.00154,z),cover)
    fx,fz=-.0254,.0679
    turned('FlashRing',[(.00335,0),(.00340,.00012),(.00322,.00025),(.00292,.00025),(.0029,0)],(fx,deck,fz),flashmetal)
    dome('TrueToneFlash',.00298,.00028,(fx,deck+.00016,fz),flash)
    for j in range(3):
        r=.0011+j*.0005
        turned(f'FlashDiffuserRidge{j}',[(r,.00042),(r+.00007,.00045),(r+.00011,.0004)],(fx,deck,fz),flashmetal if j==0 else flash)
    dome('FlashCenter',.0008,.00013,(fx,deck+.00043,fz),flash)
    dome('FlashCover',.0030,.00016,(fx,deck+.00049,fz),cover)
    disc('LiDARRim',.00345,.0001,(-.0254,deck+.000055,.0476),mats['LensRing'])
    disc('LiDAR',.00326,.00012,(-.0254,deck+.00012,.0476),iris)
    disc('RearMicrophoneBevel',.00045,.00010,(-.0256,deck+.00008,.0575),mats['LensRing'])
    disc('RearMicrophone',.00023,.00012,(-.0256,deck+.00015,.0575),iris)
    logo(mats['AppleInlay'])
    # Local width becomes depth across rail after rotating around Z.
    for name,side,z,length in [('ActionButton',-1,.0475,.0067),('VolumeUp',-1,.0337,.0107),('VolumeDown',-1,.0193,.0105),('SideButton',1,.0265,.0176),('CameraControl',1,-.031,.017)]:
        obj=shell(name+'Recess',.0037,length+.001,.00025,.00165,(side*(W/2+.00004),0,z),gasket,.00007); obj.rotation_euler.z=math.pi/2
        obj=shell(name,.0028,length,.00055,.00135,(side*(W/2+.00028),0,z),mats['FrameMetal'] if name!='CameraControl' else mats['BackGlass'],.00016); obj.rotation_euler.z=math.pi/2
    for side in [-1,1]:
        for z in [-.063,.065]:
            obj=shell(f'Antenna_{side}_{z}',D-.0013,.00085,.00009,.00012,(side*(W/2+.000025),0,z),antenna,.00002); obj.rotation_euler.z=math.pi/2
        # The upper antenna line wraps visibly across the rear shoulder.
        shell(f'RearAntennaReturn_{side}',.00315,.00072,.00009,.00012,(side*.0370,D/2+.00032,.065),antenna,.00003)
    # Bottom connector, tongue, contact pins and speaker/microphone bores.
    port=shell('USBCRim',.0093,.0033,.00016,.00155,(0,0,-H/2-.000035),mats['LensRing'],.00004); port.rotation_euler.x=math.pi/2
    port=shell('USBCOpening',.0086,.00265,.00018,.00125,(0,0,-H/2-.00012),iris,.00003); port.rotation_euler.x=math.pi/2
    port=shell('USBCTongue',.0064,.0007,.00019,.00028,(0,0,-H/2-.00023),gasket,.00003); port.rotation_euler.x=math.pi/2
    for side in [-1,1]:
        for i in range(6):
            disc(f'BottomBore_{side}_{i}',.00061,.0001,(side*(.015+i*.0025),0,-H/2-.00007),iris,'Z')
        disc(f'Pentalobe_{side}',.00062,.00012,(side*.009,0,-H/2-.00008),gasket,'Z')
    return mats

def aim(obj,point): obj.rotation_euler=(Vector(point)-obj.location).to_track_quat('-Z','Y').to_euler()

def studio():
    scene=bpy.context.scene
    scene.render.engine='CYCLES'; scene.cycles.samples=24; scene.cycles.use_denoising=True
    scene.render.resolution_x=900; scene.render.resolution_y=1100; scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG'; scene.render.image_settings.color_mode='RGBA'; scene.render.film_transparent=True
    scene.world.color=(.035,.035,.035)
    scene.view_settings.view_transform='AgX'
    for name,loc,power,size in [('Key',(-.16,-.19,.23),.7,.19),('Rim',(.14,.18,.17),1.1,.13),('RearFill',(-.18,.23,.04),.5,.17),('FrontFill',(.18,-.13,-.02),.3,.12)]:
        bpy.ops.object.light_add(type='AREA',location=loc); obj=bpy.context.object; obj.name=name; obj.data.energy=power; obj.data.shape='DISK'; obj.data.size=size; aim(obj,(0,0,0))
    bpy.ops.object.camera_add(location=(.13,-.35,.10)); camera=bpy.context.object; camera.name='StudioCamera'; camera.data.type='ORTHO'; camera.data.ortho_scale=.20; aim(camera,(0,0,0)); scene.camera=camera
    return camera

def main():
    OUT.mkdir(parents=True,exist_ok=True); RENDERS.mkdir(exist_ok=True)
    mats=build()
    objects=[obj for obj in bpy.context.scene.objects if obj.type=='MESH']
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects: obj.select_set(True)
    glb=OUT/'iphone-18-pro-max.glb'
    bpy.ops.export_scene.gltf(filepath=str(glb),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_extras=True)
    camera=studio()
    scene=bpy.context.scene
    scene['device']='iPhone 18 Pro Max — reference reconstruction'
    scene['accuracy']='Published outer size; reference-estimated camera/button/bezel measurements. Official finish lineup; visually estimated finish colors.'
    scene['finishPalettes']=json.dumps(PALETTES)
    scene.unit_settings.system='METRIC'
    def finish(variant):
        for name,color in PALETTES[variant].items():
            mats[name].diffuse_color=rgba(color); mats[name].node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=rgba(color)
    # Keep separate editable Blender scenes with shared mesh data and unique materials.
    for variant in PALETTES:
        finish(variant)
        for view,pos in [('front',(.095,-.34,.065)),('back',(-.105,.34,.060))]:
            camera.location=pos; aim(camera,(0,0,0)); scene.render.filepath=str(RENDERS/f'{variant}-{view}.png'); bpy.ops.render.render(write_still=True)
    finish('burgundy')
    for view,pos in [('front-flat',(0,-.35,0)),('back-flat',(0,.35,0)),('left',(-.35,-.025,0)),('right',(.35,-.025,0))]:
        camera.location=pos; aim(camera,(0,0,0)); scene.render.filepath=str(RENDERS/f'burgundy-{view}.png'); bpy.ops.render.render(write_still=True)
    scene.render.resolution_x=560; scene.render.resolution_y=744
    camera.data.ortho_scale=.177; camera.location=(0,.35,.035); aim(camera,(0,0,.035))
    scene.render.filepath=str(RENDERS/'burgundy-reference-detail.png'); bpy.ops.render.render(write_still=True)
    scene.render.resolution_x=900; scene.render.resolution_y=1100; camera.data.ortho_scale=.20
    camera.location=(.095,-.34,.065); aim(camera,(0,0,0))
    scene.name='Burgundy'
    for variant in PALETTES:
        if variant == 'burgundy': continue
        copied=scene.copy(); copied.name=variant.replace('-', ' ').title(); copied.use_fake_user=True
        copies={}
        for name,color in PALETTES[variant].items():
            mat=mats[name].copy(); mat.name=f'{name}_{variant}'; mat.diffuse_color=rgba(color); mat.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=rgba(color); copies[name]=mat
        for obj in list(copied.objects):
            if obj.type!='MESH': continue
            duplicate=obj.copy(); duplicate.data=obj.data.copy()
            copied.collection.objects.link(duplicate)
            # copy() initially links the original collection; isolate before unlink below.
            for slot in duplicate.material_slots:
                if slot.material.name in copies: slot.material=copies[slot.material.name]
        # Scene.copy shares child collections, so use a fresh root collection with only duplicates and studio objects.
        for child in list(copied.collection.children): copied.collection.children.unlink(child)
        for obj in scene.objects:
            if obj.type in ('CAMERA','LIGHT'): copied.collection.objects.link(obj)
        copied.camera=camera
    bpy.context.window.scene=scene
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'iphone-18-pro-max.blend'))
    data=glb.read_bytes()
    (OUT/'asset-info.json').write_text(json.dumps({'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data),'palettes':PALETTES,'screenPixels':[1320,2868],'bodyMeters':[W,H,D],'meshCount':len(objects),'revision':'official-finishes-v3','finishSource':'https://www.apple.com/id/iphone-18-pro/'},indent=2)+'\n')
    print('FORMA_ASSET_COMPLETE',len(data))

if __name__=='__main__': main()
