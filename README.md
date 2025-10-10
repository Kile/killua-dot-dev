# Killua Discord Bot Dashboard

A modern Discord bot dashboard built with React frontend and Java Spring Boot backend.

## Features

### Public Pages
- **Landing Page**: Feature showcase with invite, support server, and Patreon links
- **Premium Page**: Three-tier subscription system with perks
- **Team Page**: Team member profiles with images and descriptions
- **Commands Page**: Searchable command documentation with collapsible groups
- **News Page**: Public news feed with detailed articles and updates
- **News Detail Page**: Individual news articles with full content and metadata

### User Features
- **Discord OAuth**: Secure login with Discord integration
- **Account Page**: Personal dashboard with user statistics, settings, and preferences
- **User Settings**: Manage action settings, email notifications, and voting reminders
- **User Statistics**: Comprehensive stats including achievements, badges, game stats, and voting streaks
- **Premium Management**: View and manage premium subscriptions

### Admin Features
- **Admin Panel**: Comprehensive admin dashboard with multiple management tools
- **User Search**: Search and manage any user by Discord ID with full account access
- **User Management**: Edit user settings, view detailed statistics, and manage permissions
- **News Management**: Create, edit, delete, and publish news articles
- **File Manager**: Upload, organize, and manage CDN files with preview capabilities
- **File Link Generation**: Generate secure, time-limited access links for files

### Technical Features
- **Responsive Design**: Modern UI that works on all devices
- **Real-time Updates**: Live statistics and dynamic content updates
- **Secure Authentication**: JWT-based authentication with Discord OAuth2
- **File Upload System**: Drag-and-drop file uploads with progress tracking
- **Markdown Support**: Rich text editing with markdown rendering
- **Image Management**: Smart image layout and CDN integration

## Technologies Used

### Frontend
- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Type-safe JavaScript development
- **Vite 4**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Beautiful icon library
- **Recharts**: Composable charting library for React
- **React Router**: Client-side routing
- **React Hook Form**: Performant forms with validation

### Backend
- **Java 17**: Modern Java with latest features
- **Spring Boot 3.2**: Rapid application development framework
- **Spring Security**: Authentication and authorization
- **Spring Web**: RESTful web services
- **Spring Validation**: Bean validation framework
- **JPA/Hibernate**: Object-relational mapping
- **Maven**: Dependency management and build tool

### Database & Storage
- **H2 Database**: In-memory database for development
- **PostgreSQL**: Production-ready relational database
- **JWT**: JSON Web Tokens for authentication
- **Discord OAuth2**: Secure Discord integration

### Infrastructure
- **Docker**: Containerization platform
- **Docker Compose**: Multi-container application orchestration
- **Nginx**: Web server and reverse proxy
- **GitHub Actions**: CI/CD pipeline automation
- **GitHub Container Registry**: Container image storage

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

Controls which upstream the backend forwards to for stats/commands/user/info.

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

## Additional Environment Variables

Optional environment variables for enhanced functionality:

```
# Admin configuration
ADMIN_DISCORD_IDS=123456789,987654321

# CDN configuration
CDN_BASE_URL=https://cdn.killua.dev
CDN_TOKEN_SECRET=your-cdn-token-secret

# External API configuration
EXTERNAL_API_TIMEOUT=30000
```

## API Endpoints

### Public Endpoints
- `GET /api/stats` - Bot statistics
- `GET /api/commands` - Command documentation
- `GET /api/news` - Public news feed
- `GET /api/news/{id}` - Individual news article

### Authenticated Endpoints
- `GET /api/auth/user` - Current user information
- `GET /api/user/info` - Detailed user statistics
- `PUT /api/user/edit/{userId}` - Update user settings
- `POST /api/news/like` - Like/unlike news article

### Admin Endpoints
- `GET /api/admin/check` - Check admin status
- `GET /api/admin/user/{discordId}` - Get user info by Discord ID
- `POST /api/news/save` - Create news article
- `PUT /api/news/{id}` - Edit news article
- `DELETE /api/news/{id}` - Delete news article
- `POST /api/files/generate-link` - Generate file access link
- `GET /api/files/list` - List CDN files
- `POST /api/files/upload` - Upload file to CDN

## Development

### Project Structure
```
├── frontend/          # React TypeScript application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service functions
│   │   ├── contexts/      # React contexts
│   │   ├── types/         # TypeScript type definitions
│   │   └── utils/         # Utility functions
│   └── public/            # Static assets
├── backend/           # Spring Boot application
│   ├── src/main/java/
│   │   ├── controller/    # REST controllers
│   │   ├── service/       # Business logic
│   │   ├── entity/        # JPA entities
│   │   ├── repository/    # Data repositories
│   │   ├── dto/           # Data transfer objects
│   │   └── security/      # Security configuration
│   └── src/test/java/     # Unit tests
└── docker-compose.yml    # Container orchestration
```

### Testing
```bash
# Run frontend tests
cd frontend && npm test

# Run backend tests
cd backend && mvn test

# Run all tests
./test.sh
```