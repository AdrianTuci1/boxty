output "r2_bucket_name" {
  description = "Cloudflare R2 bucket name"
  value       = cloudflare_r2_bucket.boxty.name
}

output "r2_public_base_url" {
  description = "Public base URL for R2 objects"
  value       = "https://${var.cli_fqdn}"
}

output "r2_access_key_id" {
  description = "R2 access key ID"
  value       = cloudflare_api_token.r2_control_plane.id
  sensitive   = true
}

output "r2_secret_access_key" {
  description = "R2 secret access key"
  value       = cloudflare_api_token.r2_control_plane.value
  sensitive   = true
}
