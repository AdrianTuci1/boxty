# Preemption

Boxty handles preemption gracefully for fault-tolerant workloads.

## Preparing for interruptions

Boxty may preempt containers to optimize resource utilization. Design your workloads to handle interruptions:

```python
import boxty

app = boxty.App()

@app.function()
def checkpointable_training():
    for epoch in range(100):
        train_epoch()
        # Save checkpoint every epoch
        save_checkpoint(f"checkpoint-{epoch}.pt")
```

## Non-preemptible Functions

For workloads that cannot be interrupted, request non-preemptible containers:

```python
@app.function(preemptible=False)
def critical_workload():
    ...
```

Note that non-preemptible Functions may have longer queue times.
