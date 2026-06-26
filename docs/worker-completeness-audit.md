# Boxty Worker Completeness Audit

Acest audit separa clar:

- ce este implementat acum pentru noul `boxty worker`
- ce ramane necesar pentru a declara workerul "production complete"

## Status curent

- [x] Exista subcomanda Rust `boxty worker`
- [x] Workerul citeste config JSON compatibil cu `ansible/templates/worker-config.json.j2`
- [x] Workerul foloseste token shared doar pentru enrollment, apoi token runtime per-provider emis de control plane
- [x] Workerul se poate inregistra in control plane
- [x] Workerul trimite heartbeat-uri periodice
- [x] Workerul poate revendica assignment-uri din control plane
- [x] Workerul poate rula workload-uri `function`, `sandbox`, `endpoint`, `build`
- [x] Fiecare workload primeste un workspace efemer izolat pe worker
- [x] Workerul persista stare locala pentru provider si job-uri active
- [x] Workerul emite metering incremental pentru job-uri active
- [x] Workerul finalizeaza workload status cu `completed` sau `failed`
- [x] Workerul valideaza sandbox session token inainte de attach local
- [x] Control plane-ul expira provideri staled dupa TTL
- [x] Control plane-ul expira lease-uri de assignment claim dupa TTL
- [x] Secretele sunt pastrate centralizat si rezolvate doar la launch time

## Implementat in acest change

### Rust worker

- [x] `boxty worker --config <path>`
- [x] `boxty worker --config <path> --once`
- [x] `boxty worker --config <path> --attach-session-token <token>`
- [x] Client HTTP catre control plane
- [x] Enrollment auth cu `Authorization: Bearer <BOXTY_PROVIDER_TOKEN>`
- [x] Runtime auth cu `Authorization: Bearer <provider_token>` + `X-Provider-Id`
- [x] Detectie `docker` sau `podman`
- [x] Launch sync pentru `function`
- [x] Launch detasat pentru `sandbox`
- [x] Launch detasat cu port local pentru `endpoint` si `build`
- [x] Mount `/workspace` efemer izolat pentru fiecare workload
- [x] Mount temporar izolat pentru fisiere runtime
- [x] Inspectie container pentru reconciliere
- [x] Colectare logs la terminare
- [x] Metering periodic bazat pe resurse declarate si timp scurs
- [x] Persistenta job-urilor in starea locala a providerului
- [x] Fetch `launch spec` cu env rezolvat din secret store

### Python control plane

- [x] Auth pentru endpoint-urile de provider/worker
- [x] Verificare sandbox session token prin endpoint dedicat
- [x] TTL pentru provider heartbeat
- [x] Reclaim pentru assignment-uri claimate dar expirate
- [x] Eliberare de sloturi provider la final de workload
- [x] Secret store centralizat cu criptare la repaus pe control plane
- [x] `launch spec` provider-side fara persistarea secretelor in workload record

## Checklist de productie

### Worker core

- [x] Config local si bootstrap
- [x] Provider registration
- [x] Heartbeat
- [x] Claim loop
- [x] Execution runtime
- [x] Local state recovery dupa restart
- [x] Attach local cu token verificat
- [ ] Push channel persistent catre control plane in loc de polling
- [ ] Drain mode controlat de control plane
- [ ] Revoke/cancel activ pentru workload-uri deja lansate

### Security

- [x] Shared bearer token pentru worker endpoints
- [x] Token per-provider emis de control plane
- [ ] Rotatie de credentiale
- [ ] mTLS worker <-> control plane
- [ ] Scope-uri diferite pentru register/heartbeat/claim/meter
- [ ] Audit trail explicit pentru actiuni de attach

### Scheduling si recovery

- [x] Heartbeat TTL
- [x] Claim lease TTL
- [x] Reclaim de assignment expirat
- [ ] Reassign cross-provider dupa claim expiry
- [ ] Backoff inteligent pe provider indisponibil
- [ ] Retry orchestration pentru workload launch esuat

### Runtime si resource enforcement

- [x] Launch pe Docker/Podman
- [x] Port publishing pentru endpoint-uri
- [x] Workspace efemer local izolat per workload
- [x] Hard CPU/RAM limits aplicate containerelor
- [x] Timeout enforcement real pe task-uri
- [x] Cleanup automat pentru containere zombie
- [x] Secret injection din store real, nu doar `env` deja venit in workload

### Metering si billing

- [x] Metering incremental pentru CPU/RAM/GPU/storage-time
- [x] Metering la final de workload
- [ ] Metering bazat pe stats reale de container, nu doar resurse rezervate
- [ ] Idempotency keys pentru evenimente de usage
- [ ] Dedupe/replay safety pentru retry-uri de metering

### Observability

- [x] Provider state local pentru metrics/jobs
- [x] Logs colectate la terminarea workload-ului
- [ ] Streaming live de logs catre control plane
- [ ] Structured logs
- [ ] Health endpoints dedicate pentru worker agent
- [ ] Metrics reale de container CPU/RAM/IO

### Storage si artifacts

- [x] Volume mounts reale backed by object storage / persistent storage
- [ ] Artifact upload/download workflow
- [ ] Build cache si image artifact management

### Secrets

- [x] Secret store centralizat pe control plane
- [x] Criptare la repaus pentru valorile secretelor
- [x] Rezolvare secret values doar la launch
- [x] Injectare in env-ul workload-ului pe worker
- [ ] RBAC pe accesul la secrete
- [ ] Rotatie si versionare pentru secrete

### Control plane durability

- [ ] Repository abstraction in loc de in-memory store
- [ ] DynamoDB ca store primar, nu doar mirror
- [ ] Recovery complet dupa restart control plane

## Concluzie

Workerul nou nu mai este doar un stub conceptual: exista acum un agent Rust functional pentru fluxul principal `register -> heartbeat -> claim -> run -> meter -> complete`.

Totusi, "complet" in sens de productie stricta inca nu este adevarat pana nu sunt inchise elementele ramase din checklist-ul de productie, in special:

- mTLS, scope-uri si rotatie pentru token-urile provider
- transport push in loc de polling
- persistenta primara in control plane
- artifact workflows si cache management
- log streaming si resource enforcement real
