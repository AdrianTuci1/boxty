# Invoking deployed functions

Boxty provides multiple ways to invoke deployed Functions.

## Invoking with Python

Use the Boxty Python SDK to invoke Functions programmatically:

```python
import boxty

# Connect to deployed app
app = boxty.App.lookup("my-app")

# Invoke a function
result = app.my_function.remote()
```

## Authentication

When invoking Functions, you may need to authenticate:

```python
import boxty

client = boxty.Client(token_id="...", token_secret="...")
app = client.app("my-app")
result = app.my_function.remote()
```

Boxty also supports Web Function URLs for HTTP-based invocation without authentication.
