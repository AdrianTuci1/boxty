
import boxty
import http.server
import socketserver

app = boxty.App("py-endpoint-test")

@app.web_endpoint(port=8000, image=boxty.Image("python:3.11-slim"))
def hello():
    class Handler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"hello-from-boxty-endpoint")
        def log_message(self, *args):
            pass
    with socketserver.TCPServer(("0.0.0.0", 8000), Handler) as httpd:
        httpd.serve_forever()
