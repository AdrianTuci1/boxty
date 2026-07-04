"""Boxty CLI exceptions."""

from __future__ import annotations


class BoxtyCliError(Exception):
    """Base CLI exception."""

    def __init__(self, message: str, exit_code: int = 1) -> None:
        super().__init__(message)
        self.message = message
        self.exit_code = exit_code


class ConfigError(BoxtyCliError):
    """Raised when configuration is missing or invalid."""

    pass


class AuthRequiredError(BoxtyCliError):
    """Raised when an operation requires authentication."""

    def __init__(self, message: str = "Authentication required. Run 'boxty auth login'.") -> None:
        super().__init__(message, exit_code=1)
