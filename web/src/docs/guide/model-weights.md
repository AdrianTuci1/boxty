# Storing model weights

Boxty provides efficient storage for machine learning model weights.

## Storing weights in a Boxty Volume

Use Boxty Volumes to store and share model weights across Functions:

```python
import boxty

app = boxty.App()
volume = boxty.Volume.from_name("model-weights", create_if_missing=True)

@app.function(volumes={"/models": volume})
def load_model():
    import torch
    model = torch.load("/models/my-model.pt")
    return model

@app.function(volumes={"/models": volume})
def save_model():
    import torch
    torch.save(model.state_dict(), "/models/my-model.pt")
```

Volumes provide fast, persistent storage that is shared across all Functions in your App.
