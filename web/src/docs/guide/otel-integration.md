# Connecting Boxty to your OpenTelemetry provider

Boxty integrates with OpenTelemetry for distributed tracing and metrics.

## What this integration does

The OpenTelemetry integration sends Boxty traces and metrics to your OTLP-compatible backend, allowing you to monitor your Boxty applications with your existing observability stack.

## Metrics

The following metrics are sent via OpenTelemetry:

- Function execution count
- Function execution duration
- Container startup time
- GPU utilization
- Memory usage
- Disk usage
- Queue depth

Configure the integration in Settings > Integrations > OpenTelemetry.
