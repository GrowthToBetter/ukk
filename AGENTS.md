# AGENTS.md — Smart Space Booking (UKK RPL Paket B)

Workspace ini berisi 2 project terpisah, masing-masing punya AGENTS.md sendiri
dengan aturan spesifik stack-nya:

- `backend/AGENTS.md` — Laravel REST API (sudah pakai Laravel Boost skills, JANGAN dihapus/ditimpa)
- `frontend/AGENTS.md` — Next.js (T3 stack tanpa tRPC/Prisma), consumer API

Dokumen bersama (acuan KEDUA project, sumber kebenaran kontrak):
- `docs/PRD.md` — ringkasan produk, keputusan arsitektur, status modul & next steps (baca ini duluan untuk konteks cepat)
- `docs/DESIGN.md` — ERD, skema, aturan bisnis
- `docs/API_CONTRACT.md` — daftar endpoint, DTO, format response
- `docs/PROGRESS.md` — checklist status BE & FE

## Aturan Lintas-Project
1. Kontrak API di `docs/API_CONTRACT.md` mengikat backend DAN frontend. Perubahan path/field
   apa pun WAJIB update dokumen ini di commit yang sama, di project mana pun perubahan terjadi.
2. Commit prefix: `feat(be): ...` untuk `backend/`, `feat(fe): ...` untuk `frontend/`.
3. Update `docs/PROGRESS.md` tiap fitur selesai (checklist terpisah BE/FE di dalamnya).
4. Kalau kerja di dalam folder `backend/`, prioritaskan aturan `backend/AGENTS.md` (Laravel Boost)
   di atas segalanya untuk urusan konvensi kode Laravel. Kalau kerja di `frontend/`, ikuti
   `frontend/AGENTS.md`.

## Pembagian Model (OmniRoute)

| Task                                              | Model disarankan          |
|----------------------------------------------------|----------------------------|
| Desain skema/arsitektur, debugging lintas-service   | `AgentRouter/claude-opus-5` |
| Implementasi CRUD/controller/komponen harian        | `omniroute/bara-combo` / `combo-2` |
| Refactor besar, migrasi/bersih-bersih struktur       | `AgentRouter/gpt-5.6-sol` |
| Task ringan (boilerplate, rename, dokumentasi)      | `AgentRouter/deepseek-v4-flash` / `glm-5.3` |