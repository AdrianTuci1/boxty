
import boxty

app = boxty.App("py-example")

@app.function(image=boxty.Image("python:3.11-slim"))
def hello():
    return "hello-from-python-example"

@app.web_endpoint(port=8000, image=boxty.Image("python:3.11-slim"))
def api():
    import http.server
    import socketserver
    class H(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"endpoint-from-python-example")
        def log_message(self, *args):
            pass
    socketserver.TCPServer(("0.0.0.0", 8000), H).serve_forever()
