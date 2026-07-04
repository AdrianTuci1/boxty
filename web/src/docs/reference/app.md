# boxty.App

```python
class App(object)
```

A Boxty App is a group of functions and classes that are deployed together.

The app serves at least three purposes:

- A unit of deployment for functions and classes.
- Syncing of identities of (primarily) functions and classes across processes (your local Python interpreter and every Boxty container active in your application).
- Manage log collection for everything that happens inside your code.

## Registering functions with an app

The most common way to explicitly register an Object with an app is through the `@app.function()` decorator. It both registers the annotated function itself and other passed objects, like schedules and secrets, with the app:

```python
import boxty

app = boxty.App()

@app.function(
    secrets=[boxty.Secret.from_name("some_secret")],
    schedule=boxty.Period(days=1),
)
def foo():
    pass
```

In this example, the secret and schedule are registered with the app.

```python
__init__(self, name=None, *, tags=None, image=None, secrets=[], volumes={},
    include_source=True)
```

Construct a new app, optionally with default image, mounts, secrets, or volumes.

### Parameters

- **name** `str | None` — Optional app name used for registration and lookup.
- **tags** `dict[str, str] | None` — Additional metadata to set on the App.
- **image** `_Image | None` — Default image for the App (otherwise defaults to `boxty.Image.debian_slim()`).
- **secrets** `Sequence[_Secret]` — Secrets to add for all Functions in the App. (Default is [])
- **volumes** `dict[str | PurePosixPath, _Volume]` — Volume mounts to use for all Functions. (Default is {})
- **include_source** `bool` — Default for whether Function source files are added to the Boxty container (per-function override possible). (Default is True)

### Usage

```python
image = boxty.Image.debian_slim().pip_install(...)
secret = boxty.Secret.from_name("my-secret")
volume = boxty.Volume.from_name("my-data")
app = boxty.App(image=image, secrets=[secret], volumes={"/mnt/data": volume})
```

## name

```python
name(self)
```

The user-provided name of the App.

### Returns

The configured app name, if any.

## app_id

```python
app_id(self)
```

Return the app_id of a running or stopped app.

### Returns

The app ID when the app has been deployed or run, otherwise None.

## description

```python
description(self)
```

The App's name, if available, or a fallback descriptive identifier.

### Returns

Human-readable description string for the app.

## lookup

```python
lookup(name, *, client=None, environment_name=None, create_if_missing=False)
```

Look up an App with a given name, creating a new App if necessary.

Note that Apps created through this method will be in a deployed state, but they will not have any associated Functions or Classes. This method is mainly useful for creating an App to associate with a Sandbox.

### Parameters

- **name** `str` — App name to resolve or create.
- **client** `_Client | None` — Boxty client to use; defaults to Client.from_env() when omitted.
- **environment_name** `str | None` — Optional environment name; defaults to the configured environment.
- **create_if_missing** `bool` — If True, create the app when it does not already exist. (Default is False)

### Returns

An App handle tied to the deployed app record.

### Usage

```python
app = boxty.App.lookup("my-app", create_if_missing=True)
boxty.Sandbox.create("echo", "hi", app=app)
```

## get_dashboard_url

```python
get_dashboard_url(self)
```

Get the dashboard URL for the App.

### Returns

The dashboard URL for the App.

### Usage

```python
app = boxty.App.lookup("my-app")
print(app.get_dashboard_url())
```

## run

```python
run(self, *, name=None, client=None, detach=False, interactive=False,
    environment_name=None)
```

Context manager that runs an ephemeral app on Boxty.

Use this as the main entry point for your Boxty application. All calls to Boxty Functions should be made within the scope of this context manager, and they will correspond to the current App.

Note that you should not invoke this in global scope of a file where you have Boxty Functions or Classes defined, since that would run the block when the Function or Cls is imported in your containers as well. If you want to run it as your entrypoint, consider protecting it with `if __name__ == "__main__"`.

### Parameters

- **client** `_Client | None` — Boxty client to use for the run session.
- **detach** `bool` — Whether to detach after starting the app. (Default is False)
- **interactive** `bool` — Whether to run in interactive mode. (Default is False)
- **environment_name** `str | None` — Optional environment name; defaults to the configured environment.

### Returns

Async context manager yielding this App while it is running.

### Usage

```python
with app.run():
    some_boxty_function.remote()
```

To enable output printing (i.e., to see App logs), use `boxty.enable_output()`:

