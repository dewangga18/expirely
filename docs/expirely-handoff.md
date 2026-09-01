# Expirely — Submission & Pitch Companion (Venturo Build Day)

*Spesifikasi produk lengkap ada di `expirely-prd.md`, blueprint teknis ada di `expirely-architecture.md`. Dokumen ini isinya teks form submission, desain dataset, dan checklist demo — supaya nggak duplikat.*

## 1. Draft Form Ideation (siap copy-paste)

**Judul Project**
Expirely

**Problem**
Orang sering lupa atau telat menghabiskan bahan makanan sebelum kedaluwarsa sehingga uang terbuang percuma karena tidak ada cara praktis untuk tahu barang mana yang harus segera dipakai.

**Target User**
Individu atau rumah tangga yang rutin belanja groceries dan ingin mengurangi food waste serta pengeluaran yang tidak perlu.

**Solution**
Expirely mencatat barang rumah tangga lewat foto, otomatis mengenali nama produk dan tanggal kedaluwarsa (atau memperkirakannya untuk barang segar tanpa label), lalu menampilkan dashboard barang yang harus segera digunakan. Saat barang mendekati kedaluwarsa, AI memberikan rekomendasi penggunaan (misalnya ide masakan) agar barang tidak terbuang sia-sia.

**AI Leverage**
Gemini vision dipakai untuk mengenali produk dan membaca tanggal kedaluwarsa dari foto, serta menghasilkan rekomendasi penggunaan untuk barang yang akan expired. Sorting, status, kalkulasi hari, ownership, dan kuota tetap memakai logic deterministik agar efisien dan mudah diuji.

**Business Potential**
Freemium ad-supported — iklan banner tampil di aplikasi sebagai revenue dasar. Recognition foto & rekomendasi AI dibatasi kuota harian (misal 2x/hari); setelah kuota habis, user bisa nonton rewarded ad untuk dapat tambahan kuota. Input manual tetap gratis unlimited. Market besar karena hampir semua rumah tangga belanja groceries dan food waste berdampak langsung ke pengeluaran mereka.

*Bonus pitch line (buat Q&A, bukan buat form):* "Kalau mau serius, bisa juga di-scale ke konteks yang lebih gede — misal bantu tracking distribusi MBG atau logistik Kopdes biar makanan nggak kebuang di rantai yang lebih besar."

**Tech Stack**
Golang Skeleton (BE) + React Skeleton (FE) — kalau form cuma bisa 1 pilihan, pilih "Lainnya" lalu tulis manual keduanya.

---

## 2. Penegasan Scope Teknis (biar nggak kebayang lebih ribet dari aslinya)

- **Recognition = pakai AI existing (API call), BUKAN training model sendiri.** Kirim foto + prompt ke Gemini API dan terima JSON `{nama_produk, expiry_date, kategori}`. Tidak ada model yang perlu dibangun atau dilatih.
- **Dataset shelf-life = referensi lokal, BUKAN scraping.** Tabel kategori pada service backend dipakai untuk estimasi deterministik. Tidak ada crawling web.
- **Ads = di-mock untuk demo, BUKAN integrasi ad network beneran.** UI placeholder banner statis "Ad Space", dan modal "Tonton iklan untuk kuota tambahan" yang begitu diklik langsung nambah kuota (fake, tanpa nunggu video ad beneran). Juri menilai konsepnya jalan, bukan integrasi AdMob yang sungguhan.
- **Full-stack Go+React = CRUD standar** mengikuti struktur skeleton asli (lihat `expirely-architecture.md`), bukan arsitektur baru dari nol.

Total effort development riil: CRUD app biasa + 2 jenis AI API call + 1 tabel JSON kecil + fake UI ads. Tidak ada bagian yang butuh keahlian ML/training model.

---

## 3. Desain Dataset

### Dataset A — Shelf-Life Reference (static, WAJIB, ~15 menit buat nulis)
Dipakai untuk estimasi expiry barang segar tanpa tanggal tercetak (deterministic, bukan AI, gratis & instan).

