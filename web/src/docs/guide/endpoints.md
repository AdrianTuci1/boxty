# Modal Auto Endpoints

Boxty Endpoints provide a simple way to expose your Functions as HTTP endpoints.

## Getting started

Create an endpoint by decorating a function with `@app.endpoint()`:

```python
import boxty

app = boxty.App()

@app.endpoint()
def my_endpoint(request):
    return {"message": "Hello, world!"}
```

Deploy the app and Boxty will automatically provision an HTTPS endpoint.

## Proxy tokens

For secure access to your endpoints, use Boxty Proxy tokens:

```python
@app.endpoint(auth=boxty.Auth.PROXY_TOKEN)
def secure_endpoint(request):
    ...
```
