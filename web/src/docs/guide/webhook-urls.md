# Web Function URLs

Boxty provides stable URLs for invoking Functions via HTTP.

## Determine the Web Function URL from code

Get the Web Function URL programmatically:

```python
import boxty

app = boxty.App()

@app.function()
def my_web_function():
    return "Hello, world!"

@app.local_entrypoint()
def main():
    url = my_web_function.web_url
    print(f"Web Function URL: {url}")
```

Web Function URLs are stable across deployments and can be used for:

- Webhooks
- API endpoints
- Third-party integrations
- Scheduled jobs
