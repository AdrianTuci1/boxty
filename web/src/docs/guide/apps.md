# Apps, Functions, and entrypoints

An App represents an application running on Boxty. It groups one or more Functions for atomic deployment and acts as a shared namespace. All Functions and Clses are associated with an App.

A Function acts as an independent unit once it is deployed, and scales up and down independently from other Functions. If there are no live inputs to the Function then by default, no containers will run and your account will not be charged for compute resources, even if the App it belongs to is deployed.

An App can be ephemeral or deployed. You can view a list of all currently running Apps on the apps page.

The code for a Boxty App defining two separate Functions might look something like this:

```python
import boxty

app = boxty.App(name="my-boxty-app")

@app.function()
def f():
    print("Hello world!")

@app.function()
def g():
    print("Goodbye world!")
```

## Ephemeral Apps

An ephemeral App is created when you use the `boxty run` CLI command, or the `app.run` method. This creates a temporary App that only exists for the duration of your script.

Ephemeral Apps are stopped automatically when the calling program exits, or when the server detects that the client is no longer connected. You can use `--detach` in order to keep an ephemeral App running even after the client exits.

By using `app.run` you can run your Boxty apps from within your Python scripts:

```python
def main():
    ...
    with app.run():
        some_boxty_function.remote()
```

By default, running your app in this way won't propagate Boxty logs and progress bar messages. To enable output, use the `boxty.enable_output` context manager:

```python
def main():
    ...
    with boxty.enable_output():
        with app.run():
            some_boxty_function.remote()
```

## Deployed Apps

A deployed App is created using the `boxty deploy` CLI command. The App is persisted indefinitely until you stop it via the web UI or the `boxty app stop` command. Functions in a deployed App that have an attached schedule will be run on a schedule. Otherwise, you can invoke them manually using Web Functions or Python.

Deployed Apps are named via the App constructor. Re-deploying an existing App (based on the name) will update it in place.

## Entrypoints for ephemeral Apps

The code that runs first when you `boxty run` an App is called the "entrypoint".

You can register a local entrypoint using the `@app.local_entrypoint()` decorator. You can also use a regular Boxty function as an entrypoint, in which case only the code in global scope is executed locally.

### Argument parsing

If your entrypoint function takes arguments with primitive types, `boxty run` automatically parses them as CLI options. For example, the following function can be called with `boxty run script.py --foo 1 --bar "hello"`:

```python
# script.py

@app.local_entrypoint()
def main(foo: int, bar: str):
    some_boxty_function.remote(foo, bar)
```

If you wish to use your own argument parsing library, such as argparse, you can instead accept a variable-length argument list for your entrypoint or your function. In this case, Boxty skips CLI parsing and forwards CLI arguments as a tuple of strings. For example, the following function can be invoked with `boxty run my_file.py --foo=42 --bar="baz"`:

```python
import argparse

@app.function()
def train(*arglist):
    parser = argparse.ArgumentParser()
    parser.add_argument("--foo", type=int)
    parser.add_argument("--bar", type=str)
    args = parser.parse_args(args = arglist)
```

### Manually specifying an entrypoint

If there is only one `local_entrypoint` registered, `boxty run script.py` will automatically use it. If you have no entrypoint specified, and just one decorated Boxty function, that will be used as a remote entrypoint instead. Otherwise, you can direct `boxty run` to use a specific entrypoint.

For example, if you have a function decorated with `@app.function()` in your file:

```python
# script.py

@app.function()
def f():
    print("Hello world!")

@app.function()
def g():
    print("Goodbye world!")

@app.local_entrypoint()
def main():
    f.remote()
```

Running `boxty run script.py` will execute the `main` function locally, which would call the `f` function remotely. However you can instead run `boxty run script.py::app.f` or `boxty run script.py::app.g` to execute `f` or `g` directly.

## Apps were once Stubs

The `boxty.App` class in the client was previously called `boxty.Stub`. The old name was kept as an alias for some time, but from Boxty 1.0.0 onwards, using `boxty.Stub` will result in an error.
