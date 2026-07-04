# File access

Boxty Sandboxes provide controlled file system access.

## Filesystem API

Sandboxes expose a filesystem API for reading and writing files:

```python
import boxty

app = boxty.App()

@app.function()
def sandbox_file_access():
    # Write to sandbox filesystem
    with open("/sandbox/output.txt", "w") as f:
        f.write("Hello from sandbox!")
    
    # Read from sandbox filesystem
    with open("/sandbox/output.txt", "r") as f:
        return f.read()
```

Sandbox files are isolated and do not persist between invocations unless written to a Volume.
