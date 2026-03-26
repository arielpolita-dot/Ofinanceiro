# App Runner Service for Backend
resource "aws_apprunner_service" "backend" {
  service_name = local.backend_name

  source_configuration {
    authentication_configuration {
      access_role_arn = aws_iam_role.apprunner_ecr_access.arn
    }

    image_repository {
      image_configuration {
        port = tostring(var.backend_port)
        runtime_environment_variables = {
          NODE_ENV                 = "production"
          PORT                     = tostring(var.backend_port)
          CORS_ORIGIN              = join(",", var.cors_origins)
          DATABASE_URL             = var.database_url
          AUDIT_DATABASE_URL       = var.audit_database_url
          AUTHIFY_URL              = var.authify_url
          AUTHIFY_FRONTEND_URL     = var.authify_frontend_url
          AUTHIFY_API_KEY          = var.authify_api_key
          FRONTEND_URL             = var.frontend_url
          BILLING_API_URL          = var.billing_api_url
          BILLING_FRONTEND_URL     = var.billing_frontend_url
          BILLING_API_KEY          = var.billing_api_key
          ENCRYPTION_KEY           = var.encryption_key
        }
      }
      image_identifier      = "${aws_ecr_repository.backend.repository_url}:latest"
      image_repository_type = "ECR"
    }

    auto_deployments_enabled = true
  }

  instance_configuration {
    cpu               = var.backend_cpu
    memory            = var.backend_memory
    instance_role_arn = aws_iam_role.apprunner_instance.arn
  }

  health_check_configuration {
    protocol            = "HTTP"
    path                = var.health_check_path
    interval            = 20
    timeout             = 10
    healthy_threshold   = 1
    unhealthy_threshold = 10
  }

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }

  depends_on = [
    aws_iam_role_policy_attachment.apprunner_ecr_access
  ]
}
