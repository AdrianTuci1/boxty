"""Custom exception hierarchy for the Boxty SDK."""


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
    """Raised when request validation fails."""

    def __init__(self, message: str = "Validation error") -> None:
        super().__init__(message, status_code=422)


class BoxtyConnectionError(BoxtyError):
    """Raised when a connection to the Boxty server fails."""

    def __init__(self, message: str = "Connection failed") -> None:
        super().__init__(message, status_code=None)


class BoxtyTimeoutError(BoxtyError):
    """Raised when a request times out."""

    def __init__(self, message: str = "Request timed out") -> None:
        super().__init__(message, status_code=None)
