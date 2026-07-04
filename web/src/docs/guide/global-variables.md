# Global variables

Boxty provides special global variables for sharing state across function invocations.

## Warning about regular module globals

Regular Python module globals are not shared between function invocations in Boxty. Each container has its own isolated memory space.

To share state between invocations, use Boxty Dicts, Queues, or Volumes. For in-memory caching within a single container, use container-local variables initialized in the module scope.

```python
import boxty

app = boxty.App()

# This cache is per-container, not global
cache = {}

@app.function()
def cached_function(x):
    if x not in cache:
        cache[x] = expensive_computation(x)
    return cache[x]
```
