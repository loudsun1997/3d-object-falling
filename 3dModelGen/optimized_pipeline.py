"""
Optimized pipeline for PNG to SVG conversion.
"""

import os
from typing import List
from loguru import logger

from base_pipeline import BasePipeline, ConversionResult


class OptimizedPipeline(BasePipeline):
    """Optimized conversion pipeline."""
    
    def __init__(self, config: dict):
        super().__init__(config)
        self.name = "optimized"
    
    def get_required_tools(self) -> List[str]:
        """Return list of required command-line tools."""
        return []
    
    def check_dependencies(self) -> bool:
        """Check if all dependencies are available."""
        return True
    
    def _png_to_pbm(self, png_path: str, pbm_path: str, result: ConversionResult) -> bool:
        """Convert PNG to PBM format for potrace."""
        try:
            from PIL import Image
            
            # Read PNG and convert to 1-bit black and white
            img = Image.open(png_path)
            if img.mode != '1':
                img = img.convert('1')
            
            # Save as PBM
            img.save(pbm_path, 'PPM')
            return True
            
        except Exception as e:
            result.error_message = f"PNG to PBM conversion failed: {str(e)}"
            logger.error(f"PNG to PBM conversion failed: {str(e)}")
            return False
    
    def _svg_cleanup_builtin(self, input_svg: str, output_svg: str, result: ConversionResult) -> bool:
        """Built-in SVG cleanup fallback."""
        try:
            # Simple copy for now - implement actual cleanup if needed
            import shutil
            shutil.copy(input_svg, output_svg)
            result.add_intermediate_file(output_svg, "Built-in SVG cleanup")
            return True
            
        except Exception as e:
            result.error_message = f"Built-in SVG cleanup failed: {str(e)}"
            logger.error(f"Built-in SVG cleanup failed: {str(e)}")
            return False
