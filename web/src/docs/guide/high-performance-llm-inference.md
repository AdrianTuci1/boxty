# High-performance LLM inference

Boxty is optimized for high-throughput, low-latency LLM inference.

## Achieving high throughput LLM inference (TPS)

To maximize tokens per second (TPS) for LLM inference on Boxty:

1. **Use appropriate GPU**: A100 or H100 for large models, A10G for smaller ones
2. **Enable dynamic batching**: Use `@batched` to batch requests automatically
3. **Optimize model serving**: Use vLLM, TGI, or TensorRT-LLM for efficient serving
4. **Use fast container images**: Pre-install all dependencies to minimize cold starts
5. **Configure input concurrency**: Allow multiple concurrent requests per container
6. **Use volumes for model weights**: Load models from Boxty Volumes for fast access

Example configuration:

```python
import boxty

app = boxty.App()

@app.function(gpu="a100", concurrency=10)
@batched(max_batch_size=16, wait_ms=5)
def llm_inference(requests: list[str]) -> list[str]:
    # Use vLLM or similar for efficient batching
    return model.generate(requests)
```
