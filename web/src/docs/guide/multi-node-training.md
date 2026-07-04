# Multi-node clusters (Beta)

Boxty supports distributed training across multiple nodes.

## Cluster compute capability

Boxty's cluster compute capability allows you to run distributed training jobs across multiple GPU nodes:

```python
import boxty

app = boxty.App()

@app.function(gpu=boxty.gpu.A100(count=8), cluster_size=4)
def distributed_training():
    # Runs on 4 nodes, each with 8 A100 GPUs
    ...
```

## @clustered

Use the `@clustered` decorator to configure cluster behavior:

```python
@app.function(gpu="a100")
@clustered(size=4, interconnect="ib")
def train():
    # 4 nodes with InfiniBand interconnect
    ...
```

Contact Boxty support to enable multi-node clusters for your workspace.
