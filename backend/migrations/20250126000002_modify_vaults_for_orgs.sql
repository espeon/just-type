-- Add organization support to vaults
ALTER TABLE vaults
    ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    ADD COLUMN vault_type TEXT NOT NULL DEFAULT 'user' CHECK (vault_type IN ('user', 'org', 'shared'));

-- Make user_id nullable since org vaults don't have a user owner
ALTER TABLE vaults
    ALTER COLUMN user_id DROP NOT NULL;

-- Ensure vault has either user_id OR org_id, not both
ALTER TABLE vaults
    ADD CONSTRAINT vaults_owner_check
    CHECK (
        (user_id IS NOT NULL AND org_id IS NULL) OR
        (user_id IS NULL AND org_id IS NOT NULL)
    );

-- Index for org vault queries
CREATE INDEX idx_vaults_org ON vaults(org_id) WHERE org_id IS NOT NULL;
CREATE INDEX idx_vaults_type ON vaults(vault_type);
