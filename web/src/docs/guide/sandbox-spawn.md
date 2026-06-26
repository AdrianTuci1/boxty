# Running commands

Boxty Sandboxes support running arbitrary commands.

## Input

Pass input to Sandbox commands:

```python
import boxty

app = boxty.App()

@app.function()
def run_command():
    result = boxty.sandbox.run(
        "python",
        "-c",
        "print('Hello from sandbox!')"
    )
    return result.stdout
```

## Output

Capture output from Sandbox commands:

```python
@app.function()
def capture_output():
    result = boxty.sandbox.run("ls", "-la")
    return {
        "stdout": result.stdout,
        "stderr": result.stderr,
        "returncode": result.returncode
    }
```
