# Web Functions

Boxty Web Functions provide HTTP endpoints for your Functions.

## Simple endpoints

Create a simple HTTP endpoint:

```python
import boxty

app = boxty.App()

@app.function()
def hello_world():
    return {"message": "Hello, world!"}
```

The Web Function URL is automatically generated and available in the dashboard.

## Developing with boxty serve

Test your Web Functions locally:

```bash
boxty serve my_app.py
```

This starts a local development server that mimics the Boxty environment.
