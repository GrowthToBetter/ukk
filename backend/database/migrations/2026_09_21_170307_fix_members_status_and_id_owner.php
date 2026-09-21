<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Fix semua member existing yang masih pending atau tidak punya id_owner.
     * Setiap member di-assign ke SpaceOwner milik maker yang sama,
     * dan status-nya di-set ke 'active'.
     *
     * Dibutuhkan karena sebelumnya registerMember tidak mengisi
     * kedua field ini, sehingga member tidak bisa melakukan reservasi.
     */
    public function up(): void
    {
        // Ambil semua member yang perlu diperbaiki
        $members = DB::table('members')
            ->where(function ($q) {
                $q->where('status', '!=', 'active')
                    ->orWhereNull('id_owner');
            })
            ->get();

        foreach ($members as $member) {
            // Cari SpaceOwner dengan maker_id yang sama
            $owner = DB::table('space_owners')
                ->where('maker_id', $member->maker_id)
                ->first();

            DB::table('members')
                ->where('id', $member->id)
                ->update([
                    'status' => 'active',
                    'id_owner' => $owner?->id ?? $member->id_owner,
                ]);
        }
    }

    public function down(): void
    {
        // Tidak di-revert — data lama tidak bisa dipulihkan secara aman
    }
};
