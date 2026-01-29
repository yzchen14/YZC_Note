"""
YZC Notes Desktop Application using pywebview
Serves the React frontend with FastAPI backend
"""

import webview
import threading
import uvicorn
import time
import webbrowser
from pathlib import Path

# Add backend to path
import sys
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

from main import app

def run_server():
    """Run the FastAPI server in a separate thread"""
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")

def main():
    """Launch the pywebview application"""
    # Start the FastAPI server in a background thread
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    
    # Give the server time to start
    time.sleep(2)
    
    # Create and show the webview window
    webview.create_window(
        title="YZC Notes",
        url="http://127.0.0.1:8000/",
        width=1200,
        height=800,
        min_size=(800, 600)
    )
    
    webview.start(debug=False)

if __name__ == "__main__":
    main()
