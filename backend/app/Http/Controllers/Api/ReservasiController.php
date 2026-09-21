<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateReservasiRequest;
use App\Models\Diskon;
use App\Models\Reservasi;
use App\Models\Space;
use App\Services\ReservasiService;
use App\Traits\ApiResponse;
use Cloudinary\Cloudinary;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReservasiController extends Controller
{
    use ApiResponse;

    protected ReservasiService $reservasiService;

    public function __construct(ReservasiService $reservasiService)
    {
        $this->reservasiService = $reservasiService;
    }

    /**
     * Buat reservasi baru (Member only).
     */
    public function store(CreateReservasiRequest $request): JsonResponse
    {
        $makerId = $request->integer('maker_id');
        $user = $request->user();
        $member = $user->member;

        // Validasi space milik maker yang sama
        $space = Space::forMaker($makerId)->findOrFail($request->id_space);

        // Validasi member dan space dalam coworking yang sama
        if ($space->id_owner !== $member->id_owner) {
            return $this->error('Anda tidak dapat memesan di coworking ini', 403);
        }

        // Cek ketersediaan
        $tersedia = $this->reservasiService->cekKetersediaan(
            $request->id_space,
            $request->tanggal_reservasi,
            $request->jam_mulai,
            $request->durasi_jam
        );

        if (! $tersedia) {
            return $this->error('Space tidak tersedia pada jadwal yang dipilih. Terjadi bentrok dengan reservasi lain.', 400);
        }

        // Handle diskon
        $diskon = null;
        if ($request->filled('kode_promo')) {
            $diskon = Diskon::forMaker($makerId)
                ->where('nama_diskon', $request->kode_promo)
                ->first();

            if (! $diskon) {
                return $this->error('Kode promo tidak ditemukan', 400);
            }

            if (! $diskon->is_active) {
                return $this->error('Kode promo sudah kadaluarsa atau tidak aktif', 400);
            }
        } elseif ($request->filled('id_diskon')) {
            $diskon = Diskon::forMaker($makerId)->find($request->id_diskon);

            if ($diskon && ! $diskon->is_active) {
                return $this->error('Diskon sudah kadaluarsa atau tidak aktif', 400);
            }
        }

        // Hitung harga - Backend sebagai Source of Truth
        $harga = $this->reservasiService->hitungHarga($space, $request->durasi_jam, $diskon);

        // Hitung jam_selesai
        $jamSelesai = $this->reservasiService->hitungJamSelesai($request->jam_mulai, $request->durasi_jam);

        DB::beginTransaction();

        try {
            // Buat reservasi (kode_booking temporary, akan di-update setelah dapat ID)
            $reservasi = Reservasi::create([
                'maker_id' => $makerId,
                'kode_booking' => 'TEMP',
                'id_member' => $member->id,
                'id_space' => $space->id,
                'id_diskon' => $diskon?->id,
                'tanggal_reservasi' => $request->tanggal_reservasi,
                'jam_mulai' => $request->jam_mulai,
                'jam_selesai' => $jamSelesai,
                'durasi_jam' => $request->durasi_jam,
                'harga_per_jam' => $space->harga_per_jam,
                'total_harga_awal' => $harga['total_harga_awal'],
                'potongan_diskon' => $harga['potongan_diskon'],
                'total_bayar' => $harga['total_bayar'],
                'status' => 'belum_dikonfirm',
            ]);

            // Generate dan update kode_booking
            $kodeBooking = $this->reservasiService->generateKodeBooking($request->tanggal_reservasi, $reservasi->id);
            $reservasi->update(['kode_booking' => $kodeBooking]);

            DB::commit();

            // Load relasi untuk response
            $reservasi->load(['member', 'space.owner', 'diskon']);

            return $this->success([
                'id' => $reservasi->id,
                'kode_booking' => $reservasi->kode_booking,
                'member' => [
                    'id' => $reservasi->member->id,
                    'nama_member' => $reservasi->member->nama_member,
                ],
                'space' => [
                    'id' => $reservasi->space->id,
                    'nama_space' => $reservasi->space->nama_space,
                    'tipe' => $reservasi->space->tipe,
                ],
                'diskon' => $reservasi->diskon ? [
                    'id' => $reservasi->diskon->id,
                    'nama_diskon' => $reservasi->diskon->nama_diskon,
                    'persentase_diskon' => (float) $reservasi->diskon->persentase_diskon,
                ] : null,
                'tanggal_reservasi' => $reservasi->tanggal_reservasi->format('Y-m-d'),
                'jam_mulai' => $reservasi->jam_mulai->format('H:i'),
                'jam_selesai' => $reservasi->jam_selesai->format('H:i'),
                'durasi_jam' => $reservasi->durasi_jam,
                'harga_per_jam' => $reservasi->harga_per_jam,
                'total_harga_awal' => $reservasi->total_harga_awal,
                'potongan_diskon' => $reservasi->potongan_diskon,
                'total_bayar' => $reservasi->total_bayar,
                'status' => $reservasi->status,
                'created_at' => $reservasi->created_at->toIso8601String(),
            ], 'Reservasi berhasil dibuat', 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return $this->error('Gagal membuat reservasi: '.$e->getMessage(), 500);
        }
    }

    /**
     * List reservasi member yang login.
     */
    public function myReservations(Request $request): JsonResponse
    {
        $makerId = $request->integer('maker_id');
        $member = $request->user()->member;

        $query = Reservasi::forMaker($makerId)
            ->forMember($member->id)
            ->with(['space', 'diskon']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('tanggal_awal')) {
            $query->where('tanggal_reservasi', '>=', $request->tanggal_awal);
        }
        if ($request->filled('tanggal_akhir')) {
            $query->where('tanggal_reservasi', '<=', $request->tanggal_akhir);
        }

        $reservasi = $query->orderBy('tanggal_reservasi', 'desc')
            ->orderBy('jam_mulai', 'desc')
            ->get();

        $data = $reservasi->map(fn ($r) => [
            'id' => $r->id,
            'kode_booking' => $r->kode_booking,
            'space' => [
                'id' => $r->space->id,
                'nama_space' => $r->space->nama_space,
                'tipe' => $r->space->tipe,
                'foto_url' => $r->space->foto_url,
            ],
            'tanggal_reservasi' => $r->tanggal_reservasi->format('Y-m-d'),
            'jam_mulai' => $r->jam_mulai->format('H:i'),
            'jam_selesai' => $r->jam_selesai->format('H:i'),
            'durasi_jam' => $r->durasi_jam,
            'total_bayar' => $r->total_bayar,
            'status' => $r->status,
            'bukti_bayar' => $r->bukti_bayar,
            'created_at' => $r->created_at->toIso8601String(),
        ]);

        return $this->success([
            'reservasi' => $data,
            'total' => $data->count(),
        ], 'Daftar reservasi berhasil diambil');
    }

    /**
     * History reservasi dengan filter month/year.
     */
    public function myHistory(Request $request): JsonResponse
    {
        $makerId = $request->integer('maker_id');
        $member = $request->user()->member;

        $query = Reservasi::forMaker($makerId)->forMember($member->id);

        if ($request->filled('month') && $request->filled('year')) {
            $query->whereMonth('tanggal_reservasi', $request->month)
                ->whereYear('tanggal_reservasi', $request->year);
        } elseif ($request->filled('year')) {
            $query->whereYear('tanggal_reservasi', $request->year);
        }

        $reservasi = $query->with(['space'])->get();

        $totalPengeluaran = $reservasi->where('status', '!=', 'dibatalkan')->sum('total_bayar');

        $items = $reservasi->map(fn ($r) => [
            'id' => $r->id,
            'kode_booking' => $r->kode_booking,
            'space' => [
                'id' => $r->space->id,
                'nama_space' => $r->space->nama_space,
            ],
            'tanggal_reservasi' => $r->tanggal_reservasi->format('Y-m-d'),
            'jam_mulai' => $r->jam_mulai->format('H:i'),
            'jam_selesai' => $r->jam_selesai->format('H:i'),
            'total_bayar' => $r->total_bayar,
            'status' => $r->status,
        ]);

        return $this->success([
            'total_reservasi' => $reservasi->count(),
            'total_pengeluaran' => $totalPengeluaran,
            'items' => $items,
        ], 'History reservasi berhasil diambil');
    }

    /**
     * Get e-ticket reservasi.
     */
    public function eTicket(Request $request, int $id): JsonResponse
    {
        $makerId = $request->integer('maker_id');
        $user = $request->user();

        $reservasi = Reservasi::forMaker($makerId)
            ->with(['member.user', 'space.owner', 'diskon'])
            ->findOrFail($id);

        // Cek akses: member pemilik atau admin_space pemilik space
        $isMemberOwner = $user->isMember() && $reservasi->member->user_id === $user->id;
        $isAdminOwner = $user->isAdminSpace() && $reservasi->space->owner->user_id === $user->id;

        if (! $isMemberOwner && ! $isAdminOwner) {
            return $this->error('Anda tidak memiliki akses ke e-ticket ini', 403);
        }

        // Generate QR code payload
        $maker = $request->attributes->get('maker');
        $qrCodePayload = in_array($reservasi->status, ['disetujui', 'aktif', 'selesai'])
            ? "VERIFY-RESERVASI-{$reservasi->id}-{$maker->app_key}"
            : null;

        return $this->success([
            'kode_booking' => $reservasi->kode_booking,
            'qr_code_payload' => $qrCodePayload,
            'member' => [
                'nama_member' => $reservasi->member->nama_member,
                'instansi' => $reservasi->member->instansi,
                'telp' => $reservasi->member->telp,
            ],
            'space' => [
                'nama_space' => $reservasi->space->nama_space,
                'tipe' => $reservasi->space->tipe,
                'kapasitas' => $reservasi->space->kapasitas,
            ],
            'coworking' => [
                'nama_coworking' => $reservasi->space->owner->nama_coworking,
                'nama_pemilik' => $reservasi->space->owner->nama_pemilik,
                'telp' => $reservasi->space->owner->telp,
            ],
            'tanggal_reservasi' => $reservasi->tanggal_reservasi->format('Y-m-d'),
            'jam_mulai' => $reservasi->jam_mulai->format('H:i'),
            'jam_selesai' => $reservasi->jam_selesai->format('H:i'),
            'durasi_jam' => $reservasi->durasi_jam,
            'total_bayar' => $reservasi->total_bayar,
            'status' => $reservasi->status,
            'bukti_bayar_url' => $reservasi->bukti_bayar_url,
        ], $qrCodePayload ? 'E-ticket berhasil diambil' : 'E-ticket belum tersedia (menunggu persetujuan admin)');
    }

    /**
     * Detail reservasi (member pemilik atau admin_space pemilik space).
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $makerId = $request->integer('maker_id');
        $user = $request->user();

        $reservasi = Reservasi::forMaker($makerId)
            ->with(['member', 'space.owner', 'diskon'])
            ->findOrFail($id);

        // Cek akses
        $isMemberOwner = $user->isMember() && $reservasi->member->user_id === $user->id;
        $isAdminOwner = $user->isAdminSpace() && $reservasi->space->owner->user_id === $user->id;

        if (! $isMemberOwner && ! $isAdminOwner) {
            return $this->error('Anda tidak memiliki akses ke reservasi ini', 403);
        }

        return $this->success([
            'id' => $reservasi->id,
            'kode_booking' => $reservasi->kode_booking,
            'member' => [
                'id' => $reservasi->member->id,
                'nama_member' => $reservasi->member->nama_member,
                'instansi' => $reservasi->member->instansi,
            ],
            'space' => [
                'id' => $reservasi->space->id,
                'nama_space' => $reservasi->space->nama_space,
                'tipe' => $reservasi->space->tipe,
                'harga_per_jam' => $reservasi->space->harga_per_jam,
            ],
            'diskon' => $reservasi->diskon ? [
                'id' => $reservasi->diskon->id,
                'nama_diskon' => $reservasi->diskon->nama_diskon,
                'persentase_diskon' => (float) $reservasi->diskon->persentase_diskon,
            ] : null,
            'tanggal_reservasi' => $reservasi->tanggal_reservasi->format('Y-m-d'),
            'jam_mulai' => $reservasi->jam_mulai->format('H:i'),
            'jam_selesai' => $reservasi->jam_selesai->format('H:i'),
            'durasi_jam' => $reservasi->durasi_jam,
            'harga_per_jam' => $reservasi->harga_per_jam,
            'total_harga_awal' => $reservasi->total_harga_awal,
            'potongan_diskon' => $reservasi->potongan_diskon,
            'total_bayar' => $reservasi->total_bayar,
            'status' => $reservasi->status,
            'bukti_bayar_url' => $reservasi->bukti_bayar_url,
            'check_in_time' => $reservasi->check_in_time?->toIso8601String(),
            'check_out_time' => $reservasi->check_out_time?->toIso8601String(),
            'created_at' => $reservasi->created_at->toIso8601String(),
            'updated_at' => $reservasi->updated_at->toIso8601String(),
        ], 'Detail reservasi berhasil diambil');
    }

    /**
     * Upload bukti bayar untuk reservasi (Member only).
     */
    public function uploadBuktiBayar(Request $request, int $id): JsonResponse
    {
        $makerId = $request->integer('maker_id');
        $user = $request->user();
        $member = $user->member;

        $reservasi = Reservasi::forMaker($makerId)
            ->forMember($member->id)
            ->findOrFail($id);

        if (in_array($reservasi->status, ['disetujui', 'dibatalkan', 'aktif', 'selesai'])) {
            return $this->error('Reservasi tidak dapat menerima bukti bayar lagi', 400);
        }

        $request->validate([
            'file' => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ], [
            'file.required' => 'File bukti bayar wajib diunggah',
            'file.image' => 'File harus berupa gambar',
            'file.mimes' => 'Format gambar harus jpeg, png, atau jpg',
            'file.max' => 'Ukuran file maksimal 2MB',
        ]);

        try {
            // Upload ke Cloudinary
            $cloudinary = new Cloudinary(env('CLOUDINARY_URL'));
            $file = $request->file('file');
            $result = $cloudinary->uploadApi()->upload($file->getRealPath(), [
                'folder' => 'bukti-bayar',
            ]);

            $reservasi->update([
                'bukti_bayar' => $result['public_id'],
            ]);

            return $this->success([
                'bukti_bayar_url' => $result['secure_url'],
            ], 'Bukti pembayaran berhasil diupload');

        } catch (\Exception $e) {
            \Log::error('Bukti bayar upload error: '.$e->getMessage());

            return $this->error('Gagal mengupload bukti pembayaran', 500);
        }
    }

    public function cancel(Request $request, int $id): JsonResponse
    {
        $makerId = $request->integer('maker_id');
        $user = $request->user();
        $member = $user->member;

        $reservasi = Reservasi::forMaker($makerId)
            ->forMember($member->id)
            ->findOrFail($id);

        if (! $reservasi->canBeCancelled()) {
            return $this->error('Reservasi tidak dapat dibatalkan. Status saat ini: '.$reservasi->status, 400);
        }

        $reservasi->update(['status' => 'dibatalkan']);

        return $this->success([
            'id' => $reservasi->id,
            'kode_booking' => $reservasi->kode_booking,
            'status' => $reservasi->status,
        ], 'Reservasi berhasil dibatalkan');
    }
}
