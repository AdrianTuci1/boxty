# Developing and debugging

Boxty provides several tools to help you develop and debug your applications.

## Interactivity

You can attach an interactive shell to a running container for debugging:

```bash
boxty shell my_function
```

This opens a bash shell inside the container, allowing you to inspect the environment, check logs, and run diagnostic commands.

You can also use the `--pty` flag to get a proper TTY for interactive applications:

```bash
boxty shell --pty my_function
```
