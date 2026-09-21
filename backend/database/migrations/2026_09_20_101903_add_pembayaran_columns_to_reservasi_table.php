<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('reservasi', function (Blueprint $table) {
            $table->string('bukti_bayar')->nullable()->after('status');
            $table->boolean('is_claimed')->default(false)->after('bukti_bayar');
            $table->timestamp('claimed_at')->nullable()->after('is_claimed');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reservasi', function (Blueprint $table) {
            $table->dropColumn(['bukti_bayar', 'is_claimed', 'claimed_at']);
        });
    }
};
