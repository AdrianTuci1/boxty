# boxty.enable_output

```python
enable_output()
```

Context manager that enable output when using the Python SDK.

This will print to stdout and stderr things such as

- Logs from running functions
- Status of creating objects
- Map progress

## Usage

```python
app = boxty.App()
with boxty.enable_output():
    with app.run():
        ...
```
