<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Admin\StoreMemberRequest;
use App\Http\Requests\Api\Admin\UpdateMemberRequest;
use App\Models\Member;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class MemberController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $makerId = $request->integer('maker_id');
        $query = Member::forMaker($makerId);

        if ($request->has('search')) {
            $query->where('nama_member', 'like', '%'.$request->search.'%');
        }

        return $this->success($query->get(), 'Daftar member berhasil diambil');
    }

    public function store(StoreMemberRequest $request): JsonResponse
    {
        $makerId = $request->integer('maker_id');

        DB::beginTransaction();
        try {
            $user = User::create([
                'maker_id' => $makerId,
                'username' => $request->username,
                'password' => Hash::make($request->password),
                'role' => 'member',
            ]);

            $member = Member::create([
                'user_id' => $user->id,
                'maker_id' => $makerId,
                'nama_member' => $request->nama_member,
                'instansi' => $request->instansi,
                'alamat' => $request->alamat,
                'telp' => $request->telp,
            ]);

            DB::commit();

            return $this->success($member, 'Member berhasil ditambahkan', 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return $this->error('Gagal menambahkan member: '.$e->getMessage(), 500);
        }
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $makerId = $request->integer('maker_id');

        return $this->success(Member::forMaker($makerId)->findOrFail($id), 'Detail member berhasil diambil');
    }

    public function update(UpdateMemberRequest $request, int $id): JsonResponse
    {
        $makerId = $request->integer('maker_id');
        $member = Member::forMaker($makerId)->findOrFail($id);
        $member->update($request->validated());

        return $this->success($member, 'Member berhasil diperbarui');
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $makerId = $request->integer('maker_id');
        $member = Member::forMaker($makerId)->findOrFail($id);
        $user = $member->user;

        DB::beginTransaction();
        try {
            $member->delete();
            $user->delete();
            DB::commit();

            return $this->success(null, 'Member berhasil dihapus');
        } catch (\Exception $e) {
            DB::rollBack();

            return $this->error('Gagal menghapus member', 500);
        }
    }
}
