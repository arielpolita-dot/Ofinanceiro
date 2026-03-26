# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "app_logs" {
  name              = "/${var.project_name}/${var.environment}"
  retention_in_days = var.environment == "production" ? 90 : 14

  tags = {
    Name        = "${var.project_name}-logs-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
  }
}

# CloudWatch Metric Alarms
resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "${var.project_name}-${var.environment}-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "5XXError"
  namespace           = "AWS/AppRunner"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "This alarm fires when error rate exceeds threshold"

  dimensions = {
    ServiceName = aws_apprunner_service.backend.service_name
  }

  alarm_actions = var.sns_alert_topic_arn != "" ? [var.sns_alert_topic_arn] : []

  tags = {
    Name        = "${var.project_name}-error-alarm-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_cloudwatch_metric_alarm" "high_latency" {
  alarm_name          = "${var.project_name}-${var.environment}-high-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "RequestLatency"
  namespace           = "AWS/AppRunner"
  period              = 300
  statistic           = "Average"
  threshold           = 2000 # 2 seconds
  alarm_description   = "This alarm fires when average latency exceeds 2s"

  dimensions = {
    ServiceName = aws_apprunner_service.backend.service_name
  }

  alarm_actions = var.sns_alert_topic_arn != "" ? [var.sns_alert_topic_arn] : []

  tags = {
    Name        = "${var.project_name}-latency-alarm-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_cloudwatch_metric_alarm" "low_healthy_instances" {
  alarm_name          = "${var.project_name}-${var.environment}-low-instances"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ActiveInstances"
  namespace           = "AWS/AppRunner"
  period              = 60
  statistic           = "Average"
  threshold           = 1
  alarm_description   = "This alarm fires when no healthy instances"

  dimensions = {
    ServiceName = aws_apprunner_service.backend.service_name
  }

  alarm_actions = var.sns_alert_topic_arn != "" ? [var.sns_alert_topic_arn] : []

  tags = {
    Name        = "${var.project_name}-instances-alarm-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "app" {
  dashboard_name = "${var.project_name}-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "Request Count"
          region = var.aws_region
          metrics = [
            ["AWS/AppRunner", "RequestCount", "ServiceName", aws_apprunner_service.backend.service_name]
          ]
          period = 300
          stat   = "Sum"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "Request Latency"
          region = var.aws_region
          metrics = [
            ["AWS/AppRunner", "RequestLatency", "ServiceName", aws_apprunner_service.backend.service_name]
          ]
          period = 300
          stat   = "Average"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          title  = "Error Rate"
          region = var.aws_region
          metrics = [
            ["AWS/AppRunner", "5XXError", "ServiceName", aws_apprunner_service.backend.service_name],
            ["AWS/AppRunner", "4XXError", "ServiceName", aws_apprunner_service.backend.service_name]
          ]
          period = 300
          stat   = "Sum"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          title  = "Active Instances"
          region = var.aws_region
          metrics = [
            ["AWS/AppRunner", "ActiveInstances", "ServiceName", aws_apprunner_service.backend.service_name]
          ]
          period = 60
          stat   = "Average"
        }
      }
    ]
  })
}

# Variables for CloudWatch
variable "sns_alert_topic_arn" {
  description = "SNS topic ARN for alarm notifications"
  type        = string
  default     = ""
}
