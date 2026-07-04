variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["production", "staging"], var.environment)
    error_message = "Environment must be production or staging."
  }
}

variable "aws_region" {
  description = "AWS region for DynamoDB and S3 state backend"
  type        = string
  default     = "eu-central-1"
}

variable "dynamodb_table_name" {
  description = "DynamoDB single table name"
  type        = string
  default     = "boxty-control-plane"
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID"
  type        = string
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token with DNS and R2 permissions"
  type        = string
  sensitive   = true
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone ID for the domain"
  type        = string
}

variable "domain" {
  description = "Base domain for Boxty services"
  type        = string
  default     = "boxty.dev"
}

variable "control_plane_subdomain" {
  description = "Subdomain for the control plane API"
  type        = string
  default     = "control"
}

variable "cli_subdomain" {
  description = "Subdomain for CLI binary downloads"
  type        = string
  default     = "cli"
}

variable "web_subdomain" {
  description = "Subdomain for the web dashboard"
  type        = string
  default     = "app"
}

variable "landing_subdomain" {
  description = "Subdomain for the landing page"
  type        = string
  default     = "www"
}

variable "r2_bucket_name" {
  description = "Cloudflare R2 bucket name for object storage and CLI artifacts"
  type        = string
  default     = "boxty"
}

variable "control_plane_ip" {
  description = "Public IP of the existing control plane VPS"
  type        = string
}
