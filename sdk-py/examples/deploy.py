import boxty as bx

app = bx.App("my-ml-service")

@app.function(image="pytorch:latest", gpu="A100", cpu=8, memory=32768)
@bx.web_endpoint(method="POST")
def predict(data: dict):
    return {"prediction": "ok"}

app.deploy()
