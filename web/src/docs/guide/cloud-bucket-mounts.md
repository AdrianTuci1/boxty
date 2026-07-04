# Cloud bucket mounts

The boxty.CloudBucketMount is a mutable volume that allows for both reading and writing files from a cloud bucket. It supports AWS S3, Cloudflare R2, and Google Cloud Storage buckets.

Cloud bucket mounts are built on top of AWS' mountpoint technology and inherits its limitations. See the Limitations and troubleshooting section for more details.

## Mounting Cloudflare R2 buckets

CloudBucketMount enables Cloudflare R2 buckets to be mounted as file system volumes. Because Cloudflare R2 is S3-Compatible the setup is very similar between R2 and S3. See boxty.CloudBucketMount for usage instructions.

When creating the R2 API token for use with the mount, you need to have the ability to read, write, and list objects in the specific buckets you will mount. You do not need admin permissions, and you should not use "Client IP Address Filtering".

## Mounting Google Cloud Storage buckets

CloudBucketMount enables Google Cloud Storage (GCS) buckets to be mounted as file system volumes. See boxty.CloudBucketMount for GCS setup instructions.

## Mounting S3 buckets

CloudBucketMount enables S3 buckets to be mounted as file system volumes. To interact with a bucket, you must have the appropriate IAM permissions configured (refer to the section on IAM Permissions).

```python
import boxty
import subprocess

app = boxty.App()

s3_bucket_name = "s3-bucket-name"  # Bucket name not ARN.
s3_access_credentials = boxty.Secret.from_dict({
    "AWS_ACCESS_KEY_ID": "...",
    "AWS_SECRET_ACCESS_KEY": "...",
    "AWS_REGION": "..."
})

@app.function(
    volumes={
        "/my-mount": boxty.CloudBucketMount(s3_bucket_name, secret=s3_access_credentials)
    }
)
def f():
    subprocess.run(["ls", "/my-mount"])
```

## Specifying S3 bucket region

Amazon S3 buckets are associated with a single AWS Region. Mountpoint attempts to automatically detect the region for you.
