import boxty as bx

client = bx.Client(api_key="bxty_...")
sandbox = client.create_sandbox(image="pytorch:latest", cpu=4, memory=16384, gpu="A100")
result = sandbox.exec("python train.py --epochs=10")
print(result.stdout)
sandbox.stop()
