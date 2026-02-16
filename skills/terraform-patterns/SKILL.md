---
name: terraform-patterns
description: Terraform modules for AWS, GCP, and Azure infrastructure including networking, compute, and managed services. Use when writing Terraform modules for cloud infrastructure, networking, compute resources, or managed services.
---

# Terraform Patterns Skill

Apply these patterns when working with Terraform.

## Module Structure

```
terraform/
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── terraform.tfvars
│   ├── staging/
│   └── production/
└── modules/
    ├── vpc/
    ├── ecs/
    ├── rds/
    └── s3/
```

## Environment Main

```hcl
# environments/production/main.tf
terraform {
  required_version = ">= 1.5.0"

  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }

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

module "vpc" {
  source = "../../modules/vpc"

  environment = var.environment
  cidr_block  = var.vpc_cidr
}

module "ecs" {
  source = "../../modules/ecs"

  environment       = var.environment
  vpc_id            = module.vpc.vpc_id
  private_subnets   = module.vpc.private_subnet_ids
  image_tag         = var.image_tag
}
```

## AWS ECS Module

```hcl
# modules/ecs/main.tf
resource "aws_ecs_cluster" "main" {
  name = "${var.project}-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_ecs_task_definition" "app" {
  family                   = "${var.project}-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.task.arn

  container_definitions = jsonencode([{
    name  = "app"
    image = "${var.ecr_url}:${var.image_tag}"
    portMappings = [{
      containerPort = 3000
      protocol      = "tcp"
    }]
    environment = [
      { name = "NODE_ENV", value = var.environment }
    ]
    secrets = [
      { name = "DATABASE_URL", valueFrom = var.db_secret_arn }
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.app.name
        "awslogs-region"        = var.region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])
}
```

## AWS RDS Module

```hcl
# modules/rds/main.tf
resource "aws_db_instance" "main" {
  identifier = "${var.project}-${var.environment}"

  engine               = "postgres"
  engine_version       = "15"
  instance_class       = var.instance_class
  allocated_storage    = var.allocated_storage

  db_name  = var.database_name
  username = var.master_username
  password = random_password.master.result

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  multi_az               = var.environment == "production"
  storage_encrypted      = true
  deletion_protection    = var.environment == "production"
  skip_final_snapshot    = var.environment != "production"
}
```

## Variables Pattern

```hcl
# variables.tf
variable "environment" {
  type        = string
  description = "Environment name"
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

variable "instance_class" {
  type        = string
  default     = "db.t3.micro"
  description = "RDS instance class"
}
```

## Outputs Pattern

```hcl
# outputs.tf
output "vpc_id" {
  value       = aws_vpc.main.id
  description = "The ID of the VPC"
}

output "database_endpoint" {
  value       = aws_db_instance.main.endpoint
  description = "RDS endpoint"
  sensitive   = true
}
```

## Checklist

- [ ] Remote state with locking
- [ ] Modular structure
- [ ] Environment separation
- [ ] Variable validation
- [ ] Sensitive outputs marked
- [ ] Encryption enabled
- [ ] Tags for resources
