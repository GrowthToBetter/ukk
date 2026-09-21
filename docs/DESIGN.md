# DESIGN.md — Smart Space Booking (UKK RPL Paket B)

> Sumber kebenaran tunggal untuk skema data, aturan bisnis, kontrak API, dan sistem UI/UX.
> `DESIGN.md` portfolio pribadi (sndyy.id) dipakai **hanya sebagai referensi gaya** — motif
> index-bracket, token OKLCH, pola GSAP/Motion, prinsip anti-slop — bukan sumber konten. Semua
> entitas, field, dan endpoint di dokumen ini mengikuti **Kontrak API resmi Paket B**
> (`Rev_Soal_UKK_2026-2027_Paket_B.pdf`, Bagian III) dan `API_CONTRACT.md` ringkas.

## 0. Kategori pengerjaan & scope

- Kategori: **Backend** (Lampiran B) — backend dibangun sendiri, mengikuti Kontrak API resmi
  persis (bukan bebas desain sendiri).
- Frontend Next.js dibangun **di luar** kewajiban deliverable UKK Backend, untuk kebutuhan
  pribadi, mengonsumsi API buatan sendiri di atas.
- Karena soal aslinya dirancang untuk banyak siswa berbagi satu server panitia, **App Maker
  (multi-tenancy)** tetap wajib diimplementasikan meski dipakai solo.

## 1. Skema Database

Mengikuti ERD resmi (Bagian II) + Kontrak API (Bagian III), dengan deviasi yang diizinkan soal:
`detail_reservasi` digabung langsung ke tabel `reservasi` untuk simplifikasi.

### `makers`
| Kolom | Tipe | Ket |
|---|---|---|
| id | bigint PK | |
| name | string | |
| username | string unique | |
| email | string unique | |
| password | string hashed | |
| app_key | string unique | format `mk_xxxxxxxxxxxx` |
| created_at, updated_at | timestamp | |

### `users`
| Kolom | Tipe | Ket |
|---|---|---|
| id | bigint PK | |
| maker_id | bigint FK → makers.id | isolasi tenant |
| username | string unique per maker | |
| password | string hashed | |
| role | enum('member','admin_space') | |
| created_at, updated_at | timestamp | |

### `members`
| Kolom | Tipe | Ket |
|---|---|---|
| id | bigint PK | |
| user_id | bigint FK → users.id | |
| maker_id | bigint FK → makers.id | isolasi tenant |
| nama_member | string | |
| instansi | string | |
| alamat | text | |
| telp | string | |
| foto | string nullable | filename saja, bukan URL |
| created_at, updated_at | timestamp | |

### `space_owners`
| Kolom | Tipe | Ket |
|---|---|---|
| id | bigint PK | |
| user_id | bigint FK → users.id | |
| maker_id | bigint FK → makers.id | isolasi tenant |
| nama_coworking | string | |
| nama_pemilik | string | |
| telp | string | |
| created_at, updated_at | timestamp | |

### `spaces`
| Kolom | Tipe | Ket |
|---|---|---|
| id | bigint PK | |
| maker_id | bigint FK → makers.id | isolasi tenant |
| id_owner | bigint FK → space_owners.id | |
| nama_space | string | |
| harga_per_jam | decimal/integer | |
| tipe | enum('desk','meeting_room','private_office') | |
| kapasitas | integer | |
| deskripsi | text | |
| foto | string nullable | filename saja |
| created_at, updated_at | timestamp | |

### `diskon`
| Kolom | Tipe | Ket |
|---|---|---|
| id | bigint PK | |
| maker_id | bigint FK → makers.id | isolasi tenant |
| nama_diskon | string unique per maker | |
| persentase_diskon | decimal | 1–100 |
| tanggal_awal | timestamp | |
| tanggal_akhir | timestamp | |
| created_at, updated_at | timestamp | |

### `reservasi`
| Kolom | Tipe | Ket |
|---|---|---|
| id | bigint PK | |
| maker_id | bigint FK → makers.id | isolasi tenant |
| kode_booking | string unique | `BOOK-YYYYMMDD-XXXX` |
| id_member | bigint FK → members.id | |
| id_space | bigint FK → spaces.id | |
| id_diskon | bigint FK nullable → diskon.id | |
| tanggal_reservasi | date | |
| jam_mulai | time | |
| jam_selesai | time | dihitung server |
| durasi_jam | integer | |
| harga_per_jam | integer | snapshot saat transaksi |
| total_harga_awal | integer | |
| potongan_diskon | integer | |
| total_bayar | integer | |
| status | enum('belum_dikonfirm','disetujui','aktif','selesai','dibatalkan') | default belum_dikonfirm |
| check_in_time | datetime nullable | |
| check_out_time | datetime nullable | |
| created_at, updated_at | timestamp | |

## 2. Aturan Bisnis

- **Ketersediaan space**: reservasi baru ditolak kalau ada reservasi lain di space yang sama,
  tanggal sama, rentang jam overlap, dengan status selain `dibatalkan`. Formula end-exclusive:
  `new.start < existing.end AND existing.start < new.end`.
