# boxty.Server

```python
class Server(object)
```

Server runs an HTTP server started in an @boxty.enter method.

See the guide for more information.

Generally, you will not construct a Server directly. Instead, use the @app.server() decorator.

```python
@app.server(port=8080, routing_region="us-east")
class MyServer:
    @boxty.enter()
    def start_server(self):
        self.process = subprocess.Popen(["python3", "-m", "http.server", "8080"])
```

## object_id

```python
object_id(self)
```

Boxty's internal ID for this Server instance.

## get_url

```python
get_url(self)
```

The URL for making requests to this Server.

## update_autoscaler

```python
update_autoscaler(self, *, target_concurrency=None, min_containers=None,
    max_containers=None, buffer_containers=None, scaleup_window=None,
    scaledown_window=None)
```

Override the current autoscaler behavior for this Server.

Unspecified parameters will retain their current value, i.e. either the static value from the @app.server() decorator, or an override value from a previous call to this method.

Subsequent deployments of the App containing this Server will reset the autoscaler back to its static configuration.

### Parameters

- `target_concurrency` (int | None): Target number of concurrent requests per container.
- `min_containers` (int | None): Minimum number of containers to keep running regardless of demand.
- `max_containers` (int | None): Limit on the number of containers that can be concurrently running.
- `buffer_containers` (int | None): Extra containers to scale up beyond current demand.
- `scaleup_window` (int | None): Seconds of sustained demand required before scaling up new containers.
- `scaledown_window` (int | None): Maximum duration (in seconds) idle containers wait before scaling down.

### Usage

```python
server = boxty.Server.from_name("my-app", "Server")

# Always have at least 2 containers running, with an extra buffer of 2 containers
server.update_autoscaler(min_containers=2, buffer_containers=1)

# Limit this Server to avoid spinning up more than 5 containers
server.update_autoscaler(max_containers=5)

# Require 30 seconds of sustained demand before scaling up
server.update_autoscaler(scaleup_window=30)

# Adjust Server autoscaling to target 20 concurrent requests per replica
server.update_autoscaler(target_concurrency=20)

# Disable the Server autoscaling by setting target_concurrency to 0
server.update_autoscaler(target_concurrency=0)
```

## hydrate

```python
hydrate(self, client=None)
```

Synchronize the local object with its identity on the Boxty server.

It is rarely necessary to call this method explicitly, as most operations will lazily hydrate when needed.

## from_name

```python
from_name(cls, app_name, name, *, environment_name=None, client=None)
```

Reference a Server from a deployed App by its name.

This is a lazy method that defers hydrating the local object with metadata from Boxty servers until the first time it is actually used.
