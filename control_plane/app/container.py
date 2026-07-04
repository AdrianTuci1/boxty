from __future__ import annotations

import os
from typing import Any, Callable


class ServiceContainer:
    """Dependency injection container for modular services.
    
    Services can be enabled/disabled via configuration.
    Disabled services return None or raise ServiceDisabledError.
    """
    
    def __init__(self):
        self._services: dict[str, Any] = {}
        self._factories: dict[str, Callable[[], Any]] = {}
        self._enabled: dict[str, bool] = {}
    
    def register(self, name: str, factory: Callable[[], Any], enabled: bool = True) -> None:
        """Register a service factory."""
        self._factories[name] = factory
        self._enabled[name] = enabled
    
    def get(self, name: str) -> Any:
        """Get a service instance. Lazy initialization."""
        if not self._enabled.get(name, False):
            raise ServiceDisabledError(f"Service '{name}' is disabled")
        
        if name not in self._services:
            if name not in self._factories:
                raise KeyError(f"Service '{name}' not registered")
            self._services[name] = self._factories[name]()
        
        return self._services[name]
    
    def is_enabled(self, name: str) -> bool:
        """Check if a service is enabled."""
        return self._enabled.get(name, False)
    
    def enable(self, name: str) -> None:
        """Enable a service."""
        self._enabled[name] = True
    
    def disable(self, name: str) -> None:
        """Disable a service."""
        self._enabled[name] = False
        self._services.pop(name, None)
    
    def reset(self, name: str) -> None:
        """Reset a service instance (force re-initialization)."""
        self._services.pop(name, None)


class ServiceDisabledError(Exception):
    """Raised when trying to use a disabled service."""
    pass


# Global container instance
container = ServiceContainer()


def init_container() -> None:
    """Initialize the service container with all services.
    
    Services are enabled/disabled based on configuration.
    """
    from .config import settings
    
    # Stripe service
    def create_stripe_service():
        from .stripe_service import StripeService
        return StripeService()
    
    container.register(
        "stripe",
        create_stripe_service,
        enabled=bool(os.environ.get("STRIPE_SECRET_KEY", ""))
    )
    
    # RunPod service
    def create_runpod_service():
        from .runpod import runpod_adapter
        return runpod_adapter
    
    container.register(
        "runpod",
        create_runpod_service,
        enabled=settings.runpod_enabled
    )
    
    # DynamoDB service
    def create_dynamodb_service():
        from .integrations import DynamoSingleTableMirror
        return DynamoSingleTableMirror()
    
    container.register(
        "dynamodb",
        create_dynamodb_service,
        enabled=bool(settings.dynamodb_table_name)
    )
    
    # Email service
    def create_email_service():
        from .email_service import EmailService
        return EmailService()
    
    container.register(
        "email",
        create_email_service,
        enabled=settings.invite_email_provider != "console"
    )
    
    # Object storage service
    def create_storage_service():
        from .storage_service import StorageService
        return StorageService()
    
    container.register(
        "storage",
        create_storage_service,
        enabled=settings.object_storage_provider != "filesystem"
    )
