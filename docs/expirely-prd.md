# Expirely — Product Requirements Document (PRD)

## 1. Overview
Expirely adalah aplikasi household inventory yang membantu pengguna mencatat barang lewat foto, memantau tanggal kedaluwarsa, dan mendapat rekomendasi pemakaian sebelum barang terbuang.

## 2. Problem Statement
Orang sering lupa atau telat menghabiskan bahan makanan sebelum kedaluwarsa sehingga uang terbuang percuma karena tidak ada cara praktis untuk tahu barang mana yang harus segera dipakai.

## 3. Target Users
Individu atau rumah tangga yang rutin belanja groceries dan ingin mengurangi food waste serta pengeluaran yang tidak perlu.

## 4. Goals & Success Metrics (untuk demo, bukan produksi)
- Juri bisa lihat end-to-end flow: foto → recognition → dashboard → rekomendasi → mark consumed/wasted
- Minimal 1 skenario barang berkemasan (ada tanggal tercetak) dan 1 skenario barang segar (estimasi) berjalan mulus
- Narasi business model (ads + kuota harian) tersampaikan jelas di pitch

## 5. Fitur — In Scope (MVP, 3-5 hari)
| # | Fitur | Deskripsi |
|---|---|---|
| 1 | Add item via foto | 1 AI call (vision) → identifikasi nama produk + baca tanggal expired, atau kategori kalau tidak ada tanggal tercetak. User memilih lokasi simpan; AI menampilkan indikator risiko pembusukan dari kondisi visual + konteks lokasi. |
| 2 | Manual edit fallback | Koreksi nama/tanggal kalau hasil AI salah |
| 3 | Dashboard | List item sorted by urgensi expiry, color-coded (merah/kuning/hijau) — logic deterministik |
| 4 | AI recommendation | Saran resep/pemakaian saat ada barang mau expired |
| 5 | Mark consumed/wasted | Update status barang |
| 6 | Kuota & ads (mock) | Kuota harian untuk recognition & recommendation; kuota habis → tampil ads (mock); rewarded ad (mock) menambah kuota |

## 6. Roadmap Berfase (Fase 1 = submission challenge, sisanya buat pitch & pengembangan lanjutan)

**Fase 1 — MVP (3-5 hari, wajib selesai untuk demo)**
Lihat bagian 5 (fitur #1-6): add item, manual edit, dashboard, AI recommendation, mark consumed/wasted, ads+kuota mock.

**Fase 2 — Quick wins pasca-challenge**
- Barcode scanning (integrasi nyata, bukan mock)
- Push notification reminder (scheduler beneran)
- Dataset B: product recognition cache — ngirit cost AI recognition berulang
- Integrasi ad network beneran (AdMob dsb), ganti dari mock

**Fase 3 — Growth features**
- Family sharing (multi-user per rumah tangga)
- Waste analytics & purchase pattern insights dashboard
- Infrastruktur payment/subscription (kalau nanti mau nambah tier lagi di luar ads)

**Fase 4 — Expansion**
- Partnership dengan grocery store/supermarket (data harga/promo)
- Partnership dengan brand untuk sponsored recommendation
- Perluasan use-case ke skala lebih besar (misal institusi/distribusi pangan)

## 7. User Flow (Core Loop)
1. User foto barang
2. User memilih lokasi simpan (suhu ruang, kulkas, freezer, pantry, atau tidak yakin). AI mengembalikan: `{nama_produk, ada_tanggal_tercetak, expiry_date}` ATAU `{nama_produk, ada_tanggal_tercetak: false, kategori}`, serta indikator risiko pembusukan dari kondisi visual + lokasi simpan.
3. Jika kategori (tanpa tanggal) → sistem hitung estimasi expiry dari Dataset Shelf-Life
4. Item masuk dashboard, status "Dari kemasan" / "Perkiraan"
5. User bisa koreksi manual kapan saja
6. Saat item mendekati expiry, muncul rekomendasi AI (resep/pemakaian)
7. User tandai consumed/wasted

## 8. AI Behavior Spec
**Recognition (1 call per foto):**
```json
// Kondisi A — ada tanggal tercetak
{ "nama_produk": "susu UHT", "ada_tanggal_tercetak": true, "expiry_date": "2026-09-15" }

// Kondisi B — tanpa tanggal (barang segar)
{ "nama_produk": "pisang", "ada_tanggal_tercetak": false, "kategori": "buah_segar" }
```

**Recommendation (dipanggil saat ada item mendekati expiry):**
Input: daftar nama produk yang mendekati expiry.
Output: 1 saran singkat (nama resep/pemakaian).

**Spoilage-risk indicator (saat recognition):**
Input tambahan: lokasi simpan yang dipilih user. Output: `low`, `moderate`, atau `high`, kondisi visual, dan saran penyimpanan/pemakaian. Ini hanya indikator untuk mengurangi food waste, **bukan** jaminan makanan aman dikonsumsi.

## 9. Business Model
Freemium ad-supported — banner ads selalu tampil sebagai revenue dasar. Recognition & recommendation dibatasi kuota harian (misal 2x/hari); kuota habis → user nonton rewarded ad untuk tambahan kuota. Input manual tetap gratis unlimited. Tidak ada subscription tier.

## 10. Keputusan Implementasi Saat Ini
- Scope MVP tetap groceries dan barang rumah tangga, termasuk barang segar.
- Provider AI yang dipakai adalah Google Gemini (`AI_MODEL`, default saat ini `gemini-3.5-flash-lite`).
- Item dan kuota diisolasi per user. Family/household sharing tetap roadmap fase berikutnya.
