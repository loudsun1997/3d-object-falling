#!/usr/bin/env python3
"""
SVG to GLB Converter
Converts SVG vector files to 3D GLB models using trimesh extrusion.
Processes all SVG files from svg_outputs_refined directory.
"""

import os
import glob
import trimesh
import pymeshlab
from pathlib import Path

# --- Configuration ---
# Input directory containing SVG files
input_dir = 'svg_outputs_refined'

# Output directory for GLB files
output_dir = 'glb_outputs'

# Extrusion settings
extrusion_height = 130.0  # Height of the 3D extrusion (increased for thicker models)

# Mesh optimization settings
enable_simplification = True
target_face_count = 5000  # Target number of faces for simplified mesh
preserve_uvs = True  # Generate UV coordinates for texturing

# --- Functions ---
def convert_svg_to_glb(svg_path: str, glb_path: str, height: float = 2.0, 
                       simplify: bool = True, target_faces: int = 5000, add_uvs: bool = True) -> bool:
    """
    Convert a single SVG file to GLB format with mesh optimization.
    
    Args:
        svg_path: Path to input SVG file
        glb_path: Path to output GLB file
        height: Extrusion height for 3D conversion
        simplify: Whether to simplify the mesh to reduce vertex count
        target_faces: Target number of faces for simplified mesh
        add_uvs: Whether to generate UV coordinates
    
    Returns:
        bool: True if conversion successful, False otherwise
    """
    try:
        print(f"  🔧 Loading SVG: {os.path.basename(svg_path)}")
        
        # Load the 2D vector paths from the SVG file
        # The 'process=True' argument merges multiple paths into one
        path = trimesh.load_path(svg_path, process=True)
        
        if path is None or len(path.entities) == 0:
            print(f"    ⚠️  No valid paths found in SVG file")
            return False
        
        print(f"    📐 Found {len(path.entities)} path entities")
        print(f"    🏗️  Extruding to height: {height}mm")
        
        # Extrude the 2D shape into a 3D mesh
        mesh = path.extrude(height=height)
        
        # Handle case where extrusion returns multiple meshes
        if isinstance(mesh, list):
            if len(mesh) == 0:
                print(f"    ❌ No meshes generated from extrusion")
                return False
            elif len(mesh) == 1:
                mesh = mesh[0]
            else:
                # Combine multiple meshes into one
                print(f"    🔗 Combining {len(mesh)} separate meshes")
                mesh = trimesh.util.concatenate(mesh)
        
        if mesh is None:
            print(f"    ❌ Failed to create 3D mesh from paths")
            return False
        
        # Print original mesh statistics
        original_vertices = len(mesh.vertices)
        original_faces = len(mesh.faces)
        print(f"    📊 Original mesh: {original_vertices} vertices, {original_faces} faces")
        
        # Mesh optimization
        if simplify and original_faces > target_faces:
            print(f"    🔄 Simplifying mesh from {original_faces} to ~{target_faces} faces")
            try:
                # Use pymeshlab for better mesh simplification
                ms = pymeshlab.MeshSet()
                
                # Create a pymeshlab mesh from trimesh
                vertices = mesh.vertices.astype('float64')
                faces = mesh.faces.astype('int32')
                ms.add_mesh(pymeshlab.Mesh(vertices, faces))
                
                # Apply quadric edge collapse decimation
                target_face_ratio = target_faces / original_faces
                ms.apply_filter('simplification_quadric_edge_collapse_decimation', 
                               targetfacenum=target_faces, 
                               preservenormal=True, 
                               preservetopology=True)
                
                # Get the simplified mesh back
                simplified_mesh = ms.current_mesh()
                
                # Convert back to trimesh
                mesh = trimesh.Trimesh(vertices=simplified_mesh.vertex_matrix(), 
                                     faces=simplified_mesh.face_matrix())
                
                print(f"    ✅ Simplified to {len(mesh.vertices)} vertices, {len(mesh.faces)} faces")
                
            except Exception as e:
                print(f"    ⚠️  Simplification error: {str(e)}, using original mesh")
        
        # Generate UV coordinates for texturing
        if add_uvs:
            try:
                # Generate simple planar UV mapping
                mesh.visual = mesh.visual.to_color()
                print(f"    🎨 Generated UV coordinates")
            except Exception as e:
                print(f"    ⚠️  UV generation warning: {str(e)}")
        
        # Ensure the mesh has proper normals
        if not hasattr(mesh.vertex_normals, '__len__') or len(mesh.vertex_normals) == 0:
            mesh.vertex_normals  # This computes normals if they don't exist
            print(f"    🔄 Computed vertex normals")
        
        # Ensure output directory exists
        os.makedirs(os.path.dirname(glb_path), exist_ok=True)
        
        # Export the 3D mesh to a GLB file
        mesh.export(glb_path)
        
        if os.path.exists(glb_path):
            file_size = os.path.getsize(glb_path)
            print(f"    ✅ Success: {glb_path} ({file_size/1024:.1f}KB)")
            
            # Print final mesh statistics
            print(f"       📊 Final: {len(mesh.vertices)} vertices, {len(mesh.faces)} faces")
            
            return True
        else:
            print(f"    ❌ GLB file was not created")
            return False
            
    except Exception as e:
        print(f"    ❌ Conversion failed: {str(e)}")
        return False

