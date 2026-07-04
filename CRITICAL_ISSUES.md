# Probleme Critice Boxty - Raport Real

## Data: 2026-06-28

---

## DESCOPERIRE MAJORĂ

Worker-ul ARE execuție reală Docker, dar NU în comenzile client!

### Ce funcționează REAL:
- `boxty-worker worker` (loop) → rulează Docker containere reale
- `boxty-worker worker` → heartbeat, claim assignments, launch workloads

### Ce e SIMULAT (doar print-uri):
- `boxty-worker function` → doar print-uri, nu rulează nimic
- `boxty-worker run` → doar print-uri
- `boxty-worker sandbox` → doar print-uri  
- `boxty-worker shell` → doar print-uri
- `boxty-worker deploy` → doar print-uri
- `boxty-worker attach` → doar print-uri
- `boxty-worker app` → doar print-uri
- `boxty-worker gateway` → doar print-uri

---

## PROBLEME CRITICE (blocante pentru production)

### 1. ❌ PERSISTENȚA DATELOR
**Status:** InMemoryStore = datele se pierd la restart
**Impact:** CRITICAL - toate datele utilizatorilor se pierd
**Soluție:** PostgreSQL sau SQLite

### 2. ❌ COMENZILE CLIENT DIN WORKER SUNT SIMULATE
**Status:** `boxty-worker function/sandbox/deploy` = doar print-uri
**Impact:** HIGH - utilizatorul nu poate rula workload-uri direct
**Soluție:** Conectează comenzile client la control plane API

### 3. ❌ AUTH WEB HARDCODED
**Status:** useAuth folosește email/password fixe
**Impact:** HIGH - oricine poate intra cu aceleași credențiale
**Soluție:** Elimină hardcoded, folosește backend API real

### 4. ❌ WORKER - DOAR LOOP-UL E REAL
**Status:** Loop-ul (register/heartbeat/claim/launch) e real, restul e simulat
**Impact:** MEDIUM - funcționează dar nu poate fi folosit direct de client
**Soluție:** Clarifică documentația - worker e doar pentru VPS, nu pentru client

### 5. ❌ IMAGE BUILD
**Status:** Doar schimbă statusul, nu face build real
**Impact:** MEDIUM - utilizatorul nu poate build imagini custom
**Soluție:** Implementează build Docker real sau integrare cu registry

### 6. ❌ SCHEDULE TRIGGER
**Status:** Doar updatează timestamp, nu execută workload
**Impact:** MEDIUM - cron jobs nu funcționează
**Soluție:** Implementează scheduler real (cron job sau background task)

---

## CE FUNCȚIONEAZĂ REAL (100%)

### Backend API (55 endpointuri)
- Toate CRUD-urile funcționează
- Auth (register/login/me)
- Workspaces, Environments, Workloads, Volumes, Secrets, Routes, Schedules, Images
- Providers (register/heartbeat/assignments)
- Billing, Dashboard, Usage
- WebSocket tunnel
- Endpoint proxy (/r/{name})

### Web UI
- Toate paginile funcționează
- Conectat la backend API
- Dashboard, Apps, Volumes, Secrets, Billing, Settings

### CLI Client (boxty)
- Toate comenzile funcționează
- Conectat la backend API
- Auth, Workspaces, Environments, Apps, Volumes, Secrets, Billing, Routes, Schedules, Images

### SDK Python & JS
- Toate metodele funcționează
- Conectate la backend API

### Worker Loop (boxty-worker worker)
- Register provider real
- Heartbeat real
- Claim assignments real
- Launch workloads real (Docker subprocess)
- Volume mounts real
- Secret injection real
- Log collection real
- Metrics reporting real

---

## CE E SIMULAT / STUB

### Worker CLI Commands (nu loop-ul)
- `boxty-worker function` - simulat
- `boxty-worker sandbox` - simulat
- `boxty-worker deploy` - simulat
- `boxty-worker attach` - simulat
- `boxty-worker app` - simulat
- `boxty-worker gateway` - simulat

### Backend
- RunPod dispatch - stub
- Image build - doar schimbă status
- Schedule trigger - doar updatează timestamp

### Web
- Auth - hardcoded credentials

---

## RECOMANDĂRI PRIORITARE

### 1. CRITICAL: Persistență date
**Acțiune:** Înlocuiește InMemoryStore cu SQLite/PostgreSQL
**Timp estimat:** 2-4 ore
**Impact:** Fără asta, aplicația nu poate fi folosită în production

### 2. HIGH: Elimină hardcoded auth
**Acțiune:** Folosește backend API real pentru login/register
**Timp estimat:** 1-2 ore
**Impact:** Securitate critică

### 3. MEDIUM: Implementează schedule trigger real
**Acțiune:** Adaugă background task care verifică și execută schedules
**Timp estimat:** 2-3 ore
**Impact:** Funcționalitate importantă

### 4. MEDIUM: Implementează image build real
**Acțiune:** Integrează cu Docker registry sau build service
**Timp estimat:** 3-4 ore
**Impact:** Necesar pentru custom images

### 5. LOW: Documentează clar separarea
**Acțiune:** Documentează că `boxty-worker` e pentru VPS, `boxty` e pentru client
**Timp estimat:** 30 minute
**Impact:** Evită confuzie

---

## CONCLUZIE

Aplicația are **structura completă** și **API-urile funcționale**, dar **lipsește persistența** și **unele funcționalități sunt simulate**.

**Pentru a funcționa în production:**
1. ✅ API backend (55 endpointuri) - GATA
2. ✅ Web UI - GATA
3. ✅ CLI client - GATA
4. ✅ SDK-uri - GATA
5. ✅ Worker loop (Docker) - GATA
6. ❌ Persistență date - LIPSEȘTE
7. ❌ Auth real - LIPSEȘTE
8. ❌ Schedule execution - LIPSEȘTE

**Scor real:** 70% funcțional, 30% lipsă criticală (persistență + auth)
