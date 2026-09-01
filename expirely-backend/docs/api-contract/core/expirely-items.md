# Expirely Items API Contract

**Version:** v1
**Base URL:** `/core/v1`
**Module:** Expirely — Household Expiry Tracker
**Last Updated:** 2026-09-01

---

## Overview

API untuk melacak masa simpan barang rumah tangga. Mendukung:
- CRUD items (manual input)
- Photo recognition via Gemini AI
- AI-powered usage recommendations
- Daily quota tracking
- Dashboard statistics

**Base Path:** `/core/v1`

**Authentication:** Semua endpoint pada dokumen ini memerlukan JWT. Data, statistik, dan kuota selalu di-scope ke user dari token.

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

---

## Response Format

**Success:**
```json
{
  "data": { ... },
  "message": "Success message",
  "status": 200
}
```

**Error:**
```json
{
  "data": null,
  "message": "Error message",
  "errors": { "detail": ["error details"] }
}
```

---

## Endpoints

### 1. Create Item (Manual)

Tambah barang secara manual.

```
POST /core/v1/items
```

**Auth:** Bearer token

**Request:**
```json
{
  "nama_produk": "Susu UHT Ultra",
  "kategori": "susu_segar_non_uht",
  "expiry_date": "2026-09-15",
  "is_estimated": false
}
```

| Field | Type | Required | Keterangan |
|-------|------|----------|------------|
| `nama_produk` | string | Ya | Nama produk (1-255 karakter) |
| `kategori` | string \| null | Tidak | Kategori shelf-life (lihat daftar di bawah) |
| `expiry_date` | string | Ya | Format `YYYY-MM-DD` |
| `is_estimated` | bool | Tidak | Default `false`. `true` jika tanggal dari estimasi AI |

**Response (201):**
```json
{
  "data": {
    "id": "550e8400-...",
    "nama_produk": "Susu UHT Ultra",
    "kategori": "susu_segar_non_uht",
    "expiry_date": "2026-09-15",
    "is_estimated": false,
    "status": "active",
    "source": "manual",
    "created_at": "2026-08-31T10:00:00Z",
    "updated_at": "2026-08-31T10:00:00Z"
  },
  "message": "Item created successfully"
}
```

**Errors:**

| Status | Message |
|--------|---------|
| 400 | Invalid request payload |
| 400 | invalid expiry_date format, use YYYY-MM-DD |

---

### 2. Create Item from Photo (AI Recognition)

Upload foto → Gemini AI mengenali produk + masa simpan.

```
POST /core/v1/items/photo
```

**Auth:** Bearer token

**Request (base64):**
```json
{
  "photo_base64": "/9j/4AAQSkZJRg...",
  "mime_type": "image/jpeg"
}
```

| Field | Type | Required | Keterangan |
|-------|------|----------|------------|
| `photo_base64` | string | Ya | Base64-encoded image data, maksimal 10 MB setelah decode |
| `mime_type` | string | Tidak | `image/jpeg`, `image/png`, `image/webp`, atau `image/gif`; default `image/jpeg` |

Remote image URL sengaja tidak didukung untuk mencegah server-side request forgery (SSRF). Maksimum request body adalah 15 MB.

**AI Behavior:**
- Jika ada tanggal kedaluwarsa tercetak → `is_estimated: false`, pakai tanggal tersebut
- Jika tidak ada (barang segar) → `is_estimated: true`, estimasi dari shelf-life dataset
- Kategori yang dikenali: `buah_segar`, `sayur_hijau`, `sayur_umbi`, `roti_tanpa_pengawet`, `telur_lepas`, `daging_segar`, `daging_beku`, `ikan_segar`, `susu_segar_non_uht`, `keju_segar`

**Response (201):** Sama seperti Create Item, dengan `source: "ai_photo"`

**Errors:**

| Status | Message |
|--------|---------|
| 400 | photo_base64 is required / unsupported image type / invalid base64 |
| 413 | Image is too large |
| 429 | Daily quota exceeded |
| 500 | AI recognition failed |

---

### 3. List Items

Ambil semua items aktif, sorted by expiry date (nearest first).

```
GET /core/v1/items
```

**Auth:** Bearer token

