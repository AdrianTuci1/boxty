import { App, Volume, Database, http, wallet } from 'boxty';

// 1. Define the persistent volume (for model weights or data storage)
const modelVolume = Volume.fromName("my_ml_weights");

// 2. Define the secure NoSQL database connection
// Boxty handles replication, client-side encryption, and TEE attestation transparently.
const db = Database.connect({ encryptionKey: wallet.getKey() });

const app = new App("llm-inference-service");

app.webEndpoint({
  port: 8080,
  volumes: { "/models": modelVolume },
  secrets: ["OPENAI_API_KEY", "DATABASE_SECRET"]
}, async (req) => {
  // Access the mounted encrypted volume
  // With OverlayFS and mmap, these weights are loaded instantly in 12ms.
  const weightsPath = "/models/llama3-8b.safetensors";
  
  // Securely query the replicated database using Searchable Encryption (Zero-Knowledge)
  // Even if the client is offline, the TEE worker queries securely.
  const userSession = await db.query({ status: "active", role: "Architect" });
  
  // Perform outbound API call (e.g. OpenAI)
  // The Boxty consensus interceptor ensures that only the Leader node executes this HTTP call.
  // Followers intercept the call and consume the Leader-signed response, avoiding duplicate billing.
  const response = await http.post("https://api.openai.com/v1/chat/completions", {
    json: { prompt: `Process session for: ${userSession.name}` }
  });
  
  return { status: "success", result: response.json() };
});
