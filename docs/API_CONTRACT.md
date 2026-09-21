# API Contract — Smart Space Booking (Ringkasan Kerja)

> Dokumen ini ringkasan operasional dari soal UKK Bagian III. Detail contoh JSON lengkap ada
> di soal asli (`Rev_Soal_UKK_2026-2027_Paket_B.pdf`). File ini untuk checklist implementasi
> cepat backend & referensi cepat frontend.

Base URL (dev lokal): `http://localhost:8000/api` (sesuaikan dengan Laravel `APP_URL`)

Header wajib semua request (kecuali disebutkan publik murni): `x-maker-key: <app_key>`
Header tambahan untuk endpoint ber-auth: `Authorization: Bearer <access_token>`

## 1. Root & Health
| Method | Path | Auth |
|---|---|---|
| GET | `/` | Publik |
| GET | `/health` | Publik |

## 2. App Maker (Multi-Tenancy)
| Method | Path | Auth | Ket |
|---|---|---|---|
| POST | `/maker/register` | Publik | body: name, username, email, password → return app_key |
| POST | `/maker/login` | Publik | body: usernameOrEmail, password |
| GET | `/maker/me` | Bearer (maker) | |
| GET | `/maker/stats` | x-maker-key | total_members, total_spaces, total_diskon, total_reservasi, total_pendapatan |
| GET | `/maker/list` | Publik | daftar semua maker (panel guru) |

## 3. Auth User (Member & Admin Space)
| Method | Path | Auth | Body |
|---|---|---|---|
| POST | `/auth/register/member` | x-maker-key | username, password, nama_member, instansi, alamat, telp, foto? |
| POST | `/auth/register/admin-space` | x-maker-key | username, password, nama_coworking, nama_pemilik, telp |
| POST | `/auth/login` | x-maker-key | username, password → access_token |
| GET | `/auth/profile` | Bearer + x-maker-key | |

## 4. Space (Katalog & Ketersediaan)
| Method | Path | Auth | Query |
|---|---|---|---|
| GET | `/spaces/types` | x-maker-key | |
| GET | `/spaces/availability` | x-maker-key | id_space, tanggal, jam_mulai, durasi_jam |
| GET | `/spaces` | x-maker-key | ?tipe, ?search |
| GET | `/spaces/{id}` | x-maker-key | |

## 5. Diskon
| Method | Path | Auth | Body/Query |
|---|---|---|---|
| GET | `/diskon/active` | x-maker-key | |
| POST | `/diskon/check` | x-maker-key | nama_diskon |
| GET | `/diskon/{id}` | x-maker-key | |

## 6. Reservasi (Member)
| Method | Path | Auth | Body/Query |
|---|---|---|---|
| POST | `/reservasi` | Bearer (member) + x-maker-key | id_space, tanggal_reservasi, jam_mulai, durasi_jam, id_diskon?, kode_promo? |
| GET | `/reservasi/my` | Bearer (member) + x-maker-key | |
| GET | `/reservasi/my/history` | Bearer (member) + x-maker-key | ?month, ?year |
| GET | `/reservasi/{id}/e-ticket` | Bearer (member/admin) + x-maker-key | |
| GET | `/reservasi/{id}` | Bearer (member/admin) + x-maker-key | |
| PATCH | `/reservasi/{id}/cancel` | Bearer (member) + x-maker-key | |

## 7. Profil Lokasi (Admin)
| Method | Path | Auth | Body |
|---|---|---|---|
| GET | `/admin/profile` | Bearer (admin_space) + x-maker-key | |
| PUT | `/admin/profile` | Bearer (admin_space) + x-maker-key | nama_coworking*, nama_pemilik*, telp* |

## 8. Member Management (Admin)
| Method | Path | Auth | Body |
|---|---|---|---|
| GET | `/admin/members` | Bearer (admin_space) + x-maker-key | ?search |
| POST | `/admin/members` | Bearer (admin_space) + x-maker-key | username*, password*, nama_member*, instansi*, alamat*, telp*, foto? |
| GET | `/admin/members/{id}` | Bearer (admin_space) + x-maker-key | |
| PUT | `/admin/members/{id}` | Bearer (admin_space) + x-maker-key | field opsional (nama_member, instansi, alamat, telp, foto) |
| DELETE | `/admin/members/{id}` | Bearer (admin_space) + x-maker-key | |