- `jam_selesai = jam_mulai + durasi_jam`, dihitung server, bukan input client.
- `total_harga_awal = harga_per_jam * durasi_jam`.
- `kode_promo`/`id_diskon` dikirim tapi invalid/kedaluwarsa → **400**, bukan diam-diam diabaikan
  (member harus sadar kodenya salah).
- `potongan_diskon = total_harga_awal * persentase_diskon / 100`.
- `total_bayar = total_harga_awal - potongan_diskon`.
- Alur status: `belum_dikonfirm → disetujui → aktif → selesai`. Bisa `→ dibatalkan` hanya dari
  `belum_dikonfirm` atau `disetujui` (tidak bisa cancel `aktif`/`selesai`).
- Check-in valid hanya dari status `disetujui`. Check-out valid hanya dari status `aktif`.
- `kode_booking`: `BOOK-{YYYYMMDD tanggal_reservasi}-{4 digit id reservasi, zero-padded}`.
- `qr_code_payload` e-ticket: `VERIFY-RESERVASI-{id}-{app_key}` — generate QR image di frontend
  (`qrcode.react`), backend hanya kirim string payload.

## 3. Auth & Multi-Tenancy

- Setiap request wajib header `x-maker-key` (atau `x-app-key`), di-resolve middleware
  `ResolveMakerKey` ke `maker_id`. Request tanpa header ini → 400/401, kecuali endpoint publik
  murni (`/`, `/health`, `/api/maker/*`).
- Login pakai Sanctum (`personal access token`, disebut `access_token` di response — setara
  dengan istilah "JWT" yang dipakai soal, format header tetap `Authorization: Bearer <token>`).
- Token divalidasi guard Sanctum **+** dicocokkan `maker_id` token dengan `x-maker-key` header,
  supaya token dari maker lain tidak bisa dipakai lintas tenant.
- Role check via middleware `CheckRole` terpisah untuk `member` vs `admin_space`, per route
  group di `routes/api.php`. Gagal role → 403 format `ApiResponse` standar.
- Token invalid/kosong di endpoint `auth:sanctum` → **wajib** JSON 401 format `ApiResponse`
  (bukan redirect ke route login), dihandle global di `bootstrap/app.php`.

## 4. Format Response Standar

```jsonc
// Sukses
{ "status": true, "statusCode": 200, "message": "...", "data": {}, "timestamp": "ISO 8601" }
// Error
{ "status": false, "statusCode": 400, "message": "...", "error": "Bad Request", "timestamp": "..." }
// Validation Error (422)
{ "status": false, "statusCode": 422, "message": "pesan field pertama gagal",
  "errors": { "field": ["detail"] }, "timestamp": "..." }
// Unauthenticated (401)
{ "status": false, "statusCode": 401, "message": "Unauthenticated", "error": "Unauthorized",
  "timestamp": "..." }
```

Root (`GET /`) dan `GET /health` wajib ada, publik, mengembalikan status API + link dokumentasi
(lihat contoh persis di soal PDF hal. 12).

## 5. Kontrak API — Daftar Endpoint Lengkap

Base URL dev lokal: `http://127.0.0.1:8000/api`. Header wajib semua request (kecuali disebut
publik murni): `x-maker-key: <app_key>`. Header tambahan endpoint ber-auth:
`Authorization: Bearer <access_token>`.

### 5.1 Root & Health
| Method | Path | Auth |
|---|---|---|
| GET | `/` | Publik |
| GET | `/health` | Publik |

### 5.2 App Maker (Multi-Tenancy)
| Method | Path | Auth | Ket |
|---|---|---|---|
| POST | `/maker/register` | Publik | body: name, username, email, password → return app_key + access_token |
| POST | `/maker/login` | Publik | body: usernameOrEmail, password → access_token |
| GET | `/maker/me` | Bearer (maker) | |
| GET | `/maker/stats` | x-maker-key | total_members, total_spaces, total_diskon, total_reservasi, total_pendapatan |
| GET | `/maker/list` | Publik | daftar semua maker (panel guru/penguji) |

### 5.3 Auth User (Member & Admin Space)
| Method | Path | Auth | Body |
|---|---|---|---|
| POST | `/auth/register/member` | x-maker-key | username, password, nama_member, instansi, alamat, telp, foto? |
| POST | `/auth/register/admin-space` | x-maker-key | username, password, nama_coworking, nama_pemilik, telp |
| POST | `/auth/login` | x-maker-key | username, password → access_token |
| GET | `/auth/profile` | Bearer + x-maker-key | |

### 5.4 Space (Katalog & Ketersediaan)
| Method | Path | Auth | Query |
|---|---|---|---|
| GET | `/spaces/types` | x-maker-key | |
| GET | `/spaces/availability` | x-maker-key | id_space, tanggal, jam_mulai, durasi_jam |
| GET | `/spaces` | x-maker-key | ?tipe, ?search |
| GET | `/spaces/{id}` | x-maker-key | |

### 5.5 Diskon
| Method | Path | Auth | Body/Query |
|---|---|---|---|
| GET | `/diskon/active` | x-maker-key | |
| POST | `/diskon/check` | x-maker-key | nama_diskon → response wajib sertakan `is_active` |
| GET | `/diskon/{id}` | x-maker-key | |

