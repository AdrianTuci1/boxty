# Dataset ingestion

Boxty provides efficient patterns for ingesting large datasets into your applications.

## Configure your Function for heavy disk usage

When processing large datasets, configure your Function with appropriate disk and memory resources:

```python
@app.function(cpu=8, memory=32768, disk=102400)
def process_dataset():
    ...
```

Boxty automatically provisions the requested resources and handles data locality optimization.
