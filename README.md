# ServiceForge

A self-service deployment platform for containerized applications. ServiceForge lets you register GitHub repositories as services, track deployments, view health checks, and manage deployment metadata — all from a clean dashboard UI.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   Next.js       │────▶│   FastAPI       │────▶│  PostgreSQL     │
│   Frontend      │     │   Backend       │     │  Database       │
│   :3000         │     │   :8000         │     │   :5432         │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Features (MVP)

- **Service Registration** — Register services with name, GitHub repo URL, environment, health check URL, and description
- **Deployment Tracking** — Create and track deployment records with version, image URI, status, commit SHA, and timestamps
- **Health Checks** — Call service health endpoints and store results
- **Rollback Simulation** — Roll back to a previous successful deployment
- **Dashboard** — View all services with latest deployment status and health at a glance

## Tech Stack

| Layer           | Technology                           |
| --------------- | ------------------------------------ |
| Frontend        | Next.js 14, TypeScript, Tailwind CSS |
| Backend         | FastAPI, Python 3.11, SQLAlchemy     |
| Database        | PostgreSQL 16                        |
| Container       | Docker, Docker Compose               |
| Cloud (planned) | AWS ECS, ECR, CloudWatch, Terraform  |

## Local Setup

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- Git
- Node.js 20+ and Python 3.11+ _(only needed for running outside Docker)_

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

| File                  | Variable              | Default                                                              | Description                   |
| --------------------- | --------------------- | -------------------------------------------------------------------- | ----------------------------- |
| `backend/.env`        | `DATABASE_URL`        | `postgresql://serviceforge:serviceforge@localhost:5432/serviceforge` | PostgreSQL connection string  |
| `frontend/.env.local` | `NEXT_PUBLIC_API_URL` | `http://localhost:8000`                                              | Backend URL (browser-visible) |

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

## API Endpoints

### Services

| Method | Endpoint           | Description         |
| ------ | ------------------ | ------------------- |
| GET    | /api/services/     | List all services   |
| GET    | /api/services/{id} | Get service details |
| POST   | /api/services/     | Create a service    |
| PUT    | /api/services/{id} | Update a service    |
| DELETE | /api/services/{id} | Delete a service    |

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
serviceforge/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app entry point
│   │   ├── config.py         # Configuration / env vars
│   │   ├── database.py       # SQLAlchemy engine & session
│   │   ├── models/           # SQLAlchemy ORM models
│   │   │   ├── service.py
│   │   │   ├── deployment.py
│   │   │   └── health_check.py
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   │   ├── service.py
│   │   │   ├── deployment.py
│   │   │   └── health_check.py
│   │   └── routes/           # API route handlers
│   │       ├── services.py
│   │       ├── deployments.py
│   │       └── health_checks.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   ├── components/       # Reusable UI components
│   │   ├── lib/              # API client
│   │   └── types/            # TypeScript types
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── package.json
├── infra/                    # Future Terraform files
├── docker-compose.yml
└── README.md
```

## AWS Deployment Roadmap

### Phase 1: Container Registry

- Push Docker images to Amazon ECR
- Tag images with git SHA and semantic version

### Phase 2: ECS Deployment

- Deploy backend and frontend to ECS Fargate
- Configure ALB for routing
- Set up service discovery

### Phase 3: Infrastructure as Code

- Terraform modules for:
  - VPC and networking
  - ECS cluster and services
  - ECR repositories
  - IAM roles and policies
  - RDS PostgreSQL
  - CloudWatch log groups and alarms

### Phase 4: CI/CD Pipeline

- GitHub Actions workflows:
  - Build and push images on merge to main
  - Run tests on PR
  - Deploy to staging automatically
  - Deploy to production with manual approval

### Phase 5: Observability

- CloudWatch metrics and dashboards
- Container Insights
- Alarm notifications via SNS
- Structured logging with correlation IDs

## License

MIT
