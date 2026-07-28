---
name: terraform-patterns
description: Terraform patterns for AWS infrastructure using a shared modules repo and per-workload consumer repos, covering state backends, tagging, variable validation, and outputs. Use when writing or reviewing Terraform.
globs: "**/*.tf,**/*.tfvars,**/*.hcl"
user-invocable: false
---

# Terraform Patterns

A shared modules repo (`terraform-modules`) is consumed by per-workload `tf-*` repos. State lives in S3, one backend per region and environment.

## Repository Structure

```
terraform-modules/        # Shared modules (eks, rds, ecr, s3, secrets-manager, ...)
tf-platform/              # Consumer repo
  ca-central-1/           # One directory per region
    01-networking.tf       # Numbered files enforce resource ordering
    02-cdn-ingress.tf
    03-ecr.tf
    04-eks.tf
    05-kubernetes-rbac.tf
    ...
    providers.tf
    variables.tf
    locals.tf
    backend.tf
    prod.tfvars
    backend-config/
      prod.conf
```

Module reference from consumer: `source = "../terraform-modules/eks"`

Numbered filenames document dependency order for humans; Terraform itself resolves order from the graph.

## State Backend

```hcl
# Good - backend.tf (always S3 + DynamoDB)
terraform {
  backend "s3" {}          # Config injected via -backend-config=backend-config/prod.conf
}
```

```ini
# Good - backend-config/prod.conf
region         = "ca-central-1"
bucket         = "acme-platform-prod-ca-central-1-tfstate"
key            = "terraform.tfstate"
dynamodb_table = "acme-platform-prod-ca-central-1-db-tfstate"
encrypt        = true
```

Naming: `{org}-{app}-{env}-{region}-tfstate`. Encryption ALWAYS on. DynamoDB locking prevents two concurrent applies from corrupting state.

## Naming & Tagging

```hcl
# Good - standard locals block
locals {
  general = {
    prefix   = var.prefix      # org short name, e.g. "acme"
    app_name = var.app_name    # "platform"
    env_name = var.env_name    # "prod"
  }

  resources_prefix_name = "${local.general.prefix}-${local.general.app_name}-${local.general.env_name}"
  # -> "acme-platform-prod"

  global_tags = {
    env        = var.env_name
    project    = var.app_name
    created_by = "Terraform"
  }
}

# Usage
tags = merge(local.global_tags, { Name = "${local.resources_prefix_name}-eks" })
```

ALWAYS apply `global_tags`. NEVER create resources without `env`, `project`, `created_by` tags - untagged resources cannot be attributed for cost or ownership.

## Variables & Validation

```hcl
# Good - typed + validated
variable "environment" {
  type        = string
  description = "Environment name"
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Must be dev, staging, or production."
  }
}

variable "cluster_role_mappings" {
  type = list(object({
    role_arn = string
    username = optional(string)   # optional() requires Terraform >= 1.3
    groups   = list(string)
  }))
  default = []
}
```

## Key Shared Modules

Wrap upstream `terraform-aws-modules` rather than calling them directly from every consumer repo, so version bumps and hardened defaults happen in one place.

| Module | Wraps | Hardened defaults |
|--------|-------|-------------------|
| `eks` | `terraform-aws-modules/eks` | Access Entries (not aws-auth), IRSA on, private endpoint |
| `rds` | `terraform-aws-modules/rds` | multi_az in prod, performance insights, IAM auth |
| `ecr` | `terraform-aws-modules/ecr` | Lifecycle policy: keep last 30 tagged images |
| `s3` | `terraform-aws-modules/s3-bucket` | Encryption + versioning, public access blocked |
| `secrets-manager` | own | Secrets Manager wrapper |
| `ssm-parameter-store` | own | Read/write parameter patterns |
| `dynamic-subnets` | own | Cluster, DB, and endpoint subnet layout |
| `eks-addons` | own | Karpenter, FluentBit, External Secrets Operator |

Pin every module to an exact version. A floating module source makes `plan` output non-reproducible.

## EKS Module Pattern

```hcl
module "eks" {
  source  = "../terraform-modules/eks"

  enable_irsa             = true
  endpoint_private_access = true
  endpoint_public_access  = false

  # EKS Access Entries, not the deprecated aws-auth ConfigMap
  access_entries = local.access_entries

  eks_managed_node_groups = {
    karpenter = {
      tags = {
        "karpenter.sh/discovery/${local.resources_prefix_name}" = local.resources_prefix_name
      }
    }
  }
}
```

## Cross-Account Provider

```hcl
# Good - networking account with role assumption
provider "aws" {
  alias  = "networking"
  region = var.region
  assume_role {
    role_arn     = "arn:aws:iam::${var.networking_account}:role/workloads-assumerole"
    session_name = "${var.env_name}-${var.app_name}-session"
  }
}
```

## Outputs

Expose only critical identifiers (IDs, ARNs, endpoints). NEVER expose entire resource objects.

```hcl
# Good - specific outputs
output "cluster_id" {
  value = module.eks.cluster_id
}

# Bad - exposes everything
output "cluster" {
  value = module.eks    # Too broad
}
```

## Checklist

- [ ] S3 backend with DynamoDB locking, encrypt = true
- [ ] `global_tags` applied via `merge()` on all resources
- [ ] `resources_prefix_name` used for resource naming
- [ ] Variables have `type`, `description`, and `validation {}` where appropriate
- [ ] Modules sourced from the shared modules repo (not reimplemented) and pinned to an exact version
- [ ] Numbered `.tf` files in consumer root modules
- [ ] `terraform validate && terraform plan` before applying
