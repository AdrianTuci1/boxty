from __future__ import annotations
from typing import Any, List, Optional, Callable
from functools import wraps

class App:
    def __init__(self, name: str):
        self.name = name
        self._functions: dict = {}

    def function(self, image: str = "python:3.12-slim", cpu: int = 1, memory: int = 1024, gpu: Optional[str] = None, timeout: int = 3600):
        def decorator(fn: Callable):
            self._functions[fn.__name__] = Function(self, fn, image, cpu, memory, gpu, timeout)
            return self._functions[fn.__name__]
        return decorator

    def deploy(self) -> str:
        return f"https://{self.name}.boxty.dev"

    def undeploy(self) -> None:
        pass

    def stop(self) -> None:
        pass

    def sandboxes(self) -> List[Any]:
        return []

    def deployments(self) -> List[Any]:
        return []

    def metrics(self) -> Any:
        return {}

    def usage(self) -> Any:
        return {}

    def logs(self) -> List[str]:
        return []

    def delete(self) -> None:
        pass

class Function:
    def __init__(self, app, fn, image, cpu, memory, gpu, timeout):
        self._fn = fn
        self._app = app
        self.image = image
        self.cpu = cpu
        self.memory = memory
        self.gpu = gpu
        self.timeout = timeout
        self.web_url = f"https://{fn.__name__}-{app.name}.boxty.dev"

    def remote(self, *args, **kwargs):
        return self._fn(*args, **kwargs)

    def map(self, inputs: List[Any]):
        return [self._fn(inp) for inp in inputs]

    def spawn(self, *args, **kwargs):
        return {"call_id": "call-123", "status": "pending"}

def web_endpoint(method: str = "GET", timeout: int = 60):
    def decorator(fn: Callable):
        fn._web_endpoint = {"method": method, "timeout": timeout}
        return fn
    return decorator
