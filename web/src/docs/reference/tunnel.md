# boxty.Tunnel

```python
class Tunnel(object)
```

A port forwarded from within a running Boxty container. Created by boxty.forward().

Important: This is an experimental API which may change in the future.

## __init__

```python
__init__(self, host, port, unencrypted_host, unencrypted_port)
```

## url

```python
url(self)
```

Get the public HTTPS URL of the forwarded port.

## tls_socket

```python
tls_socket(self)
```

Get the public TLS socket as a (host, port) tuple.

## tcp_socket

```python
tcp_socket(self)
```

Get the public TCP socket as a (host, port) tuple.