### 5.6 Reservasi (Member)
| Method | Path | Auth | Body/Query |
|---|---|---|---|
| POST | `/reservasi` | Bearer (member) + x-maker-key | id_space, tanggal_reservasi, jam_mulai, durasi_jam, id_diskon?, kode_promo? |
| GET | `/reservasi/my` | Bearer (member) + x-maker-key | |
| GET | `/reservasi/my/history` | Bearer (member) + x-maker-key | ?month, ?year |
| GET | `/reservasi/{id}/e-ticket` | Bearer (member/admin) + x-maker-key | response nested: coworking_space, member, space, jadwal, rincian_pembayaran, qr_code_payload |
| GET | `/reservasi/{id}` | Bearer (member/admin) + x-maker-key | |
| PATCH | `/reservasi/{id}/cancel` | Bearer (member) + x-maker-key | |

### 5.7 Profil Lokasi (Admin)
| Method | Path | Auth | Body |
|---|---|---|---|
| GET | `/admin/profile` | Bearer (admin_space) + x-maker-key | |
| PUT | `/admin/profile` | Bearer (admin_space) + x-maker-key | nama_coworking*, nama_pemilik*, telp* |

### 5.8 Member Management (Admin)
| Method | Path | Auth | Body |
|---|---|---|---|
| GET | `/admin/members` | Bearer (admin_space) + x-maker-key | ?search |
| POST | `/admin/members` | Bearer (admin_space) + x-maker-key | username*, password*, nama_member*, instansi*, alamat*, telp*, foto? |
| GET | `/admin/members/{id}` | Bearer (admin_space) + x-maker-key | |
| PUT | `/admin/members/{id}` | Bearer (admin_space) + x-maker-key | field opsional |
| DELETE | `/admin/members/{id}` | Bearer (admin_space) + x-maker-key | |

### 5.9 Space Management (Admin)
| Method | Path | Auth | Body |
|---|---|---|---|
| GET | `/admin/spaces` | Bearer (admin_space) + x-maker-key | |
| POST | `/admin/spaces` | Bearer (admin_space) + x-maker-key | nama_space*, harga_per_jam*, tipe*, kapasitas*, deskripsi*, foto? |
| GET | `/admin/spaces/{id}` | Bearer (admin_space) + x-maker-key | |
| PUT | `/admin/spaces/{id}` | Bearer (admin_space) + x-maker-key | field opsional |
| DELETE | `/admin/spaces/{id}` | Bearer (admin_space) + x-maker-key | |

### 5.10 Diskon Management (Admin)
| Method | Path | Auth | Body |
|---|---|---|---|
| GET | `/admin/diskon` | Bearer (admin_space) + x-maker-key | |
| POST | `/admin/diskon` | Bearer (admin_space) + x-maker-key | nama_diskon*, persentase_diskon*, tanggal_awal*, tanggal_akhir* |
| GET | `/admin/diskon/{id}` | Bearer (admin_space) + x-maker-key | |
| PUT | `/admin/diskon/{id}` | Bearer (admin_space) + x-maker-key | field opsional |
| DELETE | `/admin/diskon/{id}` | Bearer (admin_space) + x-maker-key | |

### 5.11 Reservasi & Check-in/out (Admin)
| Method | Path | Auth | Body/Query |
|---|---|---|---|
| GET | `/admin/reservasi` | Bearer (admin_space) + x-maker-key | ?month, ?year, ?status, ?id_space, ?tanggal |
| PATCH | `/admin/reservasi/{id}/status` | Bearer (admin_space) + x-maker-key | status* |
| POST | `/admin/reservasi/{id}/check-in` | Bearer (admin_space) + x-maker-key | — |
| POST | `/admin/reservasi/{id}/check-out` | Bearer (admin_space) + x-maker-key | — |

### 5.12 Laporan (Admin)
| Method | Path | Auth | Query |
|---|---|---|---|
| GET | `/admin/reports/monthly` | Bearer (admin_space) + x-maker-key | ?month, ?year — full breakdown per tipe space |
| GET | `/admin/reports/income` | Bearer (admin_space) + x-maker-key | ?month, ?year — alias ringkas, field lebih sedikit |

### 5.13 Upload
| Method | Path | Auth | Response |
|---|---|---|---|
| POST | `/upload/image` | x-maker-key (multipart: file) | filename, original_name, mimetype, size, url |
| POST | `/upload/spaces` | x-maker-key (multipart: file) | filename, url |
| POST | `/upload/members` | x-maker-key (multipart: file) | filename, url |

### 5.14 Catatan penyelarasan penting

Empat titik ini adalah selisih yang paling gampang terlewat dibanding versi kontrak "bebas
desain sendiri" sebelumnya — dicek ulang setiap kali endpoint terkait diimplementasikan:

1. `POST /maker/register` & `/maker/login` mengembalikan `access_token` **langsung** di
   response-nya sendiri (bukan cuma di endpoint login user biasa).
2. `POST /diskon/check` wajib menyertakan field `is_active: true/false`.
3. `GET /reservasi/{id}/e-ticket` **nested**, bukan flat — lihat §5.6.
4. `POST /upload/*` mengembalikan `original_name`, `mimetype`, `size` — bukan cuma
   filename+url.

### 5.15 DTO Ringkas (validasi wajib di Form Request Laravel)

