output "dynamodb_table_name" {
  description = "DynamoDB single table name"
  value       = module.aws.dynamodb_table_name
}

output "dynamodb_table_arn" {
  description = "DynamoDB single table ARN"
  value       = module.aws.dynamodb_table_arn
}

output "control_plane_iam_access_key_id" {
  description = "AWS access key ID for the control plane"
  value       = module.aws.control_plane_access_key_id
  sensitive   = true
}

output "control_plane_iam_secret_access_key" {
  description = "AWS secret access key for the control plane"
  value       = module.aws.control_plane_secret_access_key
  sensitive   = true
}

output "r2_bucket_name" {
  description = "Cloudflare R2 bucket name"
  value       = module.cloudflare.r2_bucket_name
}

output "r2_public_base_url" {
  description = "Public base URL for R2 objects"
  value       = module.cloudflare.r2_public_base_url
}

output "r2_access_key_id" {
  description = "R2 access key ID"
  value       = module.cloudflare.r2_access_key_id
  sensitive   = true
}

output "r2_secret_access_key" {
  description = "R2 secret access key"
  value       = module.cloudflare.r2_secret_access_key
  sensitive   = true
}

output "control_plane_fqdn" {
  description = "Control plane fully qualified domain name"
  value       = local.control_plane_fqdn
}

output "cli_fqdn" {
  description = "CLI download fully qualified domain name"
  value       = local.cli_fqdn
}

output "web_fqdn" {
  description = "Web dashboard fully qualified domain name"
  value       = local.web_fqdn
}

output "landing_fqdn" {
  description = "Landing page fully qualified domain name"
  value       = local.landing_fqdn
}
