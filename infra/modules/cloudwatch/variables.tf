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

variable "cluster_name" {
  description = "ECS cluster name"
  type        = string
}

variable "backend_service_name" {
  description = "ECS backend service name"
  type        = string
}

variable "frontend_service_name" {
  description = "ECS frontend service name"
  type        = string
}

variable "alb_arn_suffix" {
  description = "ALB ARN suffix for CloudWatch metrics (e.g. app/name/id)"
  type        = string
}

variable "cpu_alarm_threshold" {
  description = "CPU utilization % threshold for alarm"
  type        = number
  default     = 80
}

variable "memory_alarm_threshold" {
  description = "Memory utilization % threshold for alarm"
  type        = number
  default     = 80
}

variable "error_5xx_threshold" {
  description = "Number of 5xx errors in a 5-minute window before alarming"
  type        = number
  default     = 10
}
