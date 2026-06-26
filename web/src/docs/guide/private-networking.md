# Networking and security

Boxty provides secure networking options for your applications.

## Private networking

Boxty supports private networking for secure communication between Functions:

```python
import boxty

app = boxty.App()

@app.function(network=boxty.Network.PRIVATE)
def secure_function():
    ...
```

## Region boundaries

Functions in the same region can communicate with lower latency. Boxty automatically optimizes data locality within regions.

Configure region preferences in your App settings.
