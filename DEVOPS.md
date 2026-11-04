# Dexta Africa Enterprise Portal — DevOps & Cloud Architecture

This document outlines the professional DevOps engineering architecture, Docker containerization strategy, Git workflow policies, and CI/CD automation pipelines for the **Dexta Africa Admin Portal**.

---

## 1. High-Level Architecture

```mermaid
flowchart TD
    subgraph Git_Workflow["Git Workflow & Branches"]
        FEAT["feature/* / fix/*"] -->|PR / Code Review| DEV["develop (Integration & Staging)"]
        DEV -->|Release PR / Tag| MAIN["main (Production)"]
        HOTFIX["hotfix/*"] -->|Emergency PR| MAIN
        HOTFIX -->|Backport| DEV
    end

    subgraph CI_CD["GitHub Actions CI/CD"]
        DEV -->|Trigger| CI["ci.yml (Lint, Typecheck, Build, Docker Test)"]
        MAIN -->|Trigger| CD["release.yml (Multi-Arch Build & GHCR Publish)"]
        REGISTRY[("ghcr.io/dextaafrica/admin-portal")]
        CD --> REGISTRY
    end

    subgraph Container_Runtime["Docker Runtime Architecture"]
        REGISTRY --> PULL["Docker Runner (Non-Root UID 1001)"]
        PULL --> STANDALONE["Next.js Standalone (Port 3000)"]
        PULL --> PRISMA["Prisma Engine + SQLite / PostgreSQL"]
        PULL --> HEALTH["Healthcheck /api/health"]
    end

    subgraph Services["Orchestrated Services (Dev / Testing)"]
        STANDALONE --> MINIO["MinIO (Local S3 Storage :9000/:9001)"]
        STANDALONE --> MAILPIT["Mailpit (Local SMTP Testing :1025/:8025)"]
    end
```

---

## 2. Git Workflow & Branching Strategy

The repository strictly enforces a dual-trunk workflow with **`main`** as production and **`develop`** as integration:

| Branch | Role | Deployment Target | Protection Rules |
| :--- | :--- | :--- | :--- |
| **`main`** | **Production** | Live production environment / GHCR `:latest` | Requires PR from `develop` or `hotfix/*`, passing CI, review approvals. Direct pushes prohibited. |
| **`develop`** | **Staging & Integration** | Staging / testing environment | Central integration branch. All feature branches merge here via PR. |
| **`feature/<name>`** | New features | Local / Ephemeral branch | Branched from `develop`, merged back to `develop`. |
| **`fix/<name>`** | Bug fixes | Local / Ephemeral branch | Branched from `develop`, merged back to `develop`. |
| **`hotfix/<name>`** | Production emergencies | Production fix | Branched from `main`, merged to both `main` and `develop`. |

### Branch Flow Commands

```bash
# 1. Start a new feature from develop
git checkout develop
git pull origin develop
git checkout -b feature/auth-device-sessions

# 2. Commit using Conventional Commits format
git commit -m "feat(auth): add persistent device session revoking"

# 3. Push and open PR targeting develop
git push -u origin feature/auth-device-sessions

# 4. Release promotion from develop to main
git checkout main
git pull origin main
git checkout -b release/v1.0.0
# Open PR: base: main <- compare: develop
```

---

## 3. Docker Containerization Architecture

The application uses an optimized **multi-stage Docker build** (`Dockerfile`) utilizing Next.js **standalone mode**:

### Multi-Stage Build Breakdown

1. **`base` (Alpine Linux + Node.js 20)**:
   - Base image: `node:20-alpine`.
   - Installs native prerequisites: `libc6-compat` and `openssl` (required for Prisma Query Engines on musl libc).

2. **`deps` (Dependency Resolution)**:
   - Copies `package.json`, `package-lock.json`, and `prisma/schema.prisma`.
   - Executes `npm ci` for deterministic, cached dependency installation.

3. **`builder` (Compilation)**:
   - Generates Prisma client bindings (`npx prisma generate`).
   - Runs `npm run build` with `output: 'standalone'`, creating a minimal standalone bundle that copies only strictly necessary node_modules.

4. **`runner` (Hardened Production Image)**:
   - Runs as an unprivileged non-root user (`nextjs:nodejs`, UID/GID 1001) for container security compliance.
   - Signal management: Uses `dumb-init` as PID 1 to ensure instant and graceful propagation of `SIGTERM` / `SIGINT` signals.
   - Healthcheck: Built-in probe executing `curl -f http://localhost:3000/api/health` every 30 seconds.
   - Entrypoint: `docker-entrypoint.sh` automatically synchronizes database schema (`prisma db push`) and mounts persistent volumes.

---

## 4. Local Development Containers (`docker-compose.dev.yml` & `Dockerfile.dev`)

