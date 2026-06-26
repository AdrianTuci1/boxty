# AgentNet CLI Release to R2

Acest pipeline publică binarele `boxty` din `agentnet/cli/sdk` în Cloudflare R2.

## Trigger

Workflow-ul rulează în două moduri:

- automat la push pe tag-uri `agentnet-v*`
- manual din GitHub Actions prin `workflow_dispatch`

Exemplu tag valid:

```bash
git tag agentnet-v1.0.0
git push origin agentnet-v1.0.0
```

Versiunea din tag trebuie să fie identică cu `version` din [`agentnet/cli/sdk/Cargo.toml`](../agentnet/cli/sdk/Cargo.toml).

## Build outputs

Workflow-ul produce:

- `boxty-v<version>-linux-x86_64.tar.gz`
- `boxty-v<version>-darwin-x86_64.tar.gz`
- `boxty-v<version>-darwin-aarch64.tar.gz`
- câte un fișier `.sha256` pentru fiecare arhivă
- `manifest.json` pentru release-ul curent
- `latest.json` pentru ultimul release publicat
- `install.sh` pentru instalare automată cu detecție de platformă

## GitHub configuration

Secrets necesare:

- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`

Repository variables necesare:

- `R2_ACCOUNT_ID`
- `R2_BUCKET`
- `R2_PUBLIC_BASE_URL`

Exemplu pentru `R2_PUBLIC_BASE_URL`:

- `https://releases.boxty.dev`

## R2 layout

Artefactele sunt publicate în bucket sub prefixul:

```text
agentnet/releases/v<version>/
```

Manifestul pentru ultimul release este publicat la:

```text
agentnet/releases/latest.json
```

Exemplu URL final:

```text
https://releases.boxty.dev/agentnet/releases/v1.0.0/manifest.json
```

Installer-ul este publicat la:

```text
https://releases.boxty.dev/install.sh
```

și, redundant, la:

```text
https://releases.boxty.dev/agentnet/install.sh
```

## Install

Instalare implicită a ultimei versiuni:

```bash
curl -fsSL https://releases.boxty.dev/install.sh | sh
```

Instalare a unei versiuni specifice:

```bash
curl -fsSL https://releases.boxty.dev/install.sh | VERSION=1.0.0 sh
```

Instalare într-un director explicit:

```bash
curl -fsSL https://releases.boxty.dev/install.sh | INSTALL_DIR=/usr/local/bin sh
```

Scriptul detectează automat:

- `linux` vs `darwin`
- `x86_64` vs `aarch64`

și descarcă asset-ul corespunzător din `latest.json` sau din manifestul versiunii cerute.

## Bucket setup

Pentru download public de binare:

- configurează bucket-ul R2 pe un custom domain
- evită `r2.dev` pentru producție

Referințe oficiale Cloudflare:

- [Public buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/)
- [aws CLI with R2](https://developers.cloudflare.com/r2/examples/aws/aws-cli/)
