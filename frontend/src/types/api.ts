/**
 * src/types/api.ts
 * Semua tipe TypeScript yang bersumber dari API_CONTRACT.md & DESIGN.md.
 * Tidak ada `any`. Dipakai di seluruh codebase frontend.
 */

// ─── RESPONSE WRAPPER ────────────────────────────────────────────────────────

/** Shape sukses dari backend (status: true). */
export interface ApiResponse<T> {
  status: true;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

/** Shape error umum dari backend (status: false). */
export interface ApiErrorResponse {
  status: false;
  statusCode: number;
  message: string;
  error?: string;
  /** Hanya ada pada 422 Validation Error. */
  errors?: Record<string, string[]>;
  timestamp: string;
}

/**
 * Error class yang di-throw oleh api-client ketika backend
 * mengembalikan status: false.
 */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly error?: string;
  readonly errors?: Record<string, string[]>;

  constructor(response: ApiErrorResponse) {
    super(response.message);
    this.name = "ApiError";
    this.statusCode = response.statusCode;
    this.error = response.error;
    this.errors = response.errors;
  }
}

// ─── ENUM / UNION TYPES ──────────────────────────────────────────────────────

export type Role = "member" | "admin_space";

export type TipeSpace = "desk" | "meeting_room" | "private_office";

export type StatusReservasi =
  | "belum_dikonfirm"
  | "disetujui"
  | "aktif"
  | "selesai"
  | "dibatalkan";

// ─── ENTITAS INTI ─────────────────────────────────────────────────────────────

/** Entity: Maker (App / tenant). */
export interface Maker {
  id: number;
  name: string;
  username: string;
  email: string;
  app_key: string;
  created_at: string;
  updated_at?: string;
}

/** Entity: User (login credentials + role). */
export interface User {
  id: number;
  maker_id: number;
  username: string;
  role: Role;
  created_at?: string;
  updated_at?: string;
}

/** Entity: Member (profil lengkap seorang member). */
export interface Member {
  id: number;
  user_id: number;
  maker_id: number;
  nama_member: string;
  instansi: string;
  alamat: string;
  telp: string;
  foto: string | null;
  foto_url: string | null;
  created_at?: string;
  updated_at?: string;
}

/** Entity: SpaceOwner (profil admin coworking). */
export interface SpaceOwner {
  id: number;
  user_id: number;
  maker_id: number;
  nama_coworking: string;
  nama_pemilik: string;
  telp: string;
  created_at?: string;
  updated_at?: string;
}

/** Entity: Space (ruangan yang bisa dipesan). */
export interface Space {
  id: number;
  maker_id: number;
  id_owner: number;
  nama_space: string;
  harga_per_jam: number;
  tipe: TipeSpace;
  kapasitas: number;
  deskripsi: string;
  foto: string | null;
  foto_url: string | null;
  owner: Pick<SpaceOwner, "id" | "nama_coworking" | "nama_pemilik" | "telp">;
  created_at: string;
  updated_at?: string;
}

/** Tipe statis yang dikembalikan GET /spaces/types. */
export interface SpaceType {
  value: TipeSpace;
  label: string;
  description: string;
}

