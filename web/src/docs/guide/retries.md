# Failures and retries

Boxty automatically retries failed Functions to recover from transient errors.

## Automatically recover from flakes with retries

Configure retry behavior for your Functions:

```python
import boxty

app = boxty.App()

@app.function(retries=3)
def flaky_function():
    # Will be retried up to 3 times on failure
    ...
```

You can also configure retry delays and backoff strategies:

```python
@app.function(
    retries=boxty.Retries(
        max_retries=5,
        initial_delay=1.0,
        backoff_multiplier=2.0,
        max_delay=60.0
    )
)
def carefully_retried_function():
    ...
```

Boxty distinguishes between retriable errors (network, transient) and non-retriable errors (code bugs, invalid input).
