# boxty.exception

Boxty-specific exception types.

## Notes on grpclib.GRPCError migration

Historically, the Boxty SDK could propagate grpclib.GRPCError exceptions out to user code. As of v1.3, we are in the process of gracefully migrating to always raising a Boxty exception type in these cases. To avoid breaking user code that relies on catching grpclib.GRPCError, a subset of Boxty exception types temporarily inherit from grpclib.GRPCError.

We encourage users to migrate any code that currently catches grpclib.GRPCError to instead catch the appropriate Boxty exception type. The following mapping between GRPCError status codes and Boxty exception types is currently in use:

- CANCELLED -> ServiceError
- UNKNOWN -> ServiceError
- INVALID_ARGUMENT -> InvalidError
- DEADLINE_EXCEEDED -> ServiceError
- NOT_FOUND -> NotFoundError
- ALREADY_EXISTS -> AlreadyExistsError
- PERMISSION_DENIED -> PermissionDeniedError
- RESOURCE_EXHAUSTED -> ResourceExhaustedError
- FAILED_PRECONDITION -> ConflictError
- ABORTED -> ConflictError
- OUT_OF_RANGE -> InvalidError
- UNIMPLEMENTED -> UnimplementedError
- INTERNAL -> InternalError
- UNAVAILABLE -> ServiceError
- DATA_LOSS -> DataLossError
- UNAUTHENTICATED -> AuthError

## boxty.exception.AlreadyExistsError

```python
class AlreadyExistsError(boxty.exception.Error, boxty.exception._GRPCErrorWrapper)
```

Raised when a resource creation conflicts with an existing resource.

```python
__init__(self, message=None)
```

### message

```python
message(self)
```

### status

```python
status(self)
```

### details

```python
details(self)
```

## boxty.exception.AsyncUsageWarning

```python
class AsyncUsageWarning(UserWarning)
```

Warning emitted when a blocking Boxty interface is used in an async context.

## boxty.exception.AuthError

```python
class AuthError(boxty.exception.Error, boxty.exception._GRPCErrorWrapper)
```

Raised when a client has missing or invalid authentication.

```python
__init__(self, message=None)
```

### message

```python
message(self)
```

### status

```python
status(self)
```

### details

```python
details(self)
```

## boxty.exception.ClientClosed

```python
class ClientClosed(boxty.exception.Error)
```

## boxty.exception.ConflictError

```python
class ConflictError(boxty.exception.InvalidError, boxty.exception._GRPCErrorWrapper)
```

Raised when a resource conflict occurs between the request and current system state.

```python
__init__(self, message=None)
```

### message

```python
message(self)
```

### status

```python
status(self)
```

### details

```python
details(self)
```

## boxty.exception.ConnectionError

```python
class ConnectionError(boxty.exception.Error)
```

Raised when an issue occurs while connecting to the Boxty servers.

## boxty.exception.DataLossError

```python
class DataLossError(boxty.exception.Error, boxty.exception._GRPCErrorWrapper)
```

Raised when data is lost or corrupted.

```python
__init__(self, message=None)
```

### message

```python
message(self)
```

### status

```python
status(self)
```

### details

```python
details(self)
```

## boxty.exception.DeprecationError

```python
class DeprecationError(UserWarning)
```

UserWarning category emitted when a deprecated Boxty feature or API is used.

## boxty.exception.DeserializationError

```python
class DeserializationError(boxty.exception.Error)
```

Raised to provide more context when an error is encountered during deserialization.

## boxty.exception.Error

```python
class Error(Exception)
```

Base class for all Boxty errors. See boxty.exception for the specialized error classes.

### Usage

```python
import boxty

try:
    ...
except boxty.Error:
    # Catch any exception raised by Boxty's systems.
    print("Responding to error...")
```

## boxty.exception.ExecTimeoutError

```python
class ExecTimeoutError(boxty.exception.TimeoutError)
```

Raised when a container process exceeds its execution duration limit and times out.

## boxty.exception.ExecutionError

