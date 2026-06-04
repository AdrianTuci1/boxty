# Agent: Boxty Documentation (Scalar/OpenAPI)

## Rol

Creează documentația API pentru platforma Boxty folosind **OpenAPI 3.1** + **Scalar** (via CDN). Documentația e servită static din API-ul Fastify la `/docs`.

## Director de lucru

`/Users/adriantucicovenco/Proiecte/boxty/api/docs/`

## Tech Stack

- **OpenAPI**: 3.1.0 YAML
- **Scalar**: `@scalar/api-reference` via CDN (`https://cdn.jsdelivr.net/npm/@scalar/api-reference`)
- **Server**: Fișierele sunt servite static de Fastify

## Ce trebuie făcut

### 1. `api/docs/openapi.yaml`

OpenAPI 3.1 spec completă care documentează **toate** endpoint-urile expuse de API:

```yaml
openapi: 3.1.0
info:
  title: Boxty API
  version: 1.0.0
  description: >
    Boxty — programmable sandbox platform. Rulează cod în cloud cu gVisor,
    suportă secrets, cron, image building, volume persistente, și web endpoint API.

servers:
  - url: https://api.boxty.dev
  - url: http://localhost:3000
    description: Development

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: JWT din login/register
    ApiKeyAuth:
      type: apiKey
      in: header
      name: Authorization
      description: API key format "Bearer bxty_..."

  schemas:
    Error:
      type: object
      required: [error]
      properties:
        error: { type: string }

    Sandbox:
      type: object
      properties:
        id: { type: string }
        status: { type: string, enum: [running, stopped, snapshotted] }
        url: { type: string, format: uri }
        image: { type: string }
        cpu: { type: integer }
        memory: { type: integer }
        gpu: { type: string, nullable: true }
        created_at: { type: string, format: date-time }
        timeout: { type: integer }

    ExecResult:
      type: object
      properties:
        stdout: { type: string }
        stderr: { type: string }
        exit_code: { type: integer }
        duration_ms: { type: integer }

    Secret:
      type: object
      properties:
        name: { type: string }
        created_at: { type: string, format: date-time }

    ImageBuild:
      type: object
      properties:
        id: { type: string }
        image_url: { type: string, nullable: true }
        status: { type: string, enum: [building, done, failed] }
        error: { type: string, nullable: true }

    Volume:
      type: object
      properties:
        id: { type: string }
        name: { type: string }
        size_gb: { type: integer }
        status: { type: string }
        created_at: { type: string, format: date-time }

    Schedule:
      type: object
      properties:
        id: { type: string }
        name: { type: string }
        schedule_type: { type: string, enum: [cron, period] }
        schedule_value: { type: string }
        next_run: { type: string, format: date-time }
        status: { type: string, enum: [active, paused] }

    Deployment:
      type: object
      properties:
        id: { type: string }
        url: { type: string, format: uri }
        status: { type: string, enum: [deploying, active, failed] }

paths:
  /health:
    get:
      summary: Health check
      tags: [System]
      responses:
        '200':
          description: Server is healthy
          content:
            application/json:
              schema:
                type: object
                properties:
                  status: { type: string }

  # Auth
  /api/auth/register:
    post:
      summary: Înregistrare utilizator
      tags: [Auth]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email: { type: string, format: email }
                password: { type: string, minLength: 8 }
      responses:
        '201':
          description: User creat, returnează JWT
          content:
            application/json:
              schema:
                type: object
                properties:
                  token: { type: string }
                  user: { type: object }

  /api/auth/login:
    post:
      summary: Autentificare
      tags: [Auth]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email: { type: string, format: email }
                password: { type: string }
      responses:
        '200':
          description: JWT token

  /api/auth/api-keys:
    post:
      summary: Generează API key
      tags: [Auth]
      security: [{ BearerAuth: [] }]
      responses:
        '201':
          description: API key creat

  # Sandboxes
  /api/sandboxes:
    post:
      summary: Creează sandbox
      tags: [Sandboxes]
      security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [image]
              properties:
                image: { type: string, example: "pytorch:latest" }
                cpu: { type: integer, default: 2 }
                memory: { type: integer, default: 4096, description: "MB" }
                gpu: { type: string, nullable: true }
                timeout: { type: integer, default: 3600, description: "seconds" }
                disk_size_gb: { type: integer, default: 10, description: "spațiu ephemeral" }
                volume: { type: string, nullable: true, description: "nume volum persistent" }
                volume_mount_path: { type: string, default: "/mnt/volume" }
      responses:
        '201':
          description: Sandbox creat
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Sandbox'

    get:
      summary: List sandbox-uri
      tags: [Sandboxes]
      security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }]
      responses:
        '200':
          description: Listă sandbox-uri

  /api/sandboxes/{id}:
    get:
      summary: Detalii sandbox
      tags: [Sandboxes]
      security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }]
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: string }
      responses:
        '200':
          description: Sandbox details

    delete:
      summary: Oprește și șterge sandbox
      tags: [Sandboxes]
      security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }]
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: string }
      responses:
        '200':
          description: Sandbox oprit

  # ... continuă pentru toate endpoint-urile:
  # - /api/sandboxes/{id}/exec
  # - /api/sandboxes/{id}/snapshot
  # - /api/sandboxes/restore
  # - /api/sandboxes/{id}/forward
  # - /api/sandboxes/{id}/secrets
  # - /api/images/build, /api/images/build-from-dockerfile, /api/images/{id}
  # - /api/secrets, /api/secrets/{name}
  # - /api/volumes, /api/volumes/{id}, /api/volumes/{id}/mount, /api/volumes/{id}/unmount
  # - /api/schedules, /api/schedules/{id}, /api/schedules/{id}/trigger
  # - /api/deployments, /api/deployments/{id}, /api/deployments/{id}/invoke
  # - /api/billing/balance, /api/billing/usage, /api/billing/credits
  # - /api/workers/register, /api/workers/{id}/heartbeat
  # - /api/admin/stats, /api/admin/cron/status
```

