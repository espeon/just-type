-- Add soft delete columns to vaults table
ALTER TABLE vaults
ADD COLUMN deleted_at TIMESTAMPTZ,
ADD COLUMN deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add soft delete columns to subdocs table
ALTER TABLE subdocs
ADD COLUMN deleted_at TIMESTAMPTZ,
ADD COLUMN deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create indexes for efficient cleanup and filtering queries
CREATE INDEX idx_vaults_deleted_at ON vaults(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_subdocs_deleted_at ON subdocs(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_vaults_user_deleted ON vaults(user_id, deleted_at) WHERE deleted_at IS NOT NULL;
