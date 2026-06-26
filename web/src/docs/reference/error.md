# boxty.Error

```python
class Error(Exception)
```

Base class for all Boxty errors. See [boxty.exception](exception.md) for the specialized error classes.

## Usage

```python
import boxty

try:
    ...
except boxty.Error:
    # Catch any exception raised by Boxty's systems.
    print("Responding to error...")
```