For daily development with **live code hot-reloading (HMR)** and isolated dependencies:

- **Hot Reloading**: The host directory is bind-mounted (`.:/app`), with `WATCHPACK_POLLING=true` enabled for cross-platform filesystem sync.
- **Dependency Isolation**: Anonymous volume `/app/node_modules` guarantees that container-native Linux musl binaries and engines do not clash with macOS/host packages.
- **Persistent Local Assets & DB**: Native persistent volumes for SQLite (`/app/prisma/dev.db`) and local asset storage (`/app/public/uploads`).
- **Local Mail Testing**: Pre-configured with local Mailpit SMTP server (`:1025` / Web inbox `:8025`).
- **IDE Dev Container**: `.devcontainer/devcontainer.json` provides native 1-click container workspace in VS Code or Cursor.

### Dev Container Commands

```bash
# Start live hot-reloading dev container stack
make dev-up
# Or directly via docker compose:
docker compose -f docker-compose.dev.yml up -d --build

# Stream live development server logs
make dev-logs
# Or:
docker compose -f docker-compose.dev.yml logs -f app

# Stop the dev container stack
make dev-down
```

---

## 5. Local Production-Like Stack with Docker Compose (`docker-compose.yml`)

To test the entire enterprise stack locally without configuring external cloud services, Docker Compose provides:

- **Web Portal Application**: Next.js standalone container on port `3000`.
- **Local S3 Cloud Storage (MinIO)**: High-performance S3 emulator on port `9000` (API) and `9001` (Web Console), with automatic bucket creation.
- **Local Email Testing Server (Mailpit)**: Captures all outbound campaign and verification emails on port `1025` (SMTP) with web inbox preview at `http://localhost:8025`.

### Quickstart Commands

```bash
# Start all services in the background
docker-compose up -d --build

# View real-time application logs
docker-compose logs -f app

# Stop all services
docker-compose down
```

### Access Endpoints

- **Portal Web UI**: `http://localhost:3000`
- **Container Health Check**: `http://localhost:3000/api/health`
- **MinIO S3 Console**: `http://localhost:9001` (Credentials: `dexta_minio_user` / `DextaMinioPass2026!`)
- **Mailpit Email Inbox**: `http://localhost:8025`

---

## 5. Production Deployment (`docker-compose.prod.yml`)

For single-node VPS, Cloud VMs (AWS EC2, DigitalOcean Droplets, Hetzner), or PaaS (Coolify, Dokku):

```bash
# 1. Copy and configure production secrets
cp .env.example .env
nano .env

# 2. Launch production stack with restart policy and log rotation
docker-compose -f docker-compose.prod.yml up -d --build
```

### Production Hardening Highlights

- **Resource Limits**: CPU capped at 2.0 cores, memory capped at 2048MB.
- **Log Rotation**: Docker `json-file` logging driver limited to `max-size: "20m"` and `max-file: "5"`.
- **Persistent Storage**: Named Docker volume `dexta-prod-sqlite` ensures data persists across container recreations.

---

## 6. GitHub Actions CI/CD Automation

Located in `.github/workflows/`:

1. **`ci.yml` (Continuous Integration)**:
   - Triggers on PRs to `main` and `develop`, and pushes to `develop`.
   - Runs `npm run typecheck`, `npm run lint`, Next.js standalone build, and test Docker image compilation with layer caching.

2. **`release.yml` (Continuous Delivery)**:
   - Triggers on push/merge to `main` or version tags (`v*.*.*`).
   - Compiles multi-platform images (`linux/amd64`, `linux/arm64`).
   - Pushes images to GitHub Container Registry (`ghcr.io/dextaafrica/admin-portal:latest`).

3. **`pr-hygiene.yml` (Branch Policy & Conventional Commits)**:
   - Enforces that PRs to `main` must come from `develop` or release/hotfix branches.
   - Enforces Conventional Commit titles (`feat:`, `fix:`, `chore:`, etc.).

4. **`dependabot.yml`**:
   - Automated weekly vulnerability updates for npm packages and GitHub Actions.

---

## 7. Database Maintenance & Backup Runbook

### SQLite Volume Backup

```bash
# Create an atomic hot backup of the SQLite database
docker exec -t dexta-admin-portal sqlite3 /app/prisma/admin_portal.db ".backup '/app/data/backup_$(date +%Y%m%d_%H%M%S).db'"

# Copy backup to host machine
docker cp dexta-admin-portal:/app/data/. ./backups/
```

### Upgrading to Managed PostgreSQL

To switch to enterprise PostgreSQL (e.g., AWS RDS or Supabase), update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

And set `DATABASE_URL` in `.env`:
```env
DATABASE_URL="postgresql://user:password@rds-host:5432/dexta_portal?sslmode=require"
```
Re-run `npx prisma generate && npx prisma db push`.

