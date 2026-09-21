# Smart Space Booking — Cara Menjalankan

## Prasyarat

| Software | Versi Minimum | Keterangan |
|---|---|---|
| PHP | 8.2+ | Dengan ekstensi: pdo, pdo_sqlite (atau pdo_mysql), mbstring, openssl, fileinfo |
| Composer | 2.x | Dependency manager PHP |
| Node.js | 18+ | Untuk asset frontend (opsional, hanya jika pakai Vite) |
| SQLite / MySQL | — | SQLite sudah built-in di PHP; MySQL perlu diinstal terpisah |

---

## Install dari Nol

### 1. Clone & masuk ke direktori backend

```bash
git clone <repo_url>
cd ukk/backend
```

### 2. Install dependency PHP

```bash
composer install
```

### 3. Salin file environment

```bash
cp .env.example .env
```

### 4. Generate application key

```bash
php artisan key:generate
```

### 5. Konfigurasi database di `.env`

**Opsi A — SQLite (paling mudah, default proyek ini):**
```env
DB_CONNECTION=sqlite
# DB_DATABASE akan otomatis pakai database/database.sqlite
```

Buat file SQLite:
```bash
touch database/database.sqlite   # Linux/Mac
# Windows: buat file kosong database/database.sqlite via File Explorer atau:
New-Item database/database.sqlite -ItemType File
```

**Opsi B — MySQL:**
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=smartspace_ukk
DB_USERNAME=root
DB_PASSWORD=
```

### 6. Jalankan migrasi + seeder

> ⚠️ `--seed` akan mengisi data awal (1 Maker, 1 admin_space, 1 member, 2 space, 3 diskon, beberapa reservasi demo)

```bash
php artisan migrate:fresh --seed
```

### 7. Buat symlink storage publik

```bash
php artisan storage:link
```

### 8. Jalankan server development

```bash
php artisan serve
# Server berjalan di http://localhost:8000
```

---

## Base URL

```
http://localhost:8000/api
```

---

## Kredensial Testing Default (dari Seeder)

### App Maker (untuk panel guru / multi-tenancy)
| Field | Nilai |
|---|---|
| x-maker-key | `mk_dev_default_key_ukk2026` |
| Email login maker | `admin@smartspace.dev` |
| Password maker | `password` |

### Admin Space
| Field | Nilai |
|---|---|
| username | `admin_cowork` |
| password | `password` |
| role | `admin_space` |

### Member
| Field | Nilai |
|---|---|
| username | `member_test` |
| password | `password` |
| role | `member` |

---

## Header Standar

Semua request ke endpoint yang bukan publik murni wajib menyertakan:

```
x-maker-key: mk_dev_default_key_ukk2026
Accept: application/json
```

Endpoint yang membutuhkan autentikasi user tambahkan:
```
Authorization: Bearer <access_token>
```

`access_token` didapat dari response `POST /api/auth/login`.

---

## Cara Login & Dapat Token

```bash
# Login sebagai admin
curl -X POST http://localhost:8000/api/auth/login \
  -H "x-maker-key: mk_dev_default_key_ukk2026" \
  -F "username=admin_cowork" \
  -F "password=password"

# Login sebagai member
curl -X POST http://localhost:8000/api/auth/login \
  -H "x-maker-key: mk_dev_default_key_ukk2026" \
  -F "username=member_test" \
  -F "password=password"
```

Response akan mengandung `data.access_token` — gunakan sebagai `Bearer` token.

---

## Import Postman Collection

File koleksi ada di: `docs/SmartSpaceBooking.postman_collection.json`

1. Buka Postman → **Import** → pilih file tersebut
2. Collection memiliki **variable** bawaan:
   - `base_url` = `http://localhost:8000/api`
   - `maker_key` = `mk_dev_default_key_ukk2026`
   - `access_token`, `admin_token`, `member_token` diisi otomatis saat login lewat request di folder **Auth**
3. Jalankan **"POST /auth/login (Admin)"** atau **"POST /auth/login (Member)"** untuk mengisi token secara otomatis

---

## Struktur Direktori Penting

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/       ← semua controller endpoint
│   │   ├── Middleware/            ← ResolveMakerKey, CheckRole
│   │   └── Requests/             ← Form Request validasi
│   ├── Models/                    ← Maker, User, Member, SpaceOwner, Space, Diskon, Reservasi
│   ├── Services/ReservasiService.php
│   └── Traits/ApiResponse.php    ← helper response standar
├── bootstrap/app.php              ← exception handler global (401, 422)
├── database/
│   ├── migrations/                ← semua migration tabel
│   └── seeders/DatabaseSeeder.php ← data awal testing
├── routes/api.php                 ← semua route API
└── storage/app/public/
    ├── images/                    ← hasil upload /upload/image
    ├── spaces/                    ← hasil upload /upload/spaces
    └── members/                   ← hasil upload /upload/members
```

---

## Reset Database (jika diperlukan)

```bash
# HATI-HATI: ini menghapus semua data!
php artisan migrate:fresh --seed
```

---

## Troubleshooting

| Masalah | Solusi |
|---|---|
| `Route [login] not defined` | Pastikan `bootstrap/app.php` punya `redirectGuestsTo(fn() => null)` dan handler `AuthenticationException` |
| `storage/public` 404 saat akses file | Jalankan `php artisan storage:link` |
| Token tidak diterima | Pastikan header `x-maker-key` juga disertakan bersamaan dengan `Authorization: Bearer` |
| 422 pada upload | Pastikan field bernama `file`, tipe jpg/jpeg/png/webp, ukuran ≤ 2MB |
| CORS error dari frontend | Periksa `config/cors.php`, set `allowed_origins` sesuai URL frontend |
