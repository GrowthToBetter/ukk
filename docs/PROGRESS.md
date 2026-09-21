## Backend — App Maker & Auth
- [x] Migration tabel `makers` (id, name, username, email, password, app_key, timestamps)
- [x] Model Maker (HasApiTokens, auto-generate app_key, password hashing via casts)
- [x] POST /maker/register — register maker baru, return app_key + access_token
- [x] POST /maker/login — login maker, return access_token
- [x] GET /maker/me — profile maker (auth:sanctum)
- [x] GET /maker/stats — statistik maker (x-maker-key header)
- [x] GET /maker/list — daftar semua maker untuk panel guru
- [x] Middleware ResolveMakerKey (accept x-maker-key atau x-app-key, inject maker_id)
- [x] Migration tabel `users` (maker_id FK, username unique per maker, role enum)
- [x] Migration tabel `members` (user_id FK, maker_id FK, nama_member, instansi, alamat, telp, foto)
- [x] Migration tabel `space_owners` (user_id FK, maker_id FK, nama_coworking, nama_pemilik, telp)
- [x] Model User (relasi maker, member, spaceOwner, scope forMaker)
- [x] Model Member (relasi maker, scope forMaker, accessor foto_url)
- [x] Model SpaceOwner (relasi maker, scope forMaker)
- [x] POST /auth/register/member — username unique per maker (x-maker-key)
- [x] POST /auth/register/admin-space — username unique per maker (x-maker-key)
- [x] POST /auth/login — login scoped per maker (x-maker-key)
- [x] GET /auth/profile — profile user dengan relasi member/space_owner (auth:sanctum + x-maker-key)
- [x] Multi-tenancy validation — isolasi data per maker_id, username unique per maker

## Backend — Space & Diskon (scoped per maker)
- [x] Migration tabel `spaces` (maker_id FK, id_owner FK, nama_space, harga_per_jam, tipe enum, kapasitas, deskripsi, foto, timestamps)
- [x] Migration tabel `diskon` (maker_id FK, nama_diskon unique per maker, persentase_diskon, tanggal_awal, tanggal_akhir, timestamps)
- [x] Model Space (relasi maker, relasi owner, accessor foto_url, scope forMaker, scope byTipe, scope search)
- [x] Model Diskon (relasi maker, accessor is_active, scope forMaker, scope active, custom table name)
- [x] GET /spaces/types — daftar tipe statis (desk, meeting_room, private_office) [x-maker-key]
- [x] GET /spaces/availability — check ketersediaan [x-maker-key]
- [x] GET /spaces — list space scoped per maker + filter ?tipe & ?search [x-maker-key]
- [x] GET /spaces/{id} — detail space scoped per maker + relasi owner [x-maker-key]
- [x] GET /diskon/active — list diskon aktif scoped per maker [x-maker-key]
- [x] POST /diskon/check — validasi nama_diskon scoped per maker, return detail + is_active [x-maker-key]
- [x] GET /diskon/{id} — detail diskon scoped per maker [x-maker-key]
- [x] DatabaseSeeder — 1 Maker (app_key tetap: mk_dev_default_key_ukk2026) + admin_space + member + 5 space + 3 diskon

