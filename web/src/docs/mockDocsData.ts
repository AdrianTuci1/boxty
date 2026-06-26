export interface DocHeading {
  label: string;
  slug: string;
  level: number;
}

export const docHeadingsMap: Record<string, DocHeading[]> = {
  'introduction': [
    { label: 'Introduction', slug: 'introduction', level: 1 },
    { label: 'How does it work?', slug: 'how-does-it-work', level: 2 },
    { label: 'Quickstart', slug: 'quickstart', level: 2 },
    { label: 'Prerequisites', slug: 'prerequisites', level: 2 },
  ],
  'apps': [
    { label: 'Ephemeral Apps', slug: 'ephemeral-apps', level: 2 },
    { label: 'Deployed Apps', slug: 'deployed-apps', level: 2 },
    { label: 'Entrypoints for ephemeral Apps', slug: 'entrypoints-for-ephemeral-apps', level: 2 },
    { label: 'Argument parsing', slug: 'argument-parsing', level: 3 },
    { label: 'Manually specifying an entrypoint', slug: 'manually-specifying-an-entrypoint', level: 3 },
    { label: 'Apps were once Stubs', slug: 'apps-were-once-stubs', level: 2 },
  ],
  'async': [
    { label: 'Async functions', slug: 'async-functions', level: 2 },
  ],
  'audit-logs': [
    { label: 'Fields', slug: 'fields', level: 2 },
    { label: 'Filtering', slug: 'filtering', level: 2 },
    { label: 'Actions', slug: 'actions', level: 2 },
  ],
  'batch-processing': [
    { label: 'Background Execution with .spawn_map', slug: 'background-execution-with-spawn-map', level: 2 },
    { label: 'Parallel Processing with .map', slug: 'parallel-processing-with-map', level: 2 },
  ],
  'billing': [
    { label: 'Billing frequency and incremental billing', slug: 'billing-frequency-and-incremental-billing', level: 2 },
    { label: 'Budgets', slug: 'budgets', level: 2 },
    { label: 'Updating billing information', slug: 'updating-billing-information', level: 2 },
    { label: 'Viewing invoice history', slug: 'viewing-invoice-history', level: 2 },
    { label: 'Generating billing reports', slug: 'generating-billing-reports', level: 2 },
  ],
  'cloud-bucket-mounts': [
    { label: 'Mounting Cloudflare R2 buckets', slug: 'mounting-cloudflare-r2-buckets', level: 2 },
    { label: 'Mounting Google Cloud Storage buckets', slug: 'mounting-google-cloud-storage-buckets', level: 2 },
    { label: 'Mounting S3 buckets', slug: 'mounting-s3-buckets', level: 2 },
    { label: 'Specifying S3 bucket region', slug: 'specifying-s3-bucket-region', level: 2 },
  ],
  'cold-start': [
    { label: 'What is a cold start?', slug: 'what-is-a-cold-start', level: 2 },
    { label: 'Reduce time spent queueing for warm containers', slug: 'reduce-time-spent-queueing-for-warm-containers', level: 2 },
  ],
  'concurrent-inputs': [
    { label: 'Overview', slug: 'overview', level: 2 },
    { label: 'Use cases', slug: 'use-cases', level: 2 },
  ],
  'continuous-deployment': [
    { label: 'GitHub Actions', slug: 'github-actions', level: 2 },
  ],
  'cron': [
    { label: 'Basic scheduling', slug: 'basic-scheduling', level: 2 },
    { label: 'Monitoring your scheduled runs', slug: 'monitoring-your-scheduled-runs', level: 2 },
    { label: 'Schedule types', slug: 'schedule-types', level: 2 },
  ],
  'cuda': [
    { label: 'What is CUDA?', slug: 'what-is-cuda', level: 2 },
  ],
  'customer-supplied-encryption-keys': [
    { label: 'How CSEK works', slug: 'how-csek-works', level: 2 },
    { label: 'Supported resources', slug: 'supported-resources', level: 2 },
  ],
  'datadog-integration': [
    { label: 'What this integration does', slug: 'what-this-integration-does', level: 2 },
    { label: 'Installing the integration', slug: 'installing-the-integration', level: 2 },
    { label: 'Metrics', slug: 'metrics', level: 2 },
  ],
  'dataset-ingestion': [
    { label: 'Configure your Function for heavy disk usage', slug: 'configure-your-function-for-heavy-disk-usage', level: 2 },
  ],
  'developing-debugging': [
    { label: 'Interactivity', slug: 'interactivity', level: 2 },
  ],
  'developing-with-llms': [
    { label: 'Boxty Rules and Guidelines for LLMs', slug: 'boxty-rules-and-guidelines-for-llms', level: 2 },
  ],
  'dicts': [
    { label: 'Boxty Dicts are Python dicts in the cloud', slug: 'boxty-dicts-are-python-dicts-in-the-cloud', level: 2 },
  ],
  'dynamic-batching': [
    { label: 'Enable dynamic batching with @batched', slug: 'enable-dynamic-batching-with-batched', level: 2 },
  ],
  'dynamic-function-config': [
    { label: 'Basic configuration', slug: 'basic-configuration', level: 2 },
  ],
  'endpoint-benchmarks': [
    { label: 'Workload patterns', slug: 'workload-patterns', level: 2 },
    { label: 'Endpoint preview benchmarks', slug: 'endpoint-preview-benchmarks', level: 2 },
  ],
  'endpoint-metrics': [
    { label: 'What the metrics mean', slug: 'what-the-metrics-mean', level: 2 },
  ],
  'endpoints': [
    { label: 'Getting started', slug: 'getting-started', level: 2 },
    { label: 'Proxy tokens', slug: 'proxy-tokens', level: 2 },
  ],
  'environment_variables': [
    { label: 'Container runtime environment variables', slug: 'container-runtime-environment-variables', level: 2 },
  ],
  'environments': [
    { label: 'Create a Workspace', slug: 'create-a-workspace', level: 2 },
  ],
  'existing-images': [
    { label: 'Load an image from a public registry with .from_registry', slug: 'load-an-image-from-a-public-registry-with-from-registry', level: 2 },
  ],
  'fast-pull-from-registry': [
    { label: 'How to use estargz', slug: 'how-to-use-estargz', level: 2 },
  ],
  'feature-maturity': [
    { label: 'Release Phases', slug: 'release-phases', level: 2 },
    { label: 'Experimental SDK', slug: 'experimental-sdk', level: 2 },
  ],
  'global-variables': [
    { label: 'Warning about regular module globals', slug: 'warning-about-regular-module-globals', level: 2 },
  ],
  'gpu': [
    { label: 'Quickstart', slug: 'quickstart', level: 2 },
    { label: 'Specifying GPU type', slug: 'specifying-gpu-type', level: 2 },
    { label: 'Specifying GPU count', slug: 'specifying-gpu-count', level: 2 },
    { label: 'Picking a GPU', slug: 'picking-a-gpu', level: 2 },
  ],
  'gpu-health': [
    { label: '[gpu-health] logging', slug: 'gpu-health-logging', level: 2 },
  ],
  'gpu-metrics': [
    { label: 'GPU utilization %', slug: 'gpu-utilization', level: 2 },
  ],
  'high-performance-llm-inference': [
    { label: 'Achieving high throughput LLM inference (TPS)', slug: 'achieving-high-throughput-llm-inference-tps', level: 2 },
  ],
  'images': [
    { label: 'What are Images?', slug: 'what-are-images', level: 2 },
  ],
  'job-queue': [
    { label: 'Creating jobs with .spawn()', slug: 'creating-jobs-with-spawn', level: 2 },
  ],
  'jupyter-notebooks': [
    { label: 'Boxty inside Jupyter', slug: 'boxty-inside-jupyter', level: 2 },
    { label: 'Jupyter inside Boxty', slug: 'jupyter-inside-boxty', level: 2 },
  ],
  'lifecycle-functions': [
    { label: '@boxty.enter', slug: 'boxty-enter', level: 2 },
  ],
  'local-data': [
    { label: 'Passing function arguments', slug: 'passing-function-arguments', level: 2 },
    { label: 'Including local files', slug: 'including-local-files', level: 2 },
  ],
  'managing-deployments': [
    { label: 'Creating deployments', slug: 'creating-deployments', level: 2 },
  ],
  'memory-snapshots': [
    { label: 'CPU Memory Snapshots', slug: 'cpu-memory-snapshots', level: 2 },
  ],
  'modal-1-0-migration': [
    { label: 'Deprecating Image.copy_* methods', slug: 'deprecating-image-copy-methods', level: 2 },
  ],
  'modal-user-account-setup': [
    { label: 'What GitHub permissions does signing up require?', slug: 'what-github-permissions-does-signing-up-require', level: 2 },
  ],
  'model-weights': [
    { label: 'Storing weights in a Boxty Volume', slug: 'storing-weights-in-a-boxty-volume', level: 2 },
  ],
  'multi-node-training': [
    { label: 'Cluster compute capability', slug: 'cluster-compute-capability', level: 2 },
    { label: '@clustered', slug: 'clustered', level: 2 },
  ],
  'named-images': [
    { label: 'Publishing an Image from a script', slug: 'publishing-an-image-from-a-script', level: 2 },
  ],
  'notebooks': [
    { label: 'Getting started', slug: 'getting-started', level: 2 },
    { label: 'Kernel resources', slug: 'kernel-resources', level: 2 },
  ],
  'oidc-integration': [
    { label: 'How it works', slug: 'how-it-works', level: 2 },
  ],
  'okta-sso': [
    { label: 'Prerequisites', slug: 'prerequisites', level: 2 },
    { label: 'Configuration', slug: 'configuration', level: 2 },
  ],
  'otel-integration': [
    { label: 'What this integration does', slug: 'what-this-integration-does', level: 2 },
    { label: 'Metrics', slug: 'metrics', level: 2 },
  ],
  'parametrized-functions': [
    { label: 'Function calls for each unique combination', slug: 'function-calls-for-each-unique-combination', level: 2 },
  ],
  'preemption': [
    { label: 'Preparing for interruptions', slug: 'preparing-for-interruptions', level: 2 },
    { label: 'Non-preemptible Functions', slug: 'non-preemptible-functions', level: 2 },
  ],
  'private-networking': [
    { label: 'Private networking', slug: 'private-networking', level: 2 },
    { label: 'Region boundaries', slug: 'region-boundaries', level: 2 },
  ],
  'project-structure': [
    { label: 'Apps spanning multiple files', slug: 'apps-spanning-multiple-files', level: 2 },
    { label: 'Defining your project as a Python package', slug: 'defining-your-project-as-a-python-package', level: 2 },
  ],
  'proxy-ips': [
    { label: 'Creating a Proxy', slug: 'creating-a-proxy', level: 2 },
    { label: 'Using a Proxy', slug: 'using-a-proxy', level: 2 },
  ],
  'queues': [
    { label: 'Boxty Queues are Python queues in the cloud', slug: 'boxty-queues-are-python-queues-in-the-cloud', level: 2 },
  ],
  'rbac': [
    { label: 'Workspace Roles', slug: 'workspace-roles', level: 2 },
    { label: 'Environment Roles', slug: 'environment-roles', level: 2 },
  ],
  'region-selection': [
    { label: 'Specifying a container region', slug: 'specifying-a-container-region', level: 2 },
    { label: 'Pricing', slug: 'pricing', level: 2 },
  ],
  'resources': [
    { label: 'CPU cores', slug: 'cpu-cores', level: 2 },
    { label: 'Memory', slug: 'memory', level: 2 },
  ],
  'restricted-access': [
    { label: 'Create a Restricted Function', slug: 'create-a-restricted-function', level: 2 },
  ],
  'retries': [
    { label: 'Automatically recover from flakes with retries', slug: 'automatically-recover-from-flakes-with-retries', level: 2 },
  ],
  's3-gateway-endpoints': [
    { label: 'Endpoint configuration', slug: 'endpoint-configuration', level: 2 },
  ],
  'saml-sso': [
    { label: 'Prerequisites', slug: 'prerequisites', level: 2 },
    { label: 'Configuration', slug: 'configuration', level: 2 },
  ],
  'sandbox-files': [
    { label: 'Filesystem API', slug: 'filesystem-api', level: 2 },
  ],
  'sandbox-networking': [
    { label: 'Outbound access control', slug: 'outbound-access-control', level: 2 },
  ],
  'sandbox-resources': [
    { label: 'Pay for what you use', slug: 'pay-for-what-you-use', level: 2 },
  ],
  'sandbox-snapshots': [
    { label: 'Snapshot Retention', slug: 'snapshot-retention', level: 2 },
  ],
  'sandbox-spawn': [
    { label: 'Input', slug: 'input', level: 2 },
    { label: 'Output', slug: 'output', level: 2 },
  ],
  'sandboxes': [
    { label: 'What are Sandboxes and why should I use them?', slug: 'what-are-sandboxes-and-why-should-i-use-them', level: 2 },
    { label: 'Lifecycle', slug: 'lifecycle', level: 2 },
  ],
  'scale': [
    { label: 'How does autoscaling work on Boxty?', slug: 'how-does-autoscaling-work-on-boxty', level: 2 },
    { label: 'Configuring autoscaling behavior', slug: 'configuring-autoscaling-behavior', level: 2 },
  ],
  'sdk-javascript-go': [
    { label: 'Installation', slug: 'installation', level: 2 },
  ],
  'secrets': [
    { label: 'Limits', slug: 'limits', level: 2 },
    { label: 'Deploy Secrets from the Boxty Dashboard', slug: 'deploy-secrets-from-the-boxty-dashboard', level: 2 },
  ],
  'security': [
    { label: 'Application security (AppSec)', slug: 'application-security-appsec', level: 2 },
    { label: 'Corporate security (CorpSec)', slug: 'corporate-security-corpsec', level: 2 },
  ],
  'servers': [
    { label: 'Defining a Server', slug: 'defining-a-server', level: 2 },
  ],
  'service-users': [
    { label: 'Create a Service User', slug: 'create-a-service-user', level: 2 },
  ],
  'slack-notifications': [
    { label: 'Prerequisites', slug: 'prerequisites', level: 2 },
    { label: 'Configuration', slug: 'configuration', level: 2 },
  ],
  'streaming-endpoints': [
    { label: 'Simple example', slug: 'simple-example', level: 2 },
  ],
  'timeouts': [
    { label: 'Container startup timeout', slug: 'container-startup-timeout', level: 2 },
    { label: 'Handling timeouts', slug: 'handling-timeouts', level: 2 },
  ],
  'trigger-deployed-functions': [
    { label: 'Invoking with Python', slug: 'invoking-with-python', level: 2 },
    { label: 'Authentication', slug: 'authentication', level: 2 },
  ],
  'troubleshooting': [
    { label: 'Command not found errors', slug: 'command-not-found-errors', level: 2 },
  ],
  'tunnels': [
    { label: 'Build with tunnels', slug: 'build-with-tunnels', level: 2 },
  ],
  'vm-sandboxes': [
    { label: 'Improvements over gVisor sandboxes', slug: 'improvements-over-gvisor-sandboxes', level: 2 },
  ],
  'volumes': [
    { label: 'Creating a Volume', slug: 'creating-a-volume', level: 2 },
    { label: 'Using a Volume on Boxty', slug: 'using-a-volume-on-boxty', level: 2 },
  ],
  'webhook-proxy-auth': [
    { label: 'Restricting tokens to specific Environments', slug: 'restricting-tokens-to-specific-environments', level: 2 },
  ],
  'webhook-timeouts': [
    { label: 'Polling solutions', slug: 'polling-solutions', level: 2 },
  ],
  'webhook-urls': [
    { label: 'Determine the Web Function URL from code', slug: 'determine-the-web-function-url-from-code', level: 2 },
  ],
  'webhooks': [
    { label: 'Simple endpoints', slug: 'simple-endpoints', level: 2 },
    { label: 'Developing with boxty serve', slug: 'developing-with-boxty-serve', level: 2 },
  ],
  'workspaces': [
    { label: 'Create a Workspace', slug: 'create-a-workspace', level: 2 },
  ],
};