**IMPORTANT**: Completează TOATE path-urile cu request/response details. Fiecare endpoint trebuie să aibă:
- `summary` scurt (română sau engleză)
- `tags` pentru grupare (Auth, Sandboxes, Secrets, Images, Volumes, Schedules, Deployments, Billing, Workers, Admin, System)
- `security` - majoritatea endpoint-urilor au `BearerAuth` sau `ApiKeyAuth`
- `requestBody` cu `required` + `properties` pentru POST/PUT/PATCH
- `responses` cu `'200'`, `'201'`, `'400'`, `'404'` etc
- `parameters` pentru endpoint-urile cu path params (/{id})
- Exemple în `example` / `examples` acolo unde e util

Vezi `AGENT_API.md` pentru lista completă de endpoint-uri și body-urile lor.

### 2. `api/docs/index.html`

Pagină HTML simplă care încarcă Scalar și specificația OpenAPI:

```html
<!doctype html>
<html lang="en">
<head>
    <title>Boxty API Reference</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="Boxty — programmable sandbox platform API" />
    <style>
        body { margin: 0; }
    </style>
</head>
<body>
    <script id="api-reference"></script>
    <script>
        const specUrl = new URL('/docs/openapi.yaml', window.location.origin);

        fetch(specUrl)
            .then((response) => {
                if (!response.ok) throw new Error('Failed to load OpenAPI spec');
                return response.text();
            })
            .then((spec) => {
                document.getElementById('api-reference').dataset.spec = spec;
            })
            .catch((error) => {
                document.body.innerHTML = '<pre style="padding:16px;font-family:monospace;white-space:pre-wrap;">Failed to load docs: ' + error.message + '</pre>';
            });
    </script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>
```

### 3. Wire în Fastify

În `api/src/index.js`, adaugă rutele pentru docs:

```javascript
// Serve docs
app.get('/docs', async (req, reply) => {
    return reply.sendFile('index.html', path.join(__dirname, '../docs'));
});

app.get('/docs/openapi.yaml', async (req, reply) => {
    return reply.type('application/yaml').sendFile('openapi.yaml', path.join(__dirname, '../docs'));
});
```

## Structura fișierelor de creat

```
api/docs/
├── index.html              # Scalar API reference page
└── openapi.yaml            # OpenAPI 3.1 spec
```

## Contract cu API-ul

Documentația trebuie să reflecte EXACT rutele implementate de AGENT_API.md. Dacă un endpoint nu e documentat, developerii nu știu de existența lui. Dacă e documentat greșit, dau request-uri invalid.

**Regula de aur**: Fiecare endpoint din `AGENT_API.md` → un path în `openapi.yaml`.

## Reguli

- Scalar e încărcat via CDN — nu instala package NPM
- OpenAPI spec e static YAML — nu se generează din cod
- Tag-urile trebuie să fie consistente peste tot
- Nu se rulează teste live
- Toate fișierele trebuie să fie valide (YAML parsabil, HTML valid)
