# Using existing container images

If you already have a container image hosted on a registry, you can use it directly in Boxty.

## Load an image from a public registry with .from_registry

You can reference public images from Docker Hub or any other public registry:

```python
import boxty

image = boxty.Image.from_registry("python:3.10-slim")
```

## Custom registries

You can also use private registries by providing credentials:

```python
image = boxty.Image.from_registry(
    "my-private-registry.com/my-image:latest",
    secret=boxty.Secret.from_name("my-registry-secret")
)
```

Boxty pulls the image, configures its internal runner environment, and boots your functions within your custom container.