```python
with boxty.enable_output():
    with app.run():
        some_boxty_function.remote()
```

Note that you should not invoke this in global scope of a file where you have Boxty Functions or Classes defined, since that would run the block when the Function or Cls is imported in your containers as well. If you want to run it as your entrypoint, consider protecting it:

```python
if __name__ == "__main__":
    with app.run():
        some_boxty_function.remote()
```

You can then run your script with:

```python
python app_module.py
```

## deploy

```python
deploy(self, *, name=None, environment_name=None, tag="", client=None,
    strategy="rolling")
```

Deploy the App so that it is available persistently.

Deployed Apps will be available for lookup or web-based invocations until they are stopped. Unlike with App.run, this method will return as soon as the deployment completes.

This method is a programmatic alternative to the boxty deploy CLI command.

Unlike with App.run, Function logs will not stream back to the local client after the App is deployed.

Note that you should not invoke this method in global scope, as that would redeploy the App every time the file is imported. If you want to write a programmatic deployment script, protect this call so that it only runs when the file is executed directly.

### Parameters

- **name** `str | None` — Name for the deployment, overriding any set on the App.
- **environment_name** `str | None` — Environment to deploy the App in.
- **tag** `str` — Optional metadata that is specific to this deployment. (Default is "")
- **client** `_Client | None` — Alternate client to use for communication with the server.
- **strategy** `str` — Deployment strategy. rolling (default) shifts traffic gradually to new containers while old ones drain. recreate terminates all running containers as part of the deployment before new work starts. (Default is "rolling")

### Returns

This app instance after deployment completes.

### Usage

```python
app = App("my-app")
app.deploy()
```

To enable output printing (i.e., to see build logs), use `boxty.enable_output()`:

```python
app = App("my-app")
with boxty.enable_output():
    app.deploy()
```

Unlike with App.run, Function logs will not stream back to the local client after the App is deployed.

Note that you should not invoke this method in global scope, as that would redeploy the App every time the file is imported. If you want to write a programmatic deployment script, protect this call so that it only runs when the file is executed directly. You can then run your script with:

```python
if __name__ == "__main__":
    with boxty.enable_output():
        app.deploy()
```

Then you can deploy your app with:

```python
python app_module.py
```

## local_entrypoint

```python
local_entrypoint(self, _warn_parentheses_missing=None, *, name=None)
```

Decorate a function to be used as a CLI entrypoint for a Boxty App.

These functions can be used to define code that runs locally to set up the app, and act as an entrypoint to start Boxty functions from. Note that regular Boxty functions can also be used as CLI entrypoints, but unlike local_entrypoint, those functions are executed remotely directly.

Note that an explicit app.run() is not needed, as an app is automatically created for you.

### Parameters

- **name** `str | None` — Optional name for the entrypoint; defaults to the function's qualified name.

### Returns

A decorator that registers the wrapped callable as a local CLI entrypoint.

### Usage

```python
@app.local_entrypoint()
def main():
    some_boxty_function.remote()
```

You can call the function using boxty run directly from the CLI:

```python
boxty run app_module.py
```

Note that an explicit app.run() is not needed, as an app is automatically created for you.

### Multiple entrypoints

If you have multiple local_entrypoint functions, qualify the name:

```python
boxty run app_module.py::app.some_other_function
```

### Parsing arguments

If your entrypoint function take arguments with primitive types, boxty run automatically parses them as CLI options. For example, the following function can be called with `boxty run app_module.py --foo 1 --bar "hello"`:

```python
@app.local_entrypoint()
def main(foo: int, bar: str):
    some_boxty_function.call(foo, bar)
```

Currently, str, int, float, bool, and datetime.datetime are supported. Use `boxty run app_module.py --help` for more information on usage.

## function

```python
function(self, *, image=None, schedule=None, env=None, secrets=None, gpu=None,
    serialized=False, network_file_systems={}, volumes={}, cpu=None,
    memory=None, ephemeral_disk=None, min_containers=None, max_containers=None,
    buffer_containers=None, scaledown_window=None, proxy=None, retries=None,
    timeout=300, startup_timeout=None, name=None, is_generator=None, cloud=None,
    region=None, routing_region=None, nonpreemptible=False,
    enable_memory_snapshot=False, block_network=False,
    restrict_boxty_access=False, single_use_containers=False, i6pn=None,
    include_source=None, experimental_options=None,
    _experimental_restrict_output=False, max_inputs=None)
```

