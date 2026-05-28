locals {
  name_prefix = "${var.project}-${var.environment}"
}

# ── Random password ────────────────────────────────────────────────────────
resource "random_password" "db" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}:?"
}

# ── Secrets Manager ────────────────────────────────────────────────────────
resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "${local.name_prefix}/rds/credentials"
  description             = "RDS credentials for ${local.name_prefix}"
  recovery_window_in_days = 0 # Allow immediate deletion when tearing down

  tags = {
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db.result
    dbname   = var.db_name
    host     = aws_db_instance.this.address
    port     = aws_db_instance.this.port
    engine   = "postgres"
  })

  depends_on = [aws_db_instance.this]
}

# ── DB Subnet Group ────────────────────────────────────────────────────────
resource "aws_db_subnet_group" "this" {
  name        = "${local.name_prefix}-db-subnet-group"
  description = "Subnet group for ${local.name_prefix} RDS"
  subnet_ids  = var.private_subnet_ids

  tags = {
    Name        = "${local.name_prefix}-db-subnet-group"
    Project     = var.project
    Environment = var.environment
  }
}

# ── RDS Instance ───────────────────────────────────────────────────────────
resource "aws_db_instance" "this" {
  identifier = "${local.name_prefix}-postgres"

  engine               = "postgres"
  engine_version       = "15.12"
  instance_class       = var.instance_class
  allocated_storage    = var.allocated_storage
  storage_type         = "gp3"
  storage_encrypted    = true

  db_name  = var.db_name
  username = var.db_username
  password = random_password.db.result

  db_subnet_group_name   = aws_db_subnet_group.this.name
  vpc_security_group_ids = [var.rds_security_group_id]

  # Cost-saving settings for dev/production-ready for prod
  multi_az               = false
  publicly_accessible    = false
  deletion_protection    = false
  skip_final_snapshot    = true

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  tags = {
    Name        = "${local.name_prefix}-postgres"
    Project     = var.project
    Environment = var.environment
  }
}
