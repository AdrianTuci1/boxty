# Modal Sandboxes

Boxty Sandboxes provide isolated execution environments for untrusted code.

## What are Sandboxes and why should I use them?

Sandboxes are isolated containers with restricted access to:

- Network
- File system
- System resources
- Other Functions

Use Sandboxes for:

- Running user-submitted code
- Executing untrusted scripts
- Security-sensitive workloads
- Compliance requirements

## Lifecycle

Sandboxes have a defined lifecycle:

1. **Create**: Sandbox is provisioned
2. **Run**: Code executes in the sandbox
3. **Destroy**: Sandbox is cleaned up

```python
import boxty

app = boxty.App()

@app.function(sandbox=True)
def run_untrusted(code: str):
    # Code runs in an isolated sandbox
    exec(code)
```
