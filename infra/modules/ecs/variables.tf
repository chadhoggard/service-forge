variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "aws_account_id" {
  description = "AWS account ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for backend tasks"
  type        = list(string)
}

variable "public_subnet_ids" {
  description = "Public subnet IDs for frontend tasks"
  type        = list(string)
}

variable "backend_security_group_id" {
  description = "Security group ID for backend tasks"
  type        = string
}

variable "frontend_security_group_id" {
  description = "Security group ID for frontend tasks"
  type        = string
}

variable "backend_image_uri" {
  description = "Full ECR image URI for the backend (e.g. account.dkr.ecr.region.amazonaws.com/repo:tag)"
  type        = string
}

variable "frontend_image_uri" {
  description = "Full ECR image URI for the frontend"
  type        = string
}

variable "github_secret_arn" {
  description = "Secrets Manager ARN containing GITHUB_TOKEN and GITHUB_WORKFLOW_FILE"
  type        = string
}

variable "db_secret_arn" {
  description = "Secrets Manager ARN containing DB credentials"
  type        = string
}

variable "jwt_secret_arn" {
  description = "Secrets Manager ARN for JWT signing key"
  type        = string
}

variable "api_key_secret_arn" {
  description = "Secrets Manager ARN for CI/CD API key"
  type        = string
}

variable "db_host" {
  description = "RDS hostname"
  type        = string
}

variable "db_port" {
  description = "RDS port"
  type        = number
  default     = 5432
}

variable "db_name" {
  description = "Database name"
  type        = string
}

variable "backend_target_group_arn" {
  description = "ALB target group ARN for backend"
  type        = string
  default     = ""
}

variable "frontend_target_group_arn" {
  description = "ALB target group ARN for frontend"
  type        = string
  default     = ""
}

variable "backend_cpu" {
  description = "Fargate CPU units for backend (256/512/1024/2048)"
  type        = number
  default     = 256
}

variable "backend_memory" {
  description = "Fargate memory (MB) for backend"
  type        = number
  default     = 512
}

variable "frontend_cpu" {
  description = "Fargate CPU units for frontend"
  type        = number
  default     = 256
}

variable "frontend_memory" {
  description = "Fargate memory (MB) for frontend"
  type        = number
  default     = 512
}

variable "backend_desired_count" {
  description = "Desired number of backend tasks"
  type        = number
  default     = 1
}

variable "frontend_desired_count" {
  description = "Desired number of frontend tasks"
  type        = number
  default     = 1
}