**Response (200):**
```json
{
  "data": {
    "items": [
      {
        "id": "550e8400-...",
        "nama_produk": "Bayam Segar",
        "kategori": "sayur_hijau",
        "expiry_date": "2026-09-01",
        "is_estimated": true,
        "status": "active",
        "source": "ai_photo",
        "created_at": "2026-08-28T09:00:00Z",
        "updated_at": "2026-08-28T09:00:00Z"
      }
    ],
    "total": 52
  },
  "message": "Items retrieved successfully"
}
```

> Hanya mengembalikan items dengan `status = 'active'`. Sorted by `expiry_date ASC`.

---

### 4. Get Item by ID

```
GET /core/v1/items/:id
```

**Auth:** Bearer token

**Response (200):** Sama seperti item di list, tapi single object.

**Errors:**

| Status | Message |
|--------|---------|
| 404 | Item not found |

---

### 5. Update Item

Edit nama, kategori, atau tanggal expiry.

```
PATCH /core/v1/items/:id
```

**Auth:** Bearer token

**Request:**
```json
{
  "nama_produk": "Pisang Ambon (updated)",
  "expiry_date": "2026-09-05"
}
```

| Field | Type | Required | Keterangan |
|-------|------|----------|------------|
| `nama_produk` | string | Tidak | 1-255 karakter |
| `kategori` | string \| null | Tidak | Kategori shelf-life |
| `expiry_date` | string | Tidak | Format `YYYY-MM-DD` |
| `is_estimated` | bool | Tidak | |

**Response (200):** Updated item object.

---

### 6. Update Status

Tandai barang sebagai terpakai atau terbuang.

```
PATCH /core/v1/items/:id/status
```

**Auth:** Bearer token

