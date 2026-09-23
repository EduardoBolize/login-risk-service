variable "project" {
  description = "Name prefix for every resource"
  type        = string
  default     = "login-risk"
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "github_repository" {
  description = "GitHub repository (owner/name) allowed to deploy through OIDC"
  type        = string
  default     = "EduardoBolize/login-risk-service"
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "api_cpu" {
  description = "Fargate task CPU units"
  type        = number
  default     = 256
}

variable "api_memory" {
  description = "Fargate task memory (MiB)"
  type        = number
  default     = 512
}

variable "api_desired_count" {
  type    = number
  default = 1
}

variable "db_instance_class" {
  type    = string
  default = "db.t4g.micro"
}

variable "cache_node_type" {
  type    = string
  default = "cache.t4g.micro"
}
