"""
Advanced PNG to SVG conversion pipeline optimized for AI-generated images.
Uses advanced preprocessing, adaptive thresholding, and optimized path processing.
"""

import os
import time
import numpy as np
from typing import List, Tuple
from loguru import logger

try:
    from svgpathtools import svg2paths, Path, Line, Arc, CubicBezier, QuadraticBezier
    from svgpathtools import wsvg
    SVGPATHTOOLS_AVAILABLE = True
except ImportError:
    SVGPATHTOOLS_AVAILABLE = False

try:
    from ai_image_tuning import PREPROCESSING, POTRACE, VPYPE, SVG_PROCESSING
    TUNING_AVAILABLE = True
except ImportError:
    TUNING_AVAILABLE = False
    # Default parameters if tuning file not available
    PREPROCESSING = {
        'bilateral_d': 9,
        'bilateral_sigmaColor': 75,
        'bilateral_sigmaSpace': 75,
        'adaptive_blocksize': 11,
        'adaptive_C': 2,
        'contrast_factor': 1.5,
    }
    POTRACE = {
        'turdsize': 2,
        'alphamax': 0.5,
        'opttolerance': 0.2,
        'longcurve': True,
    }
    VPYPE = {
        'linemerge_tolerance': 0.1,
        'linesimplify_tolerance': 0.1,
        'reloop_tolerance': 0.1,
    }
    SVG_PROCESSING = {
        'curve_simplify_threshold': 0.1,
        'collinear_tolerance': 0.1,
        'close_path_tolerance': 0.1,
    }

try:
    from .optimized_pipeline import OptimizedPipeline
    from .base_pipeline import ConversionResult
except ImportError:
    # Handle direct execution
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from optimized_pipeline import OptimizedPipeline
    from base_pipeline import ConversionResult


