# Networking and security

Boxty Sandboxes provide controlled network access.

## Outbound access control

Configure outbound network access for Sandboxes:

```python
import boxty

app = boxty.App()

@app.function(
    sandbox_network=boxty.SandboxNetwork(
        allow=["https://api.example.com"],
        deny=["*"]
    )
)
def restricted_network():
    import requests
    # Only allowed URLs are accessible
    return requests.get("https://api.example.com")
```

Sandboxes can be configured with allowlists, denylists, and no outbound access.
