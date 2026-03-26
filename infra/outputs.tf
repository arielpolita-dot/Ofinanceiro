output "ecr_repository_url" {
  description = "ECR repository URL for backend"
  value       = aws_ecr_repository.backend.repository_url
}

output "backend_url" {
  description = "App Runner service URL"
  value       = "https://${aws_apprunner_service.backend.service_url}"
}

output "frontend_url" {
  description = "Frontend URL"
  value       = var.frontend_url
}
