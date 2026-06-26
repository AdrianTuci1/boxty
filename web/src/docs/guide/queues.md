# Queues

Boxty Queues are distributed message queues for asynchronous communication.

## Boxty Queues are Python queues in the cloud

Boxty Queues provide a simple, serverless message queue:

```python
import boxty

app = boxty.App()
q = boxty.Queue.from_name("my-queue", create_if_missing=True)

@app.function()
def producer():
    q.put("message")

@app.function()
def consumer():
    return q.get()
```

Queues are ideal for task distribution, job scheduling, and inter-function communication.
