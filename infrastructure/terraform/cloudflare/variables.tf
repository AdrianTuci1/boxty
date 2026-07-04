variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID"
  type        = string
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone ID"
  type        = string
}

variable "domain" {
  description = "Base domain"
  type        = string
}

variable "control_plane_fqdn" {
  description = "Control plane fully qualified domain name"
  type        = string
}

variable "control_plane_ip" {
  description = "Public IP of the existing control plane VPS"
  type        = string
}

variable "cli_fqdn" {
  description = "CLI download fully qualified domain name"
  type        = string
}

variable "web_fqdn" {
  description = "Web dashboard fully qualified domain name"
  type        = string
}

variable "landing_fqdn" {
  description = "Landing page fully qualified domain name"
  type        = string
}

variable "r2_bucket_name" {
  description = "Cloudflare R2 bucket name"
  type        = string
}
