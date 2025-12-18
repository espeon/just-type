-- Vault sharing: allow multiple users to access a single vault
-- Tracks vault members with their roles (owner, editor, viewer)
CREATE TABLE IF NOT EXISTS vault_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'viewer')),
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(vault_id, user_id)
);

CREATE INDEX idx_vault_members_vault ON vault_members(vault_id);
CREATE INDEX idx_vault_members_user ON vault_members(user_id);
CREATE INDEX idx_vault_members_role ON vault_members(vault_id, role);
