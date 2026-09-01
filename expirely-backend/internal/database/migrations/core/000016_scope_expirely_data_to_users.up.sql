ALTER TABLE core.expirely_items
    ADD COLUMN user_id UUID;

DO $$
DECLARE
    fallback_user_id UUID;
BEGIN
    SELECT id INTO fallback_user_id
    FROM core.users
    WHERE deleted_at IS NULL
    ORDER BY created_at ASC
    LIMIT 1;

    IF EXISTS (SELECT 1 FROM core.expirely_items) AND fallback_user_id IS NULL THEN
        RAISE EXCEPTION 'cannot assign existing Expirely items: no active user exists';
    END IF;

    UPDATE core.expirely_items
    SET user_id = fallback_user_id
    WHERE user_id IS NULL;
END $$;

ALTER TABLE core.expirely_items
    ALTER COLUMN user_id SET NOT NULL,
    ADD CONSTRAINT expirely_items_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES core.users(id) ON DELETE CASCADE;

CREATE INDEX idx_expirely_items_user_status_expiry
    ON core.expirely_items (user_id, status, expiry_date);

ALTER TABLE core.expirely_quotas
    ADD COLUMN user_id UUID,
    ADD COLUMN recognition_bonus INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN recommendation_bonus INTEGER NOT NULL DEFAULT 0;

DO $$
DECLARE
    fallback_user_id UUID;
BEGIN
    SELECT id INTO fallback_user_id
    FROM core.users
    WHERE deleted_at IS NULL
    ORDER BY created_at ASC
    LIMIT 1;

    IF EXISTS (SELECT 1 FROM core.expirely_quotas) AND fallback_user_id IS NULL THEN
        RAISE EXCEPTION 'cannot assign existing Expirely quotas: no active user exists';
    END IF;

    UPDATE core.expirely_quotas
    SET user_id = fallback_user_id
    WHERE user_id IS NULL;
END $$;

ALTER TABLE core.expirely_quotas
    DROP CONSTRAINT expirely_quotas_pkey,
    ALTER COLUMN user_id SET NOT NULL,
    ADD CONSTRAINT expirely_quotas_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES core.users(id) ON DELETE CASCADE,
    ADD PRIMARY KEY (user_id, date),
    ADD CONSTRAINT expirely_quotas_recognition_bonus_check
        CHECK (recognition_bonus BETWEEN 0 AND 3),
    ADD CONSTRAINT expirely_quotas_recommendation_bonus_check
        CHECK (recommendation_bonus BETWEEN 0 AND 3);

