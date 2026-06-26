# JavaScript SDK

## Installation

```bash
npm install @boxty/sdk
```

## Quick Start

```typescript
import { App } from '@boxty/sdk';

const app = new App();

app.function('hello', async (name: string) => {
    return `Hello, ${name}!`;
});

app.run();
```

## API Reference

### App

```typescript
import { App } from '@boxty/sdk';

const app = new App({
    name: 'my-app',
    image: 'node:20-slim'
});
```

### Secrets

```typescript
import { Secret } from '@boxty/sdk';

const secret = new Secret('api-key');
secret.setEnv('OPENAI_API_KEY', 'sk-...');
```

### Volumes

```typescript
import { Volume } from '@boxty/sdk';

const volume = new Volume('data', 10);
```

### Databases

```typescript
import { Database } from '@boxty/sdk';

const db = new Database('users', 'id', 'sort');
```

## Examples

See [examples/](https://github.com/adriantucicovenco/boxty/tree/main/examples) directory.