| kategori | estimasi_hari | contoh |
|---|---|---|
| buah_segar | 6 | pisang, apel, jeruk |
| sayur_hijau | 4 | bayam, kangkung, sawi |
| sayur_umbi | 18 | kentang, wortel, bawang |
| roti_tanpa_pengawet | 3 | roti lokal, roti bakery |
| telur_lepas | 18 | telur ayam curah |
| daging_segar | 2 | daging sapi/ayam belum dibekukan |
| daging_beku | 90 | daging di freezer |
| ikan_segar | 2 | ikan belum dibekukan |
| susu_segar_non_uht | 4 | susu pasteurisasi |
| keju_segar | 10 | keju tanpa kemasan awet |
| default_unknown | 7 | fallback kalau kategori tidak dikenali |

Format data (JSON lokal, di-load sekali di backend):
```json
{
  "buah_segar": { "estimasi_hari": 6, "contoh": ["pisang", "apel", "jeruk"] },
  "sayur_hijau": { "estimasi_hari": 4, "contoh": ["bayam", "kangkung", "sawi"] },
  "default_unknown": { "estimasi_hari": 7, "contoh": [] }
}
```

### Dataset B — Product Recognition Cache (dinamis, NICE-TO-HAVE, Fase 2 — lihat roadmap di PRD)
Tujuan: mengurangi kebutuhan AI menebak ulang kategori untuk produk yang sudah pernah dikenali.

```json
{
  "nama_produk_normalized": "indomie goreng",
  "kategori": "makanan_instan",
  "ada_tanggal_biasa_tercetak": true,
  "hit_count": 12,
  "last_seen": "2026-08-27"
}
```
Catatan: cache ini TIDAK menggantikan pembacaan tanggal expired per unit (tiap barang beda tanggal), hanya membantu klasifikasi kategori jadi lebih cepat/konsisten.

---

## 4. Mekanisme Freemium & Kuota (detail implementasi)

- **Manual add** (ketik nama + tanggal sendiri): gratis, unlimited — tidak ada cost AI
- **AI photo recognition & AI recommendation**: dibatasi kuota harian (misal 2x/hari masing-masing)
- **Ads**: banner selalu tampil sebagai revenue dasar (di-mock untuk demo)
- **Kuota habis**: user nonton rewarded ad (di-mock) untuk dapat tambahan kuota hari itu
- Tidak ada tier subscription — monetisasi murni dari ads
- Dataset A (shelf-life) mengurangi kebutuhan AI reasoning untuk barang segar → hemat cost tanpa nunggu Dataset B

---

## 5. Rencana Harian (urutan: functional dulu → edge case demo-critical → polish terakhir)

| Hari | Fokus | Task |
|---|---|---|
| 1 | Functional | Setup backend (module `expirely_item`, migration) + frontend (copy `demo/` → `expirely-items/`), load Dataset A, sambungkan foto → AI extract → simpan (happy path saja) |
| 2 | Functional | Dashboard list sorted by urgensi expiry + AI recommendation tersambung end-to-end |
| 3 | Edge case demo-critical | Manual edit fallback, empty state, kuota habis + rewarded ad (mock), mark consumed/wasted |
| 4 | Polish + persiapan demo | Bersihin nav (`nav-config-dashboard.tsx`), seed demo data, styling ringan, siapkan 2-3 skenario demo yang pasti jalan (foto yang sudah ditest) |
| 5 (buffer) | Buffer | Bug fixing + siapkan slide pitch (problem, solution, AI leverage, business potential, roadmap) + latihan presentasi 10 menit |

---

## 6. Demo Checklist
- [ ] Seed data terisi (jangan mulai dari state kosong di depan juri)
- [ ] Minimal 1 foto barang berkemasan yang sudah ditest hasilnya akurat
- [ ] Minimal 1 foto barang segar (tanpa tanggal) yang sudah ditest hasil estimasinya masuk akal
- [ ] Manual edit fallback sudah dicoba dan berfungsi
- [ ] AI recommendation sudah dicoba dengan kombinasi barang yang realistis
- [ ] Kuota habis → rewarded ad mock sudah dicoba
- [ ] Nav sudah dibersihin dari menu enterprise yang tidak dipakai
- [ ] Skenario demo end-to-end sudah di-rehearse minimal sekali penuh
