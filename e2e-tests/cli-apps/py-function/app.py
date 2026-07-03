
import boxty

app = boxty.App("py-function-test")

@app.function(image=boxty.Image("python:3.11-slim"))
def hello():
    return "hello-from-boxty-cli"
