resource "aws_dynamodb_table" "boxty" {
  name         = var.dynamodb_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"
  range_key    = "sk"

  attribute {
    name = "pk"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  attribute {
    name = "entity_type"
    type = "S"
  }

  attribute {
    name = "workspace_id"
    type = "S"
  }

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "provider_id"
    type = "S"
  }

  global_secondary_index {
    name            = "entity-type-index"
    hash_key        = "entity_type"
    range_key       = "pk"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "workspace-index"
    hash_key        = "workspace_id"
    range_key       = "sk"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "user-index"
    hash_key        = "user_id"
    range_key       = "sk"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "provider-index"
    hash_key        = "provider_id"
    range_key       = "sk"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = {
    Name = var.dynamodb_table_name
  }
}
