# Configuring CPU, memory, and disk

Boxty lets you configure the resources allocated to your Functions.

## CPU cores

Request CPU cores for your Functions:

```python
@app.function(cpu=4)
def multi_core_function():
    ...
```

## Memory

Request memory (in MB) for your Functions:

```python
@app.function(memory=8192)
def high_memory_function():
    ...
```

You can also specify memory as a string:

```python
@app.function(memory="16Gi")
def high_memory_function():
    ...
```

Boxty automatically provisions the requested resources and bills you only for what you use.
