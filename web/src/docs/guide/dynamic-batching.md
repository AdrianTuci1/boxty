# Dynamic batching

Dynamic batching automatically groups individual inference requests into batched inputs to maximize GPU utilization.

## Enable dynamic batching with @batched

Use the `@batched` decorator to enable dynamic batching on your Boxty Functions:

```python
import boxty

app = boxty.App()

@app.function(gpu="a100")
@batched(max_batch_size=16, wait_ms=10)
def predict(inputs: list[str]) -> list[str]:
    # Process a batch of inputs
    return [model(inp) for inp in inputs]
```

Dynamic batching is particularly effective for GPU inference workloads where individual requests are too small to saturate the GPU.
