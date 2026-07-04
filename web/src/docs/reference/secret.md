# boxty.Secret

```python
class Secret(boxty.object.Object)
```

Secrets provide a dictionary of environment variables for images.

Secrets are a secure way to add credentials and other sensitive information to the containers your functions run in. You can create and edit secrets on the dashboard, or programmatically from Python code.

See the secrets guide page for more information.

## hydrate

```python
hydrate(self, client=None)
```

Synchronize the local object with its identity on the Boxty server.

It is rarely necessary to call this method explicitly, as most operations will lazily hydrate when needed. The main use case is when you need to access object metadata, such as its ID.

Added in v0.72.39: This method replaces the deprecated `.resolve()` method.

## objects

```python
objects: SecretManager
```

Namespace with methods for managing named Secret objects.

## objects.create

```python
create(self, name, env_dict, *, allow_existing=False, environment_name=None,
    client=None)
```

Create a new named Secret in the workspace environment.

This does not return a local handle; use boxty.Secret.from_name to look up the Secret after creation.

Added in v1.1.2.

### Parameters

- `name` (str): Name for the new Secret.
- `env_dict` (dict[str, str]): Environment variable keys and values stored in the Secret.
- `allow_existing` (bool): If True, do nothing when a Secret with this name already exists (existing values are kept). (Default is False)
- `environment_name` (str | None): Environment to create in; defaults to the active environment.
- `client` (_Client | None): Boxty client to use; defaults to Client.from_env() when omitted.

### Usage

```python
contents = {"MY_KEY": "my-value", "MY_OTHER_KEY": "my-other-value"}
boxty.Secret.objects.create("my-secret", contents)
```

Secrets will be created in the active environment, or another one can be specified:

```python
boxty.Secret.objects.create("my-secret", contents, environment_name="dev")
```

By default, an error will be raised if the Secret already exists, but passing allow_existing=True will make the creation attempt a no-op in this case. If the env_dict data differs from the existing Secret, it will be ignored.

```python
boxty.Secret.objects.create("my-secret", contents, allow_existing=True)
```

Note that this method does not return a local instance of the Secret. You can use boxty.Secret.from_name to perform a lookup after creation.

## objects.list

```python
list(self, *, max_objects=None, created_before=None, environment_name="",
    client=None)
```

List named Secrets in the workspace environment as hydrated handles.

Results are ordered newest to oldest. By default, all matching Secrets are returned.

Added in v1.1.2.

### Parameters

- `max_objects` (int | None): Maximum number of Secrets to return.
- `created_before` (datetime | str | None): Only include Secrets created before this time (datetime or ISO date string).
- `environment_name` (str): Environment to list from; defaults to the active environment. (Default is "")
- `client` (_Client | None): Boxty client to use; defaults to Client.from_env() when omitted.

### Returns

Hydrated Secret objects for each named Secret in the listing.

### Usage

```python
secrets = boxty.Secret.objects.list()
print([s.name for s in secrets])
```

Secrets will be retrieved from the active environment, or another one can be specified:

```python
dev_secrets = boxty.Secret.objects.list(environment_name="dev")
```

By default, all named Secrets are returned, newest to oldest. It's also possible to limit the number of results and to filter by creation date:

```python
secrets = boxty.Secret.objects.list(max_objects=10, created_before="2025-01-01")
```

## objects.delete

```python
delete(self, name, *, allow_missing=False, environment_name=None, client=None)
```

Delete a named Secret entirely.

Deletion is irreversible and affects any Apps using this Secret.

Added in v1.1.2.

### Parameters

- `name` (str): Name of the Secret to delete.
- `allow_missing` (bool): If True, do nothing when the Secret does not exist. (Default is False)
- `environment_name` (str | None): Environment to delete from; defaults to the active environment.
- `client` (_Client | None): Boxty client to use; defaults to Client.from_env() when omitted.

### Usage

```python
await boxty.Secret.objects.delete("my-secret")
```

Secrets will be deleted from the active environment, or another one can be specified:

```python
await boxty.Secret.objects.delete("my-secret", environment_name="dev")
```

## name

```python
name(self)
```

## from_dict

```python
from_dict(env_dict={})
```

Create a Secret from a dictionary of environment variable names to string values.

Values may be None; those keys are omitted from the Secret.

### Parameters

- `env_dict` (dict[str, str | None]): Mapping of variable names to values (or None to skip a key). (Default is {})

### Returns

A lazy Secret handle backed by the given key-value pairs.

### Usage

```python
@app.function(secrets=[boxty.Secret.from_dict({"FOO": "bar"})])
def run():
    print(os.environ["FOO"])
```

## from_local_environ

```python
from_local_environ(env_keys)
```

Build a Secret from the current process environment (local runs only).

In remote execution, returns an empty Secret.

### Parameters

- `env_keys` (list[str]): Names of environment variables to copy into the Secret.

### Returns

A Secret containing the resolved variables (or empty when not local).

## from_dotenv

```python
from_dotenv(path=None, *, filename=".env", client=None)
```

Load environment variables from a .env file into a Secret.

With no path, searches from the current working directory (not the caller's file path). With path set, walks upward from that file or directory to find filename.

### Parameters

- `path`: File or directory to search from; omit to search from the process cwd.
- `filename` (str): Name of the env file to find (default .env). (Default is ".env")
- `client` (_Client | None): Boxty client used when hydrating the Secret.

### Returns

A lazy Secret handle whose values are loaded from the resolved .env file.

### Usage

```python
@app.function(secrets=[boxty.Secret.from_dotenv(__file__)])
def run():
    print(os.environ["USERNAME"])  # Assumes USERNAME is defined in your .env file
```

```python
@app.function(secrets=[boxty.Secret.from_dotenv(filename=".env-dev")])
def run():
    ...
```

## from_name

```python
from_name(name, *, environment_name=None, required_keys=[], client=None)
```

Reference a deployed Secret by name.

Hydration is lazy until the Secret is used.

### Parameters

- `name` (str): Deployment name of the Secret.
- `environment_name` (str | None): Environment to resolve the name in; defaults to the active environment.
- `required_keys` (list[str]): If non-empty, the server asserts these keys exist on the Secret. (Default is [])
- `client` (_Client | None): Boxty client to use for loading; defaults to Client.from_env() when omitted.

### Returns

A Secret handle (possibly not yet hydrated).

### Usage

```python
secret = boxty.Secret.from_name("my-secret")

@app.function(secrets=[secret])
def run():
    ...
```

## info

```python
info(self)
```

Return information about the Secret object.

## update

```python
update(self, env_dict)
```

Update this Secret, adding or overwriting key-value pairs.

Like dict.update(), this merges env_dict into the existing Secret. Keys not mentioned in env_dict are left unchanged.
