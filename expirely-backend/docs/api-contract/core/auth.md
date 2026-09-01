# Authentication API Contract — Google Only

**Version:** v1

**Base URL:** `/core/v1/auth`

**Last Updated:** 2026-09-01

## Overview

Expirely hanya memasang Google Sign-In melalui Firebase. Endpoint email/password `/signin` dan `/signup` tidak tersedia pada router.

Flow:

1. Frontend mendapat Firebase ID token melalui Google provider.
2. Frontend mengirim token itu ke `POST /google`.
3. Backend Firebase Admin memverifikasi signature, audience, expiry, dan provider `google.com`.
4. Returning user di-login; user baru di-auto-provision bersama client, company, dan branch default.
5. Backend mengembalikan access JWT + opaque refresh token Expirely.

Panduan credential lengkap: `docs/expirely-google-auth-setup.md` pada root project.

## Response envelope

```json
{
  "data": {},
  "message": "Success message",
  "meta": null,
  "errors": null
}
```

## Access token

JWT berisi identity/context claims, bukan permission list:

```json
{
  "user_id": "550e8400-...",
  "company_id": "660e8400-...",
  "company_name": "Rumah Budi",
  "client_id": "770e8400-...",
  "client_slug": "budi",
  "email": "budi@example.com",
  "username": "budi",
  "full_name": "Budi",
  "is_super_admin": false,
  "roles": ["administrator"],
  "exp": 1735689600,
  "iat": 1735603200,
  "nbf": 1735603200,
  "iss": "tuai-api",
  "sub": "550e8400-..."
}
```

Permissions dikirim lewat response Google sign-in, switch-company, dan `/me`. Backend melakukan permission lookup runtime melalui Redis dengan fallback PostgreSQL.

## Endpoints

### 1. Sign in with Google

```http
POST /core/v1/auth/google
Content-Type: application/json
```

```json
{ "id_token": "firebase-id-token" }
```

Kirim Firebase ID token, bukan Google access token atau OAuth authorization code.

Response `200` untuk returning user dan `201` untuk user baru:

```json
{
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "opaque-token",
    "token_type": "Bearer",
    "expires_in": 86400,
    "is_new_user": false,
    "user": {
      "id": "550e8400-...",
      "email": "budi@example.com",
      "username": "budi",
      "full_name": "Budi"
    },
    "company": {
      "id": "660e8400-...",
      "name": "Rumah Budi"
    },
    "client": {
      "id": "770e8400-...",
      "slug": "budi",
      "name": "Budi"
    },
    "roles": ["administrator"],
    "permissions": []
  },
  "message": "Signed in with Google"
}
```

| Status | Kondisi |
|---|---|
| 400 | JSON atau `id_token` invalid |
| 401 | Firebase token invalid/expired/revoked, provider bukan Google, atau email tidak ada |
| 503 | `FIREBASE_PROJECT_ID` belum dikonfigurasi |

### 2. Refresh

```http
POST /core/v1/auth/refresh
Content-Type: application/json
```

```json
{ "refresh_token": "opaque-token" }
```

Backend melakukan refresh-token rotation dan mengembalikan pasangan access + refresh token baru. Token lama tidak boleh dipakai lagi.

### 3. Logout satu sesi

```http
POST /core/v1/auth/logout
Authorization: Bearer <access_token>
Content-Type: application/json
```

```json
{ "refresh_token": "opaque-token" }
```

### 4. Logout semua sesi

```http
POST /core/v1/auth/logout-all
Authorization: Bearer <access_token>
```

Merevoke seluruh refresh token milik user.

### 5. Switch company

```http
POST /core/v1/auth/switch-company
Authorization: Bearer <access_token>
Content-Type: application/json
```

```json
{ "company_id": "660e8400-..." }
```

Mengembalikan JWT baru beserta company, role, dan effective permissions untuk company terpilih.

### 6. Get current session

```http
GET /core/v1/auth/me
Authorization: Bearer <access_token>
```

Mengembalikan user, active company/client, roles, permissions, dan `is_super_admin`. Frontend memanggil endpoint ini saat rehydrate halaman.

### 7. Get my companies

```http
GET /core/v1/auth/companies
Authorization: Bearer <access_token>
```

Mengembalikan company yang dapat diakses user, termasuk penanda owner/primary yang dipakai frontend untuk memilih context awal.

## Client storage dan retry

- Access dan refresh token frontend saat ini disimpan di `sessionStorage`.
- Seluruh API memakai shared Axios interceptor.
- Satu request `401` dapat memicu refresh terkoordinasi; request lain menunggu hasil refresh yang sama.
- Jika refresh gagal, token dibersihkan dan user diarahkan kembali ke Google sign-in.

## Security notes

- Gunakan HTTPS pada production.
- Project ID Firebase frontend/backend harus sama.
- Authorized domains Firebase harus eksplisit.
- Jangan commit service-account JSON.
- Rotasi credential yang pernah terekspos.
- CORS backend harus menunjuk origin frontend production yang tepat.