## Backend — Reservasi (Member)
- [x] Migration tabel `reservasi` (maker_id FK, kode_booking unique, id_member FK, id_space FK, id_diskon FK, tanggal_reservasi, jam_mulai, jam_selesai, durasi_jam, harga_per_jam, total_harga_awal, potongan_diskon, total_bayar, status enum, check_in_time, check_out_time, timestamps)
- [x] Model Reservasi (relasi member, space, diskon, scope forMaker, scope forMember, scope byStatus, method canBeCancelled)
- [x] Service `ReservasiService.php` (cekKetersediaan FIX DATE comparison & overlap logic, hitungHarga dengan diskon, generateKodeBooking, hitungJamSelesai)
- [x] Form Request `CreateReservasiRequest` (validasi id_space, tanggal_reservasi, jam_mulai format HH:mm, durasi_jam, id_diskon, kode_promo)
- [x] POST /reservasi — create data (auth:sanctum member, ResolveMakerKey)
- [x] GET /reservasi/my — list owned by member (auth:sanctum member, ResolveMakerKey)
- [x] GET /reservasi/my/history — list dengan filter month/year (auth:sanctum member, ResolveMakerKey)
- [x] GET /reservasi/{id}/e-ticket — detail eticket dengan qr code (auth:sanctum member/admin_space, ResolveMakerKey)
- [x] GET /reservasi/{id} — detail data (auth:sanctum member/admin_space, ResolveMakerKey)
- [x] PATCH /reservasi/{id}/cancel — cancle status (auth:sanctum member, ResolveMakerKey)
- [x] Fix overlap check logic dengan `whereDate` dan proper bounds comparison
- [x] Fix unauthenticated API — global handler di bootstrap/app.php, token invalid → JSON 401 (bukan RouteNotFoundException)
- [x] Fix 422 ValidationException — global handler di bootstrap/app.php, format ApiResponse standar (status, statusCode, message, errors, timestamp)

## Backend — Admin (Panel Pengelola Space)
- [x] GET /admin/profile — tampil profil space_owner (nama_coworking, nama_pemilik, telp)
- [x] PUT /admin/profile — update profil, semua field required (UpdateProfileRequest)
- [x] GET /admin/members — list + ?search filter (scoped maker_id)
- [x] POST /admin/members — buat user+member baru, username unique per maker (StoreMemberRequest)
- [x] GET /admin/members/{id} — detail member (scoped maker_id)
- [x] PUT /admin/members/{id} — update member partial (UpdateMemberRequest, termasuk foto)
- [x] DELETE /admin/members/{id} — hapus member + user (DB transaction)
- [x] GET /admin/spaces — list space (scoped maker_id)
- [x] POST /admin/spaces — tambah space, id_owner diambil dari user login (StoreSpaceRequest)
- [x] GET /admin/spaces/{id} — detail space (scoped maker_id)
- [x] PUT /admin/spaces/{id} — update space partial (UpdateSpaceRequest)
- [x] DELETE /admin/spaces/{id} — hapus space
- [x] GET /admin/diskon — list diskon (scoped maker_id)
- [x] POST /admin/diskon — tambah diskon, nama_diskon unique per maker (StoreDiskonRequest)
- [x] GET /admin/diskon/{id} — detail diskon (scoped maker_id)
- [x] PUT /admin/diskon/{id} — update diskon partial, unique check exclude current id (UpdateDiskonRequest)
- [x] DELETE /admin/diskon/{id} — hapus diskon
- [x] GET /admin/reservasi — list + filter ?month ?year ?status ?id_space ?tanggal (with member & space)
- [x] PATCH /admin/reservasi/{id}/status — update status (UpdateReservasiStatusRequest, Form Request)
- [x] POST /admin/reservasi/{id}/check-in — status disetujui → aktif, set check_in_time
- [x] POST /admin/reservasi/{id}/check-out — status aktif → selesai, set check_out_time
- [x] GET /admin/reports/monthly — reservasi selesai groupBy tanggal, filter month/year
- [x] GET /admin/reports/income — sum total_bayar reservasi selesai, filter month/year
- [x] Semua admin endpoint: middleware CheckRole:admin_space, scoped maker_id
- [x] Sync docs/DESIGN.md & docs/API_CONTRACT.md — maker_id disebutkan eksplisit semua tabel & endpoint

## Backend — Upload File
- [x] POST /upload/image — upload gambar umum ke storage/app/public/images (x-maker-key)
- [x] POST /upload/spaces — upload foto ruangan ke storage/app/public/spaces (x-maker-key)
- [x] POST /upload/members — upload foto profil member ke storage/app/public/members (x-maker-key)
- [x] UploadRequest validasi mimes:jpg,jpeg,png,webp + max:2048KB, pesan error Bahasa Indonesia
- [x] Response: filename (basename saja), url publik, path, size, mime_type — format ApiResponse 201
- [x] Tanpa x-maker-key → 400 (ResolveMakerKey middleware)
- [x] File tidak valid (txt/pdf) → 422 format ApiResponse standar (ValidationException handler)
- [x] storage:link sudah aktif (public/storage → storage/app/public)
- [x] File tersimpan terpisah per sub-direktori (images/, spaces/, members/)

