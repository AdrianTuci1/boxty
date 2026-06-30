output "dynamodb_table_name" {
  description = "DynamoDB single table name"
  value       = aws_dynamodb_table.boxty.name
}

output "dynamodb_table_arn" {
  description = "DynamoDB single table ARN"
  value       = aws_dynamodb_table.boxty.arn
}

output "control_plane_access_key_id" {
  description = "AWS access key ID for the control plane"
  value       = aws_iam_access_key.control_plane.id
}

output "control_plane_secret_access_key" {
  description = "AWS secret access key for the control plane"
  value       = aws_iam_access_key.control_plane.secret
  sensitive   = true
}
