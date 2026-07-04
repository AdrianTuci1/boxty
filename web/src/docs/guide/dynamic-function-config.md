# Dynamic function configuration

Boxty supports dynamic configuration of Functions at runtime.

## Basic configuration

You can configure Functions using environment variables or runtime parameters:

```python
import boxty
import os

app = boxty.App()

@app.function()
def configurable_function():
    config_value = os.environ.get("MY_CONFIG", "default")
    return config_value
```

For more complex configuration, use Boxty Secrets or Dicts to store and retrieve configuration values.
