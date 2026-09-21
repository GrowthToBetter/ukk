<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Admin\UpdateProfileRequest;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    use ApiResponse;

    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $profile = $user->spaceOwner;

        return $this->success([
            'nama_coworking' => $profile->nama_coworking,
            'nama_pemilik' => $profile->nama_pemilik,
            'telp' => $profile->telp,
        ], 'Profil lokasi berhasil diambil');
    }

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->spaceOwner()->update($request->validated());

        return $this->success($request->validated(), 'Profil lokasi berhasil diperbarui');
    }
}
