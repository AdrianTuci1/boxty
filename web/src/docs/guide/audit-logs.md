# Audit Logs

Audit logs are available on the Enterprise plan. Contact sales@boxty.com for more information.

Audit logs give your workspace an append-only record of the sensitive actions that change its state — who did what, when, to which resource, and from where. They are designed for compliance reviews, incident investigation, and answering questions like "did anyone delete this Secret last Thursday?" without asking Boxty support.

Audit logs are viewable within the settings page.

## Fields

Every audit event captures the same shape alongside the time it occurred:

| Field | What it is |
|-------|-----------|
| action | The kind of change that happened — e.g. secret.create, app.deploy. See the full list below. |
| actor | The user or service user that initiated the action. |
| targets | The resource(s) the action affected, each recorded by ID so the event stays attributable after a rename or delete. |
| context.environment | The environment the action was scoped to. |
| context.ip_address | The client IP address. |
| context.source | web for the dashboard, sdk for the Boxty CLI and client libraries. |
| status | Whether the action succeeded or failed. |
| metadata | Action-specific extra fields — e.g. the old and new budget values for workspace.set_budget, or the requested region for a Proxy. |

## Filtering

Filters are entered in the search bar above the table as key:value pairs, separated by spaces. Any filter can be negated by prefixing it with - to exclude matching events. The search bar autocompletes keys and values as you type.

For example:

| Filter | Matches |
|--------|---------|
| action:secret.create | Every Secret created in the selected time range. |
| -status:success | All actions that did not succeed. |
| action:volume.delete -actor_type:service | Volume deletions by non-service users. |

## Actions

The table below lists every action currently recorded. New actions will be added as additional workspace operations are instrumented.

Note: container runtime activity is not currently included in audit logs.
