locals {
  name_prefix = "${var.project}-${var.environment}"
}

# ── Application Load Balancer ──────────────────────────────────────────────
resource "aws_lb" "this" {
  name               = "${local.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.alb_security_group_id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = false

  tags = {
    Name        = "${local.name_prefix}-alb"
    Project     = var.project
    Environment = var.environment
  }
}

# ── Target Groups ──────────────────────────────────────────────────────────
resource "aws_lb_target_group" "backend" {
  name        = "sf-prod-backend-tg"
  port        = 8000
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip" # Required for Fargate awsvpc networking

  health_check {
    path                = "/api/health"
    protocol            = "HTTP"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    matcher             = "200"
  }

  tags = {
    Name        = "${local.name_prefix}-backend-tg"
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_lb_target_group" "frontend" {
  name        = "sf-prod-frontend-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    path                = "/"
    protocol            = "HTTP"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    matcher             = "200,301,302"
  }

  tags = {
    Name        = "${local.name_prefix}-frontend-tg"
    Project     = var.project
    Environment = var.environment
  }
}

# ── HTTP Listener — path-based routing ────────────────────────────────────
# Phase 6 will add HTTPS with ACM cert; HTTP redirects to HTTPS then
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.this.arn
  port              = 80
  protocol          = "HTTP"

  # Default action: forward to frontend
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }
}

# /api/* and /docs routes go to backend
resource "aws_lb_listener_rule" "backend_api" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 10

  condition {
    path_pattern {
      values = ["/api/*", "/docs", "/openapi.json"]
    }
  }

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
}