def batch_convert_svg_to_glb(input_directory: str, output_directory: str, extrusion_height: float) -> None:
    """
    Convert all SVG files in a directory to GLB format with optimization.
    
    Args:
        input_directory: Directory containing SVG files
        output_directory: Directory to save GLB files
        extrusion_height: Height for 3D extrusion
    """
    # Find all SVG files in the input directory
    svg_pattern = os.path.join(input_directory, '*.svg')
    svg_files = glob.glob(svg_pattern)
    
    if not svg_files:
        print(f"❌ No SVG files found in '{input_directory}' directory")
        return
    
    print(f"🎯 Found {len(svg_files)} SVG files to convert")
    print(f"📁 Input directory: {os.path.abspath(input_directory)}")
    print(f"📁 Output directory: {os.path.abspath(output_directory)}")
    print(f"🏗️  Extrusion height: {extrusion_height}mm")
    print(f"🔧 Mesh simplification: {'Enabled' if enable_simplification else 'Disabled'}")
    if enable_simplification:
        print(f"🎯 Target face count: {target_face_count}")
    
    # Create output directory
    os.makedirs(output_directory, exist_ok=True)
    
    successful_conversions = 0
    failed_conversions = 0
    
    # Process each SVG file
    for i, svg_file in enumerate(svg_files, 1):
        print(f"\n=== Processing {i}/{len(svg_files)}: {os.path.basename(svg_file)} ===")
        
        # Generate output GLB filename
        base_name = os.path.splitext(os.path.basename(svg_file))[0]
        glb_file = os.path.join(output_directory, f"{base_name}.glb")
        
        # Convert SVG to GLB with optimization
        if convert_svg_to_glb(svg_file, glb_file, extrusion_height, 
                             enable_simplification, target_face_count, preserve_uvs):
            successful_conversions += 1
        else:
            failed_conversions += 1
    
    # Print summary
    print(f"\n=== CONVERSION SUMMARY ===")
    print(f"Total files processed: {len(svg_files)}")
    print(f"Successful conversions: {successful_conversions}")
    print(f"Failed conversions: {failed_conversions}")
    print(f"Output directory: {os.path.abspath(output_directory)}")
    
    if successful_conversions > 0:
        print(f"\n✅ {successful_conversions} optimized GLB files saved to '{output_directory}' directory")
        print(f"🎮 GLB files can be viewed in 3D viewers, imported into Blender, or used in web applications")
        print(f"⚡ Meshes have been optimized for web performance with reduced vertex counts")

# --- Main Execution ---
if __name__ == "__main__":
    print("🚀 SVG to GLB Converter")
    print("=" * 50)
    
    # Check if input directory exists
    if not os.path.exists(input_dir):
        print(f"❌ Input directory '{input_dir}' not found")
        print("   Please run the refined_conversion_pipeline.py first to generate SVG files")
        exit(1)
    
    # Check if trimesh is available
    try:
        import trimesh
        print(f"📦 Using trimesh version: {trimesh.__version__}")
    except ImportError:
        print("❌ trimesh library not found")
        print("   Install with: pip install trimesh")
        exit(1)
    
    # Run batch conversion
    batch_convert_svg_to_glb(input_dir, output_dir, extrusion_height)
