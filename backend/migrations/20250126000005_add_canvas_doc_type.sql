-- Add 'canvas' to the doc_type enum
ALTER TABLE subdocs DROP CONSTRAINT subdocs_doc_type_check;
ALTER TABLE subdocs ADD CONSTRAINT subdocs_doc_type_check
    CHECK (doc_type IN ('vault', 'document', 'database', 'row', 'canvas'));
