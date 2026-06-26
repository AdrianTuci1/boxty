# Dicts

Boxty Dicts are distributed key-value stores that can be accessed from any Boxty Function.

## Boxty Dicts are Python dicts in the cloud

Boxty Dicts provide a simple, serverless key-value store that persists data across function invocations:

```python
import boxty

app = boxty.App()
d = boxty.Dict.from_name("my-dict", create_if_missing=True)

@app.function()
def write_data():
    d["key"] = "value"

@app.function()
def read_data():
    return d["key"]
```

Dicts are ideal for small amounts of persistent data that need to be shared between functions.
