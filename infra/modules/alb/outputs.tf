output "alb_dns_name" {
  description = "ALB public DNS name"
  value       = aws_lb.this.dns_name
}

output "alb_arn" {
  description = "ALB ARN"
  value       = aws_lb.this.arn
}

output "backend_target_group_arn" {
  description = "Target group ARN for backend"
  value       = aws_lb_target_group.backend.arn
}

output "frontend_target_group_arn" {
  description = "Target group ARN for frontend"
  value       = aws_lb_target_group.frontend.arn
}

output "alb_arn_suffix" {
  description = "ALB ARN suffix for CloudWatch metrics"
  value       = aws_lb.this.arn_suffix
}
