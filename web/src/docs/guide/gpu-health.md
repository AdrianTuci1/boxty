# GPU health

Boxty monitors GPU health and automatically handles failures.

## [gpu-health] logging

Boxty logs GPU health metrics including:

- Temperature
- Memory errors
- Utilization
- Power consumption

If a GPU fails health checks, Boxty automatically migrates your workload to a healthy GPU and retries the function.

You can access GPU health logs in the Boxty dashboard or via the CLI:

```bash
boxty logs --gpu-health my_function
```