| DTO | Field wajib (`*`) / opsional (`?`) |
|---|---|
| `RegisterMakerDto` | name*, username*, email*, password* (min 6) |
| `LoginMakerDto` | usernameOrEmail*, password* |
| `RegisterMemberDto` | username*, password* (min 6), nama_member*, instansi*, alamat*, telp*, foto? |
| `RegisterAdminSpaceDto` | username*, password* (min 6), nama_coworking*, nama_pemilik*, telp* |
| `LoginDto` | username*, password* |
| `CheckPromoDto` | nama_diskon* |
| `CreateReservasiDto` | id_space* (exists, scoped maker_id), tanggal_reservasi* (date, >= today), jam_mulai* (HH:mm), durasi_jam* (int, min 1), id_diskon? (exists, scoped maker_id), kode_promo? |
| `UpdateCoworkingProfileDto` | nama_coworking*, nama_pemilik*, telp* (PUT semantik penuh) |
| `CreateMemberAdminDto` | username*, password*, nama_member*, instansi*, alamat*, telp*, foto? |
| `UpdateMemberAdminDto` | semua opsional (nama_member, instansi, alamat, telp, password, foto) |
| `CreateSpaceDto` | nama_space*, harga_per_jam* (numeric, min 0), tipe* (in: desk,meeting_room,private_office), kapasitas* (int, min 1), deskripsi*, foto? |
| `UpdateSpaceDto` | semua opsional |
| `CreateDiskonDto` | nama_diskon* (unique per maker_id), persentase_diskon* (1–100), tanggal_awal* (date), tanggal_akhir* (date, after:tanggal_awal) |
| `UpdateDiskonDto` | semua opsional |
| `UpdateReservasiStatusDto` | status* (in: belum_dikonfirm, disetujui, aktif, selesai, dibatalkan) |

### 5.16 Multi-Tenancy: maker_id Scoping

| Model/Tabel | maker_id FK | Scope Method |
|---|---|---|
| `users` | ✅ FK → makers.id | `forMaker($makerId)` |
| `members` | ✅ FK → makers.id | `forMaker($makerId)` |
| `space_owners` | ✅ FK → makers.id | `forMaker($makerId)` |
| `spaces` | ✅ FK → makers.id | `forMaker($makerId)` |
| `diskon` | ✅ FK → makers.id | `forMaker($makerId)` |
| `reservasi` | ✅ FK → makers.id | `forMaker($makerId)` |

`maker_id` di-inject ke `$request` oleh middleware `ResolveMakerKey` dari header `x-maker-key`.
Controller mengambilnya via `$request->integer('maker_id')`.

## 6. Upload File

- Simpan ke storage lokal Laravel (`storage/app/public/...`), publish via
  `php artisan storage:link`.
- Field `foto` di Member/Space menyimpan **filename saja**; URL penuh dikonstruksi ulang saat
  response (`foto_url`) via accessor/Resource — frontend tidak pernah merekonstruksi URL sendiri
  dari filename.

---

# Sistem UI/UX — Playground diselaraskan ke Smart Space Booking

> Metode dari `DESIGN.md` portfolio (motif index-bracket, token OKLCH, tone-rhythm, GSAP untuk
> scroll pinned, Motion untuk interaksi lokal, aturan anti-slop di §9 sana) dipakai ulang di sini.
> Konten, entitas, dan pemetaan layar murni mengikuti kontrak API di atas — bukan salinan brand
> personal portofolio.

## A. Prinsip inti

1. **Playground di kulit, presisi di kerja.** Landing/katalog/alur booking member boleh main
   penuh (scroll pinned, tone-flip). Layar CRUD admin dapat token & motif yang sama, tapi
   toy-nya jadi micro-interaction (Motion), bukan scroll-jacking — tabel data pendek di viewport
   900px tidak punya jarak scroll untuk di-scrub GSAP.
2. UI didorong data API sungguhan — setiap state (loading/kosong/error) dirancang eksplisit,
   lihat §F.
3. Aturan struktural portfolio (radius 0, hairline, no shadow, no gradient, no icon selain motif
   index-bracket) tetap berlaku persis.

## B. Token warna — palet baru untuk brand produk ini

| Token | Nilai (OKLCH) | Kegunaan |
|---|---|---|
| `--ink-950` | `oklch(18% 0.015 230)` | teks tergelap / latar tone gelap |
| `--ink-900` | `oklch(24% 0.015 230)` | permukaan tone gelap |
| `--ink-600` | `oklch(48% 0.01 230)` | teks sekunder di atas terang |
| `--ink-200` | `oklch(88% 0.006 230)` | hairline di atas terang |
| `--paper-100` | `oklch(96% 0.008 95)` | latar tone terang |
| `--paper-050` | `oklch(99% 0.004 95)` | permukaan terang terangkat (card, table row) |
| `--accent-500` | `oklch(62% 0.14 165)` | CTA, status aktif, highlight index |
| `--accent-900` | `oklch(28% 0.09 165)` | latar blok tone accent |
| `--accent-050` | `oklch(95% 0.02 165)` | teks di atas `--accent-900` |
| `--status-warn` | `oklch(70% 0.16 70)` | badge status `belum_dikonfirm` |
| `--status-danger` | `oklch(55% 0.18 25)` | badge status `dibatalkan` |

