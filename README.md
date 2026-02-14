# n8n-nodes-aws-ecs

An [n8n](https://n8n.io/) community node for managing AWS ECS (Elastic Container Service) deployments.

## Features

- **Force New Deployment** — Trigger a force redeployment of any ECS service with a single node.
- **Optional Desired Count** — Optionally set the number of desired task instances during deployment. If not specified, the service retains its current desired count.
- **Dynamic Dropdowns** — Cluster and service fields are populated dynamically from your AWS account (with pagination support for services).

## Installation

### In n8n (Community Nodes)

1. Go to **Settings > Community Nodes**.
2. Select **Install**.
3. Enter `@bihan_c/n8n-nodes-aws-ecs` and click **Install**.

### Manual Installation

```bash
cd ~/.n8n/nodes
npm install @bihan_c/n8n-nodes-aws-ecs
```

Restart n8n after installation.

## Prerequisites

- An **AWS** credential configured in n8n ([docs](https://docs.n8n.io/integrations/builtin/credentials/aws/)).
- The AWS IAM user/role must have the following ECS permissions:
  - `ecs:ListClusters`
  - `ecs:ListServices`
  - `ecs:UpdateService`

## Node Reference

### Operation: Force New Deployment

Triggers a force new deployment on an ECS service using the AWS `UpdateService` API with `forceNewDeployment: true`.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **Cluster Name or ID** | Dropdown | Yes | The ECS cluster that hosts the service. Populated dynamically from your AWS account. |
| **Service Name or ID** | Dropdown | Yes | The ECS service to redeploy. Populated dynamically based on the selected cluster. |
| **Desired Count** | Number | No | The number of desired task instances. Set to `-1` (default) to keep the current count unchanged. Set to `0` or above to update the desired count during deployment. |

### Output

The node returns the full AWS `UpdateService` API response, which includes the updated service configuration and deployment details.

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Lint
npm run lint

# Dev mode (watch + linked to local n8n)
npm run dev
```

## License

[MIT](LICENSE)