class AdvancedPipeline(OptimizedPipeline):
    """Advanced conversion pipeline optimized for AI-generated images."""
    
    def __init__(self, config: dict):
        super().__init__(config)
        self.name = "advanced"
    
    def get_required_tools(self) -> List[str]:
        """Return list of required command-line tools."""
        return ["potrace", "vpype"]
    
    def check_dependencies(self) -> bool:
        """Check if all dependencies are available."""
        if not SVGPATHTOOLS_AVAILABLE:
            logger.error("svgpathtools library not available. Install with: pip install svgpathtools")
            return False
        return True
    
    def convert(self, input_path: str, output_path: str) -> ConversionResult:
        """Convert PNG to SVG using advanced pipeline."""
        result = ConversionResult(input_path, output_path)
        start_time = time.time()
        
        # Create debug directory
        debug_dir = "debug_preprocessing"
        os.makedirs(debug_dir, exist_ok=True)
        
        try:
            # Validate input
            if not self.validate_input(input_path):
                result.error_message = "Input validation failed"
                return result
            
            # Check dependencies
            if not self.check_dependencies():
                result.error_message = "Required dependencies not available"
                return result
            
            # Stage 1: Advanced preprocessing
            preprocessed_png = self.get_temp_path("preprocessed.png")
            if not self._preprocess_image(input_path, preprocessed_png, result):
                return result
            
            # Copy preprocessed image to debug directory
            import shutil
            shutil.copy(preprocessed_png, f"{debug_dir}/10_preprocessed_final.png")
            
            # Stage 2: PNG to SVG using optimized potrace
            intermediate_svg = self.get_temp_path("traced.svg")
            if not self._png_to_svg_potrace(preprocessed_png, intermediate_svg, result):
                return result
            
            # Copy traced SVG to debug directory
            shutil.copy(intermediate_svg, f"{debug_dir}/11_potrace_traced.svg")
            
            # Stage 3: SVG cleanup using vpype
            cleaned_svg = self.get_temp_path("cleaned.svg")
            if not self._svg_cleanup_vpype(intermediate_svg, cleaned_svg, result):
                return result
            
            # Copy cleaned SVG to debug directory
            shutil.copy(cleaned_svg, f"{debug_dir}/12_cleaned.svg")
            
            # Stage 4: Advanced path processing
            processed_svg = self.get_temp_path("processed.svg")
            if not self._svg_processing_svgpathtools(cleaned_svg, processed_svg, result):
                return result
            
            # Copy processed SVG to debug directory
            shutil.copy(processed_svg, f"{debug_dir}/13_processed.svg")
            
            # Final output is the processed SVG
            shutil.copy(processed_svg, output_path)
            
            print(f"DEBUG: Complete pipeline saved to {debug_dir}/ directory")
            print(f"DEBUG: Check files 10-13 for pipeline stages")
            
            result.success = True
            
        except Exception as e:
            logger.error(f"Advanced pipeline failed with exception: {str(e)}")
            result.error_message = str(e)
        
        finally:
            result.processing_time = time.time() - start_time
            result.add_metric("processing_time_sec", result.processing_time)
            
            # Add file size metrics
            if os.path.exists(output_path):
                result.add_metric("output_file_size_bytes", self.get_file_size(output_path))
        
        return result
    
    def _preprocess_image(self, input_path: str, output_path: str, result: ConversionResult) -> bool:
        """Advanced preprocessing for AI-generated images with noise removal."""
        try:
            from PIL import Image
            
            # Read image
            img = Image.open(input_path)
            
            # Apply advanced preprocessing with noise removal
            processed_img = self._preprocess_image_advanced(img, result)
            
            # Save preprocessed image
            processed_img.save(output_path)
            
            result.add_intermediate_file(output_path, "Preprocessed image with noise removal")
            return True
            
        except Exception as e:
            result.error_message = f"Image preprocessing failed: {str(e)}"
            logger.error(f"Image preprocessing failed: {str(e)}")
            return False
    
    def _preprocess_image_advanced(self, img, result: ConversionResult):
        """Advanced preprocessing optimized for AI-generated images with debug output."""
        try:
            import cv2
            import numpy as np
            from PIL import Image, ImageEnhance
            
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
            
            # Choose the better threshold (you can modify this logic)
            # For now, let's use Otsu since the user said it looks better
            chosen_thresh = otsu_thresh
            threshold_method = "otsu"
            
            Image.fromarray(chosen_thresh).save(f"{debug_dir}/06_chosen_threshold_{threshold_method}.png")
            
            # **NEW**: Add option to skip post-processing when threshold looks good
            skip_post_processing = getattr(self, 'skip_post_processing', False)
            
            if skip_post_processing:
                print("DEBUG: Skipping post-processing - using clean threshold result")
                processed_img = Image.fromarray(chosen_thresh)
                processed_img.save(f"{debug_dir}/10_preprocessed_final.png")
                print(f"DEBUG: Preprocessing complete (threshold-only). Check {debug_dir}/ for results.")
                return processed_img
            
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
            print(f"DEBUG: Preprocessing complete. Check {debug_dir}/ for intermediate results.")
            
            # result.add_step("Advanced preprocessing with intelligent detail preservation")
            return processed_img
            
        except Exception as e:
            logger.warning(f"Advanced preprocessing failed: {e}")
            # Fallback to simple processing
            return self._preprocess_image_simple(img, result)
    
    def _preprocess_image_simple(self, img, result: ConversionResult):
        """Simple fallback preprocessing."""
        try:
            from PIL import ImageEnhance
            
            # Convert to grayscale if needed
            if img.mode != 'L':
                img = img.convert('L')
            
            # Enhance contrast
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(1.5)
            
            result.add_step("Simple preprocessing (fallback)")
            return img
            
        except Exception as e:
            logger.warning(f"Simple preprocessing failed: {e}")
            return img
    
    def _png_to_svg_potrace(self, png_path: str, svg_path: str, result: ConversionResult) -> bool:
        """Convert PNG to SVG using potrace with optimized parameters for AI images."""
        logger.info(f"Converting PNG to SVG using potrace: {png_path} -> {svg_path}")
        
        # First convert PNG to PBM format
        pbm_path = self.get_temp_path("input.pbm")
        if not self._png_to_pbm(png_path, pbm_path, result):
            return False
        
        # Build potrace command with optimized parameters for AI images
        command = [
            "potrace",
            "--turdsize", str(POTRACE['turdsize']),
            "--alphamax", str(POTRACE['alphamax']),
            "--opttolerance", str(POTRACE['opttolerance']),
            "--svg",                 # Output format
            "--output", svg_path,    # Output file
            pbm_path                 # Input file
        ]
        
        # Add longcurve option if enabled
        if POTRACE['longcurve']:
            command.insert(-3, "--longcurve")
        
        # Run potrace
        success, stdout, stderr = self.run_subprocess(command, "potrace PBM to SVG")
        
        if success and os.path.exists(svg_path):
            result.add_intermediate_file(pbm_path, "PNG to PBM conversion")
            result.add_intermediate_file(svg_path, "potrace SVG output")
            result.add_metric("svg_file_size_bytes", self.get_file_size(svg_path))
            logger.info("PNG to SVG conversion successful")
            return True
        else:
            result.error_message = f"potrace failed: {stderr}"
            logger.error(f"potrace failed: {stderr}")
            return False
    
    def _svg_cleanup_vpype(self, input_svg: str, output_svg: str, result: ConversionResult) -> bool:
        """Clean up SVG using vpype with optimized parameters, fallback to built-in cleanup."""
        try:
            # Build vpype command with optimized parameters
            command = [
                "vpype",
                "read", input_svg,
                "linemerge", "--tolerance", str(VPYPE['linemerge_tolerance']),
                "linesimplify", "--tolerance", str(VPYPE['linesimplify_tolerance']),
                "reloop", "--tolerance", str(VPYPE['reloop_tolerance']),
                "write", output_svg
            ]
            
            # Run vpype
            success, stdout, stderr = self.run_subprocess(command, "vpype SVG cleanup")
            
            if success and os.path.exists(output_svg):
                result.add_intermediate_file(output_svg, "vpype cleaned SVG")
                return True
            else:
                logger.warning(f"vpype cleanup failed: {stderr}")
                logger.info("Falling back to built-in SVG cleanup")
                return self._svg_cleanup_builtin(input_svg, output_svg, result)
                
        except Exception as e:
            logger.warning(f"vpype cleanup failed: {str(e)}")
            logger.info("Falling back to built-in SVG cleanup")
            return self._svg_cleanup_builtin(input_svg, output_svg, result)
    
    def _svg_processing_svgpathtools(self, input_svg: str, output_svg: str, result: ConversionResult) -> bool:
        """Advanced SVG processing using svgpathtools."""
        try:
            # Read paths from SVG
            paths, attributes = svg2paths(input_svg)
            
            if not paths:
                result.error_message = "No paths found in SVG file"
                logger.error("No paths found in SVG file")
                return False
            
            # Process each path
            processed_paths = []
            for path in paths:
                # Simplify curves
                path = self._simplify_curves(path, threshold=SVG_PROCESSING['curve_simplify_threshold'])
                
                # Merge collinear lines
                path = self._merge_collinear_lines(path, tolerance=SVG_PROCESSING['collinear_tolerance'])
                
                # Close nearly closed paths
                path = self._close_nearly_closed_paths(path, tolerance=SVG_PROCESSING['close_path_tolerance'])
                
                processed_paths.append(path)
            
            # Write processed SVG
            wsvg(processed_paths, filename=output_svg)
            
            result.add_intermediate_file(output_svg, "Processed SVG")
            return True
            
        except Exception as e:
            result.error_message = f"SVG processing failed: {str(e)}"
            logger.error(f"SVG processing failed: {str(e)}")
            return False
    
    def _simplify_curves(self, path: Path, threshold: float) -> Path:
        """Simplify curves that are nearly straight lines."""
        simplified_segments = []
        
        for segment in path:
            if isinstance(segment, (CubicBezier, QuadraticBezier)):
                # Check if curve is nearly straight
                start = segment.start
                end = segment.end
                
                # Sample points along the curve
                sample_points = [segment.point(t) for t in [0.25, 0.5, 0.75]]
                
                # Check if all sample points are close to the straight line
                is_straight = all(
                    abs((point - start).real * (end - start).imag - (point - start).imag * (end - start).real) / abs(end - start) < threshold
                    for point in sample_points
                ) if abs(end - start) > 1e-6 else True
                
                if is_straight:
                    simplified_segments.append(Line(start, end))
                else:
                    simplified_segments.append(segment)
            else:
                simplified_segments.append(segment)
        
        return Path(*simplified_segments)
    
    def _merge_collinear_lines(self, path: Path, tolerance: float) -> Path:
        """Merge consecutive collinear lines."""
        if len(path) < 2:
            return path
        
        merged_segments = []
        current_segment = path[0]
        
        for next_segment in path[1:]:
            if isinstance(current_segment, Line) and isinstance(next_segment, Line):
                if self._lines_are_collinear(current_segment, next_segment, tolerance):
                    # Merge the lines
                    current_segment = Line(current_segment.start, next_segment.end)
                else:
                    merged_segments.append(current_segment)
                    current_segment = next_segment
            else:
                merged_segments.append(current_segment)
                current_segment = next_segment
        
        merged_segments.append(current_segment)
        return Path(*merged_segments)
    
    def _lines_are_collinear(self, line1: Line, line2: Line, tolerance: float) -> bool:
        """Check if two consecutive lines are collinear within tolerance."""
        # Lines must be connected
        if abs(line1.end - line2.start) > tolerance:
            return False
        
        # Check if direction vectors are parallel
        v1 = line1.end - line1.start
        v2 = line2.end - line2.start
        
        if abs(v1) < 1e-6 or abs(v2) < 1e-6:
            return True
        
        # Cross product should be zero for parallel lines
        cross_product = v1.real * v2.imag - v1.imag * v2.real
        return abs(cross_product) / (abs(v1) * abs(v2)) < tolerance
    
    def _close_nearly_closed_paths(self, path: Path, tolerance: float) -> Path:
        """Close paths that are nearly closed."""
        if len(path) == 0:
            return path
        
        start_point = path[0].start
        end_point = path[-1].end
        
        # If path is nearly closed, add a closing line
        if abs(end_point - start_point) < tolerance:
            segments = list(path)
            if not isinstance(path[-1], Line) or abs(path[-1].end - start_point) > 1e-6:
                segments.append(Line(end_point, start_point))
            return Path(*segments)
        
        return path
    
    def _svg_cleanup_builtin(self, input_svg: str, output_svg: str, result: ConversionResult) -> bool:
        """Built-in SVG cleanup fallback when vpype is not available."""
        try:
            import shutil
            # Simple fallback: just copy the file
            shutil.copy(input_svg, output_svg)
            result.add_intermediate_file(output_svg, "SVG cleanup (builtin fallback)")
            logger.info("Using built-in SVG cleanup (file copy)")
            return True
        except Exception as e:
            result.error_message = f"Built-in SVG cleanup failed: {str(e)}"
            logger.error(f"Built-in SVG cleanup failed: {str(e)}")
            return False
    
    def _create_empty_svg(self, output_path: str):
        """Create an empty SVG file."""
        svg_content = '''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
</svg>'''
        with open(output_path, 'w') as f:
            f.write(svg_content)


