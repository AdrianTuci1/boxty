import os

from .client import Boxty
from .app import App, Database, Image, Mount, Secret, Volume
from .exceptions import (
    BoxtyAPIError,
    BoxtyAuthError,
    BoxtyConnectionError,
    BoxtyError,
    BoxtyNotFoundError,
    BoxtyTimeoutError,
    BoxtyValidationError,
)

class Client(Boxty):
    """Convenience alias for Boxty."""

    def __init__(self, api_key: str | None = None, base_url: str | None = None) -> None:
        super().__init__(base_url=base_url)
        if api_key:
            os.environ["BOXTY_TOKEN"] = api_key

__version__ = "1.0.0"
__all__ = [
    "App",
    "Boxty",
    "BoxtyAPIError",
    "BoxtyAuthError",
    "BoxtyConnectionError",
    "BoxtyError",
    "BoxtyNotFoundError",
    "BoxtyTimeoutError",
    "BoxtyValidationError",
    "Client",
    "Database",
    "Image",
    "Mount",
    "Secret",
    "Volume",
]
