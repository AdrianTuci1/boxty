# Memory Snapshots

Boxty Memory Snapshots allow you to save and restore the state of running containers.

## CPU Memory Snapshots

Create a snapshot of a container's memory state:

```python
import boxty

app = boxty.App()

@app.function()
def save_state():
    # Create a snapshot
    boxty.snapshot.create("my-snapshot")

@app.function()
def restore_state():
    # Restore from a snapshot
    boxty.snapshot.restore("my-snapshot")
```

Memory snapshots are useful for:

- Checkpointing long-running training jobs
- Saving model state for later inference
- Debugging by capturing container state at a specific point