Decorator to register a new Boxty Function with this App.

### Parameters

- **image** `_Image | None` — The image to run as the container for the function.
- **schedule** `Schedule | None` — An optional Boxty Schedule for the function.
- **env** `dict[str, str | None] | None` — Environment variables to set in the container.
- **secrets** `Collection[_Secret] | None` — Secrets to inject into the container as environment variables.
- **gpu** `str | list[str] | None` — GPU request; either a single GPU type or a list of types.
- **serialized** `bool` — Whether to send the function over using cloudpickle. (Default is False)
- **network_file_systems** `dict[str | PurePosixPath, _NetworkFileSystem]` — Mountpoints for Boxty NetworkFileSystems. (Default is {})
- **volumes** `dict[str | PurePosixPath, _Volume | _CloudBucketMount]` — Mount points for Boxty Volumes & CloudBucketMounts. (Default is {})
- **cpu** `float | tuple[float, float] | None` — Specify, in fractional CPU cores, how many CPU cores to request. Or, pass (request, limit) to additionally specify a hard limit in fractional CPU cores. CPU throttling will prevent a container from exceeding its specified limit.
- **memory** `int | tuple[int, int] | None` — Specify, in MiB, a memory request which is the minimum memory required. Or, pass (request, limit) to additionally specify a hard limit in MiB.
- **ephemeral_disk** `int | None` — Specify, in MiB, the ephemeral disk size for the Function.
- **min_containers** `int | None` — Minimum number of containers to keep warm, even when Function is idle.
- **max_containers** `int | None` — Limit on the number of containers that can be concurrently running.
- **buffer_containers** `int | None` — Number of additional idle containers to maintain under active load.
- **scaledown_window** `int | None` — Max time (in seconds) a container can remain idle while scaling down.
- **proxy** `_Proxy | None` — Reference to a Boxty Proxy to use in front of this function.
- **retries** `int | Retries | None` — Number of times to retry each input in case of failure.
- **timeout** `int` — Maximum execution time for inputs and startup time in seconds. (Default is 300)
- **startup_timeout** `int | None` — Maximum startup time in seconds with higher precedence than timeout.
- **name** `str | None` — Sets the Boxty name of the function within the app.
- **is_generator** `None | bool` — Set this to True if it's a non-generator function returning a sync or async generator object.
- **cloud** `str | None` — Cloud provider to run the function on. Possible values are aws, gcp, oci, auto.
- **region** `str | Sequence[str] | None` — Region or regions to run the function on.
- **routing_region** `str | None` — Region to route inputs to the function through.
- **nonpreemptible** `bool` — Whether to run the function on a nonpreemptible instance. (Default is False)
- **enable_memory_snapshot** `bool` — Enable memory checkpointing for faster cold starts. (Default is False)
- **block_network** `bool` — Whether to block network access. (Default is False)
- **restrict_boxty_access** `bool` — Whether to allow this function access to other Boxty resources. (Default is False)
- **single_use_containers** `bool` — When True, containers will shut down after handling a single input. (Default is False)
- **i6pn** `bool | None` — Whether to enable IPv6 container networking within the region.
- **include_source** `bool | None` — Whether the file or directory containing the Function's source should automatically be included in the container. When unset, falls back to the App-level configuration, or is otherwise True by default.
- **experimental_options** `dict[str, Any] | None` — Experimental options for the function.
- **_experimental_restrict_output** `bool` — Experimental; do not use pickle for return values. (Default is False)
- **max_inputs** `int | None` — Deprecated; replaced with single_use_containers.

### Returns

A decorator that registers the wrapped callable or partial as a Boxty Function.

## cls

```python
cls(self, *, image=None, env=None, secrets=None, gpu=None, serialized=False,
    network_file_systems={}, volumes={}, cpu=None, memory=None,
    ephemeral_disk=None, min_containers=None, max_containers=None,
    buffer_containers=None, scaledown_window=None, proxy=None, retries=None,
    timeout=300, startup_timeout=None, cloud=None, region=None,
    routing_region=None, nonpreemptible=False, enable_memory_snapshot=False,
    block_network=False, restrict_boxty_access=False,
    single_use_containers=False, i6pn=None, include_source=None,
    experimental_options=None, _experimental_restrict_output=False,
    max_inputs=None)
```

Decorator to register a new Boxty Cls with this App.

