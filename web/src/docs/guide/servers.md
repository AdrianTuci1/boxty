# HTTP Applications

Boxty Servers provide HTTP endpoints for your Functions.

## Defining a Server

Create an HTTP server by decorating a function with `@app.server()`:

```python
import boxty

app = boxty.App()

@app.server()
def my_server(request):
    return {"message": "Hello, world!"}
```

Boxty automatically provisions an HTTPS endpoint with load balancing and autoscaling.

Servers support:

- REST APIs
- WebSocket connections
- Streaming responses
- Custom domains
