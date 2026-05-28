terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "serviceforge-terraform-state-503561436227"
    key    = "serviceforge/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# ── ECR ────────────────────────────────────────────────────────────────────
module "ecr" {
  source      = "./modules/ecr"
  project     = var.project
  environment = var.environment
}

# ── VPC ────────────────────────────────────────────────────────────────────
module "vpc" {
  source      = "./modules/vpc"
  project     = var.project
  environment = var.environment
}

# ── RDS ────────────────────────────────────────────────────────────────────
module "rds" {
  source      = "./modules/rds"
  project     = var.project
  environment = var.environment

  private_subnet_ids    = module.vpc.private_subnet_ids
  rds_security_group_id = module.vpc.rds_security_group_id
}

# ── ALB ────────────────────────────────────────────────────────────────────
module "alb" {
  source      = "./modules/alb"
  project     = var.project
  environment = var.environment

  vpc_id                = module.vpc.vpc_id
  public_subnet_ids     = module.vpc.public_subnet_ids
  alb_security_group_id = module.vpc.alb_security_group_id
}

# ── CloudWatch ─────────────────────────────────────────────────────────────
module "cloudwatch" {
  source      = "./modules/cloudwatch"
  project     = var.project
  environment = var.environment
  aws_region  = var.aws_region

  cluster_name          = module.ecs.cluster_name
  backend_service_name  = module.ecs.backend_service_name
  frontend_service_name = module.ecs.frontend_service_name
  alb_arn_suffix        = module.alb.alb_arn_suffix
}

# ── ECS ────────────────────────────────────────────────────────────────────
module "ecs" {
  source      = "./modules/ecs"
  project     = var.project
  environment = var.environment
  aws_region  = var.aws_region

  aws_account_id             = module.ecr.aws_account_id
  private_subnet_ids         = module.vpc.private_subnet_ids
  public_subnet_ids          = module.vpc.public_subnet_ids
  backend_security_group_id  = module.vpc.backend_security_group_id
  frontend_security_group_id = module.vpc.frontend_security_group_id

  backend_image_uri  = "${module.ecr.backend_repository_url}:latest"
  frontend_image_uri = "${module.ecr.frontend_repository_url}:latest"

  db_secret_arn     = module.rds.secret_arn
  github_secret_arn = "arn:aws:secretsmanager:us-east-1:503561436227:secret:serviceforge-production/github/token-G1dqsz"
  db_host       = module.rds.db_host
  db_port       = module.rds.db_port
  db_name       = module.rds.db_name

  backend_target_group_arn  = module.alb.backend_target_group_arn
  frontend_target_group_arn = module.alb.frontend_target_group_arn
}
