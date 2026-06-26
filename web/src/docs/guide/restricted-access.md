# Running untrusted code in Functions

Boxty provides sandboxing for running untrusted code safely.

## Create a Restricted Function

Use restricted Functions to run untrusted code with limited permissions:

```python
import boxty

app = boxty.App()

@app.function(restricted=True)
def untrusted_code(user_code: str):
    # Runs in a restricted sandbox
    exec(user_code)
```

Restricted Functions have limited access to:

- Network
- File system
- Environment variables
- Other Functions

Use this feature for running user-submitted code safely.
