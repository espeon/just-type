# backend

rust collaboration server with yjs websocket sync

## quick start

```bash
just init    # setup db and migrations
just run     # start server on localhost:3000
```

## development

```bash
just dev     # hot reload (requires cargo-watch)
just test    # run tests
just fmt     # format code
just lint    # clippy
```

## database

```bash
just db              # start postgres in docker
just db-reset        # reset database (deletes data)
just migrate         # run migrations
just migrate-create NAME  # create new migration
```

## project structure

```
src/
├── main.rs          # axum server setup, routes, cors
├── config.rs        # env var loading
├── api/
│   ├── auth.rs      # POST /api/auth/register, /login
│   ├── users.rs     # GET /api/users/me
│   ├── vaults.rs    # vault crud endpoints
│   └── websocket.rs # yjs websocket sync handler
├── auth/
│   ├── jwt.rs       # token generation/validation
│   └── password.rs  # argon2 hashing
├── sync/
│   └── mod.rs       # SyncManager - broadcasts yjs updates
├── db/              # postgres pool initialization
└── models/          # request/response structs
```

## how yjs sync works

1. client connects to `/ws/{doc_guid}`
2. client sends state vector (what updates it has)
3. server responds with missing updates
4. as users edit, client sends update messages
5. server broadcasts to all other connected clients
6. clients apply updates (automatic crdt merge)

**SyncManager** (`src/sync/mod.rs`):
- maintains `HashMap<doc_guid, broadcast::Sender<Vec<u8>>>`
- creates broadcast channel per document on first connection
- `broadcast_update()` sends to all subscribers

**WebSocket handler** (`src/api/websocket.rs`):
- uses `yrs-axum` which implements yjs protocol
- loads/saves `yjs_state` and `state_vector` from postgres
- handles reconnection via state vector comparison

**database storage**:
- `subdocs.yjs_state` - full document state (bytea)
- `subdocs.state_vector` - compact version info (bytea)
- updates applied incrementally and persisted

## authentication

**flow**:
1. POST `/api/auth/register` with email/password
2. server hashes password with argon2
3. creates user in postgres
4. generates jwt token (hs256, 30 day expiry)
5. client stores token, sends in `Authorization: Bearer <token>` header

**jwt structure**:
- claims: `user_id` (uuid), `exp` (timestamp)
- secret from `JWT_SECRET` env var
- validated via middleware in protected routes

**current limitation**: websocket connections don't handle unauthed connections properly

## database schema

**users** - accounts with email/password hash
- `id` (uuid), `email` (unique), `password_hash`, `username`, `display_name`

**vaults** - user-owned document collections
- `id` (uuid), `user_id` (fk), `name`

**subdocs** - unified yjs document storage
- `guid` (text pk) - client-generated document id
- `vault_id` (fk) - which vault owns this
- `parent_guid` (fk) - hierarchical nesting
- `doc_type` - enum: 'vault' | 'document' | 'database' | 'row'
- `yjs_state` (bytea) - full crdt state
- `state_vector` (bytea) - version info for sync
- indexes on: vault_id, parent_guid, doc_type, modified_at

**document_updates** - audit log of all yjs updates
- `subdoc_guid` (fk), `user_id` (fk), `update` (bytea), `created_at`

## offline-first design

server is **only a sync layer**, not source of truth:
- clients create/edit documents completely offline
- websocket broadcasts changes to collaborators
- if server crashes, clients continue working
- reconnection syncs missed changes via state vectors
- no server-side conflict resolution (crdt handles it)

## env vars

copy `.env.example` to `.env`:
- `DATABASE_URL` - postgres://user:pass@localhost:5432/justtype
- `JWT_SECRET` - random secret for tokens
- `PORT` - server port (default 3000)
- `RUST_LOG` - tracing level (info, debug, trace)

## testing api

```bash
# register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# login (get token)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# use token
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```
