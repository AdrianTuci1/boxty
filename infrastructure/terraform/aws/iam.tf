resource "aws_iam_user" "control_plane" {
  name = "boxty-control-plane-${var.environment}"
  path = "/boxty/"
}

resource "aws_iam_access_key" "control_plane" {
  user = aws_iam_user.control_plane.name
}

resource "aws_iam_user_policy" "control_plane_dynamodb" {
  name = "boxty-control-plane-dynamodb-${var.environment}"
  user = aws_iam_user.control_plane.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "BoxtyDynamoDBLimited"
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem"
        ]
        Resource = aws_dynamodb_table.boxty.arn
      }
    ]
  })
}
