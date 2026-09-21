<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterAdminSpaceRequest;
use App\Http\Requests\RegisterMemberRequest;
use App\Models\Member;
use App\Models\SpaceOwner;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    use ApiResponse;

    /**
     * Register a new member (scoped by maker_id).
     */
    public function registerMember(RegisterMemberRequest $request): JsonResponse
    {
        $makerId = $request->integer('maker_id');

        // Username unique per maker
        if (User::forMaker($makerId)->where('username', $request->username)->exists()) {
            return $this->error('Username sudah digunakan dalam aplikasi ini', 409);
        }

        DB::beginTransaction();

        try {
            $user = User::create([
                'maker_id' => $makerId,
                'username' => $request->username,
                'password' => $request->password,
                'role' => 'member',
            ]);

            // Resolve SpaceOwner milik maker ini agar member langsung terasosiasi
            $spaceOwner = SpaceOwner::where('maker_id', $makerId)->first();

            $member = Member::create([
                'user_id' => $user->id,
                'maker_id' => $makerId,
                'id_owner' => $spaceOwner?->id,
                'nama_member' => $request->nama_member,
                'instansi' => $request->instansi,
                'alamat' => $request->alamat,
                'telp' => $request->telp,
                'foto' => $request->foto,
                'status' => 'active',
            ]);

            $token = $user->createToken('auth-token')->plainTextToken;

            DB::commit();

            return $this->success([
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'role' => $user->role,
                ],
                'member' => [
                    'id' => $member->id,
                    'nama_member' => $member->nama_member,
                    'instansi' => $member->instansi,
                    'alamat' => $member->alamat,
                    'telp' => $member->telp,
                    'foto' => $member->foto,
                    'foto_url' => $member->foto_url,
                ],
                'access_token' => $token,
                'token_type' => 'Bearer',
            ], 'Member berhasil didaftarkan', 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return $this->error('Gagal mendaftarkan member', 500);
        }
    }

    /**
     * Register a new admin space (scoped by maker_id).
     */
    public function registerAdminSpace(RegisterAdminSpaceRequest $request): JsonResponse
    {
        $makerId = $request->integer('maker_id');

        // Username unique per maker
        if (User::forMaker($makerId)->where('username', $request->username)->exists()) {
            return $this->error('Username sudah digunakan dalam aplikasi ini', 409);
        }

        DB::beginTransaction();

        try {
            $user = User::create([
                'maker_id' => $makerId,
                'username' => $request->username,
                'password' => $request->password,
                'role' => 'admin_space',
            ]);

            $spaceOwner = SpaceOwner::create([
                'user_id' => $user->id,
                'maker_id' => $makerId,
                'nama_coworking' => $request->nama_coworking,
                'nama_pemilik' => $request->nama_pemilik,
                'telp' => $request->telp,
            ]);

            $token = $user->createToken('auth-token')->plainTextToken;

            DB::commit();

            return $this->success([
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'role' => $user->role,
                ],
                'space_owner' => [
                    'id' => $spaceOwner->id,
                    'nama_coworking' => $spaceOwner->nama_coworking,
                    'nama_pemilik' => $spaceOwner->nama_pemilik,
                    'telp' => $spaceOwner->telp,
                ],
                'access_token' => $token,
                'token_type' => 'Bearer',
            ], 'Admin space berhasil didaftarkan', 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return $this->error('Gagal mendaftarkan admin space', 500);
        }
    }

    /**
     * Login user — lookup dibatasi per maker.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $makerId = $request->integer('maker_id');

        $user = User::forMaker($makerId)
            ->where('username', $request->username)
            ->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return $this->error('Username atau password salah', 401);
        }

        $user->tokens()->delete();
        $token = $user->createToken('auth-token')->plainTextToken;

        $data = [
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'role' => $user->role,
            ],
            'access_token' => $token,
            'token_type' => 'Bearer',
        ];

        if ($user->isMember()) {
            $member = $user->member;
            $data['member'] = [
                'id' => $member->id,
                'nama_member' => $member->nama_member,
                'instansi' => $member->instansi,
                'alamat' => $member->alamat,
                'telp' => $member->telp,
                'foto' => $member->foto,
                'foto_url' => $member->foto_url,
            ];
        } elseif ($user->isAdminSpace()) {
            $spaceOwner = $user->spaceOwner;
            $data['space_owner'] = [
                'id' => $spaceOwner->id,
                'nama_coworking' => $spaceOwner->nama_coworking,
                'nama_pemilik' => $spaceOwner->nama_pemilik,
                'telp' => $spaceOwner->telp,
            ];
        }

        return $this->success($data, 'Login berhasil');
    }

    /**
     * Get authenticated user profile.
     */
    public function profile(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = [
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'role' => $user->role,
                'created_at' => $user->created_at->toIso8601String(),
                'updated_at' => $user->updated_at->toIso8601String(),
            ],
        ];

        if ($user->isMember()) {
            $member = $user->member;
            $data['member'] = [
                'id' => $member->id,
                'nama_member' => $member->nama_member,
                'instansi' => $member->instansi,
                'alamat' => $member->alamat,
                'telp' => $member->telp,
                'foto' => $member->foto,
                'foto_url' => $member->foto_url,
                'created_at' => $member->created_at->toIso8601String(),
            ];
        } elseif ($user->isAdminSpace()) {
            $spaceOwner = $user->spaceOwner;
            $data['space_owner'] = [
                'id' => $spaceOwner->id,
                'nama_coworking' => $spaceOwner->nama_coworking,
                'nama_pemilik' => $spaceOwner->nama_pemilik,
                'telp' => $spaceOwner->telp,
                'created_at' => $spaceOwner->created_at->toIso8601String(),
            ];
        }

        return $this->success($data, 'Data profil berhasil diambil');
    }
}
