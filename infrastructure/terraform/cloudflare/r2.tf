resource "cloudflare_r2_bucket" "boxty" {
  account_id = var.cloudflare_account_id
  name       = var.r2_bucket_name
  location   = "ENAM"
}

resource "cloudflare_api_token" "r2_control_plane" {
  name = "boxty-r2-control-plane-${var.environment}"

  policy {
    permission_groups = [
      data.cloudflare_api_token_permission_groups.all.r2["Workers R2 Storage Bucket Item Read"],
      data.cloudflare_api_token_permission_groups.all.r2["Workers R2 Storage Bucket Item Write"],
    ]
    resources = {
      "com.cloudflare.api.account.${var.cloudflare_account_id}" = "*"
    }
  }
}

data "cloudflare_api_token_permission_groups" "all" {}
