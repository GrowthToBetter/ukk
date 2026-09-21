# PRD — Smart Space Booking (UKK RPL Paket B)

**Status doc:** living reference. Update checklist status here as modules complete; keep DESIGN.md / API_CONTRACT.md as the technical source of truth for schema/endpoints.

---

## 1. Latar Belakang & Tujuan

UKK (Uji Kompetensi Keahlian) RPL SMK Telkom Malang, tahun ajaran 2026/2027, **Paket B**, kategori **Backend**. Tugas: membangun RESTful API untuk aplikasi reservasi coworking space & workstation ("Smart Space Booking"), sesuai Kontrak API resmi di soal.

Dikerjakan solo, tapi soal aslinya didesain untuk banyak siswa berbagi satu server panitia → wajib mengimplementasikan mekanisme **App Maker (multi-tenancy)** meski dipakai untuk 1 pengguna saja.

**Deliverables wajib (Lampiran B — Kategori Backend):**
1. Source code lengkap.
2. File basis data (SQL export) atau script migrasi.
3. Dokumentasi API (Postman collection / Swagger export).
4. Dokumen singkat cara menjalankan aplikasi (base URL, port, dst).

## 2. Keputusan Arsitektur

| Area | Keputusan |
|---|---|
| Backend | Laravel — REST API murni, mengikuti Kontrak API persis |
| Frontend | Next.js (T3 Stack), consumer API murni via fetch (bukan Inertia, bukan bagian dari deliverable UKK Backend, tapi dibangun untuk kebutuhan sendiri) |
| Auth | Laravel Sanctum (personal access token, simulasi Bearer JWT) |
| Multi-tenancy | Wajib — kolom `maker_id` di semua tabel utama, resolve dari header `x-maker-key`/`x-app-key` |
| DB (dev) | SQLite |
| Storage foto (production) | Cloudinary (bukan local disk — Render filesystem ephemeral) |
| Tooling | opencode + OmniRoute (routing multi-model lokal) |

**Deviasi dari ERD resmi (diizinkan soal):** tabel `detail_reservasi` pada ERD asli digabung langsung ke tabel `reservasi` untuk simplifikasi — tidak mengurangi fitur.

## 3. Entitas Data (ringkas — detail penuh di DESIGN.md)

- `makers` — app_key unik (`mk_xxxxxxxxxxxx`), untuk isolasi tenant
- `users` — maker_id, role (`member` | `admin_space`), username unik per maker
- `members` — profil member (nama, instansi, alamat, telp, foto)
- `space_owners` — profil admin/pengelola coworking
- `spaces` — maker_id, id_owner, nama, harga_per_jam, tipe (`desk`/`meeting_room`/`private_office`), kapasitas, deskripsi, foto
- `diskon` — maker_id, nama_diskon unik per maker, persentase, tanggal_awal/akhir
- `reservasi` — maker_id, kode_booking, id_member, id_space, id_diskon nullable, jadwal, harga snapshot, status, bukti_bayar, check_in/out_time, is_claimed, claimed_at

> **Catatan tambahan (lihat §4.1 dan §4.2):** kolom `bukti_bayar`, `is_claimed`, dan `claimed_at` pada `reservasi` **belum ada di migration saat ini** — perlu ditambahkan sebagai bagian dari modul Reservasi/Pembayaran. Detail schema penuh harus disinkronkan ke DESIGN.md sebelum implementasi.

## 4. Aturan Bisnis Kunci

- `jam_selesai = jam_mulai + durasi_jam` — dihitung server, bukan input client.
- `total_harga_awal = harga_per_jam * durasi_jam`
- `potongan_diskon = total_harga_awal * persentase_diskon / 100` (jika diskon valid: `tanggal_awal <= now <= tanggal_akhir`)
- `total_bayar = total_harga_awal - potongan_diskon`
- **Kode promo invalid → 400**, bukan diam-diam diabaikan.
- **Perhitungan `total_bayar` WAJIB dilakukan di backend saat submit reservasi**, bukan dihitung/dipercaya dari nilai yang dikirim frontend. Frontend hanya menampilkan estimasi (preview) sebelum submit; nilai final selalu berasal dari response backend.
- Ketersediaan space: tolak reservasi baru jika ada reservasi lain di space+tanggal sama dengan rentang jam overlap dan status ≠ `dibatalkan`.
- `kode_booking` format: `BOOK-{YYYYMMDD}-{4 digit id, zero-padded}`.
- Field `foto` di Member/Space simpan **filename saja** (dev) atau **public_id Cloudinary** (production); URL publik dikonstruksi via accessor (`foto_url`) yang menyesuaikan storage driver aktif — accessor ini harus tetap benar setelah migrasi ke Cloudinary (lihat catatan teknis di DEPLOY.md).
- Setiap request wajib header `x-maker-key` (kecuali endpoint publik murni: `/`, `/health`, `/api/maker/*` tertentu).
- Format response baku (sukses & error) — lihat API_CONTRACT.md / DESIGN.md.

