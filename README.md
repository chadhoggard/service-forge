# ServiceForge

A self-service deployment platform for containerized applications. ServiceForge lets you register GitHub repositories as services, trigger deployments via GitHub Actions, track deployment history with semantic versioning, run health checks, and monitor everything from a dashboard — deployed on AWS ECS Fargate with full IaC via Terraform.

**[Live →](http://serviceforge-production-alb-1977889151.us-east-1.elb.amazonaws.com)**

## Architecture

### Production (AWS)

```
                    ┌─────────────────────────────────────────┐
                    │              AWS us-east-1              │
                    │                                         │
  Browser ─────────►│  [ALB]  serviceforge-production-alb     │
                    │    │                                    │
                    │    ├── /api/* ──► [ECS Fargate]         │
                    │    │              FastAPI :8000          │
                    │    │              └── [RDS PostgreSQL]   │
                    │    │                                    │
                    │    └── /* ──────► [ECS Fargate]         │
                    │                   Next.js :3000         │
                    │                                         │
  GitHub Actions ──►│  [ECR] ← built images                  │
                    │  [Secrets Manager] ← credentials        │
                    │  [CloudWatch] ← logs, metrics, alarms   │
                    └─────────────────────────────────────────┘
```

### Local (Docker Compose)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js       │────▶│   FastAPI       │────▶│  PostgreSQL     │
│   :3000         │     │   :8000         │     │   :5432         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Features

- **Service Registration** — Register services with name, GitHub repo URL, environment, health check URL, and description
- **Deployment Tracking** — Trigger GitHub Actions workflows directly from the UI; auto-increments semantic versions; tracks status, commit SHA, and timestamps in real time
- **Zero-Downtime Deploys** — ECS rolling deploys with circuit breaker auto-rollback on failed health checks
- **Health Checks** — Call service health endpoints on demand and store results
- **Rollback** — Roll back to any previous successful deployment
- **Dashboard** — All services with latest deployment status and health at a glance
- **Authentication** — JWT-based login; first-user registration; bcrypt password hashing
- **Observability** — CloudWatch alarms for CPU, memory, and 5xx errors; metrics dashboard

## Tech Stack

| Layer         | Technology                                              |
| ------------- | ------------------------------------------------------- |
| Frontend      | Next.js 14, TypeScript, Tailwind CSS                    |
| Backend       | FastAPI, Python 3.11, SQLAlchemy                        |
| Database      | PostgreSQL 15 (RDS)                                     |
| Auth          | JWT (python-jose), bcrypt                               |
| Container     | Docker, Docker Compose                                  |
| Cloud         | AWS ECS Fargate, ECR, RDS, ALB, Secrets Manager        |
| IaC           | Terraform (VPC, ECS, RDS, ALB, ECR, CloudWatch)        |
| CI/CD         | GitHub Actions — build → ECR → ECS rolling deploy      |
| Monitoring    | CloudWatch alarms + dashboard, Container Insights       |

## Local Setup

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- Git
- Node.js 22+ and Python 3.11+ _(only needed for running outside Docker)_

### Quick Start with Docker Compose

```bash
# Clone the repository
git clone https://github.com/chadhoggard/service-forge.git
cd service-forge

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Build and start all services (postgres → backend → frontend)
docker compose up --build
```

Once running:

| Service     | URL                        |
| ----------- | -------------------------- |
| Frontend    | http://localhost:3000      |
| Backend API | http://localhost:8000      |
| API Docs    | http://localhost:8000/docs |
| PostgreSQL  | localhost:5432             |

> **First run note:** The frontend waits on the backend healthcheck before starting. Initial builds may take 2–3 minutes while npm/pip dependencies download.

### Environment Variables

| File                  | Variable               | Default                                                              | Description                          |
| --------------------- | ---------------------- | -------------------------------------------------------------------- | ------------------------------------ |
| `backend/.env`        | `DATABASE_URL`         | `postgresql://serviceforge:serviceforge@localhost:5432/serviceforge` | PostgreSQL connection string         |
| `backend/.env`        | `GITHUB_TOKEN`         | _(empty)_                                                            | GitHub fine-grained token            |
| `backend/.env`        | `GITHUB_WORKFLOW_FILE` | `deploy.yml`                                                         | Workflow file to dispatch            |
| `backend/.env`        | `SECRET_KEY`           | _(empty)_                                                            | JWT signing secret (required)        |
| `backend/.env`        | `SERVICEFORGE_API_KEY` | _(empty)_                                                            | API key for CI/CD callbacks          |
| `frontend/.env.local` | `NEXT_PUBLIC_API_URL`  | `http://localhost:8000`                                              | Backend URL (browser-visible)        |

### Docker Compose Commands

```bash
# Start all services (foreground — shows logs)
docker compose up --build

# Start in background
docker compose up -d --build

# Stream logs
docker compose logs -f
docker compose logs -f backend   # single service

# Stop services
docker compose down

# Stop and wipe the database volume
docker compose down -v

# Rebuild one service after code changes
docker compose build backend
docker compose up -d --no-deps backend
```

### Development Without Docker

**Backend:**

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env

# Start only PostgreSQL via Docker
docker compose up postgres -d

# Run the API with hot-reload
uvicorn app.main:app --reload --port 8000
```

**Frontend:**

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

### Production Image Build

The frontend `Dockerfile` (not `Dockerfile.dev`) produces a minimal standalone Next.js image:

```bash
# Build production images
docker build -t serviceforge-backend ./backend
docker build -t serviceforge-frontend \
  --build-arg NEXT_PUBLIC_API_URL=https://api.yourdomain.com \
  ./frontend
```

### Troubleshooting

| Symptom                              | Fix                                                                                             |
| ------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `frontend` exits immediately         | Backend healthcheck failed — run `docker compose logs backend`                                  |
| `relation "services" does not exist` | Tables not created — restart backend: `docker compose restart backend`                          |
| Port 5432/8000/3000 already in use   | Stop conflicting local services or change host ports in `docker-compose.yml`                    |
| `npm ci` fails on Apple Silicon      | Clear `node_modules` and `.next` volumes: `docker compose down -v && docker compose up --build` |

## Trigger Deployment (GitHub Actions Integration)

The **Trigger Deployment** button on each service detail page dispatches a GitHub Actions `workflow_dispatch` event and immediately records a `building` deployment. When your workflow completes, it can call back to `PATCH /api/deployments/{id}` to update the status to `succeeded` or `failed`.

### 1. Create a GitHub Fine-Grained Token

1. Go to **GitHub → Settings → Developer Settings → Personal access tokens → Fine-grained tokens**
2. Click **Generate new token**
3. Set **Resource owner** to your user or org
4. Under **Repository access**, select the repos ServiceForge will deploy
5. Grant these **Repository permissions**:
   - **Actions** — Read and write
   - **Contents** — Read-only
   - **Metadata** — Read-only (auto-selected)
6. Copy the token — it starts with `github_pat_...`

### 2. Configure Environment Variables

Add to `backend/.env`:

```bash
GITHUB_TOKEN=github_pat_your_token_here
GITHUB_WORKFLOW_FILE=deploy.yml   # name of the workflow file in .github/workflows/
```

Restart the backend to pick up the new vars:

```bash
docker compose restart backend
```

### 3. Add a Workflow File to the Target Repo

ServiceForge dispatches `workflow_dispatch` with these inputs:

| Input | Value |
|---|---|
| `version` | version tag you entered (e.g. `v1.2.3`) |
| `environment` | environment from the service (e.g. `development`) |
| `deployment_id` | UUID of the deployment record in ServiceForge |

Create `.github/workflows/deploy.yml` in your target repo:

```yaml
name: Deploy

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version tag to deploy'
        required: true
      environment:
        description: 'Target environment'
        required: true
        default: 'development'
      deployment_id:
        description: 'ServiceForge deployment ID (for status callback)'
        required: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build and push image
        run: |
          echo "Building ${{ inputs.version }} for ${{ inputs.environment }}"
          # docker build / push steps go here

      - name: Report success to ServiceForge
        if: success()
        run: |
          curl -s -X PATCH ${{ secrets.SERVICEFORGE_API_URL }}/api/deployments/${{ inputs.deployment_id }} \
            -H "Content-Type: application/json" \
            -H "X-Api-Key: ${{ secrets.SERVICEFORGE_API_KEY }}" \
            -d '{"status": "succeeded"}'

      - name: Report failure to ServiceForge
        if: failure()
        run: |
          curl -s -X PATCH ${{ secrets.SERVICEFORGE_API_URL }}/api/deployments/${{ inputs.deployment_id }} \
            -H "Content-Type: application/json" \
            -H "X-Api-Key: ${{ secrets.SERVICEFORGE_API_KEY }}" \
            -d '{"status": "failed"}'
```

Add `SERVICEFORGE_API_URL` and `SERVICEFORGE_API_KEY` as secrets in your repo settings.

### 4. Test Locally

1. Open the service detail page at `http://localhost:3000/services/{id}`
2. Click **Trigger Deployment** (indigo button)
3. Enter a version tag (e.g. `v1.0.0`) and optionally a git ref and notes
4. Click **Trigger Deployment** — the form shows a spinner while dispatching
5. On success: a `building` deployment appears in the history table
6. The GitHub Actions run will appear in your repo's **Actions** tab
7. When the workflow finishes, it calls back and the deployment status updates to `succeeded` or `failed`

**If the button shows an error:**

| Error | Cause |
|---|---|
| `GITHUB_TOKEN is not configured` | `GITHUB_TOKEN` missing from `backend/.env` |
| `GitHub token is invalid or expired` | Token is wrong or has been revoked |
| `GitHub token lacks required permissions` | Re-create the token with Actions: Read/Write |
| `Repository or workflow file not found` | Wrong workflow filename or repo URL |
| `Invalid ref` | Branch/tag doesn't exist in the target repo |

---

## API Endpoints

All endpoints except `/api/health`, `/api/auth/register`, and `/api/auth/login` require an `Authorization: Bearer <token>` header. CI/CD endpoints (`/api/deployments/*`) also accept an `X-Api-Key` header in place of a JWT.

### Auth

| Method | Endpoint               | Description                              |
| ------ | ---------------------- | ---------------------------------------- |
| POST   | /api/auth/register     | Create first admin account (closes after first user) |
| POST   | /api/auth/login        | Login — returns JWT access token         |
| GET    | /api/auth/me           | Get current user                         |

### Services

| Method | Endpoint                                      | Description                    |
| ------ | --------------------------------------------- | ------------------------------ |
| GET    | /api/services/                                | List all services              |
| GET    | /api/services/{id}                            | Get service details            |
| POST   | /api/services/                                | Create a service               |
| PUT    | /api/services/{id}                            | Update a service               |
| DELETE | /api/services/{id}                            | Delete a service               |
| POST   | /api/services/{id}/trigger-deployment         | Dispatch GitHub Actions + record deployment |

### Deployments

| Method | Endpoint                              | Description                    |
| ------ | ------------------------------------- | ------------------------------ |
| GET    | /api/deployments/service/{service_id} | List deployments for a service |
| GET    | /api/deployments/{id}                 | Get deployment details         |
| POST   | /api/deployments/                     | Create a deployment            |
| PATCH  | /api/deployments/{id}                 | Update deployment status       |
| POST   | /api/deployments/{id}/rollback        | Rollback to a deployment       |

### Health Checks

| Method | Endpoint                                       | Description                    |
| ------ | ---------------------------------------------- | ------------------------------ |
| POST   | /api/health-checks/service/{service_id}        | Run a health check             |
| GET    | /api/health-checks/service/{service_id}/latest | Get latest health check result |

## Project Structure

```
service-forge/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app entry point, CORS, route registration
│   │   ├── config.py         # Configuration / env vars
│   │   ├── database.py       # SQLAlchemy engine & session
│   │   ├── models/           # SQLAlchemy ORM models
│   │   │   ├── user.py
│   │   │   ├── service.py
│   │   │   ├── deployment.py
│   │   │   └── health_check.py
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   │   ├── auth.py
│   │   │   ├── service.py
│   │   │   ├── deployment.py
│   │   │   └── health_check.py
│   │   ├── routes/           # API route handlers
│   │   │   ├── auth.py
│   │   │   ├── services.py
│   │   │   ├── deployments.py
│   │   │   └── health_checks.py
│   │   └── utils/
│   │       ├── auth.py       # JWT, bcrypt, auth dependencies
│   │       └── github.py     # GitHub Actions dispatch helpers
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (protected)/  # Route group — requires auth
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx  # Dashboard
│   │   │   │   └── services/ # Service detail, new, edit pages
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── components/       # Reusable UI components
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── lib/
│   │   │   └── api.ts        # Typed API client
│   │   └── types/            # TypeScript types
│   ├── Dockerfile
│   └── package.json
├── infra/                    # Terraform infrastructure
│   ├── main.tf               # Root module — wires all modules together
│   ├── variables.tf
│   ├── outputs.tf
│   └── modules/
│       ├── ecr/              # ECR repositories
│       ├── vpc/              # VPC, subnets, NAT, security groups
│       ├── rds/              # PostgreSQL on RDS + Secrets Manager
│       ├── ecs/              # Fargate cluster, task definitions, services
│       ├── alb/              # Application Load Balancer + target groups
│       ├── cloudwatch/       # Alarms + dashboard
│       └── app_secrets/      # JWT secret + API key in Secrets Manager
├── .github/
│   └── workflows/
│       └── deploy.yml        # CI/CD: build → ECR → ECS → callback
├── docker-compose.yml
└── README.md
```

## Infrastructure

All AWS infrastructure is managed with Terraform and lives in `infra/`. State is stored in S3.

| Module         | Resources                                                        |
| -------------- | ---------------------------------------------------------------- |
| `ecr`          | Backend and frontend ECR repositories with lifecycle policies    |
| `vpc`          | VPC, public/private subnets across 2 AZs, NAT gateway, 4 SGs   |
| `rds`          | PostgreSQL 15 on RDS, random password stored in Secrets Manager  |
| `ecs`          | Fargate cluster, task definitions, rolling-deploy services       |
| `alb`          | ALB with path-based routing (`/api/*` → backend, `/*` → frontend)|
| `cloudwatch`   | CPU/memory/5xx alarms + metrics dashboard                        |
| `app_secrets`  | Auto-generated JWT signing key and CI/CD API key in Secrets Manager |

To apply infrastructure changes:

```bash
cd infra
terraform init
terraform plan
terraform apply
```

## License

MIT
