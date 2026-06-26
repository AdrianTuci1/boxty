# Boxty DynamoDB Single Table Design

Boxty should persist control-plane state in a single DynamoDB table.

## Table

- Table name: `boxty-control-plane`
- Partition key: `pk`
- Sort key: `sk`

## Entity patterns

- `USER#{user_id}` / `PROFILE`
- `USER#{user_id}` / `ACCOUNT`
- `WORKSPACE#{workspace_id}` / `PROFILE`
- `WORKSPACE#{workspace_id}` / `ENVIRONMENT#{environment_id}`
- `WORKSPACE#{workspace_id}` / `APIKEY#{api_key_id}`
- `WORKSPACE#{workspace_id}` / `INVITE#{invite_id}`
- `WORKSPACE#{workspace_id}` / `WORKLOAD#{workload_id}`
- `PROVIDER#{provider_id}` / `PROFILE`
- `ROUTE#{route_id}` / `PROFILE`

## Default tenancy behavior

On account creation:

- create a default workspace named exactly like `external_user_id`
- create a default environment named `main`
- mark both as default and prevent deletion unless the account itself is deleted

## Access patterns

- fetch all state for a user account
- list workspaces for a user
- list environments, api keys, invites, and workloads for a workspace
- fetch provider by id
- fetch route by id

## Current implementation note

The repository currently exposes the item layout through the in-memory control-plane store and the `/v1/admin/dynamodb-items` endpoint. The next step is replacing in-memory dictionaries with a DynamoDB adapter while preserving the same entity shapes.
