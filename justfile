# List available commands
default:
    @just --list

# === Frontend Commands ===

# Run frontend in dev mode
fe-dev:
    cd frontend && pnpm tauri dev

# Build frontend for production
fe-build:
    cd frontend && pnpm build

# Build tauri app
fe-tauri:
    cd frontend && pnpm tauri build

# Run frontend tests
fe-test:
    cd frontend && pnpm test

# Format frontend code
fe-fmt:
    cd frontend && pnpm format

# === Backend Commands ===

# Run backend server
be-dev:
    cd backend && just run

# Build backend
be-build:
    cd backend && cargo build

# Build backend release
be-build-release:
    cd backend && cargo build --release

# Run backend tests
be-test:
    cd backend && cargo test

# Format backend code
be-fmt:
    cd backend && cargo fmt

# Initialize backend (first time setup)
be-init:
    cd backend && just init

# Reset backend database
be-db-reset:
    cd backend && just db-reset

# === Combined Commands ===

# Format all code (frontend + backend)
fmt: fe-fmt be-fmt

# Run all tests
test: fe-test be-test

# Build everything
build: fe-build be-build

# Start development (shows instructions)
dev:
    @echo "=== Just Type Development ==="
    @echo ""
    @echo "Terminal 1 - Backend:"
    @echo "  just be-dev"
    @echo ""
    @echo "Terminal 2 - Frontend:"
    @echo "  just fe-dev"
    @echo ""
    @echo "Or run them individually in separate terminals"

# First time setup
init:
    @echo "Setting up backend..."
    cd backend && just init
    @echo ""
    @echo "Installing frontend dependencies..."
    cd frontend && pnpm install
    @echo ""
    @echo "Setup complete! Run 'just dev' to see how to start development"

# Clean all build artifacts
clean:
    cd frontend && rm -rf node_modules dist .next
    cd backend && cargo clean
    @echo "All build artifacts cleaned"
