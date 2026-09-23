output "api_url" {
  value = "http://${aws_lb.api.dns_name}"
}

output "dashboard_url" {
  value = local.dashboard_url
}

# The values below are consumed by the deploy workflow as GitHub repository variables
# (see scripts/sync-github-vars.sh). None of them is secret.

output "aws_region" {
  value = var.region
}

output "github_deploy_role_arn" {
  value = aws_iam_role.github_deploy.arn
}

output "ecr_repository" {
  value = aws_ecr_repository.api.name
}

output "ecs_cluster" {
  value = aws_ecs_cluster.main.name
}

output "ecs_service" {
  value = aws_ecs_service.api.name
}

output "ecs_task_family" {
  value = aws_ecs_task_definition.api.family
}

output "dashboard_bucket" {
  value = aws_s3_bucket.dashboard.bucket
}

output "api_key_secret_id" {
  value = aws_secretsmanager_secret.api_keys.name
}
