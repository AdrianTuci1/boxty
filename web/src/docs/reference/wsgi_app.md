# boxty.wsgi_app

```python
wsgi_app(*, label=None, custom_domains=None, requires_proxy_auth=False)
```

Decorator for registering a WSGI app with a Boxty function.

Web Server Gateway Interface (WSGI) is a standard for synchronous Python web apps. It has been succeeded by the ASGI interface which is compatible with ASGI and supports additional functionality such as web sockets. Boxty supports ASGI via asgi_app.

To learn how to use this decorator with popular web frameworks, see the guide on Web Functions.

## Usage

```python
from typing import Callable

@app.function()
@boxty.wsgi_app()
def create_wsgi() -> Callable:
    ...
```
