# Benchmark an endpoint

Boxty provides built-in tools for benchmarking your endpoints.

## Workload patterns

Boxty supports various workload patterns for benchmarking:

- **Constant load**: Fixed number of concurrent requests
- **Ramp up**: Gradually increasing load
- **Spike**: Sudden burst of traffic
- **Custom**: Define your own load pattern

## Endpoint preview benchmarks

Before deploying, you can preview expected performance:

```python
import boxty

app = boxty.App()

@app.function()
@boxty.benchmark(duration=60, concurrency=10)
def benchmark_endpoint():
    ...
```
