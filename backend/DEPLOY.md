# Deployment Guide: Smart Space Booking

Ini adalah panduan untuk men-deploy aplikasi ini ke Render.com.

## Prasyarat
1. Akun Render.
2. Akun Cloudinary (untuk storage).
3. Akun database (Disarankan PostgreSQL di Render).

## Langkah-langkah Deploy

1. **Buat Web Service baru** di Render dan hubungkan dengan repository GitHub Anda.
2. Pilih `Docker` sebagai *Environment*.
3. **Environment Variables:** Tambahkan variabel di atas (baca `.env.production.example` untuk referensi):
   - `APP_URL`, `DB_HOST`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`.
   - `CLOUDINARY_URL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
   - Pastikan `APP_ENV` adalah `production` dan `APP_DEBUG` adalah `false`.
4. **Pre-Deploy Command (Wajib):** 
   - Di pengaturan Render, navigasikan ke *Pre-Deploy Command*.
   - Isi dengan: `php artisan migrate --force`
   - Ini memastikan migrasi berjalan sebelum aplikasi start dan menghindari *race condition*.
5. **Start Command:**
   - Isi dengan: `php artisan serve --host=0.0.0.0 --port=8080`
6. **Persistence (Penyimpanan):** 
   - Aplikasi menggunakan Cloudinary untuk media, sehingga tidak perlu membuat *render disk*.
   - Pastikan variabel `FILESYSTEM_DISK=cloudinary` di-set.

## Pengaturan Cloudinary di Render
1. Buka Dashboard Cloudinary Anda.
2. Dapatkan API Key, API Secret, dan Cloud Name dari *Account Details*.
3. Masukkan ke variabel environment di Render Dashboard. Format `CLOUDINARY_URL` adalah `cloudinary://<API_KEY>:<API_SECRET>@<CLOUD_NAME>`.
