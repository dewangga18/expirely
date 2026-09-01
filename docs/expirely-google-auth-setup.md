# Expirely — Setup Google Sign-In dengan Firebase

Dokumen ini menjelaskan konfigurasi yang dibutuhkan oleh implementasi Google Sign-In Expirely saat ini. Frontend memperoleh Firebase ID token dari akun Google, backend memverifikasi token tersebut melalui Firebase Admin SDK, lalu backend menerbitkan access token dan refresh token milik Expirely.

## 1. Link yang dibutuhkan

- [Firebase Console](https://console.firebase.google.com/)
- [Panduan resmi menambahkan Firebase ke aplikasi web](https://firebase.google.com/docs/web/setup)
- [Panduan resmi Google Sign-In untuk web](https://firebase.google.com/docs/auth/web/google-signin)
- [Panduan resmi Firebase Admin SDK dan service account](https://firebase.google.com/docs/admin/setup)
- [Pengaturan authorized domain](https://support.google.com/firebase/answer/6400741)

## 2. Buat atau pilih Firebase project

1. Buka [Firebase Console](https://console.firebase.google.com/).
2. Pilih **Create a project**, atau gunakan project Google Cloud yang sudah ada.
3. Nama yang disarankan: `expirely` atau `expirely-production`.
4. Google Analytics tidak wajib untuk Google Sign-In.
5. Catat **Project ID** dari **Project settings → General**. Project ID berbeda dari nama project dan tidak dapat diganti setelah dibuat.

## 3. Daftarkan aplikasi web

1. Di halaman overview project, tekan ikon **Web (`</>`)**.
2. Isi nickname, misalnya `expirely-web`.
3. Firebase Hosting tidak wajib jika frontend akan di-deploy ke Vercel atau provider lain.
4. Tekan **Register app**.
5. Firebase menampilkan konfigurasi seperti berikut:

```ts
const firebaseConfig = {
  apiKey: "...",
  authDomain: "expirely.firebaseapp.com",
  projectId: "expirely",
  // Field lain tidak digunakan oleh auth Expirely saat ini.
};
```

Masukkan tiga nilai tersebut ke `expirily-frontend/.env`:

```env
VITE_FIREBASE_API_KEY=nilai_apiKey
VITE_FIREBASE_AUTH_DOMAIN=nilai_authDomain
VITE_FIREBASE_PROJECT_ID=nilai_projectId
```

Konfigurasi web Firebase bukan service-account secret. Walaupun begitu, pembatasan domain dan API key tetap perlu diterapkan sebelum production.

## 4. Aktifkan provider Google

1. Buka **Build/Security → Authentication** di Firebase Console.
2. Tekan **Get started** jika Authentication belum pernah digunakan.
3. Buka tab **Sign-in method**.
4. Pilih **Google**, lalu aktifkan.
5. Pilih support email dan tekan **Save**.
6. Jangan aktifkan provider lain jika Expirely memang Google-only.

## 5. Tambahkan authorized domain

Buka **Authentication → Settings → Authorized domains**, lalu pastikan domain berikut terdaftar sesuai environment:

- `localhost` untuk development;
- domain deployment frontend, misalnya `expirely.vercel.app`;
- custom domain production jika ada.

Masukkan hostname saja, tanpa `https://`, path, atau trailing slash. Domain backend tidak perlu ditambahkan karena popup Google dibuka dari frontend.

## 6. Siapkan kredensial backend

Backend Expirely menggunakan Firebase Admin SDK untuk memverifikasi ID token.

1. Buka **Project settings → Service accounts**.
2. Tekan **Generate new private key** dan konfirmasi.
3. Simpan JSON yang diunduh di tempat aman. Jangan taruh file tersebut di repository.
4. Isi `expirily-backend/.env`:

```env
FIREBASE_PROJECT_ID=project-id-yang-sama-dengan-frontend
FIREBASE_CREDENTIALS_JSON='{"type":"service_account", ... seluruh JSON dalam satu baris ...}'
```

Hal penting:

- `FIREBASE_PROJECT_ID` frontend dan backend harus menunjuk project Firebase yang sama.
- Simpan JSON sebagai satu baris agar parser `.env` tidak memecah private key.
- Pertahankan karakter `\n` di dalam nilai `private_key`; jangan mengubahnya menjadi baris baru sungguhan.
- Jangan commit `.env`, file private key, atau menempelkan isi private key ke issue/chat.
- Pada deployment Google Cloud yang sudah menggunakan Application Default Credentials/Workload Identity, `FIREBASE_CREDENTIALS_JSON` boleh kosong. Untuk development lokal, raw service-account JSON adalah jalur yang didukung implementasi saat ini.

## 7. URL backend frontend

Pastikan `expirily-frontend/.env` menunjuk backend:

```env
VITE_SERVER_URL=http://localhost:8080
```

Untuk production, gunakan origin HTTPS backend tanpa trailing slash, misalnya:

```env
VITE_SERVER_URL=https://api.expirely.example
```

Jika nilai environment frontend berubah, restart Vite karena nilai `VITE_*` dibaca saat aplikasi dibangun/dijalankan.

## 8. Restart dan uji

Restart backend dan frontend setelah `.env` diubah.

Backend:

```bash
cd expirily-backend
make dev
```

Frontend:

```bash
cd expirily-frontend
npm run dev
```

Checklist uji:

1. Buka frontend dalam jendela incognito.
2. Dashboard harus mengarahkan user ke `/auth/jwt/sign-in`.
3. Tekan **Lanjutkan dengan Google**.
4. Pilih akun Google.
5. User baru harus otomatis mendapat user, client, company, dan branch.
6. Setelah login, refresh halaman dan pastikan sesi pulih.
7. Sign out, lalu sign in lagi dengan akun yang sama; user tidak boleh dibuat ganda.
8. Uji dari domain production dan perangkat mobile, bukan hanya `localhost` desktop.

## 9. Troubleshooting

| Gejala | Penyebab paling mungkin | Pemeriksaan |
|---|---|---|
| `Firebase belum dikonfigurasi` | Variabel `VITE_FIREBASE_*` kosong | Periksa frontend `.env`, lalu restart Vite |
| `auth/unauthorized-domain` | Host frontend belum diizinkan | Tambahkan hostname ke Authorized domains |
| `Google sign-in is not configured` | Backend tidak menginisialisasi Firebase | Isi `FIREBASE_PROJECT_ID` dan kredensial, lalu restart backend |
| `Invalid Google ID token` | Project frontend dan backend berbeda, token expired, atau kredensial salah | Samakan project ID dan cek log backend |
| Popup tidak muncul | Popup diblokir browser atau perilaku browser mobile | Izinkan popup; untuk UX mobile production pertimbangkan redirect flow |
| Login sukses tetapi API item `401` | Sesi Expirely expired, refresh token invalid, atau frontend menunjuk backend yang salah | Periksa `VITE_SERVER_URL`, response `/auth/me`, lalu sign out/sign in ulang |

## 10. Catatan keamanan production

- Gunakan HTTPS untuk frontend dan backend production.
- Batasi origin CORS ke domain frontend yang benar.
- Jangan gunakan wildcard origin bersama credentials.
- Rotasi service-account key jika pernah bocor.
- Lebih baik gunakan secret manager/workload identity daripada menyimpan service-account JSON sebagai environment variable pada deployment production.
- Tambahkan App Check dan pembatasan API key jika aplikasi sudah keluar dari tahap demo.