**Request:**
```json
{
  "status": "consumed"
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `status` | string | Ya | `active`, `consumed`, `wasted` |

**Response (200):** Updated item object.

**Errors:**

| Status | Message |
|--------|---------|
| 404 | Item not found |

---

### 7. AI Recommendation

Minta saran penggunaan barang sebelum kedaluwarsa.

```
POST /core/v1/recommend
```

**Auth:** Bearer token

**Request:**
```json
{
  "items": [
    { "id": "550e8400-...", "nama_produk": "Bayam Segar" },
    { "id": "660e8400-...", "nama_produk": "Pisang Ambon" }
  ]
}
```

| Field | Type | Required | Keterangan |
|-------|------|----------|------------|
| `items` | array | Ya | Min 1, maksimal 20 item |
| `items[].id` | string | Ya | Item ID |
| `items[].nama_produk` | string | Tidak | Hanya informasi UI; backend mengambil ulang nama dari database |

Backend hanya memakai item milik user yang masih `active` dan kedaluwarsa dalam tujuh hari. UUID tidak valid, item user lain, dan item non-urgent tidak akan diteruskan ke provider AI.

**Response (200):**
```json
{
  "data": {
    "recommendations": [
      {
        "item_id": "550e8400-...",
        "nama_produk": "Bayam Segar",
        "rekomendasi": "Buat sup bayam ayam untuk makan malam"
      },
      {
        "item_id": "660e8400-...",
        "nama_produk": "Pisang Ambon",
        "rekomendasi": "Buat smoothie pisang untuk sarapan sehat"
      }
    ]
  },
  "message": "Recommendations generated"
}
```

**Errors:**

| Status | Message |
|--------|---------|
| 400 | Invalid request payload |
| 429 | Daily quota exceeded |
| 500 | AI recommendation failed |

---

### 8. Get Quota

Cek sisa kuota harian untuk foto recognition dan rekomendasi.

```
GET /core/v1/quota
```

**Auth:** Bearer token

**Response (200):**
```json
{
  "data": {
    "date": "2026-08-31",
    "recognition_used": 1,
    "recognition_limit": 2,
    "recommendation_used": 0,
    "recommendation_limit": 2
  },
  "message": "Quota retrieved successfully"
}
```

| Field | Type | Keterangan |
|-------|------|------------|
| `date` | string | Tanggal kuota (reset daily) |
| `recognition_used` | int | Foto recognition terpakai hari ini |
| `recognition_limit` | int | Kapasitas foto hari ini: base 2 + bonus reward |
| `recommendation_used` | int | Rekomendasi terpakai hari ini |
| `recommendation_limit` | int | Kapasitas rekomendasi hari ini: base 2 + bonus reward |

---

### 9. Claim Reward Quota (Mock)

Simulasikan rewarded ad dan tambah satu kapasitas untuk fitur yang dipilih.

```
POST /core/v1/quota/reward
```

**Auth:** Bearer token

```json
{ "kind": "recognition" }
```

`kind` harus `recognition` atau `recommendation`. Maksimal tiga bonus per fitur per user per hari. Response memakai bentuk quota yang sama dengan endpoint Get Quota.

**Errors:** `400` untuk kind invalid, `429` jika batas tiga reward harian sudah tercapai.

---

### 10. Get Statistics

Dashboard stats: jumlah items per status.

```
GET /core/v1/stats
```

**Auth:** Bearer token

**Response (200):**
```json
{
  "data": {
    "total_active": 52,
    "total_consumed": 3,
    "total_wasted": 1,
    "expiring_soon": 19
  },
  "message": "Stats retrieved successfully"
}
```

| Field | Type | Keterangan |
|-------|------|------------|
| `total_active` | int | Items dengan status `active` |
| `total_consumed` | int | Items dengan status `consumed` |
| `total_wasted` | int | Items dengan status `wasted` |
| `expiring_soon` | int | Items `active` yang expired ≤ 3 hari lagi |

---

## Shelf-Life Categories (Dataset A)

Kategori yang dikenali AI untuk estimasi masa simpan:

| Kategori | Estimasi Hari | Contoh |
|----------|---------------|--------|
| `buah_segar` | 6 | pisang, apel, jeruk |
| `sayur_hijau` | 4 | bayam, kangkung, sawi |
| `sayur_umbi` | 18 | kentang, wortel, bawang |
| `roti_tanpa_pengawet` | 3 | roti lokal, roti bakery |
| `telur_lepas` | 18 | telur ayam curah |
| `daging_segar` | 2 | daging sapi/ayam belum dibekukan |
| `daging_beku` | 90 | daging di freezer |
| `ikan_segar` | 2 | ikan belum dibekukan |
| `susu_segar_non_uht` | 4 | susu pasteurisasi |
| `keju_segar` | 10 | keju tanpa kemasan awet |
| `default_unknown` | 7 | fallback jika tidak dikenali |

---

## Item Status Flow

```
active ──→ consumed  (barang terpakai/habis)
active ──→ wasted    (barang terbuang/expired)
```

> Status `active` → sorted by `expiry_date ASC` (paling urgent di atas).

---

## Quota System

| Feature | Limit per Day | Reset |
|---------|---------------|-------|
| Photo Recognition | 2 + maksimal 3 bonus | Daily (midnight UTC) |
| AI Recommendation | 2 + maksimal 3 bonus | Daily (midnight UTC) |

Kuota di-reset otomatis setiap hari dan dicatat per user. Check + consume bersifat atomik. Jika provider AI gagal, konsumsi request tersebut dilepas kembali. Jika kuota habis, response `429 Too Many Requests`.

---

## AI Integration (Google Gemini)

- **Model:** `gemini-3.5-flash-lite` (configurable via `AI_MODEL` env var; dipilih untuk latency rendah dan input multimodal)
- **Key Rotation:** Mendukung multiple keys (comma-separated di `AI_API_KEY`)
- **Tanpa API Key:** Photo upload dan recommendation akan gagal dengan error message yang jelas
- **Prompt Vision:** Menganalisis foto → mengembalikan JSON `{ nama_produk, ada_tanggal_tercetak, expiry_date, kategori }`
- **Prompt Recommendation:** Memberikan 1 saran per item agar tidak terbuang

---

## Changelog

### v1.1 (2026-09-01)
- Semua endpoint JWT-protected dan user-scoped
- Hapus remote `photo_url`; tambah limit size/MIME
- Recommendation memverifikasi ownership dan urgency
- Atomic quota + rewarded-ad bonus endpoint

### v1.0 (2026-08-31)
- Initial release: 9 endpoints
- CRUD items, photo recognition, AI recommendations
- Quota tracking, dashboard statistics
- Shelf-life Dataset A (11 kategori)
