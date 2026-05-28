locals {
  name_prefix = "${var.project}-${var.environment}"
}

# ── ECS CPU Alarms ─────────────────────────────────────────────────────────

resource "aws_cloudwatch_metric_alarm" "backend_cpu" {
  alarm_name          = "${local.name_prefix}-backend-cpu-high"
  alarm_description   = "Backend ECS CPU utilization above ${var.cpu_alarm_threshold}%"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = var.cpu_alarm_threshold
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = var.cluster_name
    ServiceName = var.backend_service_name
  }

  tags = {
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "frontend_cpu" {
  alarm_name          = "${local.name_prefix}-frontend-cpu-high"
  alarm_description   = "Frontend ECS CPU utilization above ${var.cpu_alarm_threshold}%"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = var.cpu_alarm_threshold
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = var.cluster_name
    ServiceName = var.frontend_service_name
  }

  tags = {
    Project     = var.project
    Environment = var.environment
  }
}

# ── ECS Memory Alarms ──────────────────────────────────────────────────────

resource "aws_cloudwatch_metric_alarm" "backend_memory" {
  alarm_name          = "${local.name_prefix}-backend-memory-high"
  alarm_description   = "Backend ECS memory utilization above ${var.memory_alarm_threshold}%"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = var.memory_alarm_threshold
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = var.cluster_name
    ServiceName = var.backend_service_name
  }

  tags = {
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "frontend_memory" {
  alarm_name          = "${local.name_prefix}-frontend-memory-high"
  alarm_description   = "Frontend ECS memory utilization above ${var.memory_alarm_threshold}%"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = var.memory_alarm_threshold
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = var.cluster_name
    ServiceName = var.frontend_service_name
  }

  tags = {
    Project     = var.project
    Environment = var.environment
  }
}

# ── ALB 5xx Alarm ──────────────────────────────────────────────────────────

resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name          = "${local.name_prefix}-alb-5xx-high"
  alarm_description   = "ALB returning more than ${var.error_5xx_threshold} 5xx errors in 5 minutes"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "HTTPCode_ELB_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  threshold           = var.error_5xx_threshold
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = var.alb_arn_suffix
  }

  tags = {
    Project     = var.project
    Environment = var.environment
  }
}

# ── CloudWatch Dashboard ───────────────────────────────────────────────────

resource "aws_cloudwatch_dashboard" "this" {
  dashboard_name = "${local.name_prefix}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      # ── Row 1: CPU ──────────────────────────────────────────────────────
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "Backend CPU Utilization"
          region = var.aws_region
          view   = "timeSeries"
          stat   = "Average"
          period = 300
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ClusterName", var.cluster_name, "ServiceName", var.backend_service_name]
          ]
          annotations = {
            horizontal = [{ label = "Alarm threshold", value = var.cpu_alarm_threshold, color = "#ff6961" }]
          }
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "Frontend CPU Utilization"
          region = var.aws_region
          view   = "timeSeries"
          stat   = "Average"
          period = 300
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ClusterName", var.cluster_name, "ServiceName", var.frontend_service_name]
          ]
          annotations = {
            horizontal = [{ label = "Alarm threshold", value = var.cpu_alarm_threshold, color = "#ff6961" }]
          }
        }
      },
      # ── Row 2: Memory ───────────────────────────────────────────────────
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          title  = "Backend Memory Utilization"
          region = var.aws_region
          view   = "timeSeries"
          stat   = "Average"
          period = 300
          metrics = [
            ["AWS/ECS", "MemoryUtilization", "ClusterName", var.cluster_name, "ServiceName", var.backend_service_name]
          ]
          annotations = {
            horizontal = [{ label = "Alarm threshold", value = var.memory_alarm_threshold, color = "#ff6961" }]
          }
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          title  = "Frontend Memory Utilization"
          region = var.aws_region
          view   = "timeSeries"
          stat   = "Average"
          period = 300
          metrics = [
            ["AWS/ECS", "MemoryUtilization", "ClusterName", var.cluster_name, "ServiceName", var.frontend_service_name]
          ]
          annotations = {
            horizontal = [{ label = "Alarm threshold", value = var.memory_alarm_threshold, color = "#ff6961" }]
          }
        }
      },
      # ── Row 3: ALB ──────────────────────────────────────────────────────
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6
        properties = {
          title  = "ALB 5xx Errors"
          region = var.aws_region
          view   = "timeSeries"
          stat   = "Sum"
          period = 300
          metrics = [
            ["AWS/ApplicationELB", "HTTPCode_ELB_5XX_Count", "LoadBalancer", var.alb_arn_suffix, { color = "#ff6961", label = "5xx errors" }]
          ]
          annotations = {
            horizontal = [{ label = "Alarm threshold", value = var.error_5xx_threshold, color = "#ff6961" }]
          }
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 12
        width  = 12
        height = 6
        properties = {
          title  = "ALB Request Count"
          region = var.aws_region
          view   = "timeSeries"
          stat   = "Sum"
          period = 300
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", var.alb_arn_suffix, { label = "Total requests" }],
            ["AWS/ApplicationELB", "HTTPCode_Target_2XX_Count", "LoadBalancer", var.alb_arn_suffix, { color = "#69b34c", label = "2xx" }],
            ["AWS/ApplicationELB", "HTTPCode_Target_4XX_Count", "LoadBalancer", var.alb_arn_suffix, { color = "#ffae42", label = "4xx" }]
          ]
        }
      },
      # ── Row 4: Alarm status ─────────────────────────────────────────────
      {
        type   = "alarm"
        x      = 0
        y      = 18
        width  = 24
        height = 4
        properties = {
          title = "Alarm Status"
          alarms = [
            aws_cloudwatch_metric_alarm.backend_cpu.arn,
            aws_cloudwatch_metric_alarm.backend_memory.arn,
            aws_cloudwatch_metric_alarm.frontend_cpu.arn,
            aws_cloudwatch_metric_alarm.frontend_memory.arn,
            aws_cloudwatch_metric_alarm.alb_5xx.arn,
          ]
        }
      }
    ]
  })
}
