"""
Example Boxty app — defines a FastAPI endpoint with a persistent volume and secrets.

Run with:
    boxty deploy example_app.py
"""

import boxty

app = boxty.App("my-fastapi-service")

# Persistent volume for model weights
model_vol = app.volume("model-weights", size_gb=20, volume_type="block-storage")

# Secrets mounted as env vars
openai_secret = app.secret("openai-key")

# Container image with dependencies
image = (
    boxty.Image.debian_slim()
    .pip_install("fastapi", "uvicorn", "openai")
    .env({"MODEL_NAME": "gpt-4"})
)

@app.web_endpoint(
    port=8000,
    image=image,
    volumes={"/data": model_vol},
    secrets=[openai_secret],
    timeout=600,
)
def serve():
    """FastAPI server that runs in the Boxty sandbox."""
    from fastapi import FastAPI
    import uvicorn

    api = FastAPI()

    @api.get("/")
    def root():
        return {"service": "my-fastapi-service", "status": "healthy"}

    @api.get("/chat")
    def chat(prompt: str = ""):
        import openai
        client = openai.OpenAI()
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
        )
        return {"reply": response.choices[0].message.content}

    uvicorn.run(api, host="0.0.0.0", port=8000)


# Allow `python example_app.py` to print the manifest
if __name__ == "__main__":
    print(app.to_manifest_json())
