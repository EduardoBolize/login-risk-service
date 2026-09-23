#!/usr/bin/env bash
# Copies Terraform outputs into GitHub repository variables used by .github/workflows/deploy.yml.
# None of these values is secret: the API key stays in Secrets Manager and is read at deploy time.
#
#   ./scripts/sync-github-vars.sh        (after `terraform apply` in infra/terraform)
set -euo pipefail

cd "$(dirname "$0")/../infra/terraform"

output() { terraform output -raw "$1"; }

declare -A vars=(
  [AWS_REGION]=aws_region
  [AWS_ROLE_ARN]=github_deploy_role_arn
  [ECR_REPOSITORY]=ecr_repository
  [ECS_CLUSTER]=ecs_cluster
  [ECS_SERVICE]=ecs_service
  [ECS_TASK_FAMILY]=ecs_task_family
  [DASHBOARD_BUCKET]=dashboard_bucket
  [API_URL]=api_url
  [API_KEY_SECRET_ID]=api_key_secret_id
)

for name in "${!vars[@]}"; do
  value="$(output "${vars[$name]}")"
  gh variable set "$name" --body "$value"
  echo "✔ $name"
done
