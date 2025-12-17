-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vaults table
CREATE TABLE IF NOT EXISTS vaults (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subdocuments table (unified storage for all Yjs docs)
CREATE TABLE IF NOT EXISTS subdocs (
    guid TEXT PRIMARY KEY,
    vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
    parent_guid TEXT,
    doc_type TEXT NOT NULL CHECK (doc_type IN ('vault', 'document', 'database', 'row')),
    yjs_state BYTEA NOT NULL,
    state_vector BYTEA NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subdocs_vault ON subdocs(vault_id);
CREATE INDEX idx_subdocs_parent ON subdocs(parent_guid);
CREATE INDEX idx_subdocs_type ON subdocs(doc_type);
CREATE INDEX idx_subdocs_modified ON subdocs(modified_at DESC);

-- Document updates audit log (optional, for history)
CREATE TABLE IF NOT EXISTS document_updates (
    id BIGSERIAL PRIMARY KEY,
    subdoc_guid TEXT NOT NULL REFERENCES subdocs(guid) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    update BYTEA NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_updates_subdoc ON document_updates(subdoc_guid, created_at DESC);
