# Boxty 1.0 migration guide

This guide helps you migrate from older versions of Boxty to version 1.0.

## Deprecating Image.copy_* methods

The `Image.copy_*` methods have been deprecated in favor of `Mount`:

```python
# Old way (deprecated)
image = boxty.Image.debian_slim().copy_local_dir("./data", "/data")

# New way
image = boxty.Image.debian_slim()
mount = boxty.Mount.from_local_dir("./data", remote_path="/data")

@app.function(image=image, mounts=[mount])
def my_function():
    ...
```

Update your code to use the new APIs for compatibility with Boxty 1.0.
