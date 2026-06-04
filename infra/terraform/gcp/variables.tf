variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "api_url" {
  description = "Boxty API URL"
  type        = string
}

variable "worker_api_key" {
  description = "Worker API key"
  type        = string
  sensitive   = true
}
