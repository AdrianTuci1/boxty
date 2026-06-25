/**
 * Example Boxty app — TypeScript version.
 *
 * Run with:
 *   boxty deploy example_app.ts
 */

import { BoxtyApp, Image, Volume, Secret } from "@boxty/sdk";

const app = new BoxtyApp("my-ts-service");

const modelVol = app.volume("model-weights", 20, "block-storage");
const openaiSecret = app.secret("openai-key");

const image = Image.debianSlim()
  .pipInstall("fastapi", "uvicorn", "openai")
  .env({ MODEL_NAME: "gpt-4" });

app.webEndpoint({
  name: "serve",
  port: 8000,
  image,
  volumes: { "/data": modelVol },
  secrets: [openaiSecret],
  timeout: 600,
  handler: () => {
    // Start your HTTP server here
    console.log("Starting server on port 8000...");
  },
});

// Print manifest when run directly
if (require.main === module) {
  console.log(app.toManifestJson());
}

export default app;
