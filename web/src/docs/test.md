# Introduction

Boxty is an AI infrastructure platform that lets you:

- Run low latency [inference](/docs/guide/gpu-acceleration) with sub-second cold starts, using open weights or custom models
- Scale out [batch jobs](/docs/guide/batch-processing) to run massively in parallel
- [Train](/docs/guide/hello-world) or [fine-tune](/docs/guide/gpu-acceleration) open weights on the latest GPUs
- Spin up thousands of isolated and secure [Sandboxes](/docs/guide/input-concurrency) to execute AI generated code
- Launch GPU-backed [Notebooks](/docs/guide/configuring-cpu-memory-disk) in seconds and collaborate with your colleagues in real-time

You get [full serverless execution and pricing](/docs/guide/introduction) because we host everything and charge per second of usage.

Notably, there's zero configuration in Boxty - everything, including [container environments](/docs/guide/defining-images) and [GPU specification](/docs/guide/gpu-acceleration), is code. Take a breath of fresh air and feel how good it tastes with no YAML in it.

Here's a complete, minimal example of LLM inference running on Boxty:

```python
from pathlib import Path
import boxty

app = boxty.App("example-inference")
image = boxty.Image.debian_slim().uv_pip_install("transformers[torch]")

@app.function(gpu="h100", image=image)
def chat(prompt: str | None = None) -> list[dict]:
    from transformers import pipeline

    if prompt is None:
        prompt = f"Read this code.\n\n{Path(__file__).read_text()}\nIn one paragraph, what does the code do?"

    print(prompt)
    context = [{"role": "user", "content": prompt}]

    chatbot = pipeline(
        model="Qwen/Qwen3-1.7B", device_map="cuda", max_new_tokens=1024
    )
    result = chatbot(context)
    print(result[0]["generated_text"][-1]["content"])

    return result
```

That's it! You can copy and paste that text into a Python file in your favorite editor and then run it with `boxty run path/to/file.py`.

## How does it work?

Boxty takes your code, puts it in a container, and executes it in the cloud. If you get a lot of traffic, Boxty automatically scales up the number of containers as needed. This means you don't need to mess with Kubernetes, Docker, or even an AWS account.

## Programming language support

Currently, Boxty is designed primarily for Python. Since all configuration is code, you can use your favorite Python libraries, editors, and IDEs. We are actively exploring support for other languages.

## Getting started

Developing with Boxty is easy because you don't have to set up any infrastructure. Just:

1. Create an account at [boxty.dev](https://boxty.dev)
2. Run `pip install boxty` to install the `boxty` Python package
3. Run `boxty setup` to authenticate

…and you can start running jobs right away. Check out some of our simple getting started examples:

- [Hello, world!](/docs/guide/hello-world)
- [A simple web scraper](/docs/guide/web-scraper)

You can also learn Boxty interactively without installing anything through our [code playground](/playground).
