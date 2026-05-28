output "dashboard_name" {
  description = "CloudWatch dashboard name"
  value       = aws_cloudwatch_dashboard.this.dashboard_name
}

output "dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.this.dashboard_name}"
}

output "backend_cpu_alarm_arn" {
  description = "ARN of the backend CPU alarm"
  value       = aws_cloudwatch_metric_alarm.backend_cpu.arn
}

output "backend_memory_alarm_arn" {
  description = "ARN of the backend memory alarm"
  value       = aws_cloudwatch_metric_alarm.backend_memory.arn
}

output "frontend_cpu_alarm_arn" {
  description = "ARN of the frontend CPU alarm"
  value       = aws_cloudwatch_metric_alarm.frontend_cpu.arn
}

output "frontend_memory_alarm_arn" {
  description = "ARN of the frontend memory alarm"
  value       = aws_cloudwatch_metric_alarm.frontend_memory.arn
}

output "alb_5xx_alarm_arn" {
  description = "ARN of the ALB 5xx error alarm"
  value       = aws_cloudwatch_metric_alarm.alb_5xx.arn
}