```python
class ExecutionError(boxty.exception.Error)
```

Raised when something unexpected happened during runtime.

## boxty.exception.FilesystemExecutionError

```python
class FilesystemExecutionError(boxty.exception.Error)
```

Raised when an unknown error is thrown during a container filesystem operation.

## boxty.exception.FunctionTimeoutError

```python
class FunctionTimeoutError(boxty.exception.TimeoutError)
```

Raised when a Function exceeds its execution duration limit and times out.

## boxty.exception.InputCancellation

```python
class InputCancellation(BaseException)
```

Raised when the current input is cancelled by the task

Intentionally a BaseException instead of an Exception, so it won't get caught by unspecified user exception clauses that might be used for retries and other control flow.

## boxty.exception.InteractiveTimeoutError

```python
class InteractiveTimeoutError(boxty.exception.TimeoutError)
```

Raised when interactive frontends time out while trying to connect to a container.

## boxty.exception.InternalError

```python
class InternalError(boxty.exception.Error, boxty.exception._GRPCErrorWrapper)
```

Raised when an internal error occurs in the Boxty system.

```python
__init__(self, message=None)
```

### message

```python
message(self)
```

### status

```python
status(self)
```

### details

```python
details(self)
```

## boxty.exception.InternalFailure

```python
class InternalFailure(boxty.exception.Error)
```

Retriable internal error.

## boxty.exception.InvalidError

```python
class InvalidError(boxty.exception.Error, boxty.exception._GRPCErrorWrapper)
```

Raised when user does something invalid.

```python
__init__(self, message=None)
```

### message

```python
message(self)
```

### status

```python
status(self)
```

### details

```python
details(self)
```

## boxty.exception.LogsFetchError

```python
class LogsFetchError(boxty.exception.Error)
```

Raised when trying to fetch too many logs.

## boxty.exception.ModuleNotMountable

```python
class ModuleNotMountable(Exception)
```

## boxty.exception.MountUploadTimeoutError

```python
class MountUploadTimeoutError(boxty.exception.TimeoutError)
```

Raised when a Mount upload times out.

## boxty.exception.NotFoundError

```python
class NotFoundError(boxty.exception.Error, boxty.exception._GRPCErrorWrapper)
```

Raised when a requested resource was not found.

```python
__init__(self, message=None)
```

### message

```python
message(self)
```

### status

```python
status(self)
```

### details

```python
details(self)
```

## boxty.exception.OutputExpiredError

```python
class OutputExpiredError(boxty.exception.TimeoutError)
```

Raised when the Output exceeds expiration and times out.

## boxty.exception.PermissionDeniedError

```python
class PermissionDeniedError(boxty.exception.Error, boxty.exception._GRPCErrorWrapper)
```

Raised when a user does not have permission to perform the requested operation.

```python
__init__(self, message=None)
```

### message

```python
message(self)
```

### status

```python
status(self)
```

### details

```python
details(self)
```

## boxty.exception.RemoteError

```python
class RemoteError(boxty.exception.Error)
```

Raised when an error occurs on the Boxty server.

## boxty.exception.RequestSizeError

```python
class RequestSizeError(boxty.exception.Error)
```

Raised when an operation produces a gRPC request that is rejected by the server for being too large.

## boxty.exception.ResourceExhaustedError

```python
class ResourceExhaustedError(boxty.exception.Error, boxty.exception._GRPCErrorWrapper)
```

Raised when a server-side resource has been exhausted, e.g. a quota or rate limit.

```python
__init__(self, message=None)
```

### message

```python
message(self)
```

### status

```python
status(self)
```

### details

```python
details(self)
```

## boxty.exception.SandboxFilesystemDirectoryNotEmptyError

```python
class SandboxFilesystemDirectoryNotEmptyError(boxty.exception.SandboxFilesystemError)
```

Raised when a directory is not empty.

## boxty.exception.SandboxFilesystemError

```python
class SandboxFilesystemError(boxty.exception.Error)
```

Base class for sandbox filesystem errors.

## boxty.exception.SandboxFilesystemFileTooLargeError