Tipografi: **Clash Display** (display, variable `wght`) + **Satoshi** (body/UI), self-hosted via
`next/font/local` — setup identik §6.1.2 portfolio, tidak diulang di sini.

## C. Tier sistem & tone rhythm

| Tier | Cakupan | Tone | Toy |
|---|---|---|---|
| **1 — Public** | Landing, Katalog Space, Detail Space | dark → light → accent tone-flip, GSAP pinned | Hero pin+scrub, grid katalog stagger reveal |
| **2 — Member transaksional** | Pesan Space, Status, Histori, E-Ticket | satu tone terang konsisten, Motion-driven | Stepper booking, kalkulasi harga odometer |
| **3 — Admin (CRUD & dashboard)** | Semua `/admin/*` | satu tone terang, tanpa tone-flip per section | Accordion-row per baris tabel, chart draw-on reveal |
| **0 — Auth** | Register/Login semua role | tone gelap tunggal, tipe-only | Underline input menyala saat fokus |

## D. Peta layar — Member (7 layar)

| # | Layar | Route | Tier | Endpoint utama | Toy |
|---|---|---|---|---|---|
| 1 | Register Akun | `/register` | 0 | `POST /auth/register/member` | Field-reveal bertahap |
| 2 | Login | `/login` | 0 | `POST /auth/login` | Sama, tanpa reveal bertahap |
| 3 | Ketersediaan Space | `/spaces` | 1 | `GET /spaces`, `/spaces/types` | Filter tab underline bergeser (`layoutId`), grid stagger |
| 4 | Pesan Space | `/reservasi/baru` (query: ?id_space=...) | 2 | `GET /spaces/availability`, `POST /diskon/check`, `POST /reservasi` | Subtotal/diskon/total animasi odometer setiap kali tanggal/jam/promo berubah |
| 5 | Status Pemesanan | `/reservasi` | 2 | `GET /reservasi/my` | Tab filter status + badge warna §B |
| 6 | Histori Pemesanan | `/reservasi/history` | 2 | `GET /reservasi/my/history` | Ringkasan total odometer saat filter bulan berganti |
| 7 | E-Ticket | `/reservasi/[id]/e-ticket` | 2 | `GET /reservasi/{id}/e-ticket` | QR (`qrcode.react`) dari `qr_code_payload`, card crop-mark, tombol unduh magnetic hover |

Bottom nav mobile: `Beranda / Reservasi / Tiket / Akun` — garis atas accent untuk item aktif
(bukan background fill, konsisten "no pills").

## E. Peta layar — Admin (9 layar)

| # | Layar | Route | Tier | Endpoint utama | Toy |
|---|---|---|---|---|---|
| 1 | Register Admin | `/admin/register` | 0 | `POST /auth/register/admin-space` | Field-reveal bertahap |
| 2 | Login Admin | `/admin/login` | 0 | `POST /auth/login` | — |
| 3 | Profil Lokasi | `/admin/profile` | 3 | `GET/PUT /admin/profile` | Tombol simpan morph jadi checkmark saat sukses |
| 4 | Data Member (CRUD) | `/admin/members` | 3 | `GET/POST/PUT/DELETE /admin/members` | Baris tabel expand inline (accordion), bukan modal |
| 5 | Data Space (CRUD) | `/admin/spaces` | 3 | `GET/POST/PUT/DELETE /admin/spaces` | Sama pola + thumbnail foto di baris |
| 6 | Data Diskon (CRUD) | `/admin/diskon` | 3 | `GET/POST/PUT/DELETE /admin/diskon` | Sama pola; badge "aktif sekarang" dihitung client-side dari tanggal |
| 7 | Kelola Reservasi | `/admin/reservasi/[id]` | 3 | `PATCH .../status`, `POST .../check-in`, `.../check-out` | Tombol aksi berubah sesuai status saat ini, badge morph tanpa reload |
| 8 | Semua Reservasi | `/admin/reservasi` | 3 | `GET /admin/reservasi` (`?month&year&status&id_space&tanggal`) | Filter chip hairline kombinasi, index bracket `[0x]` di kolom pertama |
| 9 | Rekapitulasi Pendapatan | `/admin/reports` | 3 | `GET /admin/reports/monthly` | Chart garis + bar-list per tipe space, draw-on reveal saat scroll masuk viewport |

Sidebar desktop / bottom-nav 7-ikon mobile: `Dashboard / Reservasi / Space / Diskon / Member /
Laporan / Akun`. Collapse mobile mengikuti pola overlay full-height tone gelap dari §8.3
portfolio (teks `[ MENU ]`, bukan ikon hamburger).

## F. State data (loading / kosong / error)

Wajib didefinisikan di *setiap* layar §D dan §E:

- **Loading**: latar polos sesuai tone layar + label kecil `[ memuat… ]` bergaya index-bracket,
  tanpa shimmer/skeleton.
