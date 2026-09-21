<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Admin\StoreSpaceRequest;
use App\Http\Requests\Api\Admin\UpdateSpaceRequest;
use App\Models\Space;
use App\Models\SpaceOwner;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SpaceController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $owner = $request->user()->spaceOwner;
        return $this->success(Space::where('id_owner', $owner->id)->get(), 'Daftar space berhasil diambil');
    }

    public function store(StoreSpaceRequest $request): JsonResponse
    {
        $makerId = $request->integer('maker_id');
        $owner = $request->user()->spaceOwner;

        $space = Space::create(array_merge($request->validated(), [
            'maker_id' => $makerId,
            'id_owner' => $owner->id,
        ]));

        return $this->success($space, 'Space berhasil ditambahkan', 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $owner = $request->user()->spaceOwner;
        return $this->success(Space::where('id_owner', $owner->id)->findOrFail($id), 'Detail space berhasil diambil');
    }

    public function update(UpdateSpaceRequest $request, int $id): JsonResponse
    {
        $owner = $request->user()->spaceOwner;
        $space = Space::where('id_owner', $owner->id)->findOrFail($id);
        $space->update($request->validated());

        return $this->success($space, 'Space berhasil diperbarui');
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $owner = $request->user()->spaceOwner;
        $space = Space::where('id_owner', $owner->id)->findOrFail($id);
        $space->delete();

        return $this->success(null, 'Space berhasil dihapus');
    }
}
