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
        Schema::create('reservasi', function (Blueprint $table) {
            $table->id();
            $table->foreignId('maker_id')->constrained('makers')->onDelete('cascade');
            $table->string('kode_booking')->unique();
            $table->foreignId('id_member')->constrained('members')->onDelete('cascade');
            $table->foreignId('id_space')->constrained('spaces')->onDelete('cascade');
            $table->foreignId('id_diskon')->nullable()->constrained('diskon')->onDelete('set null');
            $table->date('tanggal_reservasi');
            $table->time('jam_mulai');
            $table->time('jam_selesai');
            $table->integer('durasi_jam');
            $table->integer('harga_per_jam');
            $table->integer('total_harga_awal');
            $table->integer('potongan_diskon')->default(0);
            $table->integer('total_bayar');
            $table->enum('status', ['belum_dikonfirm', 'disetujui', 'aktif', 'selesai', 'dibatalkan'])
                ->default('belum_dikonfirm');
            $table->dateTime('check_in_time')->nullable();
            $table->dateTime('check_out_time')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reservasi');
    }
};
