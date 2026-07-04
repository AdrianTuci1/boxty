# boxty.Function

```python
class Function(typing.Generic, boxty.object.Object)
```

Functions are the basic units of serverless execution on Boxty.

Generally, you will not construct a Function directly. Instead, use the `App.function()` decorator to register your Python functions with your App.

## hydrate

```python
hydrate(self, client=None)
```

Synchronize the local object with its identity on the Boxty server.

It is rarely necessary to call this method explicitly, as most operations will lazily hydrate when needed. The main use case is when you need to access object metadata, such as its ID.

Added in v0.72.39: This method replaces the deprecated `.resolve()` method.

## update_autoscaler

```python
update_autoscaler(self, *, min_containers=None, max_containers=None,
    buffer_containers=None, scaledown_window=None)
```

Override the current autoscaler behavior for this Function.

Unspecified parameters will retain their current value, i.e. either the static value from the function decorator, or an override value from a previous call to this method.

Subsequent deployments of the App containing this Function will reset the autoscaler back to its static configuration.

### Parameters

- `min_containers` (int | None): Minimum number of containers to keep running.
- `max_containers` (int | None): Maximum concurrent containers.
- `buffer_containers` (int | None): Extra containers to keep warm beyond current demand.
- `scaledown_window` (int | None): Maximum duration (in seconds) idle containers wait before scaling down.

### Usage

```python
f = boxty.Function.from_name("my-app", "function")

# Always have at least 2 containers running, with an extra buffer when the Function is active
f.update_autoscaler(min_containers=2, buffer_containers=1)

# Limit this Function to avoid spinning up more than 5 containers
f.update_autoscaler(max_containers=5)

# Extend the scaledown window to increase the amount of time that idle containers stay alive
f.update_autoscaler(scaledown_window=300)
```

## from_name

```python
from_name(cls, app_name, name, *, version=None, environment_name=None,
    client=None)
```

Reference a Function from a deployed App by its name.

This is a lazy method that defers hydrating the local object with metadata from Boxty servers until the first time it is actually used.

### Parameters

- `app_name` (str): Name of the deployed App.
- `name` (str): Name of the Function within that App. For class methods, use Cls.from_name instead.
- `environment_name` (str | None): Environment to look up the App in; defaults to the active environment.
- `client` (_Client | None): Boxty client to use; defaults to Client.from_env() when omitted.

### Returns

A lazy Function handle.

### Usage

```python
f = boxty.Function.from_name("other-app", "function")
```

The version parameter allows you to invoke a version-pinned function:

```python
f_v3 = boxty.Function.from_name("other-app", "function", version=3)
```

## get_web_url

```python
get_web_url(self)
```

URL for addressing a Web Function via HTTP.

### Returns

The HTTPS URL for the web endpoint, or None if this Function is not a web endpoint.

## with_options

```python
with_options(self, *, cpu=None, memory=None, gpu=None, env=None, secrets=None,
    volumes={}, retries=None, max_containers=None, buffer_containers=None,
    scaledown_window=None, timeout=None, region=None, cloud=None)
```

Dynamically override the static Function configuration with invocation-specific values.

This method returns a new Function instance with the dynamic configuration. Invocations of the new Function will run in a distinct container pool and autoscale independently from the base Function (and from other dynamic configurations).

Note that options cannot be "unset" with this method (i.e., if a GPU is configured in the `@app.cls()` decorator, passing gpu=None here will not create a CPU-only instance). Additionally, container arguments like volumes and secrets will replace the base configuration or any previous use of this method rather than extending it.

### Usage

You can use this method after looking up a deployed Function:

```python
fn = boxty.Function.from_name("my_app", "fn").with_options(gpu="H100")
fn.remote()  # will run on a H100 GPU
```

Or by referencing another Function defined in the same App:

```python
@app.function()
def fn():
    ...

# From a local entrypoint or another Function
fn.with_options(gpu="H100").remote()  # Uses an H100 GPU
fn.remote()  # Uses the static configuration with no GPU
```

## with_concurrency

```python
with_concurrency(self, *, max_inputs, target_inputs=None)
```

Override the static Function configuration with invocation-specific input concurrency.

Returns a new Function instance that is dynamically configured to behave like a Function using the `@boxty.concurrent` decorator. This instance will autoscale independently from the base Function.

## with_batching

```python
with_batching(self, *, max_batch_size, wait_ms)
```

Override the static Function configuration with invocation-specific dynamic batching.

Returns a new Function instance that is dynamically configured to behave like a Function using the `@boxty.batched` decorator. This instance will autoscale independently from the base Function.

## remote

```python
remote(self, *args, **kwargs)
```

Calls the function remotely, executing it with the given arguments and returning the execution's result.

### Parameters

- `*args` (P.args): Positional arguments forwarded to the deployed function.
- `**kwargs` (P.kwargs): Keyword arguments forwarded to the deployed function.

### Returns

The value returned by the remote function.

## remote_gen

```python
remote_gen(self, *args, **kwargs)
```

Calls the generator remotely, executing it with the given arguments.

### Parameters

- `*args`: Positional arguments forwarded to the deployed generator function.
- `**kwargs`: Keyword arguments forwarded to the deployed generator function.