- **Kosong**: satu baris kalimat `--ink-600` + satu CTA teks-link ke aksi relevan (mis. "Belum
  ada reservasi. [Cari space →]").
- **Error API**: tampilkan `message` dari format `ApiResponse` apa adanya dalam baris hairline
  `--status-danger` — jangan disamarkan jadi pesan generik.

## G. Implementasi representatif

Pola Lenis/GSAP/Motion dan folder rule (`scroll-scenes/` vs `interactive/`) identik §6.1
portfolio.

### G.1 Kalkulasi harga booking — animasi odometer

```tsx
// components/interactive/animated-price.tsx
'use client'
import { motion, useSpring, useTransform } from 'motion/react'
import { useEffect } from 'react'

export function AnimatedPrice({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 120, damping: 20 })
  const display = useTransform(spring, (v) =>
    Math.round(v).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
  )
  useEffect(() => { spring.set(value) }, [value, spring])
  return <motion.span className="tabular-nums font-display">{display}</motion.span>
}
```

### G.2 Chart pendapatan admin — draw-on reveal

```tsx
// components/interactive/revenue-chart.tsx
'use client'
import { motion } from 'motion/react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts'

export function RevenueChart({ data }: { data: { day: string; total: number }[] }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6 }}
      className="border border-ink-200 bg-paper-050 p-6"
    >
      <span className="tabular-nums text-fs-index text-ink-600">[09] Pendapatan per hari</span>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data}>
          <XAxis dataKey="day" stroke="var(--color-ink-600)" tickLine={false} axisLine={false} />
          <YAxis hide />
          <Line type="monotone" dataKey="total" stroke="var(--color-accent-500)" strokeWidth={2}
                dot={false} isAnimationActive animationDuration={900} />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
```

`recharts` satu-satunya dependency chart baru — dipakai hanya di layar Rekapitulasi Pendapatan
(§E.9), tidak menambah GSAP/D3 untuk satu grafik garis + satu bar-list.

## H. Komponen bersama

| Komponen | Dipakai di | Catatan |
|---|---|---|
| `<StatusBadge status={...} />` | D5, E7, E8 | `belum_dikonfirm`→`--status-warn`, `disetujui`/`aktif`→`--accent-500`, `selesai`→`--ink-600`, `dibatalkan`→`--status-danger` strikethrough |
| `<IndexBracket n={...} />` | Semua tabel admin, kartu katalog | `[0x]` tabular-nums, motif §2 portfolio |
| `<AccordionRow />` | E4–E6 | Reuse §6.1.6 portfolio, konten form beda per entitas |
| `<AnimatedPrice />` | D4, D6 | §G.1 |
| `<MagneticHover />` | Tombol unduh e-ticket (D7), CTA landing | Reuse §8.5 portfolio |

## I. Format tampilan sesuai Kontrak API

- Tanggal ditampilkan format Indonesia (`30 Agustus 2026`) dari ISO 8601 backend — konversi
  hanya di tampilan, request tetap `YYYY-MM-DD`. Jam tetap `HH:mm` 24 jam.
- Nilai uang selalu `Rp 60.000`, tidak pernah dihitung ulang di frontend — semua nilai
  (`total_harga_awal`, `potongan_diskon`, `total_bayar`) diambil apa adanya dari response
  (server tetap sumber kebenaran).
- `foto_url` dipakai langsung sebagai `src` gambar; frontend tidak pernah merekonstruksi URL
  foto sendiri dari `filename`.

## J. Route architecture & navigasi (Next.js App Router)

Sama seperti audit rute di `DESIGN.md` portfolio §8, tabel §D/§E di atas cuma menjawab *ada
layar apa*, belum menjawab *bagaimana rute, guard, dan navigasi menyambungkannya*. Ditutup di
sini:

### J.1 Peta rute file

| Route file | Fungsi |
|---|---|
| `app/(auth)/login/page.tsx`, `.../register/page.tsx` | Auth member — tier 0 |
| `app/(admin-auth)/admin/login/page.tsx`, `.../register/page.tsx` | Auth admin — tier 0 |
| `app/(public)/page.tsx` | Landing — tier 1 |
| `app/(public)/spaces/page.tsx`, `.../spaces/[id]/page.tsx` | Katalog & detail space — tier 1 |
| `app/(member)/layout.tsx` | Guard: redirect ke `/login` kalau `role !== 'member'`, render bottom-nav |
| `app/(member)/spaces/[id]/booking/page.tsx` | Pesan Space — tier 2 |
| `app/(member)/reservasi/page.tsx`, `.../history/page.tsx`, `.../[id]/e-ticket/page.tsx` | Status/histori/e-ticket — tier 2 |
| `app/(admin)/layout.tsx` | Guard: redirect ke `/admin/login` kalau `role !== 'admin_space'`, render sidebar/bottom-nav |
| `app/(admin)/admin/profile/page.tsx`, `.../members/page.tsx`, `.../spaces/page.tsx`, `.../diskon/page.tsx`, `.../reservasi/page.tsx`, `.../reservasi/[id]/page.tsx`, `.../reports/page.tsx` | Sembilan layar admin — tier 3 |
| `lib/api-client.ts` | Auto-inject `x-maker-key` + `Authorization: Bearer`, handle 401 global (clear session + redirect) |
| `lib/auth-context.tsx` | `AuthProvider`/`useAuth()`, persist token+role ke localStorage |

### J.2 Guard layout (pola sama untuk member & admin)

```tsx
// app/(member)/layout.tsx
'use client'
import { useAuth } from '@/lib/auth-context'
import { redirect } from 'next/navigation'
import { BottomNav } from '@/components/bottom-nav'

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) return <div className="min-h-screen bg-paper-100" /> // §F loading state, tanpa shimmer
  if (!user || user.role !== 'member') redirect('/login')

  return (
    <div className="min-h-screen bg-paper-100 pb-16">
      {children}
      <BottomNav role="member" />
    </div>
  )
}
```

### J.3 401 global — bukan redirect diam-diam ke halaman generik

Selaras §3 (auth wajib JSON 401, bukan redirect di backend) — di frontend, interceptor
`api-client.ts` yang menangani sisi klien:

```ts
// lib/api-client.ts (excerpt)
async function request(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'x-maker-key': MAKER_KEY,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })
  if (res.status === 401) {
    clearSession()
    // redirect ke login sesuai role terakhir yang diketahui, bukan selalu ke '/'
    window.location.href = lastRole === 'admin_space' ? '/admin/login' : '/login'
  }
  return res.json() // { status, statusCode, message, data, ... } — format ApiResponse §4
}
```

## K. Implementasi representatif tambahan

### K.1 Stepper booking (§D.4) — transisi antar-step, bukan scroll-jacking

Tier 2 tidak pakai GSAP pin (§A.1) — transisi antar-step pakai Motion `AnimatePresence` dengan
arah slide berdasarkan step index:

```tsx
// components/interactive/booking-stepper.tsx
'use client'
import { motion, AnimatePresence } from 'motion/react'
import { useState } from 'react'

const steps = ['tanggal-jam', 'ringkasan-promo', 'konfirmasi'] as const

export function BookingStepper({ render }: { render: (step: (typeof steps)[number]) => React.ReactNode }) {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)

  function goTo(next: number) {
    setDirection(next > index ? 1 : -1)
    setIndex(next)
  }

  return (
    <div className="relative overflow-hidden">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={steps[index]}
          custom={direction}
          initial={{ x: direction * 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -direction * 40, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          {render(steps[index])}
        </motion.div>
      </AnimatePresence>
      <div className="mt-6 flex gap-2 text-fs-index tabular-nums text-ink-600">
        {steps.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} className={i === index ? 'text-accent-500' : ''}>
            [{String(i + 1).padStart(2, '0')}]
          </button>
        ))}
      </div>
    </div>
  )
}
```

### K.2 AccordionRow untuk CRUD Admin (§E.4–E.6) — reuse §6.1.6 portfolio, form beda per entitas

```tsx
// components/interactive/admin-accordion-row.tsx
'use client'
import { motion, AnimatePresence } from 'motion/react'
import { useState } from 'react'

export function AdminAccordionRow<T>({
  index, title, subtitle, thumbnail, children, onExpand,
}: {
  index: number; title: string; subtitle?: string; thumbnail?: string
  children: React.ReactNode; onExpand?: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <motion.div layout className="border-b border-ink-200" transition={{ layout: { duration: 0.3 } }}>
      <button
        className="flex w-full items-center gap-4 py-3 text-left"
        onClick={() => { setOpen((v) => !v); if (!open) onExpand?.() }}
      >
        <span className="tabular-nums text-fs-index text-ink-600">[{String(index).padStart(2, '0')}]</span>
        {thumbnail && <img src={thumbnail} alt="" className="h-10 w-10 object-cover" />}
        <span className="font-display">{title}</span>
        {subtitle && <span className="ml-auto text-fs-index text-ink-600">{subtitle}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden pb-4"
          >
            {children /* form edit entitas spesifik: Member / Space / Diskon */}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
```

### K.3 StatusBadge — mapping status reservasi ke token §B

```tsx
// components/status-badge.tsx
const STATUS_MAP = {
  belum_dikonfirm: { color: 'var(--color-status-warn)', label: 'Belum Dikonfirmasi' },
  disetujui: { color: 'var(--color-accent-500)', label: 'Disetujui' },
  aktif: { color: 'var(--color-accent-500)', label: 'Aktif' },
  selesai: { color: 'var(--color-ink-600)', label: 'Selesai' },
  dibatalkan: { color: 'var(--color-status-danger)', label: 'Dibatalkan', strike: true },
} as const

export function StatusBadge({ status }: { status: keyof typeof STATUS_MAP }) {
  const s = STATUS_MAP[status]
  return (
    <span
      className={`text-fs-index uppercase tabular-nums ${s.strike ? 'line-through' : ''}`}
      style={{ color: s.color }}
    >
      [{s.label}]
    </span>
  )
}
```

## L. Hard rules (checklist, diverifikasi sebelum "selesai")

- [ ] Semua field response backend (nama, tipe, nesting) persis sama dengan soal PDF Bagian III
      — dicek satu-satu pakai Postman, bukan cuma baca kode.
- [ ] `x-maker-key` tanpa header → 400/401 di semua endpoint kecuali publik murni (`/`,
      `/health`, `/api/maker/*`).
- [ ] Token dari maker lain ditolak walau valid secara Sanctum (dicocokkan `maker_id`).
- [ ] Overlap detection reservasi diuji dengan skenario boundary (persis mepet jam mulai/selesai
      existing), bukan cuma kasus overlap penuh.
- [ ] `kode_promo`/`id_diskon` invalid → 400, bukan diam-diam diabaikan.
- [ ] Status reservasi tidak bisa lompat (mis. `belum_dikonfirm` langsung `selesai`) — divalidasi
      di server, bukan cuma UI yang menyembunyikan tombol.
- [ ] `prefers-reduced-motion`: GSAP pin tier 1 (§C) degradasi ke state statis; Motion layout
      animation di tier 2/3 turun ke instant/opacity-only.
- [ ] Full keyboard access: filter tab, accordion row admin, tombol aksi reservasi semua
      reachable via Tab dengan focus ring accent hairline.
- [ ] Setiap layar §D/§E punya tiga state eksplisit sesuai §F (loading/kosong/error) — tidak ada
      layar yang cuma menampilkan spinner generik atau blank saat data belum ada.
- [ ] Nilai uang & tanggal tidak pernah dihitung ulang di frontend (§I) — dicek dengan
      membandingkan angka tampilan vs response mentah.
- [ ] Safari/WebKit: hanya `transform`/`opacity` yang dianimasikan pada elemen besar.
- [ ] No slop: tanpa skeleton shimmer, tanpa ikon generik di luar motif index-bracket, tanpa
      badge status dengan warna yang tidak konsisten §B.
- [ ] Dokumentasi API (Postman collection/Swagger) sinkron dengan endpoint final sebelum
      dikumpulkan sebagai deliverable UKK.

## M. Workflow & pembagian kerja

| Tahap | Owns |
|---|---|
| **Skema & Migrasi** | §1 — migrasi Laravel, model, relasi `maker_id` di semua tabel utama |
| **Auth & Multi-Tenancy** | §3 — middleware `ResolveMakerKey`, `CheckRole`, Sanctum guard, handler 401/422 global |
| **Modul Bisnis** | §2, §5 — Space/Diskon/Reservasi/Admin controllers sesuai kontrak persis |
| **Frontend Tier 0–1** | §D.1–D.3, §J — auth pages, landing, katalog space |
| **Frontend Tier 2** | §D.4–D.7, §K.1 — booking stepper, status, histori, e-ticket |
| **Frontend Tier 3** | §E, §K.2–K.3 — CRUD admin, laporan, chart |
| **QA & Dokumentasi** | §L checklist, Postman collection, `CARA_MENJALANKAN.md` |

### M.1 Proses

1. Kunci `DESIGN.md` ini sebagai acuan tunggal (menggantikan asumsi kontrak versi awal).
2. Migrasi + model + middleware multi-tenancy dulu, sebelum modul bisnis apa pun.
3. Implementasi endpoint per modul (§5.2–§5.13), uji tiap endpoint via Postman/curl sebelum
   dianggap selesai — raw response dicek satu-satu, bukan laporan ringkasan.
4. Frontend tier 0→1→2→3 berurutan, karena tier 2/3 butuh auth (tier 0) dan katalog (tier 1)
   sudah berjalan.
5. Jalankan checklist §L penuh sebelum submit.
6. Setiap deviasi dari dokumen ini dicatat di §Z sebelum dikerjakan, bukan diam-diam menyimpang.

## N. Pertanyaan terbuka / asumsi yang perlu dikonfirmasi

| # | Item | Asumsi saat ini | Perlu konfirmasi? |
|---|---|---|---|
| 1 | Sanctum vs JWT literal | Sanctum personal access token dipakai, dianggap setara "JWT" yang disebut soal selama header & field response persis sama | Tidak — sudah dikonfirmasi sebelumnya |
| 2 | `recharts` sebagai dependency baru | Dipakai hanya di §E.9 (Rekapitulasi Pendapatan) | Tidak — sudah dikonfirmasi |
| 3 | Token warna §B (teal/hijau) | Palet baru khusus brand produk, bukan reuse aksen personal portfolio | Tidak — sudah dikonfirmasi |
| 4 | Struktur `detail_reservasi` digabung ke `reservasi` | Sesuai deviasi yang diizinkan soal (Bagian II) | Tidak — eksplisit diizinkan di soal |
| 5 | GSAP pin di tier 1 pada mobile sempit | Fallback ke list statis tanpa pin, sama seperti aturan portfolio §5.5 | Ya — kalau ingin pin tetap dipaksakan di mobile, perlu keputusan eksplisit |

## Z. Log keputusan

| # | Keputusan | Status |
|---|---|---|
| 1 | Backend menyesuaikan Kontrak API resmi Paket B (bukan skema bebas versi awal) | Dikonfirmasi |
| 2 | Sistem UI/UX playground direinterpretasi penuh ke seluruh app (member+admin+public) | Dikonfirmasi |
| 3 | Token warna §B palet baru untuk brand produk, bukan reuse aksen personal portfolio | Dikonfirmasi |
| 4 | `recharts` ditambahkan sebagai dependency baru khusus §E.9 | Dikonfirmasi |
| 6 | Route booking diselaraskan dari `/spaces/[id]/booking` ke `/reservasi/baru` (query param `id_space`) agar konsisten dengan struktur folder `app/(member)/reservasi/baru` | Dikonfirmasi |