# Agent: Boxty CI/CD — GitHub Actions

## Rol
Construiește pipeline-ul complet de integrare și deploy pentru toate componentele Boxty. Rulează în GitHub Actions.

## Director de lucru
`/Users/adriantucicovenco/Proiecte/boxty/.github/`

## Arhitectura workflow-urilor

```
.github/workflows/
├── ci.yml                  # PR check — lint, build, test
├── deploy-api.yml          # Push pe main → build + deploy API
├── deploy-worker.yml       # Push pe main → build + deploy Worker
├── publish-sdk-py.yml      # Release tag → publish la PyPI
├── publish-sdk-js.yml      # Release tag → publish la npm
├── provision-workers.yml   # Manual trigger → Terraform apply
└── destroy-workers.yml     # Manual trigger → Terraform destroy
```

## 1. CI — Pull Request Check (`ci.yml`)

Rulează la fiecare PR către `main`. Toate job-urile în paralel.

```yaml
name: CI
on:
  pull_request:
    branches: [main]
  push:
    branches: [develop]

jobs:
  api:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: api } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run lint
      - run: node --check src/index.js   # syntax check ESM

  worker:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: worker } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with: { go-version: '1.22' }
      - run: go mod tidy
      - run: go build ./...
      - run: go vet ./...

  sdk-py:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: sdk-py } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: pip install -e .
      - run: python -c "import boxty; print(boxty.__version__)"
      - run: pip install ruff && ruff check src/

  sdk-js:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: sdk-js } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npx eslint src/

  infra-config:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: infra } }
    steps:
      - uses: actions/checkout@v4
      - run: |
          docker compose -f docker/docker-compose.yml config
          echo "Docker Compose config is valid"
```

## 2. Deploy API (`deploy-api.yml`)

Rulează la push pe main. Build + push Docker image la GitHub Container Registry (ghcr.io).

```yaml
name: Deploy API
on:
  push:
    branches: [main]
    paths: ['api/**', '.github/workflows/deploy-api.yml']

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - name: Log in to GHCR
        run: echo "${{ secrets.GITHUB_TOKEN }}" | docker login ghcr.io -u ${{ github.actor }} --password-stdin
      - name: Build and tag
        run: |
          docker build -t ghcr.io/boxty/api:latest api/
          docker tag ghcr.io/boxty/api:latest ghcr.io/boxty/api:${{ github.sha }}
      - name: Push
        run: |
          docker push ghcr.io/boxty/api:latest
          docker push ghcr.io/boxty/api:${{ github.sha }}
      - name: Deploy
        env:
          HETZNER_API_TOKEN: ${{ secrets.HETZNER_API_TOKEN }}
        run: |
          # SSH la server, docker pull, docker compose up
          ssh -o StrictHostKeyChecking=no deploy@${{ vars.API_HOST }} << 'EOF'
            cd /opt/boxty
            docker compose pull api
            docker compose up -d api
            docker system prune -f
          EOF
```

## 3. Deploy Worker (`deploy-worker.yml`)

```yaml
name: Deploy Worker
on:
  push:
    branches: [main]
    paths: ['worker/**', '.github/workflows/deploy-worker.yml']

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with: { go-version: '1.22' }
      - name: Build binary
        run: |
          cd worker
          GOOS=linux GOARCH=amd64 go build -o bin/worker ./cmd/worker
      - name: Build Docker image
        run: |
          echo "${{ secrets.GITHUB_TOKEN }}" | docker login ghcr.io -u ${{ github.actor }} --password-stdin
          docker build -t ghcr.io/boxty/worker:latest worker/
          docker push ghcr.io/boxty/worker:latest
      - name: Rebuild golden AMI via Packer
        if: false  # manual trigger pentru AMI build
        run: |
          cd infra/packer
          packer build worker.pkr.hcl
```

## 4. Publish SDK Python (`publish-sdk-py.yml`)

Rulează la tag `sdk-py-v*`. Publică la PyPI.

```yaml
name: Publish SDK Python
on:
  push:
    tags: ['sdk-py-v*']

jobs:
  publish:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: sdk-py } }
    permissions:
      id-token: write  # PyPI trusted publishing
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: pip install build twine
      - run: python -m build
      - name: Publish to PyPI
        uses: pypa/gh-action-pypi-publish@release/v1
        with:
          packages-dir: sdk-py/dist/
          print-hash: true
```

## 5. Publish SDK Node.js (`publish-sdk-js.yml`)

Rulează la tag `sdk-js-v*`. Publică la npm.

```yaml
name: Publish SDK JS
on:
  push:
    tags: ['sdk-js-v*']

jobs:
  publish:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: sdk-js } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## 6. Provision Workers (`provision-workers.yml`)

Manual trigger — rulează Terraform să lanseze workers.

```yaml
name: Provision Workers
on:
  workflow_dispatch:
    inputs:
      provider:
        description: 'Cloud provider'
        required: true
        default: 'aws'
        type: choice
        options: [aws, gcp, azure]
      count:
        description: 'Number of workers'
        required: true
        default: '1'
      region:
        description: 'Region'
        required: true
        default: 'us-east-1'

jobs:
  provision:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: infra/terraform/${{ inputs.provider }} } }
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      - run: terraform init
      - run: terraform apply -auto-approve
        env:
          TF_VAR_count: ${{ inputs.count }}
          TF_VAR_region: ${{ inputs.region }}
          TF_VAR_api_url: ${{ vars.API_URL }}
          TF_VAR_worker_api_key: ${{ secrets.WORKER_API_KEY }}
```

## 7. Destroy Workers (`destroy-workers.yml`)

```yaml
name: Destroy Workers
on:
  workflow_dispatch:
    inputs:
      provider:
        description: 'Cloud provider'
        required: true
        default: 'aws'
        type: choice
        options: [aws, gcp, azure]

jobs:
  destroy:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: infra/terraform/${{ inputs.provider }} } }
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      - run: terraform init
      - run: terraform destroy -auto-approve
```

## Structura de creat

```
.github/
└── workflows/
    ├── ci.yml                    # PR check — lint, build
    ├── deploy-api.yml            # Push main → build + deploy API
    ├── deploy-worker.yml         # Push main → build + deploy Worker image
    ├── publish-sdk-py.yml        # Tag sdk-py-v* → PyPI
    ├── publish-sdk-js.yml        # Tag sdk-js-v* → npm
    ├── provision-workers.yml     # Manual trigger → Terraform apply
    └── destroy-workers.yml       # Manual trigger → Terraform destroy
```

## Secrets necesare în GitHub

| Secret | Folosit de | Descriere |
|---|---|---|
| `HETZNER_API_TOKEN` | deploy-api.yml | SSH deploy la server |
| `NPM_TOKEN` | publish-sdk-js.yml | Publicare la npm |
| `WORKER_API_KEY` | provision-workers.yml | Worker → API auth |
| `TF_VAR_worker_api_key` | provision-workers.yml | Terraform variable |

## Variables necesare

| Variable | Folosit de | Descriere |
|---|---|---|
| `API_HOST` | deploy-api.yml | Adresa serverului API |
| `API_URL` | deploy-workers.yml | URL-ul API-ului pentru workers |

## Reguli
- CI rulează în paralel pe toate componentele
- Deploy-urile se fac doar la push pe `main`
- Publicarea SDK-urilor se face doar la tag versionat (`sdk-py-v0.1.0`)
- Workers se provizionează manual (nu automat) — e un cost real
- Toate workflow-urile folosesc `actions/checkout@v4`
- Fără date sensibile în cod — totul prin GitHub Secrets