### Parameters

- **image** `_Image | None` — The image to run as the container for the class service.
- **env** `dict[str, str | None] | None` — Environment variables to set in the container.
- **secrets** `Collection[_Secret] | None` — Secrets to inject into the container as environment variables.
- **gpu** `str | list[str] | None` — GPU request; either a single GPU type or a list of types.
- **serialized** `bool` — Whether to send the class over using cloudpickle. (Default is False)
- **network_file_systems** `dict[str | PurePosixPath, _NetworkFileSystem]` — Mountpoints for Boxty NetworkFileSystems. (Default is {})
- **volumes** `dict[str | PurePosixPath, _Volume | _CloudBucketMount]` — Mount points for Boxty Volumes & CloudBucketMounts. (Default is {})
- **cpu** `float | tuple[float, float] | None` — Specify, in fractional CPU cores, how many CPU cores to request. Or, pass (request, limit) to additionally specify a hard limit in fractional CPU cores. CPU throttling will prevent a container from exceeding its specified limit.
- **memory** `int | tuple[int, int] | None` — Specify, in MiB, a memory request which is the minimum memory required. Or, pass (request, limit) to additionally specify a hard limit in MiB.
- **ephemeral_disk** `int | None` — Specify, in MiB, the ephemeral disk size for the Function.
- **min_containers** `int | None` — Minimum number of containers to keep warm, even when Function is idle.
- **max_containers** `int | None` — Limit on the number of containers that can be concurrently running.
- **buffer_containers** `int | None` — Number of additional idle containers to maintain under active load.
- **scaledown_window** `int | None` — Max time (in seconds) a container can remain idle while scaling down.
- **proxy** `_Proxy | None` — Reference to a Boxty Proxy to use in front of this function.
- **retries** `int | Retries | None` — Number of times to retry each input in case of failure.
- **timeout** `int` — Maximum execution time for inputs and startup time in seconds. (Default is 300)
- **startup_timeout** `int | None` — Maximum startup time in seconds with higher precedence than timeout.
- **cloud** `str | None` — Cloud provider to run the function on. Possible values are aws, gcp, oci, auto.
- **region** `str | Sequence[str] | None` — Region or regions to run the function on.
- **routing_region** `str | None` — Region to route inputs to the function through.
- **nonpreemptible** `bool` — Whether to run the function on a non-preemptible instance. (Default is False)
- **enable_memory_snapshot** `bool` — Enable memory checkpointing for faster cold starts. (Default is False)
- **block_network** `bool` — Whether to block network access. (Default is False)
- **restrict_boxty_access** `bool` — Whether to allow this class access to other Boxty resources. (Default is False)
- **single_use_containers** `bool` — When True, containers will shut down after handling a single input. (Default is False)
- **i6pn** `bool | None` — Whether to enable IPv6 container networking within the region.
- **include_source** `bool | None` — When False, don't automatically add the App source to the container.
- **experimental_options** `dict[str, Any] | None` — Experimental options for the class service.
- **_experimental_restrict_output** `bool` — Experimental; do not use pickle for return values. (Default is False)
- **max_inputs** `int | None` — Deprecated; replaced with single_use_containers.

### Returns

A decorator that registers the wrapped class or partial as a Boxty Cls.

## server

```python
server(self, *, image=None, env=None, secrets=None, gpu=None, serialized=False,
    volumes={}, cpu=None, memory=None, ephemeral_disk=None,
    target_concurrency=None, min_containers=None, max_containers=None,
    buffer_containers=None, scaleup_window=None, scaledown_window=None,
    startup_timeout=30, port=8000, unauthenticated=False, h2_enabled=False,
    exit_grace_period=0, routing_region="us-east", compute_region=None,
    cloud=None, nonpreemptible=False, proxy=None, i6pn=None,
    enable_memory_snapshot=False, include_source=None,
    experimental_options=None)
```

Decorator to register a new Boxty Server with this App.

Servers run HTTP servers that are started in a `@boxty.enter()` method. Unlike `@app.cls()`, servers only expose HTTP endpoints and do not support .remote() method calls.

See the guide for more information.

### Parameters

