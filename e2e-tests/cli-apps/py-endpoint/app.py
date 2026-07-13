
import boxty
import http.server
import socketserver
import os

app = boxty.App("py-endpoint-test")

@app.web_endpoint(port=8000, image=boxty.Image("python:3.11-slim"))
def hello():
    port = int(os.environ.get("BOXTY_ENDPOINT_PORT", "8000"))
    class Handler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"hello-from-boxty-endpoint")
        def log_message(self, *args):
            pass
    with socketserver.TCPServer(("127.0.0.1", port), Handler) as httpd:
        httpd.serve_forever()
