data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  azs             = slice(data.aws_availability_zones.available.names, 0, 2)
  public_subnets  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnets = ["10.0.11.0/24", "10.0.12.0/24"]
}

# ── VPC ────────────────────────────────────────────────────────────────────
resource "aws_vpc" "this" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.project}-vpc"
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# ── Internet Gateway ───────────────────────────────────────────────────────
resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id

  tags = {
    Name      = "${var.project}-igw"
    Project   = var.project
    ManagedBy = "terraform"
  }
}

# ── Public Subnets ─────────────────────────────────────────────────────────
resource "aws_subnet" "public" {
  count = length(local.azs)

  vpc_id                  = aws_vpc.this.id
  cidr_block              = local.public_subnets[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name      = "${var.project}-public-${local.azs[count.index]}"
    Project   = var.project
    ManagedBy = "terraform"
  }
}

# ── Private Subnets ────────────────────────────────────────────────────────
resource "aws_subnet" "private" {
  count = length(local.azs)

  vpc_id            = aws_vpc.this.id
  cidr_block        = local.private_subnets[count.index]
  availability_zone = local.azs[count.index]

  tags = {
    Name      = "${var.project}-private-${local.azs[count.index]}"
    Project   = var.project
    ManagedBy = "terraform"
  }
}

# ── NAT Gateway (single, in first public subnet) ───────────────────────────
resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name      = "${var.project}-nat-eip"
    Project   = var.project
    ManagedBy = "terraform"
  }
}

resource "aws_nat_gateway" "this" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  tags = {
    Name      = "${var.project}-nat"
    Project   = var.project
    ManagedBy = "terraform"
  }

  depends_on = [aws_internet_gateway.this]
}

# ── Route Tables ───────────────────────────────────────────────────────────
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.this.id
  }

  tags = {
    Name      = "${var.project}-public-rt"
    Project   = var.project
    ManagedBy = "terraform"
  }
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.this.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.this.id
  }

  tags = {
    Name      = "${var.project}-private-rt"
    Project   = var.project
    ManagedBy = "terraform"
  }
}

resource "aws_route_table_association" "private" {
  count          = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# ── Security Groups ────────────────────────────────────────────────────────

# ALB — accepts HTTP from internet
resource "aws_security_group" "alb" {
  name        = "${var.project}-alb-sg"
  description = "Allow HTTP inbound to ALB"
  vpc_id      = aws_vpc.this.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name      = "${var.project}-alb-sg"
    Project   = var.project
    ManagedBy = "terraform"
  }
}

# Backend ECS tasks — accepts traffic from ALB only
resource "aws_security_group" "backend" {
  name        = "${var.project}-backend-sg"
  description = "Allow traffic from ALB to backend ECS tasks"
  vpc_id      = aws_vpc.this.id

  ingress {
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name      = "${var.project}-backend-sg"
    Project   = var.project
    ManagedBy = "terraform"
  }
}

# Frontend ECS tasks — accepts traffic from ALB only
resource "aws_security_group" "frontend" {
  name        = "${var.project}-frontend-sg"
  description = "Allow traffic from ALB to frontend ECS tasks"
  vpc_id      = aws_vpc.this.id

  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name      = "${var.project}-frontend-sg"
    Project   = var.project
    ManagedBy = "terraform"
  }
}

# RDS — accepts traffic from backend ECS tasks only
resource "aws_security_group" "rds" {
  name        = "${var.project}-rds-sg"
  description = "Allow postgres from backend ECS tasks"
  vpc_id      = aws_vpc.this.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.backend.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name      = "${var.project}-rds-sg"
    Project   = var.project
    ManagedBy = "terraform"
  }
}
