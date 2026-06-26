# Environment variables

The Boxty runtime sets several environment variables during initialization. The keys for these environment variables are reserved and cannot be overridden by your Function or Sandbox configuration.

These variables provide information about the container's runtime environment.

## Container runtime environment variables

The following variables are present in every Boxty container:

- **BOXTY_CLOUD_PROVIDER** — Boxty executes containers across a number of cloud providers (AWS, GCP, OCI). This variable specifies which cloud provider the Boxty container is running within.
- **BOXTY_IMAGE_ID** — The ID of the boxty.Image used by the Boxty container.
- **BOXTY_REGION** — This will correspond to a geographic area identifier from the cloud provider associated with the Boxty container (see above). For AWS, the identifier is a "region". For GCP it is a "zone", and for OCI it is an "availability domain". Example values are us-east-1 (AWS), us-central1 (GCP), us-ashburn-1 (OCI). See the full list here.
- **BOXTY_TASK_ID** — The ID of the container running the Boxty Function or Sandbox.

## Function runtime environment variables

The following variables are present in containers running Boxty Functions:

- **BOXTY_ENVIRONMENT** — The name of the Boxty Environment the container is running within.
- **BOXTY_IS_REMOTE** - Set to '1' to indicate that Boxty Function code is running in a remote container.
- **BOXTY_IDENTITY_TOKEN** — An OIDC token encoding the identity of the Boxty Function.

## Sandbox environment variables

The following variables are present within boxty.Sandbox instances.

- **BOXTY_SANDBOX_ID** — The ID of the Sandbox.

## Container image environment variables

The container image layers used by a boxty.Image may set environment variables. These variables will be present within your container's runtime environment. For example, the debian_slim image sets the GPG_KEY variable.

To override image variables or set new ones, use the .env method provided by boxty.Image.
