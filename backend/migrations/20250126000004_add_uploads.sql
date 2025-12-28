-- Create uploads table for tracking uploaded files
CREATE TABLE uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    storage_key TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_uploads_user ON uploads(user_id);
CREATE INDEX idx_uploads_created ON uploads(created_at DESC);
CREATE INDEX idx_uploads_deleted ON uploads(deleted_at) WHERE deleted_at IS NULL;

-- Add icon field to organizations
ALTER TABLE organizations ADD COLUMN icon_upload_id UUID REFERENCES uploads(id) ON DELETE SET NULL;
