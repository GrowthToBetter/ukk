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
        Schema::create('diskon', function (Blueprint $table) {
            $table->id();
            $table->foreignId('maker_id')->constrained('makers')->onDelete('cascade');
            $table->string('nama_diskon');
            $table->decimal('persentase_diskon', 5, 2);
            $table->dateTime('tanggal_awal');
            $table->dateTime('tanggal_akhir');
            $table->timestamps();

            $table->unique(['maker_id', 'nama_diskon']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('diskon');
    }
};
