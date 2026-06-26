# Feature maturity

Boxty uses a release phase system to indicate the maturity of features.

## Release Phases

| Phase | Description |
|-------|-------------|
| Experimental | Early access, may change significantly |
| Beta | Feature-complete, testing in production |
| GA | Generally available, fully supported |
| Deprecated | Will be removed in a future version |

## Experimental SDK

Experimental features are available in the `boxty.experimental` module. These features may change or be removed without notice.

```python
from boxty.experimental import new_feature
```

Use experimental features at your own risk and provide feedback to help us improve them.
