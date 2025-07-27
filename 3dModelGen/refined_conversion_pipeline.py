#!/usr/bin/env python3
"""
Refined Conversion Pipeline using exact logic from refined_png_to_dxf_smart_curves
PNG → SVG (potrace) → DXF with smart curve detection
"""

import os
import subprocess
import math
import xml.etree.ElementTree as ET
from PIL import Image
import ezdxf
from svgpathtools import svg2paths2, Line, QuadraticBezier, CubicBezier, Arc

def preprocess_png_image(input_path: str, output_path: str, processing_type: str = "full_processing") -> bool:
    """
    EXACT preprocessing from advanced_pipeline.py _preprocess_image_advanced method.
    This is the original code that creates 10_preprocessed_final.png
    """
    try:
        import cv2
        import numpy as np
        from PIL import ImageEnhance
        
        # Read image
        img = Image.open(input_path)
        
        # Create debug directory
        debug_dir = "debug_preprocessing"
        os.makedirs(debug_dir, exist_ok=True)
        
        # Convert to grayscale and save
        if img.mode != 'L':
            img = img.convert('L')
        img.save(f"{debug_dir}/01_original_grayscale.png")
        
        # Convert PIL to OpenCV format
        img_array = np.array(img)
        
        # Step 1: Noise reduction (preserve edges)
        blurred = cv2.medianBlur(img_array, 3)
        Image.fromarray(blurred).save(f"{debug_dir}/02_median_blur.png")
        
        # Step 2: Morphological opening to remove noise
        kernel = np.ones((2,2), np.uint8)
        opened = cv2.morphologyEx(blurred, cv2.MORPH_OPEN, kernel, iterations=1)
        Image.fromarray(opened).save(f"{debug_dir}/03_morphology_open.png")
        
        # Step 3: CLAHE for local contrast enhancement
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        contrast_enhanced = clahe.apply(opened)
        Image.fromarray(contrast_enhanced).save(f"{debug_dir}/04_clahe_contrast.png")
        
        # Step 4: Dual thresholding approach
        # Adaptive threshold
        adaptive_thresh = cv2.adaptiveThreshold(
            contrast_enhanced, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 
            blockSize=15, C=1
        )
        Image.fromarray(adaptive_thresh).save(f"{debug_dir}/05a_adaptive_threshold.png")
        
        # Otsu threshold  
        _, otsu_thresh = cv2.threshold(contrast_enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        Image.fromarray(otsu_thresh).save(f"{debug_dir}/05b_otsu_threshold.png")
        
        # Choose the better threshold (using Otsu as in original)
        chosen_thresh = otsu_thresh
        threshold_method = "otsu"
        
        Image.fromarray(chosen_thresh).save(f"{debug_dir}/06_chosen_threshold_{threshold_method}.png")
        
        # Check if we should skip post-processing (threshold_only mode)
        if processing_type == "threshold_only":
            print("DEBUG: Using threshold-only mode - skipping post-processing")
            processed_img = Image.fromarray(chosen_thresh)
            processed_img.save(f"{debug_dir}/10_preprocessed_final.png")
            processed_img.save(output_path)
            print(f"DEBUG: Preprocessing complete (threshold-only). Check {debug_dir}/ for results.")
            return True
        
        # Continue with original post-processing (steps 07-10)
        img_array = chosen_thresh
        
        # Component analysis and filtering (Step 07)
        num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(img_array, connectivity=8)
        total_pixels = img_array.shape[0] * img_array.shape[1]
        
        # Calculate dynamic threshold based on image complexity
        if num_labels > 50:  # Complex image with many components
            min_area = max(20, total_pixels * 0.00005)  # Keep more detail (0.005% instead of 0.01%)
            complexity = "complex"
        elif num_labels > 20:  # Moderately complex
            min_area = max(30, total_pixels * 0.0001)   # Standard filtering
            complexity = "moderate"
        else:  # Simple image
            min_area = max(50, total_pixels * 0.0002)   # More aggressive for simple images
            complexity = "simple"
        
        print(f"DEBUG: Image complexity: {complexity}, min_area threshold: {min_area}")
        
        # Create clean binary image
        clean_img = np.zeros_like(img_array)
        kept_components = 0
        for i in range(1, num_labels):  # Skip background (label 0)
            if stats[i, cv2.CC_STAT_AREA] >= min_area:
                clean_img[labels == i] = 255
                kept_components += 1
        
        print(f"DEBUG: Kept {kept_components} components out of {num_labels-1}")
        Image.fromarray(clean_img).save(f"{debug_dir}/07_component_filtered.png")
        
        # Step 5: Gentle final cleanup (preserve detail)
        # Use smaller kernel for final morphology
        kernel_final = np.ones((1,1), np.uint8)  # Minimal final cleanup
        clean_img = cv2.morphologyEx(clean_img, cv2.MORPH_CLOSE, kernel_final, iterations=1)
        Image.fromarray(clean_img).save(f"{debug_dir}/08_final_morphology.png")
        
        # Convert back to PIL Image
        processed_img = Image.fromarray(clean_img)
        
        # Moderate contrast boost (preserve detail)
        enhancer = ImageEnhance.Contrast(processed_img)
        processed_img = enhancer.enhance(1.5)  # Reduced from 2.0
        processed_img.save(f"{debug_dir}/09_final_contrast.png")
        
        processed_img.save(f"{debug_dir}/10_preprocessed_final.png")
        processed_img.save(output_path)
        print(f"DEBUG: Preprocessing complete. Check {debug_dir}/ for intermediate results.")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Preprocessing failed: {e}")
        return False

def png_to_svg_potrace(png_path: str, svg_path: str) -> bool:
    """Convert PNG to SVG using potrace with balanced parameters."""
    try:
        # Create temporary PBM file
        pbm_path = png_path.replace('.png', '.pbm')
        
        # Convert PNG to PBM
        img = Image.open(png_path)
        if img.mode != 'L':
            img = img.convert('L')
        
        # Convert to 1-bit black and white
        img = img.point(lambda x: 0 if x < 128 else 255, '1')
        img.save(pbm_path, 'PPM')
        
        # Build potrace command with balanced settings
        command = [
            "potrace",
            "--turdsize", "2",        # Moderate detail
            "--alphamax", "0.8",      # Good curve smoothness
            "--opttolerance", "0.2",  # Balanced precision
            "--longcurve",            # Preserve long smooth curves
            "--svg",                  # Output format
            "--output", svg_path,     # Output file
            pbm_path                  # Input file
        ]
        
        # Run potrace
        result = subprocess.run(command, capture_output=True, text=True)
        
        # Clean up temporary PBM file
        if os.path.exists(pbm_path):
            os.remove(pbm_path)
        
        if result.returncode == 0 and os.path.exists(svg_path):
            print(f"   ✅ PNG to SVG conversion successful (potrace)")
            return True
        else:
            print(f"   ❌ potrace failed: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"   ❌ PNG to SVG conversion failed: {e}")
        return False

def get_svg_dimensions(svg_path: str):
    """Extract SVG dimensions and calculate scaling factor."""
    try:
        tree = ET.parse(svg_path)
        root = tree.getroot()
        
        # Try to get width and height from SVG
        width = root.get('width')
        height = root.get('height')
        
        # Try to get viewBox
        viewBox = root.get('viewBox')
        
        if viewBox:
            # Parse viewBox: "min-x min-y width height"
            parts = viewBox.split()
            if len(parts) >= 4:
                vb_width = float(parts[2])
                vb_height = float(parts[3])
                print(f"   📐 SVG viewBox: {vb_width} x {vb_height}")
                return vb_width, vb_height
        
        if width and height:
            # Remove units if present (px, pt, etc.)
            width_val = float(width.rstrip('px').rstrip('pt').rstrip('mm').rstrip('cm'))
            height_val = float(height.rstrip('px').rstrip('pt').rstrip('mm').rstrip('cm'))
            print(f"   📐 SVG dimensions: {width_val} x {height_val}")
            return width_val, height_val
        
        # Fallback: analyze path bounds
        return None, None
        
    except Exception as e:
        print(f"   ⚠️  Could not parse SVG dimensions: {e}")
        return None, None

def is_essentially_straight(segment, tolerance=0.05):
    """Check if a curve is essentially straight and should be treated as a line."""
    try:
        # Get start and end points
        start = complex(segment.start.real, segment.start.imag)
        end = complex(segment.end.real, segment.end.imag)
        
        # Calculate direct distance
        direct_distance = abs(end - start)
        
        if direct_distance < 1e-6:  # Too short to matter
            return True
        
        # Sample points along the curve
        max_deviation = 0
        for t in [0.25, 0.5, 0.75]:
            try:
                point = segment.point(t)
                curve_point = complex(point.real, point.imag)
                
                # Calculate expected point on straight line
                expected_point = start + t * (end - start)
                
                # Calculate deviation from straight line
                deviation = abs(curve_point - expected_point)
                max_deviation = max(max_deviation, deviation)
                
            except Exception:
                continue
        
        # If maximum deviation is small relative to length, treat as straight
        relative_deviation = max_deviation / direct_distance
        return relative_deviation < tolerance
        
    except Exception:
        return False

def is_significant_arc(segment, min_radius=2.0, min_angle=0.1):
    """Check if an arc is significant enough to preserve as an arc."""
    try:
        if not hasattr(segment, 'radius'):
            return False
            
        radius = float(segment.radius)
        if radius < min_radius:
            return False
            
        # Check if arc spans significant angle
        try:
            start_angle = segment.start_angle()
            end_angle = segment.end_angle()
            angle_diff = abs(end_angle - start_angle)
            
            # Handle wraparound
            if angle_diff > math.pi:
                angle_diff = 2 * math.pi - angle_diff
                
            return angle_diff > min_angle
            
        except Exception:
            return False
            
    except Exception:
        return False

def smart_curve_preserving_svg_to_dxf(svg_path: str, output_path: str, target_size_mm=100) -> bool:
    """
    Smart SVG to DXF converter that only creates curves when significantly curved.
    Avoids tiny unnecessary curves on straight lines.
    """
    try:
        print(f"   🔧 Converting SVG to DXF with SMART CURVE DETECTION")
        print(f"   🎯 Target size: {target_size_mm}mm for larger dimension")
        print(f"   🧠 Intelligent curve filtering - no tiny curves on straight lines")
        
        # Get SVG dimensions and calculate scaling
        svg_width, svg_height = get_svg_dimensions(svg_path)
        if svg_width and svg_height:
            # Use the larger dimension for target size
            max_dimension = max(svg_width, svg_height)
            scale_factor = target_size_mm / max_dimension
        else:
            scale_factor = 1.0
            print(f"   ⚠️  Using default scale factor: {scale_factor}")
        
        # Read SVG
        try:
            paths, attributes, svg_attributes = svg2paths2(svg_path)
        except Exception as e:
            print(f"   ❌ Failed to read SVG: {e}")
            return False
        
        if not paths:
            print(f"   ⚠️  No paths found in SVG")
            return False
        
        print(f"   📊 Found {len(paths)} path objects in SVG")
        
        # Create DXF document
        doc = ezdxf.new('R2010')
        doc.units = ezdxf.units.MM
        msp = doc.modelspace()
        
        total_entities = 0
        entity_counts = {"lines": 0, "splines": 0, "arcs": 0, "polylines": 0}
        curve_rejections = {"too_straight": 0, "too_small": 0, "too_short": 0}
        
        # Smart curve detection parameters
        MIN_CURVE_LENGTH = 1.0 * scale_factor  # Minimum length to consider for curves
        STRAIGHTNESS_TOLERANCE = 0.05
        MIN_ARC_RADIUS = 2.0 * scale_factor  # Minimum radius for arcs
        
        print(f"   🧠 Smart filtering parameters:")
        print(f"      • Min curve length: {MIN_CURVE_LENGTH:.2f}mm")
        print(f"      • Straightness tolerance: {STRAIGHTNESS_TOLERANCE}")
        print(f"      • Min arc radius: {MIN_ARC_RADIUS:.2f}mm")
        
        for i, path in enumerate(paths):
            if not path:
                continue
            
            if i % 20 == 0:
                print(f"   🔧 Processing path {i+1}/{len(paths)}")

            # Handle compound paths - but group consecutive lines
            sub_paths = path.continuous_subpaths()
            
            for j, sub_path in enumerate(sub_paths):
                try:
                    # Collect consecutive line segments
                    current_polyline_points = []
                    
                    for k, segment in enumerate(sub_path):
                        if isinstance(segment, Line):
                            # Add to current polyline
                            if not current_polyline_points:
                                current_polyline_points.append(
                                    (float(segment.start.real) * scale_factor, float(segment.start.imag) * scale_factor)
                                )
                            current_polyline_points.append(
                                (float(segment.end.real) * scale_factor, float(segment.end.imag) * scale_factor)
                            )
                            
                        else:
                            # Process accumulated line segments as polyline
                            if len(current_polyline_points) >= 2:
                                msp.add_lwpolyline(current_polyline_points)
                                entity_counts["polylines"] += 1
                                total_entities += 1
                                current_polyline_points = []
                            
                            # Process curve segment with smart filtering
                            segment_length = 0
                            try:
                                segment_length = abs(segment.end - segment.start) * scale_factor
                            except:
                                segment_length = 0
                                
                            # Skip very short segments
                            if segment_length < MIN_CURVE_LENGTH:
                                curve_rejections["too_short"] += 1
                                continue
                                
                            if isinstance(segment, (QuadraticBezier, CubicBezier)):
                                # Check if essentially straight
                                if is_essentially_straight(segment, STRAIGHTNESS_TOLERANCE):
                                    # Convert to line instead
                                    start = (float(segment.start.real) * scale_factor, float(segment.start.imag) * scale_factor)
                                    end = (float(segment.end.real) * scale_factor, float(segment.end.imag) * scale_factor)
                                    msp.add_line(start, end)
                                    entity_counts["lines"] += 1
                                    total_entities += 1
                                    curve_rejections["too_straight"] += 1
                                else:
                                    # Create spline
                                    control_points = []
                                    
                                    if isinstance(segment, QuadraticBezier):
                                        control_points = [
                                            (float(segment.start.real) * scale_factor, float(segment.start.imag) * scale_factor),
                                            (float(segment.control.real) * scale_factor, float(segment.control.imag) * scale_factor),
                                            (float(segment.end.real) * scale_factor, float(segment.end.imag) * scale_factor)
                                        ]
                                        degree = 2
                                    else:  # CubicBezier
                                        control_points = [
                                            (float(segment.start.real) * scale_factor, float(segment.start.imag) * scale_factor),
                                            (float(segment.control1.real) * scale_factor, float(segment.control1.imag) * scale_factor),
                                            (float(segment.control2.real) * scale_factor, float(segment.control2.imag) * scale_factor),
                                            (float(segment.end.real) * scale_factor, float(segment.end.imag) * scale_factor)
                                        ]
                                        degree = 3
                                    
                                    try:
                                        spline = msp.add_open_spline(control_points, degree=degree)
                                        entity_counts["splines"] += 1
                                        total_entities += 1
                                    except Exception:
                                        # Fallback to line
                                        start = (float(segment.start.real) * scale_factor, float(segment.start.imag) * scale_factor)
                                        end = (float(segment.end.real) * scale_factor, float(segment.end.imag) * scale_factor)
                                        msp.add_line(start, end)
                                        entity_counts["lines"] += 1
                                        total_entities += 1
                                        
                            elif isinstance(segment, Arc):
                                # Check if arc is significant
                                if is_significant_arc(segment, MIN_ARC_RADIUS):
                                    try:
                                        center = (float(segment.center.real) * scale_factor, float(segment.center.imag) * scale_factor)
                                        radius = float(segment.radius) * scale_factor
                                        start_angle = math.degrees(segment.start_angle())
                                        end_angle = math.degrees(segment.end_angle())
                                        
                                        # Ensure proper angle direction
                                        if end_angle < start_angle:
                                            end_angle += 360
                                        
                                        msp.add_arc(center, radius, start_angle, end_angle)
                                        entity_counts["arcs"] += 1
                                        total_entities += 1
                                        
                                    except Exception:
                                        # Fallback to line
                                        start = (float(segment.start.real) * scale_factor, float(segment.start.imag) * scale_factor)
                                        end = (float(segment.end.real) * scale_factor, float(segment.end.imag) * scale_factor)
                                        msp.add_line(start, end)
                                        entity_counts["lines"] += 1
                                        total_entities += 1
                                else:
                                    # Convert small arc to line
                                    start = (float(segment.start.real) * scale_factor, float(segment.start.imag) * scale_factor)
                                    end = (float(segment.end.real) * scale_factor, float(segment.end.imag) * scale_factor)
                                    msp.add_line(start, end)
                                    entity_counts["lines"] += 1
                                    total_entities += 1
                                    curve_rejections["too_small"] += 1
                    
                    # Process any remaining line segments
                    if len(current_polyline_points) >= 2:
                        msp.add_lwpolyline(current_polyline_points)
                        entity_counts["polylines"] += 1
                        total_entities += 1
                        
                except Exception as e:
                    if i < 3:  # Only show errors for first few paths
                        print(f"       ⚠️  Error processing sub-path: {e}")
                    continue
        
        # Save DXF
        if total_entities > 0:
            try:
                # Ensure output directory exists
                output_dir = os.path.dirname(output_path)
                if output_dir:  # Only create directory if path has a directory part
                    os.makedirs(output_dir, exist_ok=True)
                
                abs_output_path = os.path.abspath(output_path)
                print(f"   💾 Saving to: {abs_output_path}")
                doc.saveas(abs_output_path)
                
                if os.path.exists(abs_output_path):
                    file_size = os.path.getsize(abs_output_path)
                    print(f"   ✅ Success: {total_entities} entities ({file_size/1024:.1f}KB)")
                    
                    # Show entity breakdown
                    print(f"   📊 Entity types:")
                    for entity_type, count in entity_counts.items():
                        if count > 0:
                            print(f"      • {entity_type}: {count}")
                    
                    # Show smart filtering results
                    total_rejected = sum(curve_rejections.values())
                    if total_rejected > 0:
                        print(f"   🧠 Smart filtering:")
                        print(f"      • Rejected {total_rejected} unnecessary curves")
                        for reason, count in curve_rejections.items():
                            if count > 0:
                                print(f"        - {reason}: {count}")
                    
                    # Calculate curve percentage
                    curve_entities = entity_counts["splines"] + entity_counts["arcs"]
                    curve_percentage = (curve_entities / total_entities * 100) if total_entities > 0 else 0
                    print(f"   📈 Meaningful curves: {curve_percentage:.1f}% ({curve_entities}/{total_entities})")
                    
                    return True
                else:
                    print(f"   ❌ DXF file was not created")
                    return False
            except Exception as e:
                print(f"   ❌ Failed to save DXF: {e}")
                return False
        else:
            print(f"   ❌ No entities to save")
            return False
            
    except Exception as e:
        print(f"   ❌ SVG to DXF conversion failed: {e}")
        return False

# Keep the original function names for compatibility
def png_to_svg_opencv(png_path: str, svg_path: str) -> bool:
    """Redirect to potrace-based conversion for better results."""
    return png_to_svg_potrace(png_path, svg_path)

def svg_to_dxf_smart_curves(svg_path: str, output_path: str, target_size_mm: float = 100, enable_smart_curves: bool = True) -> bool:
    """Redirect to smart curve preserving conversion."""
    return smart_curve_preserving_svg_to_dxf(svg_path, output_path, target_size_mm)

# Main execution function for testing
if __name__ == "__main__":
    import glob
    
    # Test with PNG files from pngs directory
    pngs_dir = os.path.join(os.path.dirname(__file__), 'pngs')
    png_files = glob.glob(os.path.join(pngs_dir, '*.png'))
    
    if not png_files:
        print("No PNG files found in /pngs directory")
        exit(1)
    
    # Create output directory for SVG files
    output_dir = "svg_outputs_refined"
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"Found {len(png_files)} PNG files to process")
    print(f"Output directory: {output_dir}")
    
    successful_conversions = 0
    
    for i, png_file in enumerate(png_files, 1):
        print(f"\n=== Processing {i}/{len(png_files)}: {os.path.basename(png_file)} ===")
        
        base_name = os.path.splitext(os.path.basename(png_file))[0]
        
        # Step 1: Preprocess PNG
        preprocessed_png = f"temp_{base_name}_preprocessed.png"
        print("🔧 Step 1: Preprocessing PNG...")
        if not preprocess_png_image(png_file, preprocessed_png, "full_processing"):
            print("❌ Preprocessing failed, skipping file")
            continue
        
        # Step 2: Convert PNG to SVG (final output)
        svg_file = os.path.join(output_dir, f"{base_name}.svg")
        print("🔧 Step 2: Converting PNG to SVG...")
        if png_to_svg_potrace(preprocessed_png, svg_file):
            print(f"✅ Successfully converted: {svg_file}")
            successful_conversions += 1
        else:
            print("❌ PNG to SVG conversion failed")
        
        # Clean up temporary files
        if os.path.exists(preprocessed_png):
            os.remove(preprocessed_png)
    
    # Summary
    print(f"\n=== CONVERSION SUMMARY ===")
    print(f"Total files processed: {len(png_files)}")
    print(f"Successful conversions: {successful_conversions}")
    print(f"Failed conversions: {len(png_files) - successful_conversions}")
    print(f"Output directory: {os.path.abspath(output_dir)}")
    
    if successful_conversions > 0:
        print(f"\n✅ {successful_conversions} SVG files saved to '{output_dir}' directory")
