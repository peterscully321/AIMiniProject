"""
Launcher for the A* Pathfinding Web Visualizer.
Runs a local Python HTTP server and automatically opens the browser.
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8080
DIRECTORY = os.path.join(os.path.dirname(os.path.abspath(__file__)), "visualizer")

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
        
    def log_message(self, format, *args):
        # Suppress noisy HTTP asset logs in terminal
        pass

def launch():
    os.chdir(DIRECTORY)
    server = None
    port = PORT
    
    # Find available port if 8080 is busy
    for p in range(PORT, PORT + 20):
        try:
            socketserver.TCPServer.allow_reuse_address = True
            server = socketserver.TCPServer(("", p), CustomHandler)
            port = p
            break
        except OSError:
            continue
            
    if not server:
        print("Error: Could not bind to an available port between 8080 and 8100.")
        sys.exit(1)

    url = f"http://127.0.0.1:{port}"
    print("=" * 60)
    print(" 🚀 A* Pathfinding Interactive Web Visualizer")
    print(f" Serving at: {url}")
    print(" Opening your default web browser...")
    print(" Press Ctrl+C to stop the server.")
    print("=" * 60)
    
    webbrowser.open(url)
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping visualizer server.")
        server.server_close()

if __name__ == "__main__":
    launch()
