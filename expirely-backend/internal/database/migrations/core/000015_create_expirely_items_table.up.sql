CREATE TABLE IF NOT EXISTS core.expirely_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_produk VARCHAR(255) NOT NULL,
    kategori VARCHAR(100),
    expiry_date DATE NOT NULL,
    is_estimated BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'consumed', 'wasted')),
    source VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (source IN ('ai_photo', 'manual')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expirely_items_expiry_date ON core.expirely_items (expiry_date);
CREATE INDEX idx_expirely_items_status ON core.expirely_items (status);

CREATE TABLE IF NOT EXISTS core.expirely_quotas (
    date DATE PRIMARY KEY,
    recognition_count INTEGER NOT NULL DEFAULT 0,
    recommendation_count INTEGER NOT NULL DEFAULT 0
);
