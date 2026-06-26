# Batch Processing

Boxty is optimized for large-scale batch processing, allowing functions to scale to thousands of parallel containers with zero additional configuration. Function calls can be submitted asynchronously for background execution, eliminating the need to wait for jobs to finish or tune resource allocation.

This guide covers Boxty's batch processing capabilities, from basic invocation to integration with existing pipelines.

## Background Execution with .spawn_map

The fastest way to submit multiple jobs for asynchronous processing is by invoking a function with .spawn_map. When combined with the --detach flag, your App continues running until all jobs are completed.

Here's an example of submitting 100,000 videos for parallel embedding. You can disconnect after submission, and the processing will continue to completion in the background:

```python
# Kick off asynchronous jobs with `boxty run --detach batch_processing.py`
import boxty

app = boxty.App("batch-processing-example")
volume = boxty.Volume.from_name("video-embeddings", create_if_missing=True)

@app.function(volumes={"/data": volume})
def embed_video(video_id: int):
    # Business logic:
    # - Load the video from the volume
    # - Embed the video
    # - Save the embedding to the volume
    ...

@app.local_entrypoint()
def main():
    embed_video.spawn_map(range(100_000))
```

This pattern works best for jobs that store results externally—for example, in a Boxty Volume, Cloud Bucket Mount, or your own database*.

* For database connections, consider using Boxty Proxy to maintain a static IP across thousands of containers.

## Parallel Processing with .map

Using .map allows you to offload expensive computations to powerful machines while gathering results. This is particularly useful for pipeline steps with bursty resource demands. Boxty handles all infrastructure provisioning and de-provisioning automatically.
