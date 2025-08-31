# Killua Discord Bot Dashboard

A modern Discord bot dashboard built with React frontend and Java Spring Boot backend.

## Features

- **Landing Page**: Feature showcase with invite, support server, and Patreon links
- **Premium Page**: Three-tier subscription system with perks
- **Team Page**: Team member profiles with images and descriptions
- **Discord OAuth**: Secure login with Discord integration
- **Commands Page**: Searchable command documentation with collapsible groups
- **Responsive Design**: Modern UI that works on all devices

## Technologies Used

- **Frontend**: React 18, TypeScript, Vite 4, Tailwind CSS, Lucide, Recharts
- **Backend**: Java 17, Spring Boot 3.2, Spring Security, Spring Web, Validation
- **Persistence**: JPA with H2 (dev) and PostgreSQL (production ready) for user/auth data
- **Auth/JWT**: Discord OAuth2, JJWT
- **Build**: Maven
- **Containerization**: Docker, Docker Compose (Nginx for SPA + backend JVM)
- **CI/CD**: GitHub Actions (tests, container builds to GHCR)

## Running the app

### Outside Docker (local development)

Prereqs: Node 18+, Java 17+, Maven.

1) Create a root `.env` with required values (see Environment Variables below).
2) Start backend (dev profile, loads .env):
```bash
cd backend && ./start.sh
```
3) Start frontend (Vite dev server with /api proxy):
```bash
cd frontend && ./start.sh
```
4) Open http://localhost:5173

### Docker (compose)

1) Ensure root `.env` has required secrets (see above). For compose you can choose upstream via `EXTERNAL_API_BASE_URL`.
2) Build and run:
```bash
docker compose up --build
```
3) Open http://localhost:3000

## Environment Variables

All secrets are read from a single root `.env` (loaded by start scripts and docker-compose).
Required:
```
VITE_DISCORD_CLIENT_ID=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_REDIRECT_URI=
JWT_SECRET=
EXTERNAL_API_BASE_URL=
```

### EXTERNAL_API_BASE_URL (Upstream API selection)

Controls which upstream the backend forwards to for stats/commands/userinfo.

- Local development (backend outside Docker):
  - Use your local upstream aggregator.
  - Set (or rely on backend/start.sh default):
```bash
EXTERNAL_API_BASE_URL=http://127.0.0.1:7650
```

- Docker (backend in Docker, upstream on your host):
  - Containers can reach your host via `host.docker.internal`.
  - Start compose with:
```bash
EXTERNAL_API_BASE_URL=http://host.docker.internal:7650 docker compose up --build
```

- Production (public upstream):
```bash
EXTERNAL_API_BASE_URL=https://api.killua.dev
```

Compose default: if `EXTERNAL_API_BASE_URL` is not set, docker-compose defaults to `https://api.killua.dev`. Override it as shown above for local testing.