#!/usr/bin/env python3
"""
Start script for the Python Analysis API Server.
This script starts the Flask server for Python-based delay analysis and predictions.
"""

import sys
import os
import subprocess
import time

# Add python_analysis directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'python_analysis'))

def start_analysis_server():
    """Start the Python analysis API server."""
    print("Starting Smart Project Pulse Python Analysis Server...")
    
    try:
        # Change to python_analysis directory
        os.chdir('python_analysis')
        
        # Start the API server
        from api_integration import main
        main()
        
    except KeyboardInterrupt:
        print("\nShutting down Python Analysis Server...")
    except Exception as e:
        print(f"Error starting Python Analysis Server: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit_code = start_analysis_server()
    sys.exit(exit_code)