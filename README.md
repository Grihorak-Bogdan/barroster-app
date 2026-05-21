# BarRoster

Staff and shift management system for bars and restaurants.

**Stack:** React 19 + TypeScript + Tailwind CSS v4 · Django 5 + DRF · PostgreSQL · Docker

---

## Features

- Branches — create and manage multiple venue locations
- Employees — hire staff, track roles, compensations, and employment history
- Shifts — plan, confirm, and complete shifts with per-employee time assignments
- Leave Requests — approve or reject vacation, sick leave, and days off
- Payroll — generate and approve payroll periods with auto-calculated hours and pay
- Reports — hours summary per employee with CSV export
- Audit Log — full history of all changes across the system
- Role-based access — Owner, Manager, Supervisor, Staff

---

## Project Structure

```
barroster-app/
├── apps/
│   ├── api/          # Django REST API
│   └── web/          # React + Vite frontend
├── packages/
├── docker-compose.yml
├── package.json
└── pnpm-workspace.yaml
```

---

## Local Development

### Prerequisites

- Python 3.12+
- Node.js 20+
- pnpm (`npm install -g pnpm`)

### Backend

```bash
cd apps/api
cp .env.example .env        # edit as needed
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo  # optional: load demo data
python manage.py runserver
```

API runs at `http://localhost:8000`

### Frontend

```bash
# from repo root
pnpm install
pnpm --filter @barroster/web dev
```

Frontend runs at `http://localhost:5173`

---

## Docker Deployment

### 1. Create a `.env` file at the repo root

```bash
cp apps/api/.env.example .env
```

Required variables:

```env
SECRET_KEY=<generate with: python -c "import secrets; print(secrets.token_hex(50))">
POSTGRES_PASSWORD=<strong password>
ALLOWED_HOSTS=yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

### 2. Build and start

```bash
docker compose up --build -d
```

### 3. Run migrations (first deploy)

```bash
docker compose exec api python manage.py migrate
docker compose exec api python manage.py createsuperuser
```

The web frontend is served at `http://localhost` (port 80 by default, override with `PORT=443`).
API requests from the browser are proxied via nginx to the `api` container — no CORS issues.

---

## Environment Variables

All variables are read by `apps/api/.env` (or the container environment).

| Variable | Default | Description |
|---|---|---|
| `SECRET_KEY` | `django-insecure-...` | Django secret key — **must change in production** |
| `DATABASE_URL` | *(SQLite)* | Postgres URL: `postgres://user:pass@host:5432/db` |
| `DEBUG` | auto | `true` / `false` — auto-detected from `runserver` |
| `ALLOWED_HOSTS` | `127.0.0.1,localhost` | Comma-separated hostnames |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated origins |
| `JWT_ACCESS_MINUTES` | `60` | JWT access token lifetime |
| `JWT_REFRESH_DAYS` | `30` | JWT refresh token lifetime |
| `POSTGRES_PASSWORD` | `barroster_dev` | Postgres password (docker-compose) |
| `PORT` | `80` | Host port to expose the web container on |
| `SECURE_SSL_REDIRECT` | `true` | Redirect HTTP → HTTPS (when DEBUG=false) |

---

## Demo Data

```bash
# Seed demo branches, users, shifts, and payroll data
python manage.py seed_demo

# Wipe everything and re-seed
python manage.py seed_demo --clear
```

Demo logins (password: `Password1!`):

| Email | Role |
|---|---|
| owner@demo.com | Owner — both branches |
| manager@demo.com | Manager — both branches |
| supervisor1@demo.com | Supervisor — Downtown Bar |
| staff1@demo.com | Staff — Downtown Bar |
| staff4@demo.com | Staff — Airport Lounge |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS v4, React Router v7 |
| Backend | Django 5, Django REST Framework, SimpleJWT |
| Database | PostgreSQL (production), SQLite (local dev) |
| Tooling | pnpm workspaces, Turborepo |
| Deploy | Docker, nginx |
