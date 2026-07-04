"""Custom exception hierarchy for the Boxty SDK."""

from __future__ import annotations


class BoxtyError(Exception):
    """Base exception for all Boxty SDK errors."""

    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class BoxtyAuthError(BoxtyError):
    """Raised when authentication fails or credentials are invalid."""

    def __init__(self, message: str = "Authentication failed") -> None:
        super().__init__(message, status_code=401)


class BoxtyNotFoundError(BoxtyError):
    """Raised when a requested resource does not exist."""

    def __init__(self, message: str = "Resource not found") -> None:
        super().__init__(message, status_code=404)


class BoxtyValidationError(BoxtyError):
    """Raised when request parameters fail validation."""

    def __init__(self, message: str = "Validation error") -> None:
        super().__init__(message, status_code=422)


class BoxtyAPIError(BoxtyError):
    """Raised when the API returns an error response."""

    def __init__(self, message: str = "API error", status_code: int | None = None) -> None:
        super().__init__(message, status_code=status_code or 500)


class BoxtyConnectionError(BoxtyError):
    """Raised when the SDK cannot reach the Boxty API."""

    def __init__(self, message: str = "Connection error") -> None:
        super().__init__(message, status_code=503)


class BoxtyTimeoutError(BoxtyError):
    """Raised when an API request exceeds the configured timeout."""

    def __init__(self, message: str = "Request timed out") -> None:
        super().__init__(message, status_code=504)
