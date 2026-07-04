# boxty.method

```python
method(*, is_generator=None)
```

Decorator for methods that should be transformed into a Boxty Function registered against this class's App.

## Usage

```python
@app.cls(cpu=8)
class MyCls:

    @boxty.method()
    def f(self):
        ...
```
