# boxty.fastapi_endpoint

```python
fastapi_endpoint(*, method="GET", label=None, custom_domains=None, docs=False,
    requires_proxy_auth=False)
```

Create a Web Function that can be addressed via HTTP at a public URL.

Boxty will internally use FastAPI to expose a simple, single request handler. If you are defining your own FastAPI application (e.g. if you want to define multiple routes), use @boxty.asgi_app instead.

The Web Function created with this decorator will automatically have CORS enabled and can leverage many of FastAPI's features.

For more information on using Boxty with popular web frameworks, see our guide on Web Functions.

Added in v0.73.82: This function replaces the deprecated @web_endpoint decorator.
