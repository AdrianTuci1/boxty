# Volumes

Boxty Volumes provide persistent storage for your Functions.

## Creating a Volume

Create a Volume from the Boxty dashboard or programmatically:

```python
import boxty

app = boxty.App()
volume = boxty.Volume.from_name("my-volume", create_if_missing=True)
```

## Using a Volume on Boxty

Mount a Volume in your Functions:

```python
@app.function(volumes={"/data": volume})
def use_volume():
    import os
    # Write to volume
    with open("/data/file.txt", "w") as f:
        f.write("Hello, Volume!")
    # Read from volume
    with open("/data/file.txt", "r") as f:
        return f.read()
```

Volumes are:

- Persistent across function invocations
- Shared across all Functions in an App
- Backed by high-performance storage
- Billed per GB-month
