# Expirely — Arsitektur Saat Ini

## 1. Stack

- **Backend:** Go, Gin, PostgreSQL, optional Redis permission cache
- **Frontend:** React 19, Vite, MUI 7, React Hook Form, Zod, Axios, i18next
- **Authentication:** Google Sign-In melalui Firebase; backend menerbitkan JWT Expirely
- **AI:** Google Gemini, dipanggil hanya dari backend

## 2. Batas sistem

```text
Browser
  ├─ Google popup → Firebase ID token
  └─ Axios + Expirely JWT → Go API :8080
                               ├─ PostgreSQL (source of truth)
                               ├─ Redis (optional authz cache)
                               ├─ Firebase Admin (verify Google token)
                               └─ Gemini (photo + recommendation)
```

Firebase dan Gemini bersifat optional saat startup. Tanpa credential, manual CRUD, dashboard, stats, dan quota tetap dapat berjalan; endpoint yang membutuhkan provider memberi error terkontrol.

## 3. Authentication

Flow produksi:

1. Frontend membuka Google Sign-In via Firebase.
2. Frontend mengirim Firebase ID token ke `POST /core/v1/auth/google`.
3. Backend memverifikasi token dan auto-provision user baru bila perlu.
4. Backend mengembalikan access + refresh token Expirely.
5. Frontend menyimpan token di `sessionStorage` dan Axios interceptor menambahkan Bearer token.

Email/password sign-up dan sign-in tidak dipasang pada router. Semua endpoint Expirely wajib JWT.

## 4. Data model dan ownership

`core.expirely_items` memiliki `user_id` dan seluruh operasi selalu memakai kombinasi user dari JWT + item ID. User lain menerima `404`, sehingga keberadaan item juga tidak dibocorkan.

`core.expirely_quotas` memakai primary key `(user_id, date)` dengan counter:

- `recognition_count`
- `recommendation_count`
- `recognition_bonus` (0–3)
- `recommendation_bonus` (0–3)

Limit dasar masing-masing fitur adalah 2 per hari. Claim rewarded-ad mock menambah satu bonus, maksimal tiga per fitur/hari.

## 5. Endpoint Expirely

Base path: `/core/v1`, semuanya Bearer-authenticated.

| Method | Path | Fungsi |
|---|---|---|
| POST | `/items` | Tambah manual |
| POST | `/items/photo` | Base64 image → Gemini → simpan |
| GET | `/items` | List aktif terurut expiry |
| GET | `/items/:id` | Detail milik user |
| PATCH | `/items/:id` | Edit manual |
| PATCH | `/items/:id/status` | `active`, `consumed`, atau `wasted` |
| POST | `/recommend` | Ide penggunaan untuk item urgent |
| GET | `/quota` | Status kuota user hari ini |
| POST | `/quota/reward` | Tambah bonus quota mock |
| GET | `/stats` | Statistik milik user |

Kontrak lengkap ada di `expirily-backend/docs/api-contract/core/expirely-items.md`.

## 6. Photo recognition

```text
camera/gallery
  → validasi frontend type + 10 MB
  → JSON base64 ke backend
  → backend body max 15 MB, decoded max 10 MB, MIME allowlist
  → reserve quota atomik
  → Gemini vision
  → tanggal tercetak, atau kategori shelf-life lokal
  → simpan PostgreSQL
```

Remote `photo_url` sengaja tidak didukung untuk menghindari SSRF. Jika Gemini gagal, reservasi quota dilepas.

Dataset shelf-life deterministik berada di service backend. Kategori tidak dikenal memakai `default_unknown` (7 hari).

## 7. Recommendation

Client mengirim maksimal 20 UUID. Backend mengambil ulang data dari database dan hanya memproses item yang:

- dimiliki user dari JWT;
- status `active`;
- kedaluwarsa dalam tujuh hari.

Nama produk dari client tidak dipercaya. Quota juga di-reserve atomik dan dikembalikan bila Gemini gagal.

## 8. Frontend

- Home mengambil stats dan item nyata, dengan loading/error/retry.
- List memakai table pada desktop dan card pada mobile/tablet.
- Add/edit/detail/photo/recommendation dibuat full-screen pada mobile.
- Query `?action=add` dan `?action=scan` membuka shortcut yang benar.
- Input manual tidak memakai quota; photo/recommendation me-refresh panel quota setelah berhasil.
- Mock fallback tidak aktif. Backend error selalu terlihat oleh user.

## 9. Security/reliability baseline

- JWT pada seluruh endpoint Expirely
- per-user SQL scope
- atomic quota consumption
- UUID/input/category validation
- image size + MIME validation
- no remote image fetching
- generic public 500 + server-side logging
- synchronized Gemini key rotation
- provider call memakai request context
- explicit credentialed CORS allowlist
- Redis degradation ke database
- trusted proxy default off

## 10. Development dan test

```bash
cd expirily-backend
make migrate-up
make seed-core
make test
make test-integration
make run
```

```bash
cd expirily-frontend
npm install
npm run dev
npm run build
```

Gunakan `http://localhost:8081`. Lihat [`expirely-progress-audit.md`](expirely-progress-audit.md) untuk hasil verifikasi terakhir.