# Main function for direct execution
if __name__ == "__main__":
    import tempfile
    import glob
    import shutil
    
    # Create a simple test configuration
    config = {
        'temp_dir': tempfile.gettempdir(),
        'debug': True
    }
    
    # Create output directory
    output_dir = "svg_outputs"
    os.makedirs(output_dir, exist_ok=True)
    print(f"Created output directory: {output_dir}")
    
    # Get all PNG files from pngs directory
    pngs_dir = os.path.join(os.path.dirname(__file__), 'pngs')
    png_files = glob.glob(os.path.join(pngs_dir, '*.png'))
    
    if not png_files:
        print("No PNG files found in /pngs directory")
        exit(1)
    
    print(f"Found {len(png_files)} PNG files to process")
    
    # Create pipeline instance
    pipeline = AdvancedPipeline(config)
    
    # Process each PNG file
    successful_conversions = 0
    total_processing_time = 0
    
    for i, png_file in enumerate(png_files, 1):
        print(f"\n--- Processing {i}/{len(png_files)}: {os.path.basename(png_file)} ---")
        
        # Create output filename
        base_name = os.path.splitext(os.path.basename(png_file))[0]
        output_path = os.path.join(output_dir, f"{base_name}.svg")
        
        # Run the pipeline
        result = pipeline.convert(png_file, output_path)
        
        if result.success:
            print(f"✅ Success: {output_path}")
            print(f"   Processing time: {result.processing_time:.2f} seconds")
            successful_conversions += 1
            total_processing_time += result.processing_time
        else:
            print(f"❌ Failed: {result.error_message}")
    
    # Summary
    print(f"\n=== CONVERSION SUMMARY ===")
    print(f"Total files processed: {len(png_files)}")
    print(f"Successful conversions: {successful_conversions}")
    print(f"Failed conversions: {len(png_files) - successful_conversions}")
    print(f"Total processing time: {total_processing_time:.2f} seconds")
    print(f"Average time per file: {total_processing_time/len(png_files):.2f} seconds")
    print(f"Output directory: {os.path.abspath(output_dir)}")
    
    if successful_conversions > 0:
        print(f"\n✅ {successful_conversions} SVG files saved to '{output_dir}' directory") 