- **image** `_Image | None` — The image to run as the container for the server.
- **env** `dict[str, str | None] | None` — Environment variables to set in the container.
- **secrets** `Collection[_Secret] | None` — Secrets to inject into the container as environment variables.
- **gpu** `str | list[str] | None` — GPU request; either a single GPU type or a list of types.
- **serialized** `bool` — Whether to send the server class over using cloudpickle. (Default is False)
- **volumes** `dict[ str | PurePosixPath, _Volume | _CloudBucketMount ]` — Mount points for Boxty Volumes & CloudBucketMounts. (Default is {})
- **cpu** `float | tuple[float, float] | None` — Specify, in fractional CPU cores, how many CPU cores to request. Or, pass (request, limit) to additionally specify a hard limit in fractional CPU cores. CPU throttling will prevent a container from exceeding its specified limit.
- **memory** `int | tuple[int, int] | None` — Specify, in MiB, a memory request which is the minimum memory required. Or, pass (request, limit) to additionally specify a hard limit in MiB.
- **ephemeral_disk** `int | None` — Specify, in MiB, the ephemeral disk size for the server.
- **target_concurrency** `int | None` — Target concurrency for the server; 0 disables autoscaling.
- **min_containers** `int | None` — Minimum number of containers to keep running regardless of demand.
- **max_containers** `int | None` — Limit on the number of containers that can be concurrently running.
- **buffer_containers** `int | None` — Extra containers to scale up beyond current demand.
- **scaleup_window** `int | None` — Seconds of sustained demand required before scaling up new containers.
- **scaledown_window** `int | None` — Maximum duration (in seconds) idle containers wait before scaling down.
- **startup_timeout** `int` — Maximum container startup time in seconds. (Default is 30)
- **port** `int` — Port the HTTP server listens on. (Default is 8000)
- **unauthenticated** `bool` — Whether the endpoint requires proxy authentication; required by default. (Default is False)
- **h2_enabled** `bool` — Enable HTTP/2. (Default is False)
- **exit_grace_period** `int` — Grace period for in-flight requests on shutdown. (Default is 0)
- **routing_region** `str` — Region to route Server requests through. (Default is "us-east")
- **compute_region** `str | Sequence[str] | None` — Region(s) where containers can be scheduled.
- **cloud** `str | None` — Cloud provider (aws, gcp, oci, auto).
- **nonpreemptible** `bool` — Whether to use non-preemptible instances. (Default is False)
- **proxy** `_Proxy | None` — Boxty Proxy to use in front of this server.
- **i6pn** `bool | None` — Enable IPv6 container networking.
- **enable_memory_snapshot** `bool` — Enable memory checkpointing. (Default is False)
- **include_source** `bool | None` — Whether to add source to container.
- **experimental_options** `dict[str, Any] | None` — Experimental options.

### Usage

```python
@app.server(port=8000, routing_region="us-east")
class MyServer:
    @boxty.enter()
    def start(self):
        self.proc = subprocess.Popen(["python3", "-m", "http.server", "8000"])

    @boxty.exit()
    def stop(self):
        self.proc.terminate()
```

## include

```python
include(self, /, other_app, inherit_tags=True)
```

Include another App's objects in this one.

Useful for splitting up Boxty Apps across different self-contained files.

When inherit_tags=True any tags set on the other App will be inherited by this App (with this App's tags taking precedence in the case of conflicts).

### Parameters

- **other_app** `"_App"` — App whose registered functions and classes are merged into this app.
- **inherit_tags** `bool` — If True, merge tags from other_app into this app (this app wins on conflicts). (Default is True)

### Returns

This app instance for chaining.

### Usage

```python
app_a = boxty.App("a")
@app_a.function()
def foo():
    ...

app_b = boxty.App("b")
@app_b.function()
def bar():
    ...

app_a.include(app_b)

@app_a.local_entrypoint()
def main():
    # use function declared on the included app
    bar.remote()
```

## set_tags

```python
set_tags(self, tags, *, client=None)
```

Attach key-value metadata to the App.

Tag metadata can be used to add organization-specific context to the App and can be included in billing reports and other informational APIs. Tags can also be set in the App constructor.

Any tags set on the App before calling this method will be removed if they are not included in the argument (i.e., this method does not have .update() semantics).

### Parameters

- **tags** `Mapping[str, str]` — Complete tag set to store on the app (replaces previous tags).
- **client** `_Client | None` — Boxty client to use for the RPC.

## get_tags

```python
get_tags(self, *, client=None)
```

Get the tags that are currently attached to the App.

### Parameters

- **client** `_Client | None` — Boxty client to use for the RPC.

### Returns

Tags as a map from key to value.
