# Boxty Infrastructure Plan: Contabo + Cloudflare R2

## Target layout

- Control plane backend: Contabo VPS
- Provider workers: Contabo VPS
- Persistent object storage: Cloudflare R2
- State store: DynamoDB single table
- CI/CD trigger: GitHub Actions `workflow_dispatch`

## Why this shape

- Contabo is enough for initial control plane and manual worker rollout
- Workers can be added one by one without introducing Kubernetes too early
- Cloudflare R2 gives cheap object storage for volumes, artifacts, logs, and image layers
- RunPod remains the GPU fallback path

## Rollout stages

1. Deploy one control-plane VPS on Contabo.
2. Deploy the first CPU workers manually on Contabo.
3. Point persistent object storage to Cloudflare R2.
4. Add more workers manually as capacity grows.
5. Introduce orchestration such as Kubernetes only when operational pain justifies it.

## GitHub workflow dispatch

Two manual workflows are included:

- control plane deploy
- worker deploy

These should be triggered only with explicit operator intent.
