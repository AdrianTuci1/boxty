locals {
  control_plane_fqdn = "${var.control_plane_subdomain}.${var.domain}"
  cli_fqdn           = "${var.cli_subdomain}.${var.domain}"
  web_fqdn           = "${var.web_subdomain}.${var.domain}"
  landing_fqdn       = var.landing_subdomain == "www" ? var.domain : "${var.landing_subdomain}.${var.domain}"
}

module "aws" {
  source = "./aws"

  environment         = var.environment
  aws_region          = var.aws_region
  dynamodb_table_name = var.dynamodb_table_name
}

module "cloudflare" {
  source = "./cloudflare"

  environment             = var.environment
  cloudflare_account_id   = var.cloudflare_account_id
  cloudflare_zone_id      = var.cloudflare_zone_id
  domain                  = var.domain
  control_plane_fqdn      = local.control_plane_fqdn
  control_plane_ip        = var.control_plane_ip
  cli_fqdn                = local.cli_fqdn
  web_fqdn                = local.web_fqdn
  landing_fqdn            = local.landing_fqdn
  r2_bucket_name          = var.r2_bucket_name
}
