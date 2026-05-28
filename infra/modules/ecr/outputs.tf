output "backend_repository_url" {
  description = "ECR URL for the backend image"
  value       = aws_ecr_repository.this["backend"].repository_url
}

output "frontend_repository_url" {
  description = "ECR URL for the frontend image"
  value       = aws_ecr_repository.this["frontend"].repository_url
}

output "aws_account_id" {
  description = "AWS account ID"
  value       = data.aws_caller_identity.current.account_id
}
