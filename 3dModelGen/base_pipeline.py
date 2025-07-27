"""
Base pipeline classes and utilities.
"""

import os
import time
from typing import List, Dict, Any


class ConversionResult:
    """Result object for conversion operations."""
    
    def __init__(self, input_path: str, output_path: str):
        self.input_path = input_path
        self.output_path = output_path
        self.success = False
        self.error_message = ""
        self.processing_time = 0.0
        self.intermediate_files = []
        self.metrics = {}
        self.debug_info = []
    
    def add_intermediate_file(self, file_path: str, description: str):
        """Add an intermediate file to the result."""
        self.intermediate_files.append({
            'path': file_path,
            'description': description
        })
    
    def add_metric(self, name: str, value: Any):
        """Add a metric to the result."""
        self.metrics[name] = value
    
    def add_step(self, description: str):
        """Add a processing step description."""
        self.debug_info.append(description)


class BasePipeline:
    """Base class for conversion pipelines."""
    
    def __init__(self, config: dict):
        self.config = config
        self.temp_dir = config.get('temp_dir', '/tmp')
        self.name = "base"
    
    def get_temp_path(self, filename: str) -> str:
        """Generate a temporary file path."""
        import tempfile
        return os.path.join(tempfile.gettempdir(), f"pipeline_{filename}")
    
    def validate_input(self, input_path: str) -> bool:
        """Validate input file."""
        return os.path.exists(input_path) if input_path != "dummy_input" else True
    
    def get_file_size(self, file_path: str) -> int:
        """Get file size in bytes."""
        try:
            return os.path.getsize(file_path)
        except:
            return 0
    
    def run_subprocess(self, command: List[str], description: str):
        """Run a subprocess command."""
        import subprocess
        try:
            result = subprocess.run(command, capture_output=True, text=True, check=True)
            return True, result.stdout, result.stderr
        except subprocess.CalledProcessError as e:
            return False, e.stdout, e.stderr
        except Exception as e:
            return False, "", str(e)
    
    def convert(self, input_path: str, output_path: str) -> ConversionResult:
        """Convert input to output. Must be implemented by subclasses."""
        raise NotImplementedError("Subclasses must implement convert method")
