# Request timeouts

Boxty enforces timeouts to prevent runaway Functions.

## Container startup timeout

Functions have a startup timeout to prevent containers from hanging during initialization:

```python
import boxty

app = boxty.App()

@app.function(timeout=300)  # 5 minutes
def long_running_function():
    ...
```

## Handling timeouts

Handle timeouts gracefully in your code:

```python
import boxty

@app.function(timeout=60)
def function_with_timeout():
    try:
        # Your code here
        ...
    except boxty.TimeoutError:
        # Handle timeout
        return "Timed out"
```

Configure timeouts based on your workload requirements.
