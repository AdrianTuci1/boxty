# S3 Gateway endpoints

Boxty supports S3 Gateway endpoints for private S3 access.

## Endpoint configuration

Configure an S3 Gateway endpoint for your Functions:

```python
import boxty

app = boxty.App()

@app.function(s3_gateway="my-vpc-endpoint")
def access_s3():
    import boto3
    s3 = boto3.client("s3")
    return s3.list_buckets()
```

S3 Gateway endpoints allow private access to S3 without going through the public internet.

Contact Boxty support to configure S3 Gateway endpoints for your workspace.
