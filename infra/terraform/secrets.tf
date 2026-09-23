# Secrets are injected into the task by ECS at startup — never baked into the image or
# the task definition. Note: generated values also live in the (encrypted) remote state.

resource "aws_secretsmanager_secret" "database_url" {
  name                    = "${var.project}/database-url"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "database_url" {
  secret_id = aws_secretsmanager_secret.database_url.id
  secret_string = format(
    "postgresql://%s:%s@%s/%s?schema=public",
    aws_db_instance.main.username,
    random_password.db.result,
    aws_db_instance.main.endpoint,
    aws_db_instance.main.db_name,
  )
}

resource "random_password" "api_key" {
  length  = 40
  special = false
}

resource "aws_secretsmanager_secret" "api_keys" {
  name                    = "${var.project}/api-keys"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "api_keys" {
  secret_id     = aws_secretsmanager_secret.api_keys.id
  secret_string = random_password.api_key.result
}
