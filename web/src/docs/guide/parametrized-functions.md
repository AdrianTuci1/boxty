# Parametrized functions

Boxty supports parametrized functions for creating reusable function templates.

## Function calls for each unique combination

Parametrized functions allow you to create functions that are instantiated with different parameters:

```python
import boxty

app = boxty.App()

@app.function()
@boxty.parameterized({"model": ["gpt-4", "gpt-3.5"]})
def generate_text(model: str, prompt: str) -> str:
    # This creates two functions: one for gpt-4 and one for gpt-3.5
    ...
```

Each unique combination of parameters creates a separate function instance.
