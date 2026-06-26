import boxty as bx
from boxty import Volume, Database

# 1. Define the persistent volume (for model weights or data storage)
model_volume = Volume.from_name("my_ml_weights")

# 2. Define the secure NoSQL database connection
# Boxty handles replication, client-side encryption, and TEE attestation transparently.
db = Database.connect(encryption_key=bx.wallet.get_key())

app = bx.App("llm-inference-service")

@app.web_endpoint(
    port=8080,
    volumes={"/models": model_volume},
    secrets=["OPENAI_API_KEY", "DATABASE_SECRET"]
)
def handle_request(req):
    # Access the mounted encrypted volume
    # With OverlayFS and mmap, these weights are loaded instantly in 12ms.
    weights_path = "/models/llama3-8b.safetensors"
    
    # Securely query the replicated database using Searchable Encryption (Zero-Knowledge)
    # Even if the client is offline, the TEE worker queries securely.
    user_session = db.query(tag_status="active", field_role="Architect")
    
    # Perform outbound API call (e.g. OpenAI)
    # The Boxty consensus interceptor ensures that only the Leader node executes this HTTP call.
    # Followers intercept the call and consume the Leader-signed response, avoiding duplicate billing.
    response = bx.http.post(
        "https://api.openai.com/v1/chat/completions",
        json={"prompt": f"Process session for: {user_session['name']}"}
    )
    
    return {"status": "success", "result": response.json()}