### 4.1 Alur Status Reservasi (revisi — mencakup pembayaran)

Status lama (`belum_dikonfirm → disetujui → aktif → selesai`, atau `→ dibatalkan`) **kurang mendetailkan tahap pembayaran**. Alur yang benar mencakup verifikasi bukti bayar sebelum admin bisa menyetujui reservasi:

```
belum_dikonfirm
  → menunggu_pembayaran      (setelah reservasi dibuat, sebelum bukti bayar diupload)
  → menunggu_verifikasi      (setelah member upload bukti transfer)
  → disetujui                (admin verifikasi bukti bayar valid)
  → aktif                    (setelah check-in)
  → selesai                  (setelah check-out)

  → ditolak                  (admin verifikasi bukti bayar invalid — dari menunggu_verifikasi)
  → dibatalkan               (hanya dari belum_dikonfirm / menunggu_pembayaran / menunggu_verifikasi)
```

**Keputusan yang perlu dikonfirmasi sebelum implementasi:**
- Apakah status existing (`belum_dikonfirm`, `disetujui`) di kode saat ini sudah cukup, atau perlu ditambah state `menunggu_pembayaran` dan `menunggu_verifikasi` secara eksplisit? → **Perlu diputuskan sebelum migration ditulis**, karena mengubah enum status setelah data production ada akan butuh migration data tambahan.
- Minimal viable untuk UKK: kalau waktu terbatas, status bisa disederhanakan jadi `belum_dikonfirm → disetujui → aktif → selesai` dengan bukti bayar diupload di tahap `belum_dikonfirm` dan admin sekaligus verifikasi bukti + approve reservasi dalam satu aksi (tidak dipisah step pembayaran vs reservasi). **Ini opsi yang direkomendasikan untuk scope UKK** kecuali soal ujian secara eksplisit meminta pemisahan tahap pembayaran.

### 4.2 Bukti Pembayaran

- Member wajib upload bukti transfer (gambar) sebagai bagian dari proses reservasi, disimpan di kolom `bukti_bayar` (path/URL Cloudinary, konsisten dengan pola upload foto space/member).
- Endpoint untuk upload bukti bayar: **belum didefinisikan** — perlu ditambahkan ke API_CONTRACT.md (contoh: `POST /reservasi/{id}/bukti-bayar`).
- Admin harus bisa melihat bukti bayar yang diupload sebelum approve reservasi (bukan hanya approve space).
- Reservasi tanpa bukti bayar tidak boleh bisa disetujui admin (validasi di backend, bukan hanya di UI).

### 4.3 QR Code / E-Ticket (revisi)

- `qr_code_payload` (e-ticket): `VERIFY-RESERVASI-{id}-{app_key}` — QR image di-generate di frontend, backend cukup kirim string payload.
- **QR HANYA ditampilkan setelah reservasi berstatus `disetujui`** (bukan langsung muncul saat reservasi baru dibuat/`belum_dikonfirm`). Kondisi ini harus divalidasi baik di frontend (hide QR sebelum status sesuai) maupun idealnya di backend (endpoint e-ticket menolak/mengembalikan null kalau status belum `disetujui`).
- Fungsi QR: digunakan sebagai bukti klaim/check-in di lokasi — dipindai oleh admin/petugas saat member datang.
- Diperlukan mekanisme klaim di sisi admin:
  - Kolom `is_claimed` (boolean) dan `claimed_at` (timestamp) di tabel `reservasi`.
  - Endpoint admin untuk menandai QR sudah diklaim/discan (contoh: `POST /admin/reservasi/{id}/claim` atau digabung dengan endpoint check-in yang sudah direncanakan di §5).
  - Setelah diklaim, status reservasi berpindah ke `aktif` (proses klaim QR = proses check-in; **tidak perlu dua mekanisme terpisah** kecuali soal ujian memintanya eksplisit).

## 5. Modul & Status Implementasi

