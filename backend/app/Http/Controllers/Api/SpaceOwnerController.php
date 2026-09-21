<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SpaceOwner;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SpaceOwnerController extends Controller
{
    use ApiResponse;

    /**
     * Get list of all space owners for the current maker.
     */
    public function index(Request $request): JsonResponse
    {
        $makerId = $request->integer('maker_id');
        $owners = SpaceOwner::where('maker_id', $makerId)->get();

        return $this->success($owners, 'Daftar pemilik space berhasil diambil');
    }
}
