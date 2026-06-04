# Agent: Boxty Infrastructure & DevOps

## Rol
Tot ce ține de deploy, environment-uri de dezvoltare, și CI/CD pentru platforma Boxty.

## Director de lucru
`/Users/adriantucicovenco/Proiecte/boxty/infra/`

## Docker Compose (Dev Local)

Fișier: `infra/docker/docker-compose.yml`

Mediul de dezvoltare local trebuie să includă:

```yaml
services:
  api:
    build: ../api
    ports: ["3000:3000"]
    environment:
      - DYNAMODB_ENDPOINT=http://dynamodb:8000
      - JWT_SECRET=dev-secret
      - WORKER_API_KEY=dev-key
      - S3_BUCKET_SNAPSHOTS=boxty-snapshots
      - AWS_ACCESS_KEY_ID=test
      - AWS_SECRET_ACCESS_KEY=test
    depends_on: [dynamodb, s3-local]

  dynamodb:
    image: amazon/dynamodb-local:latest
    ports: ["8000:8000"]
    command: -jar DynamoDBLocal.jar -sharedDb -inMemory

  s3-local:
    image: minio/minio:latest
    ports: ["9000:9000", "9001:9001"]
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: test
      MINIO_ROOT_PASSWORD: testtest

  worker-mock:
    build: ../worker
    ports: ["9001:9001", "9002:9002"]
    environment:
      - API_URL=http://api:3000
      - WORKER_API_KEY=dev-key
      - PROVIDER=local
      - REGION=local
    depends_on: [api]
```

## Terraform (Multi-Cloud)

### Provider Abstraction

Fiecare cloud provider are un fișier Terraform separat. Toate expun aceleași output-uri.

### AWS (infra/terraform/aws/)

```hcl
# main.tf
resource "aws_instance" "worker" {
  ami           = data.aws_ami.boxty_worker.id
  instance_type = "c6a.2xlarge"  # 8 vCPU, 16GB
  spot_price    = "0.15"
  user_data     = templatefile("${path.module}/cloud-init.yml", {
    api_url      = var.api_url
    worker_key   = var.worker_api_key
    provider     = "aws"
    region       = var.region
  })
  
  iam_instance_profile = aws_iam_instance_profile.worker.name
  
  tags = { Name = "boxty-worker-${var.region}" }
}

resource "aws_dynamodb_table" "boxty" {
  name         = "boxty"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"
  
  attribute {
    name = "PK"
    type = "S"
  }
  attribute {
    name = "SK"
    type = "S"
  }
  attribute {
    name = "GSI1_PK"
    type = "S"
  }
  attribute {
    name = "GSI1_SK"
    type = "S"
  }
  
  global_secondary_index {
    name            = "GSI1"
    hash_key        = "GSI1_PK"
    range_key       = "GSI1_SK"
    projection_type = "ALL"
  }
  
  global_secondary_index {
    name            = "GSI2"
    hash_key        = "GSI2_PK"
    range_key       = "GSI2_SK"
    projection_type = "ALL"
  }
}

resource "aws_s3_bucket" "snapshots" {
  bucket = "boxty-snapshots-${var.environment}"
}

resource "aws_s3_bucket" "images" {
  bucket = "boxty-images-${var.environment}"
}

resource "aws_ecr_repository" "boxty_images" {
  name = "boxty-images"
  image_tag_mutability = "MUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }
  
  lifecycle_policy {
    policy = jsonencode({
      rules = [{
        rulePriority = 1
        description  = "Expire untagged images after 14 days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 14
        }
        action = { type = "expire" }
      }]
    })
  }
}

resource "aws_iam_role_policy_attachment" "worker_ecr_push" {
  role       = aws_iam_instance_profile.worker.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser"
}
```

### GCP (infra/terraform/gcp/)

Similar cu AWS, dar cu:
- `google_compute_instance` în loc de `aws_instance`
- `google_dns_managed_zone` pentru `*.boxty.dev`
- Preemptible instances în loc de spot
- Cloud Storage în loc de S3

### Azure (infra/terraform/azure/)

Similar, cu:
- `azurerm_linux_virtual_machine`
- `azurerm_storage_account`

### Variabile comune

```
variable "environment" { default = "production" }
variable "api_url" {}
variable "worker_api_key" { sensitive = true }
variable "region" {}
```

