# File and project structure

Boxty supports flexible project structures for organizing your code.

## Apps spanning multiple files

You can define Boxty Apps across multiple files:

```python
# main.py
import boxty
from helpers import helper_function

app = boxty.App()

@app.function()
def main_function():
    return helper_function()
```

```python
# helpers.py
def helper_function():
    return "Hello from helper!"
```

Boxty automatically discovers and includes all referenced files.

## Defining your project as a Python package

For larger projects, define your Boxty App as a Python package:

```
my_project/
  __init__.py
  app.py
  functions/
    __init__.py
    inference.py
    training.py
```

Deploy with:

```bash
boxty deploy my_project.app
```
