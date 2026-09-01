# Expirely — Status Implementasi dan Kesiapan Demo

**Pembaruan terakhir:** 1 September 2026  
**Scope:** backend, frontend, PostgreSQL, Redis, keamanan API, core flow, dan responsive UI.

## Kesimpulan

Core flow yang tidak membutuhkan credential eksternal sudah siap dan terverifikasi. Manual item lifecycle, ownership per user, statistik, kuota, rewarded-ad mock, seed data, error state, dan UI mobile/desktop telah lulus test. Google Sign-In dan dua fitur Gemini belum dapat diuji live karena credential Firebase/Gemini belum diisi.

## Status per fitur

| Fitur | Status | Bukti/keterangan |
|---|---|---|
| Google-only sign-in | Siap di kode | Email/password routes tidak dipasang; perlu Firebase credential untuk uji live |
| Pemulihan sesi JWT | Terverifikasi lokal | Shared Axios + `sessionStorage` dan `/auth/me` berhasil dengan JWT test singkat |
| Tambah/edit item manual | Lulus | HTTP integration test mencakup create dan update |
| Detail dan list item | Lulus | Data PostgreSQL nyata, terurut tanggal terdekat |
| Mark consumed/wasted | Lulus | Status lifecycle diuji; wasted memakai confirmation dialog |
| Isolasi antar-user | Lulus | User lain mendapat `404` saat membaca/mengubah item |
| Statistik dashboard | Lulus | Scope per user dan data seed konsisten |
| Foto dari kamera/gallery | UI + validasi lulus | AI recognition live menunggu `AI_API_KEY` |
| Recommendation urgent | Siap di kode | Server hanya menerima item aktif milik user dengan expiry maksimal 7 hari; AI live menunggu key |
| Kuota per user | Lulus | Konsumsi atomik, 2 base use/hari per fitur |
| Rewarded-ad mock | Lulus | Bonus +1 per aksi, maksimal 3 bonus per fitur/hari |
| Banner sponsor mock | Lulus | Placeholder yang sengaja dibatasi dan tidak menyamar sebagai iklan nyata |
| Seed demo | Lulus | Seeder idempotent dengan tanggal relatif |
| Error/loading/empty/search | Lulus | Tidak ada silent mock fallback; retry dan empty state tersedia |

## Perbaikan penting yang sudah diterapkan

- Migration 16 menambahkan `user_id` pada item dan mengubah primary key kuota menjadi `(user_id, date)`.
- Semua endpoint Expirely dilindungi JWT dan seluruh query item/statistik/kuota di-scope ke user.
- Frontend memakai satu Axios client dengan interceptor JWT/refresh; fallback memory/mock diam-diam sudah dihapus.
- Quota check + consume dilakukan atomik. Reservasi kuota dikembalikan jika provider AI gagal.
- Recommendation mengabaikan nama dari client dan mengambil ulang item milik user dari database.
- Dukungan `photo_url` dihapus untuk menutup SSRF. Backend hanya menerima base64 dengan body maksimal 15 MB, hasil decode maksimal 10 MB, dan MIME allowlist JPEG/PNG/WebP/GIF.
- Error internal tidak lagi mengirim detail database/provider ke client.
- CORS memakai origin eksplisit dan mengabaikan `FRONTEND_URL=*`; trusted proxy dinonaktifkan secara default.
- Redis boleh unavailable; permission lookup jatuh ke database tanpa membuat aplikasi gagal start.
- UI mobile memakai card list, action stack, dan full-screen dialogs. Dialog foto memiliki tombol tutup yang dapat diakses.
- Sisa branding/template palsu, notification/theme control kosong, dan dummy alert telah dihapus dari UI aktif.

## Hasil quality gate

Backend:

```text
go test ./...                         PASS
go vet ./...                          PASS
make test-integration                 PASS
```

Integration test PostgreSQL mencakup manual create → edit → consumed, cleanup otomatis, isolasi user, quota exhaustion, dan reward bonus.

Frontend:

```text
yarn fm:check                         PASS
yarn lint                             PASS
npx tsc --noEmit                      PASS
npm run build                         PASS
```

Browser smoke memakai backend + database nyata dan JWT test sementara:

| Viewport | Halaman/flow | Hasil |
|---|---|---|
| 320×568 | Login dan home | Tidak overflow; tidak ada console/request error |
| 360×800 | Items + semua dialog | Card list, add, photo, detail, wasted, recommendation, search lulus |
| 768×1024 | Items tablet | Card list; tidak overflow |
| 1440×900 | Items desktop | Table layout; tidak overflow |

Catatan: smoke dilakukan dengan Chromium headless. Safari iOS dan Chrome Android pada perangkat fisik tetap perlu diuji sebelum production, terutama camera input dan Google popup/redirect.

## Yang masih menunggu konfigurasi eksternal

1. Isi Firebase frontend/backend mengikuti [`expirely-google-auth-setup.md`](expirely-google-auth-setup.md), lalu uji user baru, user lama, refresh, logout, dan mobile.
2. Isi `AI_API_KEY`/`AI_MODEL`, lalu validasi satu foto kemasan, satu barang segar, recommendation, quota exhausted, dan rollback kuota saat provider gagal.
3. Credential Kubernetes lama pernah tersimpan di repository dan file aktif sudah diganti template aman. **Revoke/rotate bearer token lama di cluster** karena penghapusan file tidak membersihkan git history.
4. Docker image belum dibangun di mesin audit karena Docker tidak tersedia.
5. Set `FRONTEND_URL` production ke origin HTTPS frontend yang tepat. Jangan gunakan wildcard.

## Menjalankan lokal

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
```

Buka `http://localhost:8081`. Hindari `source expirily-backend/.env`; nilai multi-key dapat tidak aman untuk parser shell. Target Makefile sudah membaca `.env` tanpa langkah tersebut.

## Definition of done terakhir

- [x] Core flow non-AI lulus unit/integration/browser smoke
- [x] Data dan kuota terisolasi per user
- [x] Mobile 320/360, tablet, dan desktop tanpa horizontal overflow
- [x] Tidak ada silent mock yang membuat aksi palsu terlihat berhasil
- [x] Formatter, lint, typecheck, build, test, dan vet lulus
- [ ] Google login live dengan Firebase nyata
- [ ] Recognition + recommendation live dengan Gemini nyata
- [ ] Device test Safari iOS dan Chrome Android
- [ ] Rotasi credential Kubernetes lama

