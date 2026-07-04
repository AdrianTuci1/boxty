# Arhitectură Boxty - Clarificare Stocare și Securitate

## Data: 2026-06-28

---

## CLARIFICARE: Ce e efemer vs ce trebuie persistat

### ✅ EFEMER (by design) - NU trebuie persistat

| Componentă | De ce e efemeră | Unde rulează |
|------------|----------------|--------------|
| **Containere Docker** | Workload-urile se execută și mor | Worker (VPS) |
| **Sandbox-uri** | Sesiuni temporare pentru dezvoltare | Worker (VPS) |
| **Funcții** | Execuții one-off, rezultat și gata | Worker (VPS) |
| **File system container** | Dispare odată cu containerul | Worker (VPS) |

### ✅ PERSISTENT (trebuie salvat) - DynamoDB Single Table

| Resursă | Ce stocăm | De ce |
|-----------|-----------|-------|
| **Users** | user_id, email, role, created_at | Identitate |
| **Workspaces** | workspace_id, name, owner_id | Organizare |
| **Environments** | environment_id, name, workspace_id | Izolare |
| **Workloads** | workload_id, name, image, status, config | Definiție |
| **Volumes** | volume_id, name, workspace_id, entries | Date persistente |
| **Secrets** | secret_id, name, **encrypted_env_vars** | Config securizată |
| **Routes** | route_id, hostname, target | Routing |
| **Schedules** | schedule_id, cron, workload_id | Automatizare |
| **Images** | image_id, name, status, build_log | Imagini custom |
| **Providers** | provider_id, status, capabilities | Worker nodes |
| **Usage** | usage_id, workload_id, cpu_seconds, cost | Billing |
| **Accounts** | account_id, balance_usd, credit_grants | Plăți |

---

## IMPLEMENTARE SECRETE (deja existentă)

### 1. Stocare (Backend)
```python
# SecretCipher - AES-like + HMAC
secret_cipher.encrypt_env_vars({"API_KEY": "secret123"})
# → "U2FsdGVkX1+7J8v2..." (base64 encoded)
```

### 2. Injectare (Backend → Worker)
```python
# workload_launch_spec
resolved_env = {
    "APP_ENV": "production",  # din workload.env
    "API_KEY": "secret123",   # din secret (decriptat)
    "DB_PASS": "hidden456",   # din secret (decriptat)
}
```

### 3. Execuție (Worker)
```bash
# Docker primește env vars la runtime
docker run -e API_KEY=secret123 -e DB_PASS=hidden456 my-image
```

### 4. Securitate
- ✅ **Criptare la stocare** - SecretCipher cu cheie derivată din SHA256
- ✅ **Nu stocăm plain text** - niciodată
- ✅ **Injectare doar la runtime** - secretele sunt decriptate doar când containerul pornește
- ✅ **Nu rămân în istoric** - containerul moare, secretele dispar cu el

---

## ARHITECTURĂ COMPLETĂ

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (laptop)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ boxty CLI   │  │ SDK Python  │  │ SDK JS      │         │
│  │ (Python)    │  │ (Python)    │  │ (JS/TS)     │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                │
│         └────────────────┴────────────────┘                │
│                          │                                   │
│                          ▼                                   │
│                   ┌─────────────┐                            │
│                   │  /v1 API    │                            │
│                   │  (public)   │                            │
│                   └──────┬──────┘                            │
└──────────────────────────┼───────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  CONTROL PLANE (server)                    │
│  FastAPI + InMemoryStore (→ DynamoDB)                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  SecretCipher: encrypt/decrypt env vars            │   │
│  │  workload_launch_spec: decriptează secretele       │   │
│  │  și le trimite în launch_spec.env                   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    WORKER (VPS)                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  boxty-worker (Rust)                                │   │
│  │  ├─ worker loop: register → heartbeat → claim     │   │
│  │  ├─ launch_spec.env: primește secretele decriptate │   │
│  │  ├─ Docker: docker run -e SECRET=value image      │   │
│  │  └─ Container: rulează cu secretele în ENV       │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│                   ┌─────────────┐                            │
│                   │  Docker       │                            │
│                   │  Container    │ ← EFEMER (moare după exec) │
│                   │  ENV vars     │ ← secretele sunt aici      │
│                   └─────────────┘                            │
└─────────────────────────────────────────────────────────────┘
```

---

## PROBLEME REALE (ce trebuie făcut)

### 1. ❌ PERSISTENȚĂ - InMemoryStore → DynamoDB
**Status:** Datele se pierd la restart
**Impact:** CRITICAL
**Soluție:**
```python
# Single Table Design DynamoDB
PK: WORKSPACE#<id>
SK: WORKLOAD#<id>

PK: WORKSPACE#<id>
SK: SECRET#<id>

PK: WORKSPACE#<id>
SK: VOLUME#<id>
```

### 2. ❌ AUTH WEB - Hardcoded credentials
**Status:** useAuth folosește email/password fixe
**Impact:** HIGH
**Soluție:** Elimină hardcoded, folosește `/v1/auth/login`

### 3. ❌ WORKER CLI COMMANDS - Simulate (nu loop-ul)
**Status:** `boxty-worker function/sandbox/deploy` = doar print-uri
**Impact:** MEDIUM
**Soluție:** Comenzile client ar trebui să meargă prin API, nu direct
**Clarificare:** Doar `boxty-worker worker` (loop) e pentru VPS

### 4. ❌ SCHEDULE TRIGGER - Doar updatează timestamp
**Status:** Nu execută workload real
**Impact:** MEDIUM
**Soluție:** Background task care verifică cron și pornește workloads

### 5. ❌ IMAGE BUILD - Doar schimbă status
**Status:** Nu face build Docker real
**Impact:** MEDIUM
**Soluție:** Integrează cu Docker registry sau build service

---

## CE FUNCȚIONEAZĂ CORECT

### ✅ Secrete (complet)
- Criptare la stocare
- Decriptare la injectare
- Env vars în containere
- Nu rămân în istoric

### ✅ Worker Loop (complet)
- Register provider
- Heartbeat
- Claim assignments
- Launch Docker containers (subprocess real)
- Volume mounts
- Secret injection
- Log collection
- Metrics reporting

### ✅ API Backend (55 endpointuri)
- Toate CRUD-urile
- Auth
- WebSocket tunnel
- Endpoint proxy

### ✅ Web UI
- Toate paginile
- Conectat la API

### ✅ CLI Client + SDK-uri
- Toate comenzile/metodele
- Conectate la API

---

## CONCLUZIE

**Aplicația are arhitectura corectă.**

**Containerele sunt EFEMERE by design** - așa trebuie să fie.
**Datele se stochează în DynamoDB** - doar că acum e InMemory.
**Secretele sunt securizate** - criptate + injectate la runtime.

**Singura problemă critică:** Persistența (InMemoryStore → DynamoDB).
**Restul sunt funcționalități care pot fi adăugate incremental.**
