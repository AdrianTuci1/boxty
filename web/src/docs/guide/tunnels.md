# Tunnels

Boxty Tunnels provide secure access to local services from remote Functions.

## Build with tunnels

Create a tunnel to expose a local service to your Boxty Functions:

```bash
boxty tunnel create --local-port 8080 --remote-port 8080
```

Use the tunnel in your Functions:

```python
import boxty

app = boxty.App()

@app.function()
def use_tunnel():
    import requests
    return requests.get("http://localhost:8080")
```

Tunnels are useful for:

- Local development with remote Functions
- Accessing private services
- Debugging
- Database connections
