
import boxty

app = boxty.App("py-sandbox-test")

@app.function(image=boxty.Image("python:3.11-slim"))
def hello():
    return "hello-from-sandbox"
