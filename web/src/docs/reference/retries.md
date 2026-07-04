# boxty.Retries

```python
class Retries(object)
```

Adds a retry policy to a Boxty function.

## Usage

```python
import boxty
app = boxty.App()

# Basic configuration.
# This sets a policy of max 4 retries with 1-second delay between failures.
@app.function(retries=4)
def f():
    pass


# Fixed-interval retries with 3-second delay between failures.
@app.function(
    retries=boxty.Retries(
        max_retries=2,
        backoff_coefficient=1.0,
        initial_delay=3.0,
    )
)
def g():
    pass


# Exponential backoff, with retry delay doubling after each failure.
@app.function(
    retries=boxty.Retries(
        max_retries=4,
        backoff_coefficient=2.0,
        initial_delay=1.0,
    )
)
def h():
    pass
```

## __init__

```python
__init__(self, *, max_retries, backoff_coefficient=2.0, initial_delay=1.0,
    max_delay=60.0)
```

Construct a new retries policy, supporting exponential and fixed-interval delays via a backoff coefficient.

### Parameters

- `max_retries` (int): Maximum number of retries after failures.
- `backoff_coefficient` (float): Multiplier applied to the delay after each attempt; 1.0 means fixed delay. (Default is 2.0)
- `initial_delay` (float): Seconds before the first retry. (Default is 1.0)
- `max_delay` (float): Upper cap on the delay between retries (seconds). (Default is 60.0)
