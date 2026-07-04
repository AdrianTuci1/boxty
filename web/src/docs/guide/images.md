# Defining Images

Boxty lets you customize the container images that your functions run in. This is useful for installing system packages, custom libraries, or configuring environment variables.

## What are Images?

An Image in Boxty is a container image that defines the runtime environment for your Functions. You can build Images from scratch or use existing images from registries.

```python
import boxty

# Build from a base image
image = boxty.Image.debian_slim().pip_install("numpy", "pandas")

# Use in a Function
@app.function(image=image)
def my_function():
    import numpy as np
    return np.array([1, 2, 3])
```

Boxty caches built images and reuses them across deployments, making subsequent runs fast.
