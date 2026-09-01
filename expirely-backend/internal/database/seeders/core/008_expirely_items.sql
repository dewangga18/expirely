-- Demo inventory belongs to the seeded owner and uses dates relative to setup.
INSERT INTO core.expirely_items (
    id, user_id, nama_produk, kategori, expiry_date, is_estimated, status, source
) VALUES
(
    'e1000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Bayam segar', 'sayur_hijau', CURRENT_DATE + 1, TRUE, 'active', 'manual'
),
(
    'e1000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'Susu UHT', NULL, CURRENT_DATE + 3, FALSE, 'active', 'manual'
),
(
    'e1000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000001',
    'Kentang', 'sayur_umbi', CURRENT_DATE + 12, TRUE, 'active', 'manual'
),
(
    'e1000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000001',
    'Roti tawar', NULL, CURRENT_DATE - 2, FALSE, 'wasted', 'manual'
),
(
    'e1000000-0000-0000-0000-000000000005',
    '10000000-0000-0000-0000-000000000001',
    'Pisang', 'buah_segar', CURRENT_DATE - 1, TRUE, 'consumed', 'manual'
)
ON CONFLICT (id) DO UPDATE SET
    expiry_date = EXCLUDED.expiry_date,
    status = EXCLUDED.status,
    updated_at = NOW();
