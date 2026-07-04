# Streaming endpoints

Boxty supports streaming responses from endpoints.

## Simple example

Create a streaming endpoint by yielding responses:

```python
import boxty

app = boxty.App()

@app.server()
def stream_endpoint(request):
    for i in range(10):
        yield f"data: {i}

"
```

Streaming endpoints are useful for:

- Real-time updates
- Large response payloads
- Server-sent events (SSE)
- Progressive rendering
