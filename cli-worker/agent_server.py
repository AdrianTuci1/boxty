import http.server
import time
import sys

class AgentServer(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/run-agent':
            self.send_response(200)
            self.send_header('Content-Type', 'text/event-stream')
            self.send_header('Cache-Control', 'no-cache')
            self.send_header('Connection', 'keep-alive')
            self.end_headers()

            steps = [
                "[Step 1/4] Connecting to databases and downloading source files...",
                "[Step 2/4] Initializing LangGraph workflow and state keys...",
                "[Step 3/4] Running multi-agent consensus loops (Querying LLMs)...",
                "[Step 4/4] Aggregating results and formatting markdown output...",
                "Final Agent Answer: Success! Task completed in 5.4 seconds."
            ]

            for step in steps:
                # Format as Server-Sent Event (SSE)
                message = f"data: {step}\n\n"
                self.wfile.write(message.encode('utf-8'))
                self.wfile.flush()
                time.sleep(1.5)  # Simulate processing delay between steps
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"Not Found")

def run(port=8000):
    server_address = ('', port)
    httpd = http.server.HTTPServer(server_address, AgentServer)
    print(f"Starting Python Agent Server on port {port}...")
    print(f"To test, run: curl -N http://localhost:{port}/run-agent")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server.")
        httpd.server_close()

if __name__ == '__main__':
    port = 8000
    if len(sys.argv) > 1:
        port = int(sys.argv[1])
    run(port)
