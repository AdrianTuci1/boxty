terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}

data "aws_ami" "boxty_worker" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/*ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "root-device-type"
    values = ["ebs"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_iam_role" "worker" {
  name = "boxty-worker-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_instance_profile" "worker" {
  name = "boxty-worker-profile-${var.environment}"
  role = aws_iam_role.worker.name
}

resource "aws_iam_role_policy_attachment" "worker_ecr_push" {
  role       = aws_iam_role.worker.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser"
}

resource "aws_instance" "worker" {
  ami                  = data.aws_ami.boxty_worker.id
  instance_type        = "c6a.2xlarge"
  iam_instance_profile = aws_iam_instance_profile.worker.name

  user_data = templatefile("${path.module}/cloud-init.yml", {
    api_url    = var.api_url
    worker_key = var.worker_api_key
    provider   = "aws"
    region     = var.region
    worker_id  = "terraform-${var.region}-${formatdate("YYYYMMDDhhmmss", timestamp())}"
  })

  tags = {
    Name = "boxty-worker-${var.region}"
  }
}

resource "aws_dynamodb_table" "boxty" {
  name         = "boxty"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  attribute {
    name = "GSI1_PK"
    type = "S"
  }

  attribute {
    name = "GSI1_SK"
    type = "S"
  }

  attribute {
    name = "GSI2_PK"
    type = "S"
  }

  attribute {
    name = "GSI2_SK"
    type = "S"
  }

  global_secondary_index {
    name            = "GSI1"
    hash_key        = "GSI1_PK"
    range_key       = "GSI1_SK"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "GSI2"
    hash_key        = "GSI2_PK"
    range_key       = "GSI2_SK"
    projection_type = "ALL"
  }
}

resource "aws_s3_bucket" "snapshots" {
  bucket = "boxty-snapshots-${var.environment}"
}

resource "aws_s3_bucket" "images" {
  bucket = "boxty-images-${var.environment}"
}

resource "aws_ecr_repository" "boxty_images" {
  name                 = "boxty-images"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_lifecycle_policy" "boxty_images" {
  repository = aws_ecr_repository.boxty_images.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Expire untagged images after 14 days"
      selection = {
        tagStatus   = "untagged"
        countType   = "sinceImagePushed"
        countUnit   = "days"
        countNumber = 14
      }
      action = {
        type = "expire"
      }
    }]
  })
}
