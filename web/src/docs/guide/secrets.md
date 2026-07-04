# Secrets and environment variables

Boxty Secrets provide secure storage for sensitive configuration.

## Limits

Each workspace has a limit on the number of Secrets:

- Starter: 10 Secrets
- Team: 100 Secrets
- Enterprise: Unlimited

## Deploy Secrets from the Boxty Dashboard

Create and manage Secrets in the Boxty dashboard:

1. Go to Settings > Secrets
2. Click "Create Secret"
3. Enter a name and value
4. Click "Save"

Use Secrets in your Functions:

```python
import boxty

app = boxty.App()

@app.function(secrets=[boxty.Secret.from_name("my-secret")])
def use_secret():
    import os
    return os.environ["MY_SECRET"]
```
