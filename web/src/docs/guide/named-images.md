# Named images

Named images allow you to persist and share pre-built images across different apps or teams.

## Publishing an Image from a script

You can register a built image under a specific name:

```python
import boxty

# Build and register the image
image = boxty.Image.debian_slim().pip_install("transformers")
image.persist("my-shared-transformers-image")
```

Other apps can then reference this image by name, avoiding rebuilds:

```python
image = boxty.Image.from_name("my-shared-transformers-image")
```

Named images are shared across your workspace and can be used by any App.
