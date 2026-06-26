# Container lifecycle hooks

Boxty provides lifecycle hooks for managing container initialization and cleanup.

## @boxty.enter

Use `@boxty.enter` to run code when a container starts:

```python
import boxty

app = boxty.App()

@app.function()
@boxty.enter
def initialize():
    # This runs once when the container starts
    global model
    model = load_model()

def predict(input):
    return model(input)
```

The `@boxty.enter` decorator is useful for loading models, establishing database connections, or other one-time initialization tasks.
