# Managing deployments

Boxty provides tools for managing the lifecycle of your deployments.

## Creating deployments

Deploy an App using the CLI:

```bash
boxty deploy my_app.py
```

Or programmatically:

```python
import boxty

app = boxty.App()

@app.function()
def my_function():
    ...

if __name__ == "__main__":
    app.deploy()
```

Boxty automatically provisions infrastructure, builds containers, and starts your Functions.

You can view all deployments in the Boxty dashboard and manage them from there.
