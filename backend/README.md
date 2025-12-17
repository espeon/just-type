# Just Type Server

Rust-based collaboration server for Just Type, following offline-first principles.

## Features

- **Authentication**: Email/password registration and login with JWT tokens
- **WebSocket Sync**: Real-time collaboration via WebSocket (Yjs protocol - Phase 2)
- **Multi-Tenant**: Vault-based isolation for users
- **Offline-First**: Server acts as sync layer, clients work offline

## Quick Start

### Prerequisites

- Rust 1.70+
- PostgreSQL 14+ (or Docker)
- [just](https://github.com/casey/just) command runner

### First-Time Setup

```bash
# Initialize everything (creates .env, starts db, runs migrations)
just init

# Start the server
just run
```

That's it! The server will be running on `http://localhost:3000`

### Common Commands

```bash
just              # List all available commands
just db           # Start PostgreSQL in Docker
just run          # Run the server (starts db automatically)
just dev          # Run with hot reload
just test         # Run tests
just precommit    # Format + lint + build
```

### Testing the API

```bash
# Make sure server is running first
just run

# In another terminal:
just test-register  # Register a user
just test-login     # Login
just test-health    # Health check
```

## Manual Setup (without just)

<details>
<summary>Click to expand</summary>

1. **Start PostgreSQL**:
```bash
docker-compose up -d
```

2. **Copy environment variables**:
```bash
cp .env.example .env
# Edit .env and set your JWT_SECRET
```

3. **Run migrations**:
```bash
cargo sqlx migrate run
```

4. **Start server**:
```bash
cargo run
```

</details>

## Project Structure

```
src/
├── main.rs              # Entry point
├── config.rs            # Configuration
├── auth/                # Authentication & JWT
│   ├── mod.rs
│   ├── jwt.rs
│   └── password.rs
├── api/                 # HTTP & WebSocket routes
│   ├── mod.rs
│   ├── auth.rs
│   └── websocket.rs
├── sync/                # Yjs sync engine (Phase 2)
├── db/                  # Database connection
└── models/              # Data models

migrations/              # SQL migrations
justfile                 # Command runner recipes
docker-compose.yml       # PostgreSQL for development
```

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (default in .env.example)
- `PORT` - Server port (default: 3000)
- `JWT_SECRET` - Secret key for JWT tokens (set this!)

## Development

### Available Commands

Run `just` to see all available commands:

- `just db` - Start PostgreSQL
- `just run` - Run server
- `just dev` - Run with hot reload
- `just test` - Run tests
- `just fmt` - Format code
- `just lint` - Lint code
- `just build` - Build project
- `just db-reset` - Reset database (⚠️ deletes all data)
- `just migrate` - Run migrations
- `just migrate-create NAME` - Create new migration

### Hot Reload

```bash
# Install cargo-watch first
just install-watch

# Then run with hot reload
just dev
```

## API Endpoints

### Authentication

**POST /api/auth/register**
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**POST /api/auth/login**
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

### WebSocket

**GET /ws** - WebSocket endpoint for real-time sync (Phase 2)

### Health Check

**GET /health** - Returns "OK"

## Roadmap

- [x] Phase 1: Authentication + WebSocket foundation
- [ ] Phase 2: Yjs sync engine with persistence
- [ ] Phase 3: Multi-vault support
- [ ] Phase 4: Production hardening
- [ ] Phase 5: Subdocument architecture for databases

## License

MIT
