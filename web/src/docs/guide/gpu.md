# GPU acceleration

Boxty provides out-of-the-box support for state-of-the-art GPUs, including NVIDIA T4, A10G, A100, and H100.

## Quickstart

To request a GPU, pass the `gpu` parameter to your function decorator:

```python
import boxty

app = boxty.App("gpu-app")

@app.function(gpu="a100")
def run_gpu_job():
    import torch
    print("CUDA available:", torch.cuda.is_available())
```

## Specifying GPU type

Boxty supports the following GPU types:

- `t4`: NVIDIA T4
- `a10g`: NVIDIA A10G
- `a100`: NVIDIA A100 (40GB or 80GB)
- `h100`: NVIDIA H100

## Specifying GPU count

Request multiple GPUs for distributed training:

```python
@app.function(gpu=boxty.gpu.A100(count=4))
def multi_gpu_training():
    ...
```

## Picking a GPU

Choose a GPU based on your workload:

- **T4**: Budget-friendly inference and light training
- **A10G**: Mid-range GPU for general deep learning
- **A100**: Gold standard for LLM training and high-throughput inference
- **H100**: Fastest GPU for massive models and cutting-edge performance
