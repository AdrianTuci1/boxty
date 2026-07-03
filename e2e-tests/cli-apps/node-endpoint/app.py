
import boxty

app = boxty.App("node-endpoint-test")

@app.web_endpoint(port=3000, image=boxty.Image("node:18-slim"))
def api():
    pass