| Modul | Status | Catatan |
|---|---|---|
| App Maker (multi-tenancy) | ✅ Selesai | register/login/me/stats/list, middleware ResolveMakerKey |
| Auth User (Member & Admin Space) | ✅ Selesai | Sanctum, isolasi multi-tenant tervalidasi manual |
| Space & Diskon (katalog publik) | ✅ Selesai | `availability()` masih placeholder `available=true`, nunggu tabel reservasi |
| Reservasi (Member) — dasar | 🔄 Sebagian | store/myReservations/myHistory/eTicket/show/cancel sudah ada; **perhitungan diskon di frontend belum sinkron dengan total_bayar backend (bug ditemukan saat testing)**; QR muncul sebelum status disetujui (menyalahi §4.3, perlu fix) |
| Reservasi — Bukti Pembayaran | ⬜ Belum | field `bukti_bayar`, endpoint upload, validasi wajib sebelum approve — lihat §4.2 |
| Reservasi — Filter riwayat | ⬜ Belum | halaman `/reservasi` (frontend) dan endpoint list belum support filter tanggal/status/space — lihat §4.4 (baru) |
| Reservasi — Klaim QR / Check-in | ⬜ Belum | kolom `is_claimed`/`claimed_at`, endpoint klaim — lihat §4.3 |
| Admin — Profil Lokasi | ⬜ Belum | GET/PUT `/admin/profile` |
| Admin — Member CRUD | ⬜ Belum | |
| Admin — Space CRUD | 🔄 Sebagian | Create & Edit form sudah dikerjakan di frontend (`admin/spaces/*`); backend CRUD perlu dicek kelengkapannya |
| Admin — Diskon CRUD | ⬜ Belum | |
| Admin — Reservasi & status (termasuk verifikasi bukti bayar) | ⬜ Belum | filter month/year/status/id_space/tanggal; **tambahan: tampilkan & verifikasi bukti_bayar sebelum approve** |
| Admin — Check-in/Check-out (via klaim QR) | ⬜ Belum | lihat §4.3 |
| Admin — Laporan (monthly/income) | ⬜ Belum | rekap pendapatan per bulan & per tipe space |
| Upload (image/spaces/members) | 🔄 Sebagian | Sudah pindah dari local disk ke Cloudinary; accessor `foto_url` sempat bug (masih generate URL localhost lama) — sudah diperbaiki, perlu verifikasi ulang untuk data lama |
| Testing otomatis (Pest) | ⬜ Direncanakan | disarankan sebelum lanjut modul Admin |
| Dokumentasi API (Postman/Swagger) | ⬜ Belum dibuat | wajib untuk deliverable UKK |
| Frontend (Next.js) | 🔄 Sebagian | Auth, katalog, reservasi dasar, admin space (create/edit) sudah jalan; filter riwayat, bukti bayar, verifikasi admin, klaim QR belum |

## 6. Dokumen Sinkron yang Perlu Dicek

`docs/DESIGN.md` dan `docs/API_CONTRACT.md` sempat ditulis ulang tanpa Maker (saat modul Maker sempat dianggap tidak perlu), lalu dikembalikan. **Perlu dicek ulang** agar konsisten dengan kode aktual (skema `maker_id` di semua tabel), dan sekarang juga perlu ditambahkan definisi untuk:
- Endpoint upload bukti pembayaran (§4.2)
- Endpoint klaim QR / check-in (§4.3)
- Query parameter filter untuk endpoint list reservasi (§4.4)
- Enum status reservasi final (tergantung keputusan §4.1)

## 4.4 Filter Riwayat Reservasi (baru)

Halaman `/reservasi` (member) dan halaman admin daftar reservasi butuh filter agar bisa dipakai dengan data banyak. Minimal yang perlu didukung:

- Filter by rentang tanggal (`tanggal_awal`, `tanggal_akhir`)
- Filter by status (`belum_dikonfirm`, `disetujui`, `aktif`, `selesai`, `dibatalkan`, dst sesuai keputusan §4.1)
- Filter by space (`id_space`) — relevan terutama untuk admin
- Endpoint list reservasi (member & admin) harus menerima parameter ini sebagai query string, backend yang melakukan filtering (bukan filter di frontend dari data yang sudah di-fetch semua), supaya scalable.

## 7. Next Immediate Steps (revisi)

1. **Putuskan** apakah alur status pembayaran disederhanakan atau dipisah eksplisit (§4.1) — ini menentukan scope migration & endpoint yang perlu ditambah.
2. Tambahkan migration untuk `bukti_bayar`, `is_claimed`, `claimed_at` di tabel `reservasi` (§4.2, §4.3).
3. Fix bug: kalkulasi diskon di frontend reservasi belum mempengaruhi total bayar; QR e-ticket muncul sebelum status `disetujui`.
4. Implementasi endpoint & UI upload bukti bayar, verifikasi admin, dan klaim QR/check-in.
5. Implementasi filter di endpoint list reservasi + UI filter di halaman `/reservasi` dan admin.
6. Sinkronkan ulang `DESIGN.md` & `API_CONTRACT.md` dengan seluruh keputusan di atas.
7. Lanjutkan modul Admin lain yang masih ⬜ (CRUD member/diskon, laporan pendapatan).
8. Pertimbangkan Pest test otomatis untuk modul stabil sebelum lanjut modul baru.
9. Sebelum submit: siapkan Postman collection/Swagger export + dokumen singkat cara menjalankan aplikasi (wajib deliverable kategori Backend).

## 8. Lampiran — Referensi Cepat

- Kontrak API lengkap: `docs/API_CONTRACT.md` (ringkasan) / soal PDF Bagian III (detail request/response per endpoint, contoh JSON, DTO lengkap).
- Skema DB & aturan bisnis: `docs/DESIGN.md`.
- Aturan kerja lintas-project & pembagian model OmniRoute: `AGENTS.md` (root), `backend/AGENTS.md` (Laravel Boost), `frontend/AGENTS.md`.
- Deployment: `DEPLOY.md` (Render + Cloudinary setup).