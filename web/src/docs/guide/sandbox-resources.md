# Pricing and resources

Boxty Sandboxes are billed based on usage.

## Pay for what you use

Sandbox resources are billed per second of execution time:

- CPU: $0.0001 per core-second
- Memory: $0.00001 per MB-second
- GPU: Variable by type

You only pay for the resources your Sandbox actually uses during execution.

Configure resource limits to control costs:

```python
@app.function(
    sandbox=True,
    cpu=2,
    memory=4096,
    timeout=300
)
def limited_sandbox():
    ...
```
