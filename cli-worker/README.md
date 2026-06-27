# AgentNet: Decentralized Serverless Container Runtime

AgentNet este un binar CLI unic, conceput pentru a forma o rețea P2P complet descentralizată (micro-cluster mesh) capabilă să ruleze agenți AI, cod Python, instanțe Wasm și baze de date (precum DuckDB) complet izolate, într-un mediu Zero-Trust. 

## Arhitectura Sistemului

Sistemul se bazează pe eliminarea dependenței de servere centralizate, funcționând direct pe calculatoarele utilizatorilor, interconectate printr-o rețea P2P efemeră și criptată.

### 1. P2P Mesh & Rețelistică (libp2p)
Binarul construiește un roi (Swarm) folosind librăria **libp2p**.
- **Transport & Securitate:** Se bazează pe `TCP` pentru transport, cu un strat de securitate asigurat de protocolul `Noise`. Multiplexarea se realizează prin `Yamux`, permițând mai multe canale logice (streams) pe o singură conexiune TCP.
- **Descoperire și Gossip:** Sistemul folosește `Kademlia DHT` pentru stocarea cheilor provizorii și descoperirea furnizorilor de resurse computaționale (CPU/RAM). Transmiterea spec-urilor de task-uri și coordonarea se fac prin `Gossipsub`, cu broadcast-uri pe topicuri dedicate (ex. `/agentnet/tasks/1.0.0`).
- **Hole Punching:** Pentru a ocoli limitările NAT de acasă, rutarea se bazează pe NAT Hole Punching pentru a stabili conexiuni TCP directe între peer-ii unui Micro-Cluster.

### 2. Criptografie MPC (Multi-Party Computation)
Pentru a oferi o garanție Zero-Trust absolută:
- **Niciodată întregi:** Credențialele și cheile API (cum ar fi cheia OpenAI) nu sunt stocate complet pe nicio mașină din rețea.
- Ele sunt sparte pe fragmente (Shamir's Secret Sharing) la client, iar asamblarea lor temporală se realizează doar în momentul strict al nevoii.
- Procesul actual de semnare decentralizată folosește curbe eliptice (`ed25519-dalek` bazat pe randomizare OS cu `rand_core`), permițând generarea unor semnături complete (FROST / Threshold Cryptography) direct în cluster, fără ca nodurile individuale să intercepteze datele sensibile ale utilizatorului.

### 3. Sincronizare și Consens (Raft + CRDT)
Pentru funcționarea deterministă în rețea:
- **Automerge (CRDT):** Modificările locale pe fișiere (cum ar fi output-ul execuției scripturilor) sunt sincronizate instant prin tipuri de date CRDT, păstrând o stare eventual-consistentă și prevenind conflictele concurente de rescriere.
- **Micro-Clustere (Raft):** Atunci când un task e rulat (exemplu: `agentnet run script.py`), rețeaua selectează aleatoriu 3 peer-i pentru a forma un Micro-Cluster. Pe baza protocolului **Raft**, unul este ales Lider, iar restul Urmăritori.
- O buclă asincronă activă în `tokio` (event-loop select!) monitorizează **heartbeat-ul** liderului. Dacă există deconectări sau timeout-uri (peste 3s), protocolul intră într-un scenariu de *self-healing* declanșând o nouă rundă de alegeri fără întreruperea execuției.

### 4. Sandbox Efemer & Izolare (Wasmtime)
Nu instalăm direct imagini Docker (sunt mari și greoaie pentru task-uri scurte). 
- Execuția are loc prin **Wasmtime**, limitată și blocată la nivel de syscall-uri de capabilități limitate (WASI).
- **Zero Suprapunere:** Orice imagine virtuală rulează sub mapări de fișiere rarefiate (*Sparse Files*) încărcate leneș. După terminarea procesului sau deconectarea instanței, "discul" montat virtual se descarcă automat din memoria gazdei. Terminalul (stdout/stdin) se propagă bidirecțional prin streamul P2P direct la cel care a inițiat task-ul (CLI-ul local).

### 5. Sistem de Billing și Decontare Solana
Tranzacțiile mici și repetate (micro-payments) ar supra-taxa blockhain-ul cu gas fees. Astfel:
- **Bilete Digitale:** Facturarea consumului se realizează prin tichete semnate digital *off-chain*.
- **Agregare pe Provider:** Furnizorul de resurse cache-uiește aceste bilete semnate și face o validare *on-chain* (un settlement batch contract pe rețeaua Solana Anchor) doar în momentul atingerii unei sume ($1.00 USDC) sau a unui prag de timp (24H). 
- În cadrul Smart Contractului de pe Solana, există o regulă imuabilă ce deduce un **Founder Fee de 5%**, restul de 95% ajungând în portofelul furnizorului. Modificarea acestui comportament e imposibilă de un hacker deoarece contractul de Escrow stochează acest split.

## Cum Funcționează (Fluxul Tipic)

1. **Pornirea unui Furnizor (`agentnet provider`):**
   - Un utilizator își partajează nucleele libere. Nodul generează un `PeerId`, face dial către bootnodes pentru P2P Mesh și anunță disponibilitatea sa în DHT Kademlia.

2. **Trimiterea unui Task (`agentnet run`):**
   - Clientul inițiază un script. Binarul client face Hole Punching direct către cei mai buni peer-i, stabilind un micro-cluster. O sesiune de streaming (terminal log stream) e deschisă prin multiplexarea P2P.

3. **Execuție:**
   - Liderul preia Wasm-ul și își execută sarcina (izolat de OS-ul său real). Orice apel API (ex. OpenAI) necesită decriptare/semnare threshold (în care participă micro-clusterul) astfel încât datele utilizatorului sunt sigure.

4. **Decontare & Distrugere:**
   - Imediat cum task-ul se încheie, Liderul distruge instanța sandbox RAM. Emite un Bilet Digital Off-chain pentru secundele/bityii consumați, clientul trimite suma în rețea, apoi totul se dezintegrează fără a lăsa urme.

---
*Construit complet în Rust, garantând performanță, siguranță memoriei și portabilitate într-un singur binar executabil fără dependențe externe.*

## Release

Release-urile binarului `boxty` se publică în Cloudflare R2 prin workflow-ul GitHub [`release-agentnet-r2.yml`](../../../.github/workflows/release-agentnet-r2.yml).

- tag de release: `agentnet-v<version>`
- versiunea din tag trebuie să coincidă cu `Cargo.toml`
- artefactele publicate includ arhive multi-platformă, checksum-uri și manifest JSON
- installer public: `curl -fsSL https://releases.boxty.dev/install.sh | sh`

Instrucțiunile de configurare sunt în [`docs/agentnet-r2-release.md`](../../../docs/agentnet-r2-release.md).
