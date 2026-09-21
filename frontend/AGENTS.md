# AGENTS.md — Frontend (Smart Space Booking)

Baca dulu: `../docs/DESIGN.md` dan `../docs/API_CONTRACT.md` — semua bentuk data dan endpoint
mengacu ke situ, jangan mengarang field/path sendiri.

## Konteks
Next.js App Router (T3 stack awal), **tRPC sudah dihapus**, konsumsi REST API dari
`../backend` (Laravel) via fetch biasa. **Auth bukan betterAuth session** — token & role
sepenuhnya berasal dari Laravel (Sanctum).

## Yang Harus Dibersihkan (kalau belum)
- [ ] Hapus `prisma/schema.prisma`, folder `generated/prisma/`, `src/server/db.ts`
      — database ada di backend Laravel, tidak ada Prisma di FE sama sekali.
- [ ] Hapus dependency `prisma`/`@prisma/client` dari `package.json`, hapus script terkait.
- [ ] Ganti `src/server/better-auth/**`: tidak dipakai untuk auth utama. Boleh dihapus total
      dan diganti auth context custom (lihat di bawah), atau dibiarkan tidak dipanggil kalau
      mau lebih hati-hati — tapi jangan dikembangkan lebih lanjut.
- [ ] Cek `src/app/api/auth/[...all]/route.ts` — ini route betterAuth, kalau betterAuth
      dihapus maka route ini ikut dihapus.
- [ ] Cek `src/app/layout.tsx` & `page.tsx` — pastikan tidak ada sisa import provider tRPC/betterAuth.

## Yang Harus Ditambah


`.env` tambahkan:

## Struktur Halaman
src/app/
├── (auth)/login/page.tsx
├── (auth)/register/member/page.tsx
├── (auth)/register/admin/page.tsx
├── (member)/layout.tsx ← guard role=member via useAuth()
├── (member)/spaces/page.tsx
├── (member)/spaces/[id]/page.tsx
├── (member)/reservasi/baru/page.tsx
├── (member)/reservasi/page.tsx
├── (member)/reservasi/[id]/page.tsx
├── (member)/reservasi/[id]/e-ticket/page.tsx
├── (member)/histori/page.tsx
├── (admin)/layout.tsx ← guard role=admin_space
├── (admin)/dashboard/page.tsx
├── (admin)/profil/page.tsx
├── (admin)/members/page.tsx
├── (admin)/spaces/page.tsx
├── (admin)/diskon/page.tsx
├── (admin)/reservasi/page.tsx
├── (admin)/reservasi/[id]/page.tsx
└── (admin)/laporan/page.tsx
## Aturan
1. Semua request lewat `api-client.ts`, jangan `fetch` langsung tersebar di komponen.
2. Tipe respons & DTO wajib dari `types/api.ts`, tidak ada `any`.
3. Setiap form: validasi client-side ringan (boleh Zod) + tampilkan `message` error dari backend apa adanya.
4. QR e-ticket: generate di FE dari `qr_code_payload` (string) yang dikirim backend, pakai
   library seperti `qrcode.react` — backend tidak generate image.
5. Foto (space/member): upload dulu ke `/api/upload/*`, dapat `filename`, baru submit ke
   endpoint utama pakai `filename` itu (bukan file mentah).

## Definition of Done per halaman
- [ ] Konsumsi endpoint lewat `api-client.ts`
- [ ] Loading & error state ada
- [ ] Role-guard benar (redirect ke `/login` kalau salah role/belum login)
- [ ] Tipe data dari `types/api.ts`