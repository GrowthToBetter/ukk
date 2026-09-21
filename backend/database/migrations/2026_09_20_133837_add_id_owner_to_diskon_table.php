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
        Schema::table('diskon', function (Blueprint $table) {
            $table->unsignedBigInteger('id_owner')->nullable()->after('maker_id');
            $table->foreign('id_owner')->references('id')->on('space_owners')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('diskon', function (Blueprint $table) {
            $table->dropForeign(['id_owner']);
            $table->dropColumn('id_owner');
        });
    }
};
