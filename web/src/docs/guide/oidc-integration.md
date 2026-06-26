# Using OIDC to authenticate with external services

Boxty supports OpenID Connect (OIDC) for authenticating with external services.

## How it works

Boxty can issue OIDC tokens that you can use to authenticate with external services like AWS, Google Cloud, or Azure:

```python
import boxty

app = boxty.App()

@app.function()
def access_external_service():
    token = boxty.oidc.get_token("aws")
    # Use the token to authenticate with AWS
    ...
```

Configure OIDC providers in your workspace settings.
