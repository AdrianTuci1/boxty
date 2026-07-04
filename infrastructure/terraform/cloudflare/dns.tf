resource "cloudflare_record" "control_plane" {
  zone_id = var.cloudflare_zone_id
  name    = var.control_plane_fqdn
  content = var.control_plane_ip
  type    = "A"
  proxied = true
  ttl     = 1
}

resource "cloudflare_record" "cli" {
  zone_id = var.cloudflare_zone_id
  name    = var.cli_fqdn
  content = var.control_plane_ip
  type    = "A"
  proxied = true
  ttl     = 1
}

resource "cloudflare_record" "web" {
  zone_id = var.cloudflare_zone_id
  name    = var.web_fqdn
  content = var.control_plane_ip
  type    = "A"
  proxied = true
  ttl     = 1
}

resource "cloudflare_record" "landing" {
  zone_id = var.cloudflare_zone_id
  name    = var.landing_fqdn
  content = var.control_plane_ip
  type    = "A"
  proxied = true
  ttl     = 1
}

resource "cloudflare_record" "wildcard" {
  zone_id = var.cloudflare_zone_id
  name    = "*.${var.domain}"
  content = var.control_plane_ip
  type    = "A"
  proxied = true
  ttl     = 1
}
