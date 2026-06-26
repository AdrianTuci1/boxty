# Passing local data

Boxty provides several ways to pass local data to remote Functions.

## Passing function arguments

Function arguments are automatically serialized and sent to the remote container:

```python
import boxty

app = boxty.App()

@app.function()
def process_data(data: list[int]) -> int:
    return sum(data)

@app.local_entrypoint()
def main():
    result = process_data.remote([1, 2, 3, 4, 5])
    print(result)  # => 15
```

## Including local files

You can include local files in your container using the `mounts` parameter:

```python
@app.function(mounts=[boxty.Mount.from_local_dir("./data", remote_path="/data")])
def process_files():
    import os
    return os.listdir("/data")
```

Boxty automatically syncs local files to the remote container before execution.
