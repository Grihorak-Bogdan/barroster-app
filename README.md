# BarRoster

BarRoster is a staff and shift management system for bars and restaurants.  
The project is built as a monorepo with a React + TypeScript frontend and a Django backend.

## Overview

The goal of BarRoster is to simplify everyday staff management in hospitality businesses.  
The system is designed to help managers organize shifts, assign employees, track employment records, manage leave requests, and support internal team communication.

This project is currently in active development.

## Tech Stack

### Frontend
- React
- TypeScript
- Vite

### Backend
- Django
- Django REST Framework
- django-cors-headers

### Database
- PostgreSQL (planned)
- SQLite (temporary local development)

### Monorepo / Tooling
- pnpm workspaces
- Turborepo

## Project Structure

```text
barroster/
├─ apps/
│  ├─ web/              # React + TypeScript frontend
│  └─ api/              # Django backend
├─ packages/
│  └─ types/            # shared package for common types/contracts
├─ package.json
├─ pnpm-workspace.yaml
├─ turbo.json
└─ README.md