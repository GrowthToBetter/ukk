<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\MakerLoginRequest;
use App\Http\Requests\MakerRegisterRequest;
use App\Models\Maker;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class MakerController extends Controller
{
    use ApiResponse;

    /**
     * Register a new maker.
     */
    public function register(MakerRegisterRequest $request): JsonResponse
    {
        try {
            $maker = Maker::create($request->validated());

            $token = $maker->createToken('maker-token')->plainTextToken;

            return $this->success([
                'maker' => [
                    'id' => $maker->id,
                    'name' => $maker->name,
                    'username' => $maker->username,
                    'email' => $maker->email,
                    'app_key' => $maker->app_key,
                    'created_at' => $maker->created_at->toIso8601String(),
                ],
                'access_token' => $token,
                'token_type' => 'Bearer',
            ], 'Maker berhasil didaftarkan', 201);
        } catch (\Exception $e) {
            return $this->error('Gagal mendaftarkan maker', 500);
        }
    }

    /**
     * Login a maker.
     */
    public function login(MakerLoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();

        $maker = Maker::where('username', $credentials['usernameOrEmail'])
            ->orWhere('email', $credentials['usernameOrEmail'])
            ->first();

        if (!$maker || !Hash::check($credentials['password'], $maker->password)) {
            return $this->error('Username/email atau password salah', 401);
        }

        $maker->tokens()->delete();

        $token = $maker->createToken('maker-token')->plainTextToken;

        return $this->success([
            'maker' => [
                'id' => $maker->id,
                'name' => $maker->name,
                'username' => $maker->username,
                'email' => $maker->email,
                'app_key' => $maker->app_key,
            ],
            'access_token' => $token,
            'token_type' => 'Bearer',
        ], 'Login berhasil');
    }

    /**
     * Get authenticated maker profile.
     */
    public function me(Request $request): JsonResponse
    {
        $maker = $request->user();

        return $this->success([
            'id' => $maker->id,
            'name' => $maker->name,
            'username' => $maker->username,
            'email' => $maker->email,
            'app_key' => $maker->app_key,
            'created_at' => $maker->created_at->toIso8601String(),
            'updated_at' => $maker->updated_at->toIso8601String(),
        ], 'Data maker berhasil diambil');
    }

    /**
     * Get maker statistics.
     */
    public function stats(Request $request): JsonResponse
    {
        $maker = $request->attributes->get('maker');
        $user = $request->user('sanctum');

        if (!$maker) {
            return $this->error('Maker tidak ditemukan', 404);
        }

        if ($user && $user->role === 'admin_space') {
            $owner = $user->spaceOwner;
            $stats = [
                'total_members' => \App\Models\Member::where('maker_id', $maker->id)->count(),
                'total_spaces' => \App\Models\Space::where('id_owner', $owner->id)->count(),
                'total_diskon' => \App\Models\Diskon::where('maker_id', $maker->id)->count(),
                'total_reservasi' => \App\Models\Reservasi::whereHas('space', fn($q) => $q->where('id_owner', $owner->id))->where('status', '!=', 'dibatalkan')->count(),
                'total_pendapatan' => \App\Models\Reservasi::whereHas('space', fn($q) => $q->where('id_owner', $owner->id))->whereIn('status', ['disetujui', 'aktif', 'selesai'])->sum('total_bayar'),
            ];
        } else {
            // Maker stats
            $stats = [
                'total_members' => \App\Models\Member::where('maker_id', $maker->id)->count(),
                'total_spaces' => \App\Models\Space::where('maker_id', $maker->id)->count(),
                'total_diskon' => \App\Models\Diskon::where('maker_id', $maker->id)->count(),
                'total_reservasi' => \App\Models\Reservasi::forMaker($maker->id)->where('status', '!=', 'dibatalkan')->count(),
                'total_pendapatan' => \App\Models\Reservasi::forMaker($maker->id)->whereIn('status', ['disetujui', 'aktif', 'selesai'])->sum('total_bayar'),
            ];
        }

        return $this->success($stats, 'Statistik maker berhasil diambil');
    }

    /**
     * Get list of all makers (for teacher panel).
     */
    public function list(): JsonResponse
    {
        $makers = Maker::select('id', 'name', 'username', 'email', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($maker) {
                return [
                    'id' => $maker->id,
                    'name' => $maker->name,
                    'username' => $maker->username,
                    'email' => $maker->email,
                    'created_at' => $maker->created_at->toIso8601String(),
                ];
            });

        return $this->success([
            'makers' => $makers,
            'total' => $makers->count(),
        ], 'Daftar maker berhasil diambil');
    }
}
