import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  dynamodb: {
    endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000',
    region: process.env.DYNAMODB_REGION || 'us-east-1',
    table: process.env.DYNAMODB_TABLE || 'boxty',
  },
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  workerApiKey: process.env.WORKER_API_KEY || 'boxty-worker-secret',
  s3: {
    snapshots: process.env.S3_BUCKET_SNAPSHOTS || 'boxty-snapshots',
    images: process.env.S3_BUCKET_IMAGES || 'boxty-images',
    volumes: process.env.S3_BUCKET_VOLUMES || 'boxty-volumes',
  },
  ephemeralDiskDefaultGb: parseInt(process.env.EPHEMERAL_DISK_DEFAULT_GB || '10', 10),
  idleTimeoutSeconds: parseInt(process.env.IDLE_TIMEOUT_SECONDS || '300', 10),
  imageRegistry: process.env.IMAGE_REGISTRY || 'registry.boxty.dev',
  freeTrialCredits: parseInt(process.env.FREE_TRIAL_CREDITS || '1000', 10),
  buildWorkerMaxBuilds: parseInt(process.env.BUILD_WORKER_MAX_BUILDS || '2', 10),
  cloud: {
    defaultProvider: process.env.DEFAULT_CLOUD_PROVIDER || 'aws',
    defaultRegion: process.env.DEFAULT_REGION || 'us-east-1',
    instanceProfile: process.env.WORKER_IAM_PROFILE || 'BoxtyWorkerProfile',
    workerImageId: process.env.WORKER_AMI_ID || 'ami-0c02fb55956c7d316',
  },
};
