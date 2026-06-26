# Snapshots

Boxty Sandbox Snapshots capture the state of a Sandbox for later restoration.

## Snapshot Retention

Snapshots are retained according to your workspace's retention policy:

- Starter: 7 days
- Team: 30 days
- Enterprise: 90 days

Create a snapshot:

```python
import boxty

app = boxty.App()

@app.function()
def create_snapshot():
    boxty.snapshot.create("my-sandbox-snapshot")
```

Restore from a snapshot:

```python
@app.function()
def restore_snapshot():
    boxty.snapshot.restore("my-sandbox-snapshot")
```
