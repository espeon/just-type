-- Audit logging: track all document edits with attribution and metadata
CREATE TABLE document_edits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subdoc_guid TEXT NOT NULL REFERENCES subdocs(guid) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL,
    yjs_update BYTEA NOT NULL,
    edit_type TEXT,
    block_type TEXT,
    block_position INTEGER,
    content_before TEXT,
    content_after TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_document_edits_subdoc ON document_edits(subdoc_guid);
CREATE INDEX idx_document_edits_user ON document_edits(user_id);
CREATE INDEX idx_document_edits_session ON document_edits(session_id);
CREATE INDEX idx_document_edits_created ON document_edits(created_at DESC);
CREATE INDEX idx_document_edits_subdoc_created ON document_edits(subdoc_guid, created_at DESC);

-- Document snapshots: periodic full snapshots for faster history reconstruction
CREATE TABLE document_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subdoc_guid TEXT NOT NULL REFERENCES subdocs(guid) ON DELETE CASCADE,
    yjs_state BYTEA NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    snapshot_type TEXT NOT NULL DEFAULT 'manual' CHECK (snapshot_type IN ('manual', 'auto', 'pre_restore')),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_document_snapshots_subdoc ON document_snapshots(subdoc_guid);
CREATE INDEX idx_document_snapshots_created ON document_snapshots(created_at DESC);
CREATE INDEX idx_document_snapshots_subdoc_created ON document_snapshots(subdoc_guid, created_at DESC);
CREATE INDEX idx_document_snapshots_type ON document_snapshots(snapshot_type);
