DROP INDEX IF EXISTS core.idx_expirely_items_user_status_expiry;

ALTER TABLE core.expirely_items
    DROP CONSTRAINT IF EXISTS expirely_items_user_id_fkey,
    DROP COLUMN IF EXISTS user_id;

DROP TABLE IF EXISTS core.expirely_quotas;

CREATE TABLE core.expirely_quotas (
    date DATE PRIMARY KEY,
    recognition_count INTEGER NOT NULL DEFAULT 0,
    recommendation_count INTEGER NOT NULL DEFAULT 0
);

