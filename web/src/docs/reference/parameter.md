# boxty.parameter

```python
parameter(*, default=_no_default, init=True)
```

Used to specify options for boxty.cls parameters, similar to dataclass.field for dataclasses

```python
class A:
    a: str = boxty.parameter()
```

If init=False is specified, the field is not considered a parameter for the Boxty class and not used in the synthesized constructor. This can be used to optionally annotate the type of a field that's used internally, for example values being set by @enter lifecycle methods, without breaking type checkers, but it has no runtime effect on the class.
