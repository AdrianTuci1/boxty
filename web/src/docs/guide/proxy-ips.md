# Proxies (Beta)

Boxty Proxies provide static IP addresses for outbound connections.

## Creating a Proxy

Create a proxy to get a static IP for your Functions:

```python
import boxty

app = boxty.App()
proxy = boxty.Proxy.from_name("my-proxy", create_if_missing=True)

@app.function(proxy=proxy)
def external_api_call():
    # All outbound connections use the proxy's static IP
    import requests
    return requests.get("https://api.example.com")
```

## Using a Proxy

Proxies are useful for:

- Whitelisting IP addresses with external services
- Maintaining consistent IP across function invocations
- Complying with security requirements

Contact Boxty support to enable Proxies for your workspace.
