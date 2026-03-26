variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "app-template"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "backend_port" {
  description = "Backend container port"
  type        = number
  default     = 8000
}

variable "backend_cpu" {
  description = "Backend CPU units (256, 512, 1024, 2048, 4096)"
  type        = string
  default     = "256"
}

variable "backend_memory" {
  description = "Backend memory (512, 1024, 2048, 3072, 4096, etc)"
  type        = string
  default     = "512"
}

variable "cors_origins" {
  description = "List of allowed CORS origins"
  type        = list(string)
  default     = []

  validation {
    condition     = length(var.cors_origins) > 0
    error_message = "cors_origins must have at least one origin defined"
  }
}

variable "health_check_path" {
  description = "Health check endpoint path"
  type        = string
  default     = "/health"
}

variable "github_repo" {
  description = "GitHub repository (owner/repo)"
  type        = string
  default     = ""
}

variable "frontend_url" {
  description = "Frontend URL"
  type        = string
}

variable "database_url" {
  description = "PostgreSQL database URL"
  type        = string
  sensitive   = true
}

variable "audit_database_url" {
  description = "Audit database URL (centralized logs)"
  type        = string
  sensitive   = true
}

variable "authify_url" {
  description = "Authify Backend URL"
  type        = string
}

variable "authify_frontend_url" {
  description = "Authify Frontend URL (hosted login pages)"
  type        = string
}

variable "authify_api_key" {
  description = "Authify API key for this project"
  type        = string
  sensitive   = true
}

variable "billing_api_url" {
  description = "Billing API URL"
  type        = string
}

variable "billing_frontend_url" {
  description = "Billing Frontend URL (checkout pages)"
  type        = string
}

variable "billing_api_key" {
  description = "Billing API Key"
  type        = string
  sensitive   = true
}

variable "billing_trial_product_id" {
  description = "Billing Product ID for trial unlock"
  type        = string
  default     = ""
}

variable "anthropic_api_key" {
  description = "Anthropic API Key for Claude AI (optional)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "encryption_key" {
  description = "Encryption key for sensitive data (32 chars)"
  type        = string
  sensitive   = true
}

variable "image_tag" {
  description = "Docker image tag for backend (git commit hash)"
  type        = string
  default     = "latest"
}
