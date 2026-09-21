<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Admin\StoreDiskonRequest;
use App\Http\Requests\Api\Admin\UpdateDiskonRequest;
use App\Models\Diskon;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DiskonController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $owner = $request->user()->spaceOwner;
        return $this->success(Diskon::where('id_owner', $owner->id)->get(), 'Daftar diskon berhasil diambil');
    }

    public function store(StoreDiskonRequest $request): JsonResponse
    {
        $makerId = $request->integer('maker_id');
        $owner = $request->user()->spaceOwner;
        
        $diskon = Diskon::create(array_merge($request->validated(), [
            'maker_id' => $makerId,
            'id_owner' => $owner->id
        ]));

        return $this->success($diskon, 'Diskon berhasil ditambahkan', 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $owner = $request->user()->spaceOwner;
        return $this->success(Diskon::where('id_owner', $owner->id)->findOrFail($id), 'Detail diskon berhasil diambil');
    }

    public function update(UpdateDiskonRequest $request, int $id): JsonResponse
    {
        $owner = $request->user()->spaceOwner;
        $diskon = Diskon::where('id_owner', $owner->id)->findOrFail($id);
        $diskon->update($request->validated());

        return $this->success($diskon, 'Diskon berhasil diperbarui');
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $owner = $request->user()->spaceOwner;
        $diskon = Diskon::where('id_owner', $owner->id)->findOrFail($id);
        $diskon->delete();

        return $this->success(null, 'Diskon berhasil dihapus');
    }
}
