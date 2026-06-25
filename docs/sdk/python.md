# Python SDK

## Installation

```bash
pip install boxty
```

## Quick Start

```python
from boxty import App

app = App()

@app.function()
def hello(name: str):
    return f"Hello, {name}!"

if __name__ == "__main__":
    app.run()
```

## API Reference

### App

```python
from boxty import App

app = App(
    name="my-app",
    image="python:3.10-slim"
)
```

### Secrets

```python
from boxty import Secret

secret = Secret(name="api-key")
secret.set_env("OPENAI_API_KEY", "sk-...")
```

### Volumes

```python
from boxty import Volume

volume = Volume(name="data", size_gb=10)
```

### Databases

```python
from boxty import Database

db = Database(name="users", pk="id", sk="sort")
```

## Examples

See [examples/](https://github.com/adriantucicovenco/boxty/tree/main/examples) directory.
