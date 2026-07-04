"""Boxty CLI exceptions."""


class BoxtyCLIError(Exception):
    """Base CLI error."""


class ConfigError(BoxtyCLIError):
    """Missing or invalid configuration."""


class AuthenticationError(BoxtyCLIError):
    """Not authenticated."""
