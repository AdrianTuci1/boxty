# boxty.Proxy

```python
class Proxy(boxty.object.Object)
```

Proxy objects give your Boxty containers a static outbound IP address.

This can be used for connecting to a remote address with network whitelist, for example a database. See the guide for more information.

## hydrate

```python
hydrate(self, client=None)
```

Synchronize the local object with its identity on the Boxty server.

It is rarely necessary to call this method explicitly, as most operations will lazily hydrate when needed. The main use case is when you need to access object metadata, such as its ID.

Added in v0.72.39: This method replaces the deprecated `.resolve()` method.

## from_name

```python
from_name(name, *, environment_name=None, client=None)
```

Reference a Proxy by its name.

In contrast to most other Boxty objects, new Proxy objects must be provisioned via the Dashboard and cannot be created on the fly from code.

### Parameters

- `name` (str): Name of the Proxy in the target environment.
- `environment_name` (str | None): Environment to resolve the name in; defaults to the active environment.
- `client` (_Client | None): Boxty client to use for loading; defaults to Client.from_env() when omitted.

### Returns

A lazy Proxy handle.