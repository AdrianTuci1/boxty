import dotenv from 'dotenv';
dotenv.config();

export const config = {
  PORT: parseInt(process.env.PORT || '3000'),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // DynamoDB
  DYNAMODB_ENDPOINT: process.env.DYNAMODB_ENDPOINT, // localhost:8000 for local dev
  DYNAMODB_REGION: process.env.DYNAMODB_REGION || 'us-east-1',
  DYNAMODB_TABLE: process.env.DYNAMODB_TABLE || 'boxty',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',

  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,

  // Worker communication
  WORKER_API_KEY: process.env.WORKER_API_KEY || 'boxty-worker-secret',

  // Cloud provider credentials
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  GCP_SERVICE_ACCOUNT: process.env.GCP_SERVICE_ACCOUNT,
  AZURE_SUBSCRIPTION_ID: process.env.AZURE_SUBSCRIPTION_ID,

  // S3
  S3_BUCKET_SNAPSHOTS: process.env.S3_BUCKET_SNAPSHOTS || 'boxty-snapshots',
  S3_BUCKET_IMAGES: process.env.S3_BUCKET_IMAGES || 'boxty-images',

  // Billing defaults
  FREE_TRIAL_CREDITS: parseInt(process.env.FREE_TRIAL_CREDITS || '1000'),
  CREDIT_COST_PER_MINUTE: {
    CPU_BASE: 1,        // 1 credit/min pentru 1 vCPU / 2GB
    CPU_4: 4,
    CPU_8: 8,
    GPU_T4: 15,
    GPU_A100: 60,
    GPU_H100: 90,
  },

  // Idle timeout
  IDLE_TIMEOUT_SECONDS: parseInt(process.env.IDLE_TIMEOUT_SECONDS || '300'), // 5 min

  // Worker provisioning
  WORKER_PROVISIONING_ENABLED: process.env.WORKER_PROVISIONING_ENABLED === 'true',
  WORKER_MIN_CPUS: parseInt(process.env.WORKER_MIN_CPUS || '8'),
  WORKER_MIN_MEMORY_GB: parseInt(process.env.WORKER_MIN_MEMORY_GB || '32'),
};
