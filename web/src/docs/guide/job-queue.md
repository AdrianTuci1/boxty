# Job queues

Boxty Functions can be used as job queues for asynchronous processing.

## Creating jobs with .spawn()

Submit jobs to be processed asynchronously using `.spawn()`:

```python
import boxty

app = boxty.App()

@app.function()
def process_job(job_id: str):
    # Process the job
    return f"Processed {job_id}"

@app.local_entrypoint()
def main():
    # Submit 100 jobs asynchronously
    for i in range(100):
        process_job.spawn(f"job-{i}")
```

Jobs are queued and processed by available containers. Boxty automatically scales the number of containers based on queue depth.

You can also use `.spawn_map()` for batch submission:

```python
@app.local_entrypoint()
def main():
    process_job.spawn_map([f"job-{i}" for i in range(100)])
```