```python
class SandboxFilesystemFileTooLargeError(boxty.exception.SandboxFilesystemError)
```

Raised when a file exceeds the maximum allowed size for a read operation in the sandbox.

## boxty.exception.SandboxFilesystemIsADirectoryError

```python
class SandboxFilesystemIsADirectoryError(boxty.exception.SandboxFilesystemError)
```

Raised when a file operation in the sandbox targets a directory when it should target a non-directory file.

## boxty.exception.SandboxFilesystemNotADirectoryError

```python
class SandboxFilesystemNotADirectoryError(boxty.exception.SandboxFilesystemError)
```

Raised when a path component in the sandbox is not a directory.

## boxty.exception.SandboxFilesystemNotFoundError

```python
class SandboxFilesystemNotFoundError(boxty.exception.SandboxFilesystemError)
```

Raised when a file or directory is not found in the sandbox.

## boxty.exception.SandboxFilesystemPathAlreadyExistsError

```python
class SandboxFilesystemPathAlreadyExistsError(boxty.exception.SandboxFilesystemError)
```

Raised when a path already exists and the operation requires it to be absent.

## boxty.exception.SandboxFilesystemPermissionError

```python
class SandboxFilesystemPermissionError(boxty.exception.SandboxFilesystemError)
```

Raised when permission is denied for a file operation in the sandbox.

## boxty.exception.SandboxTerminatedError

```python
class SandboxTerminatedError(boxty.exception.Error)
```

Raised when a Sandbox is terminated for an internal reason.

## boxty.exception.SandboxTimeoutError

```python
class SandboxTimeoutError(boxty.exception.TimeoutError)
```

Raised when a Sandbox exceeds its execution duration limit and times out.

## boxty.exception.SerializationError

```python
class SerializationError(boxty.exception.Error)
```

Raised to provide more context when an error is encountered during serialization.

## boxty.exception.ServerWarning

```python
class ServerWarning(UserWarning)
```

Warning originating from the Boxty server and re-issued in client code.

## boxty.exception.ServiceError

```python
class ServiceError(boxty.exception.Error, boxty.exception._GRPCErrorWrapper)
```

Raised when an error occurs in basic client/server communication.

```python
__init__(self, message=None)
```

### message

```python
message(self)
```

### status

```python
status(self)
```

### details

```python
details(self)
```

## boxty.exception.TimeoutError

```python
class TimeoutError(boxty.exception.Error)
```

Base class for Boxty timeouts.

## boxty.exception.UnimplementedError

```python
class UnimplementedError(boxty.exception.Error, boxty.exception._GRPCErrorWrapper)
```

Raised when a requested operation is not implemented or not supported.

```python
__init__(self, message=None)
```

### message

```python
message(self)
```

### status

```python
status(self)
```

### details

```python
details(self)
```

## boxty.exception.VersionError

```python
class VersionError(boxty.exception.Error)
```

Raised when the current client version of Boxty is unsupported.

## boxty.exception.VolumeUploadTimeoutError

```python
class VolumeUploadTimeoutError(boxty.exception.TimeoutError)
```

Raised when a Volume upload times out.

## boxty.exception.WorkspaceManagementError

```python
class WorkspaceManagementError(boxty.exception.Error)
```

Raised when an error occurs while managing a workspace.

## boxty.exception.simulate_preemption

```python
simulate_preemption(wait_seconds, jitter_seconds=0)
```

Utility for simulating a preemption interrupt after wait_seconds seconds. The first interrupt is the SIGINT signal. After 30 seconds, a second interrupt will trigger.

This second interrupt simulates SIGKILL, and should not be caught. Optionally add between zero and jitter_seconds seconds of additional waiting before first interrupt.

### Usage

```python
import time
from boxty.exception import simulate_preemption

simulate_preemption(3)

try:
    time.sleep(4)
except KeyboardInterrupt:
    print("got preempted") # Handle interrupt
    raise
```

See https://boxty.com/docs/guide/preemption for more details on preemption handling.