## Packer (Worker Golden Image)

Fișier: `infra/packer/worker.pkr.hcl`

Construiește un AMI/Imagine care include:
- OS: Ubuntu 22.04 LTS
- gVisor pre-instalat (`runsc`)
- Docker Engine (docker build + docker push pentru server-side image building pe port 9004)
- containerd
- Worker agent (Go binary) pre-compilat
- Cloud-init config cu credențiale registry: `REGISTRY_USER`, `REGISTRY_PASS`
- Mount `/var/lib/boxty/build-cache` (SSD/EFS) — cache pentru layer-urile Docker build

```hcl
source "amazon-ebs" "worker" {
  ami_name      = "boxty-worker-{{timestamp}}"
  instance_type = "c6a.2xlarge"
  region        = "us-east-1"
  source_ami_filter {
    filters = {
      name                = "ubuntu/images/*ubuntu-jammy-22.04-amd64-server-*"
      root-device-type    = "ebs"
      virtualization-type = "hvm"
    }
    most_recent = true
    owners      = ["099720109477"]
  }
  ssh_username = "ubuntu"
}

build {
  sources = ["source.amazon-ebs.worker"]
  
  provisioner "shell" {
    inline = [
      "curl -fsSL https://gvisor.dev/archive.key | apt-key add -",
      "add-apt-repository 'deb https://storage.googleapis.com/gvisor/releases release main'",
      "apt-get update && apt-get install -y runsc containerd",
      "runsc install",
      "systemctl enable runsc",
    ]
  }
  
  provisioner "file" {
    source      = "../worker/bin/worker"
    destination = "/usr/local/bin/boxty-worker"
  }
  
  provisioner "shell" {
    inline = [
      "chmod +x /usr/local/bin/boxty-worker",
      "systemctl enable boxty-worker",
    ]
  }
}
```

## Cloud-init (Worker Bootstrap)

Fișier: `infra/packer/cloud-init.yml`

```yaml
#cloud-config
package_update: true
packages:
  - runsc
  - containerd
  - docker.io

runcmd:
  - systemctl enable --now containerd
  - runsc install
  - docker pull boxty/worker:latest
  - docker run -d --name boxty-worker
    -e API_URL="${api_url}"
    -e WORKER_API_KEY="${worker_key}"
    -e PROVIDER="${provider}"
    -e REGION="${region}"
    -v /var/run/containerd:/var/run/containerd
    -v /var/run/runsc:/var/run/runsc
    --privileged
    boxty/worker:latest
```

## GitHub Actions (CI/CD)

Fișier: `infra/github/ci.yml`

```yaml
name: Boxty CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  api-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cd api && npm install && npm run lint

  worker-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with: { go-version: '1.22' }
      - run: cd worker && go build ./...

  sdk-py:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: cd sdk-py && pip install -e . && python -c "import boxty"

  sdk-js:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd sdk-js && npm install && npx tsc --noEmit

  docker-build:
    runs-on: ubuntu-latest
    needs: [api-lint, worker-build]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Build API image
        run: docker build -t boxty/api:latest api/
      - name: Build Worker image
        run: docker build -t boxty/worker:latest worker/
      - name: Push to registry
        run: |
          docker push boxty/api:latest
          docker push boxty/worker:latest
```

## Structura completă de creat

```
infra/
├── docker/
│   └── docker-compose.yml     # Dev local: api + dynamodb + minio + worker mock
├── terraform/
│   ├── aws/
│   │   ├── main.tf            # EC2 spot, DynamoDB, S3, IAM, VPC
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── gcp/
│   │   ├── main.tf            # GCE, Cloud Storage, Cloud DNS
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── azure/
│       ├── main.tf            # VM Scale Set, Storage Account
│       ├── variables.tf
│       └── outputs.tf
├── packer/
│   ├── worker.pkr.hcl         # Packer template pentru golden AMI
│   └── cloud-init.yml         # Cloud-init bootstrap script
└── github/
    └── ci.yml                 # GitHub Actions workflow
```

## Reguli
- `docker compose up` trebuie să pornească totul fără erori (structural)
- Expune un `.env.example` per component
- Terraform e doar schelet — variabilele principale sunt acolo
- Packer e funcțional (se poate rula cu `packer build`)
- CI verifică lint + build + import, nimic în producție