/** Entity: Diskon. */
export interface Diskon {
  id: number;
  maker_id: number;
  nama_diskon: string;
  persentase_diskon: number;
  tanggal_awal: string;
  tanggal_akhir: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/** Entity: Reservasi (lengkap, termasuk relasi yang di-load backend). */
export interface Reservasi {
  id: number;
  maker_id: number;
  kode_booking: string;
  member: Pick<Member, "id" | "nama_member" | "instansi" | "alamat" | "telp">;
  space: Pick<Space, "id" | "nama_space" | "tipe" | "harga_per_jam">;
  diskon: Pick<Diskon, "id" | "nama_diskon" | "persentase_diskon"> | null;
  tanggal_reservasi: string;
  jam_mulai: string;
  jam_selesai: string;
  durasi_jam: number;
  harga_per_jam: number;
  total_harga_awal: number;
  potongan_diskon: number;
  total_bayar: number;
  status: StatusReservasi;
  bukti_bayar: string | null;
  bukti_bayar_url: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
  created_at: string;
  updated_at?: string;
}

/** Reservasi ringkas untuk list (GET /reservasi/my). */
export interface ReservasiListItem {
  id: number;
  kode_booking: string;
  space: Pick<Space, "id" | "nama_space" | "tipe" | "foto_url">;
  tanggal_reservasi: string;
  jam_mulai: string;
  jam_selesai: string;
  durasi_jam: number;
  total_bayar: number;
  status: StatusReservasi;
  bukti_bayar: string | null;
  bukti_bayar_url: string | null;
  created_at: string;
}

/** Reservasi item untuk history (GET /reservasi/my/history). */
export interface ReservasiHistoryItem {
  id: number;
  kode_booking: string;
  space: Pick<Space, "id" | "nama_space">;
  tanggal_reservasi: string;
  jam_mulai: string;
  jam_selesai: string;
  total_bayar: number;
  status: StatusReservasi;
}

/** E-Ticket payload. */
export interface ETicket {
  kode_booking: string;
  qr_code_payload: string;
  member: {
    nama_member: string;
    instansi: string;
    telp: string;
  };
  space: {
    nama_space: string;
    tipe: TipeSpace;
    kapasitas: number;
  };
  coworking: {
    nama_coworking: string;
    nama_pemilik: string;
    telp: string;
  };
  tanggal_reservasi: string;
  jam_mulai: string;
  jam_selesai: string;
  durasi_jam: number;
  total_bayar: number;
  status: StatusReservasi;
}

// ─── MAKER STATS ─────────────────────────────────────────────────────────────

export interface MakerStats {
  total_members: number;
  total_spaces: number;
  total_diskon: number;
  total_reservasi: number;
  total_pendapatan: number;
}

// ─── AVAILABILITY ─────────────────────────────────────────────────────────────

export interface AvailabilityResult {
  id_space: number;
  nama_space: string;
  tanggal: string;
  jam_mulai: string;
  durasi_jam: number;
  available: boolean;
  message: string;
}

// ─── DISKON CHECK ─────────────────────────────────────────────────────────────

export interface DiskonCheckResult extends Diskon {
  message: string;
}

// ─── UPLOAD ──────────────────────────────────────────────────────────────────

export interface UploadResult {
  filename: string;
  url: string;
  path: string;
  size: number;
  mime_type: string;
}

// ─── REPORT ──────────────────────────────────────────────────────────────────

export interface MonthlyReportItem {
  tanggal: string;
  total_reservasi: number;
  total_pendapatan: number;
}

export interface IncomeReport {
  month?: number;
  year?: number;
  total_reservasi: number;
  total_pendapatan: number;
}

// ─── DTO (request bodies dari frontend ke backend) ───────────────────────────

/** POST /maker/register */
export interface MakerRegisterDto {
  name: string;
  username: string;
  email: string;
  password: string;
}

/** POST /maker/login */
export interface MakerLoginDto {
  usernameOrEmail: string;
  password: string;
}

/** POST /auth/login */
export interface LoginDto {
  username: string;
  password: string;
}

/** POST /auth/register/member */
export interface RegisterMemberDto {
  username: string;
  password: string;
  nama_member: string;
  instansi: string;
  alamat: string;
  telp: string;
  foto?: string;
}

/** POST /auth/register/admin-space */
export interface RegisterAdminSpaceDto {
  username: string;
  password: string;
  nama_coworking: string;
  nama_pemilik: string;
  telp: string;
}

/** POST /reservasi */
export interface CreateReservasiDto {
  id_space: number;
  tanggal_reservasi: string; // YYYY-MM-DD
  jam_mulai: string; // HH:mm
  durasi_jam: number;
  id_diskon?: number;
  kode_promo?: string;
}

/** POST /admin/spaces */
export interface CreateSpaceDto {
  nama_space: string;
  harga_per_jam: number;
  tipe: TipeSpace;
  kapasitas: number;
  deskripsi: string;
  foto?: string;
}

/** PUT /admin/spaces/{id} */
export type UpdateSpaceDto = Partial<CreateSpaceDto>;

/** POST /admin/diskon */
export interface CreateDiskonDto {
  nama_diskon: string;
  persentase_diskon: number;
  tanggal_awal: string; // ISO datetime
  tanggal_akhir: string; // ISO datetime
}

/** PUT /admin/diskon/{id} */
export type UpdateDiskonDto = Partial<CreateDiskonDto>;

/** POST /admin/members */
export interface CreateMemberByAdminDto {
  username: string;
  password: string;
  nama_member: string;
  instansi: string;
  alamat: string;
  telp: string;
  foto?: string;
}

/** PUT /admin/members/{id} */
export type UpdateMemberDto = Partial<
  Omit<CreateMemberByAdminDto, "username" | "password">
>;

/** PUT /admin/profile */
export interface UpdateProfileDto {
  nama_coworking: string;
  nama_pemilik: string;
  telp: string;
}

/** PATCH /admin/reservasi/{id}/status */
export interface UpdateReservasiStatusDto {
  status: StatusReservasi;
}

/** POST /diskon/check */
export interface CheckDiskonDto {
  nama_diskon: string;
}

// ─── RESPONSE SHAPES dari backend ────────────────────────────────────────────

/** Data dari POST /auth/login (member). */
export interface LoginMemberResponse {
  user: User;
  member: Member;
  access_token: string;
  token_type: "Bearer";
}

/** Data dari POST /auth/login (admin_space). */
export interface LoginAdminResponse {
  user: User;
  space_owner: SpaceOwner;
  access_token: string;
  token_type: "Bearer";
}

/** Union — satu login endpoint, role menentukan shape. */
export type LoginResponse = LoginMemberResponse | LoginAdminResponse;

/** Data dari GET /auth/profile. */
export interface ProfileResponse {
  user: User;
  member?: Member;
  space_owner?: SpaceOwner;
}

/** Data dari POST /maker/register atau POST /maker/login. */
export interface MakerAuthResponse {
  maker: Maker;
  access_token: string;
  token_type: "Bearer";
}

/** Data dari GET /spaces. */
export interface SpacesListResponse {
  spaces: Space[];
  total: number;
}

/** Data dari GET /spaces/types. */
export interface SpaceTypesResponse {
  types: SpaceType[];
}

/** Data dari GET /diskon/active. */
export interface DiskonListResponse {
  diskons: Diskon[];
  total: number;
}

/** Data dari GET /reservasi/my. */
export interface MyReservasiResponse {
  reservasi: ReservasiListItem[];
  total: number;
}

/** Data dari GET /reservasi/my/history. */
export interface ReservasiHistoryResponse {
  total_reservasi: number;
  total_pengeluaran: number;
  items: ReservasiHistoryItem[];
}

/** Data dari GET /maker/list. */
export interface MakerListResponse {
  makers: Omit<Maker, "app_key">[];
  total: number;
}

/** Data dari GET /admin/members. */
export type AdminMembersListResponse = Member[];

/** Data dari GET /admin/spaces. */
export type AdminSpacesListResponse = Space[];

/** Data dari GET /admin/diskon. */
export type AdminDiskonListResponse = Diskon[];

/** Data dari GET /admin/reservasi. */
export type AdminReservasiListResponse = Reservasi[];

// ─── QUERY PARAMS ────────────────────────────────────────────────────────────

export interface SpacesQueryParams {
  tipe?: TipeSpace;
  search?: string;
}

export interface AvailabilityQueryParams {
  id_space: number;
  tanggal: string;
  jam_mulai: string;
  durasi_jam: number;
}

export interface AdminReservasiQueryParams {
  month?: number;
  year?: number;
  status?: StatusReservasi;
  id_space?: number;
  tanggal?: string;
}

export interface ReservasiHistoryQueryParams {
  month?: number;
  year?: number;
}
