# Troubleshooting

Common issues and solutions for Boxty applications.

## Command not found errors

If you see "command not found" errors in your Functions, ensure the command is installed in your Image:

```python
import boxty

image = boxty.Image.debian_slim().apt_install("ffmpeg")

@app.function(image=image)
def use_ffmpeg():
    import subprocess
    subprocess.run(["ffmpeg", "-version"])
```

Other common issues:

- **Import errors**: Install missing packages with `pip_install`
- **Memory errors**: Increase memory allocation
- **Timeout errors**: Increase timeout or optimize code
- **GPU errors**: Ensure CUDA is properly configured

Check the Boxty logs for detailed error messages:

```bash
boxty logs my_function
```
