# boxty.current_input_id

```python
current_input_id()
```

Returns the input ID for the current input.

Can only be called from Boxty function (i.e. in a container context).

```python
from boxty import current_input_id

@app.function()
def process_stuff():
    print(f"Starting to process {current_input_id()}")
```
