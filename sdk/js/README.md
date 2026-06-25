# @boxty/sdk

```typescript
import { BoxtyClient } from "@boxty/sdk";

// Auto-discovers BOXTY_GATEWAY_URL from environment
const bx = new BoxtyClient();

// Secrets
const secrets = await bx.listSecrets();
await bx.createSecret("openai-key", { OPENAI_API_KEY: "sk-..." });

// Volumes
const volumes = await bx.listVolumes();
await bx.putVolumeEntry("my-vol", "data.json", JSON.stringify({ hello: "world" }));

// Databases
const dbs = await bx.listDatabases();
await bx.queryDatabase("my-db", { pk: "user_42" });

// App state
const state = await bx.state();
```
