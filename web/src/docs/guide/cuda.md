# Using CUDA on Boxty

Using CUDA on Boxty is seamless as Boxty handles driver installation and library linking automatically.

## CUDA drivers

Boxty's GPU images come pre-installed with the correct NVIDIA drivers and CUDA toolkit versions matching your runtime.

## PyTorch CUDA configuration

Simply import PyTorch and perform your matrix operations:

```python
import torch

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
tensor = torch.randn(3, 3).to(device)
print(tensor)
```
