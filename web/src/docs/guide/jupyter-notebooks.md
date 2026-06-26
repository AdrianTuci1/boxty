# Jupyter notebooks

Boxty integrates with Jupyter notebooks for interactive development and experimentation.

## Boxty inside Jupyter

You can use Boxty from within a Jupyter notebook to run functions remotely:

```python
import boxty

app = boxty.App()

@app.function(gpu="a100")
def train_model():
    ...

# Run from the notebook
result = train_model.remote()
```

## Jupyter inside Boxty

You can also run Jupyter notebooks inside Boxty containers for interactive debugging:

```bash
boxty run --interactive my_notebook.ipynb
```

This opens a Jupyter server inside a Boxty container, giving you access to GPU and other resources.
