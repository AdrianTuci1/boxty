# Request timeouts

Boxty enforces timeouts on Web Function requests.

## Polling solutions

For long-running operations, use polling instead of waiting:

```python
import boxty
import time

app = boxty.App()

@app.function()
def long_running_job():
    # Start the job
    job_id = start_job()
    return job_id

@app.function()
def check_job_status(job_id: str):
    return get_job_status(job_id)
```

Client polls for status:

```python
job_id = long_running_job.remote()
while True:
    status = check_job_status.remote(job_id)
    if status == "complete":
        break
    time.sleep(1)
```
