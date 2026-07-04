# Scaling out

Boxty scales automatically based on demand.

## How does autoscaling work on Boxty?

Boxty monitors the queue depth for each Function and scales the number of containers up or down to match the workload:

- When queue depth increases, Boxty boots new containers
- When queue depth decreases, Boxty shuts down idle containers
- You only pay for containers that are actively processing

## Configuring autoscaling behavior

Configure autoscaling parameters for your Functions:

```python
import boxty

app = boxty.App()

@app.function(
    autoscaling=boxty.Autoscaling(
        min_containers=1,
        max_containers=100,
        target_queue_depth=10
    )
)
def auto_scaled_function():
    ...
```

Boxty handles all infrastructure provisioning and de-provisioning automatically.
