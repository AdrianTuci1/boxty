# Proxy Tokens

Boxty Proxy Tokens provide secure access to your endpoints.

## Restricting tokens to specific Environments

Create Proxy Tokens with environment restrictions:

```python
import boxty

app = boxty.App()

@app.function()
def create_restricted_token():
    token = boxty.ProxyToken.create(
        environments=["production"],
        expires_at="2024-12-31"
    )
    return token.value
```

Proxy Tokens are useful for:

- API authentication
- Webhook security
- Third-party integrations
- Service-to-service communication
