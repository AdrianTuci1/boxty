# Customer-supplied encryption keys (CSEK)

Customer-supplied encryption keys (CSEK) is an Enterprise feature that lets you use your own cloud-hosted encryption keys to protect your Boxty data at rest.

## How CSEK works

When you enable CSEK, Boxty uses your key to encrypt all data stored in Boxty-managed storage, including Volumes, Dicts, and Queues. The key is managed by your cloud provider (AWS KMS, Google Cloud KMS, or Azure Key Vault) and never leaves their infrastructure.

## Supported resources

- Volumes
- Dicts
- Queues
- Secrets

Contact sales@boxty.com to enable CSEK for your workspace.