### Returns

Values produced by the remote generator.

## local

```python
local(self, *args, **kwargs)
```

Calls the function locally, executing it with the given arguments and returning the execution's result.

The function will execute in the same environment as the caller, just like calling the underlying function directly in Python. In particular, only secrets available in the caller environment will be available through environment variables.

### Parameters

- `*args` (P.args): Positional arguments passed to the underlying Python callable.
- `**kwargs` (P.kwargs): Keyword arguments passed to the underlying Python callable.

### Returns

The return value of the local call (or a coroutine for async functions).

## spawn

```python
spawn(self, *args, **kwargs)
```

Calls the function with the given arguments, without waiting for the results.

Conceptually similar to `multiprocessing.pool.apply_async`, or a Future/Promise in other contexts.

### Parameters

- `*args` (P.args): Positional arguments forwarded to the remote function.
- `**kwargs` (P.kwargs): Keyword arguments forwarded to the remote function.

### Returns

A [boxty.FunctionCall](functioncall.md) object that can later be polled or waited for using `.get(timeout=...)`.

## get_raw_f

```python
get_raw_f(self)
```

Return the inner Python object wrapped by this Boxty Function.

### Returns

The original function object registered with Boxty.

## get_current_stats

```python
get_current_stats(self)
```

Return a FunctionStats object describing the current function's queue and runner counts.

### Returns

Snapshot counts for backlog, runners, and running inputs.

## map

```python
map(self, *input_iterators, kwargs={}, order_outputs=True,
    return_exceptions=False, wrap_returned_exceptions=None)
```

Parallel map over a set of inputs.

Pass one iterable per positional argument of the underlying function. Results are yielded as an iterable (sync) or async iterator (map.aio).

If applied to an `@app.function`, `map()` returns one result per input and output order matches input order by default. Set `order_outputs=False` to emit results in completion order.

`return_exceptions` can aggregate failures into the result stream instead of raising.

### Parameters

- `*input_iterators` (typing.Iterable[Any]): One iterator per mapped positional parameter on the function.
- `kwargs`: Extra keyword arguments forwarded to every invocation. (Default is `{}`)
- `order_outputs` (bool): If True, preserve input order in outputs; if False, use completion order. (Default is True)
- `return_exceptions` (bool): If True, failed inputs appear as exceptions in the result stream instead of raising. (Default is False)
- `wrap_returned_exceptions` (bool | None): Deprecated; no longer has any effect.

### Usage

```python
@app.function()
def my_func(a):
    return a ** 2


@app.local_entrypoint()
def main():
    assert list(my_func.map([1, 2, 3, 4])) == [1, 4, 9, 16]
```

```python
@app.function()
def my_func(a):
    if a == 2:
        raise Exception("ohno")
    return a ** 2


@app.local_entrypoint()
def main():
    print(list(my_func.map(range(3), return_exceptions=True)))
```

## starmap

```python
starmap(self, input_iterator, *, kwargs={}, order_outputs=True,
    return_exceptions=False, wrap_returned_exceptions=None)
```

Like map, but each input item is unpacked into multiple positional arguments.

Every element of `input_iterator` should be a sequence (for example a tuple) with length equal to the arity of the function.

### Parameters

- `input_iterator` (typing.Iterable[typing.Sequence[Any]]): Iterable of argument tuples to unpack into each call.
- `kwargs`: Extra keyword arguments forwarded to every invocation. (Default is `{}`)
- `order_outputs` (bool): If True, preserve input order in outputs; if False, use completion order. (Default is True)
- `return_exceptions` (bool): If True, failed inputs appear as exceptions in the result stream instead of raising. (Default is False)
- `wrap_returned_exceptions` (bool | None): Deprecated; no longer has any effect.

### Usage

```python
@app.function()
def my_func(a, b):
    return a + b


@app.local_entrypoint()
def main():
    assert list(my_func.starmap([(1, 2), (3, 4)])) == [3, 7]
```

## for_each

```python
for_each(self, *input_iterators, kwargs={}, ignore_exceptions=False)
```

Execute the function for all inputs and wait for completion, discarding return values.

Like `.map()` but you do not need to iterate the result to drive work—Boxty processes every input.

### Parameters

- `*input_iterators`: One iterator per mapped positional parameter on the function.
- `kwargs`: Extra keyword arguments forwarded to every invocation. (Default is `{}`)
- `ignore_exceptions` (bool): If True, failures are swallowed instead of propagating. (Default is False)

## spawn_map

```python
spawn_map(self, *input_iterators, kwargs={})
```

Spawn parallel execution over a set of inputs, exiting as soon as the inputs are created (without waiting for the map to complete).

Takes one iterator argument per argument in the function being mapped over.

Programmatic retrieval of results will be supported in a future update.

### Parameters

- `*input_iterators`: One iterator per mapped positional parameter on the function.
- `kwargs`: Extra keyword arguments forwarded to every invocation. (Default is `{}`)

### Usage

```python
@app.function()
def my_func(a):
    return a ** 2


@app.local_entrypoint()
def main():
    my_func.spawn_map([1, 2, 3, 4])
```