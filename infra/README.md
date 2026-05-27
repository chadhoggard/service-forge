# Infrastructure

This directory will contain Terraform configurations for AWS deployment.

## Planned Modules

- `vpc/` — VPC, subnets, security groups
- `ecs/` — ECS cluster, task definitions, services
- `ecr/` — Container registry repositories
- `rds/` — PostgreSQL database
- `iam/` — Roles and policies
- `alb/` — Application Load Balancer
- `cloudwatch/` — Log groups, metrics, alarms

## Usage (future)

```bash
cd infra
terraform init
terraform plan
terraform apply
```