## 9. Space Management (Admin)
| Method | Path | Auth | Body |
|---|---|---|---|
| GET | `/admin/spaces` | Bearer (admin_space) + x-maker-key | |
| POST | `/admin/spaces` | Bearer (admin_space) + x-maker-key | nama_space*, harga_per_jam*, tipe*, kapasitas*, deskripsi*, foto? |
| GET | `/admin/spaces/{id}` | Bearer (admin_space) + x-maker-key | |
| PUT | `/admin/spaces/{id}` | Bearer (admin_space) + x-maker-key | field opsional (nama_space, harga_per_jam, tipe, kapasitas, deskripsi, foto) |
| DELETE | `/admin/spaces/{id}` | Bearer (admin_space) + x-maker-key | |

## 10. Diskon Management (Admin)
| Method | Path | Auth | Body |
|---|---|---|---|
| GET | `/admin/diskon` | Bearer (admin_space) + x-maker-key | |
| POST | `/admin/diskon` | Bearer (admin_space) + x-maker-key | nama_diskon*, persentase_diskon*, tanggal_awal*, tanggal_akhir* |
| GET | `/admin/diskon/{id}` | Bearer (admin_space) + x-maker-key | |
| PUT | `/admin/diskon/{id}` | Bearer (admin_space) + x-maker-key | field opsional (nama_diskon, persentase_diskon, tanggal_awal, tanggal_akhir) |
| DELETE | `/admin/diskon/{id}` | Bearer (admin_space) + x-maker-key | |

## 11. Reservasi & Check-in/out (Admin)
| Method | Path | Auth | Body/Query |
|---|---|---|---|
| GET | `/admin/reservasi` | Bearer (admin_space) + x-maker-key | ?month, ?year, ?status, ?id_space, ?tanggal |
| PATCH | `/admin/reservasi/{id}/status` | Bearer (admin_space) + x-maker-key | status* |
| POST | `/admin/reservasi/{id}/check-in` | Bearer (admin_space) + x-maker-key | — |
| POST | `/admin/reservasi/{id}/check-out` | Bearer (admin_space) + x-maker-key | — |

## 12. Laporan (Admin)
| Method | Path | Auth | Query | Response |
|---|---|---|---|---|
| GET | `/admin/reports/monthly` | Bearer (admin_space) + x-maker-key | ?month, ?year | { total_pendapatan, breakdown: {desk, meeting_room, private_office}, daily_data: [{day, total}] } |
| GET | `/admin/reports/income` | Bearer (admin_space) + x-maker-key | ?month, ?year | { total_pendapatan, breakdown: {desk, meeting_room, private_office}, daily_data: [] } |

## 13. Upload
| Method | Path | Auth |
|---|---|---|
| POST | `/upload/image` | x-maker-key (multipart: file) |
| POST | `/upload/spaces` | x-maker-key (multipart: file) |
| POST | `/upload/members` | x-maker-key (multipart: file) |

---

## DTO Ringkas (validasi wajib di Form Request Laravel)

**RegisterMemberDto**: username*, password* (min 6), nama_member*, instansi*, alamat*, telp*, foto?
**RegisterAdminSpaceDto**: username*, password* (min 6), nama_coworking*, nama_pemilik*, telp*
**LoginDto**: username*, password*
**CreateReservasiDto**: id_space* (exists, scoped maker_id), tanggal_reservasi* (date, >= today), jam_mulai* (HH:mm),
  durasi_jam* (int, min 1), id_diskon? (exists, scoped maker_id), kode_promo? (string)
**CreateSpaceDto**: nama_space*, harga_per_jam* (numeric, min 0), tipe* (in: desk,meeting_room,private_office),
  kapasitas* (int, min 1), deskripsi*, foto?
**CreateDiskonDto**: nama_diskon* (unique per maker_id), persentase_diskon* (1–100), tanggal_awal* (date),
  tanggal_akhir* (date, after:tanggal_awal)
**UpdateReservasiStatusDto**: status* (in: belum_dikonfirm,disetujui,aktif,selesai,dibatalkan)
**UpdateProfileDto**: nama_coworking*, nama_pemilik*, telp* (semua required — PUT semantik penuh)

Field bertanda `*` wajib, `?` opsional — samakan persis dengan tabel DTO di soal PDF halaman 7–11
kalau butuh detail contoh nilai.

---

## Multi-Tenancy: maker_id Scoping

Semua data utama di-scope per `maker_id`. Setiap model utama WAJIB memiliki kolom `maker_id`:

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