## Deliverables
- [x] Postman Collection — docs/SmartSpaceBooking.postman_collection.json
- [x] docs/CARA_MENJALANKAN.md — panduan install dari nol, kredensial testing default

---

## Pest Feature Tests (Regresi Otomatis)

> Dijalankan: `php artisan test --compact` — **85/85 passed, 232 assertions** ✅

### Factories Dibuat
- `database/factories/MakerFactory.php`
- `database/factories/UserFactory.php` (overwrite default — sesuai schema: maker_id, username, role)
- `database/factories/MemberFactory.php`
- `database/factories/SpaceOwnerFactory.php`
- `database/factories/SpaceFactory.php`
- `database/factories/DiskonFactory.php` (state: active, expired, upcoming)
- `database/factories/ReservasiFactory.php` (state: disetujui, aktif, selesai, dibatalkan)

### Test Files & Coverage

| File | Tests | Skenario |
|---|---|---|
| `MakerTest.php` | 9 | register sukses, register duplikat username/email, login via username/email, login gagal, list, me (auth), me tanpa token |
| `AuthTest.php` | 11 | register member, register admin-space, duplikat username in same maker, username sama beda maker (allowed), login member, login admin-space, login wrong pass, login cross-maker (gagal), profile 401 invalid token, profile 401 tanpa token, tanpa x-maker-key → 400 |
| `SpaceTest.php` | 10 | list scoped per maker, filter tipe, search nama, detail, detail 404 beda maker, types 3 statis, availability true (kosong), availability false (occupied), availability past date → 422, availability tanpa x-maker-key → 400 |
| `DiskonTest.php` | 9 | list active only, list scoped maker, check promo valid, check promo expired, check promo upcoming, check promo tidak ditemukan, check cross-maker tidak ditemukan, show detail, show 404 beda maker |
| `ReservasiTest.php` | 28 | store sukses, kode_booking format BOOK-..., admin_space ditolak store, harga tanpa diskon, harga diskon 20%, promo expired ditolak, **overlap A** (identik), **overlap B** (end inside), **overlap C** (start inside), **overlap D** (covers all), **boundary E** (start exactly at end → allowed), **boundary F** (end exactly at start → allowed), dibatalkan tidak block, beda tanggal not conflict, status awal belum_dikonfirm, cancel dari belum_dikonfirm, cancel dari disetujui, cancel dari aktif → 400, cancel dari selesai → 400, cancel dari dibatalkan → 400, my reservations scoped, e-ticket akses member pemilik |
| `AdminTest.php` | 18 | member ditolak 5 admin endpoints, admin ditolak 2 member-only endpoints, admin akses profile, check-in dari disetujui (sukses), check-in dari belum_dikonfirm/aktif/selesai/dibatalkan (tolak), check-out dari aktif (sukses), check-out dari disetujui/belum_dikonfirm (tolak), list reservasi scoped maker, update status ke disetujui, tanpa token → 401 |
| `ExampleTest.php` | 1 | GET /api root returns 200 |

### Modul yang Belum Ada Test
- **Upload** (`/upload/image`, `/upload/spaces`, `/upload/members`) — membutuhkan multipart file fixture, di-skip untuk sekarang karena tidak blocking regression core
- **Admin CRUD** Members/Spaces/Diskon lengkap (store, update, delete) — role guard sudah covered, CRUD detail belum
- **Report** (`/admin/reports/monthly`, `/admin/reports/income`)
- **Reservasi my/history** dengan filter month/year
- **E-ticket** akses admin_space pemilik space
