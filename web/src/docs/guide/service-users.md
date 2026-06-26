# Service users

Boxty Service Users provide API access for automated systems.

## Create a Service User

Create a service user for CI/CD pipelines, monitoring systems, or other automated tools:

1. Go to Settings > Service Users
2. Click "Create Service User"
3. Enter a name and description
4. Assign roles and permissions
5. Generate an API token

Use the service user token for API authentication:

```bash
curl -H "Authorization: Token $BOXTY_SERVICE_TOKEN"   https://api.boxty.com/v1/apps
```

Service users are billed to the workspace and can be deactivated at any time.
