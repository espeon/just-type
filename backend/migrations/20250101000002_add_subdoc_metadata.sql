-- Extended metadata table for subdocuments
-- Stores user-facing metadata like title, icon, description, and tags
CREATE TABLE IF NOT EXISTS subdoc_metadata (
    subdoc_guid TEXT PRIMARY KEY REFERENCES subdocs(guid) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Untitled',
    icon TEXT,
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    extra JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subdoc_metadata_modified ON subdoc_metadata(modified_at DESC);
