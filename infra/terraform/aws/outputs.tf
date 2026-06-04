output "dynamodb_arn" {
  description = "ARN of the DynamoDB table"
  value       = aws_dynamodb_table.boxty.arn
}

output "ecr_repo_url" {
  description = "URL of the ECR repository"
  value       = aws_ecr_repository.boxty_images.repository_url
}

output "s3_bucket_names" {
  description = "Names of created S3 buckets"
  value = [
    aws_s3_bucket.snapshots.bucket,
    aws_s3_bucket.images.bucket,
  ]
}
