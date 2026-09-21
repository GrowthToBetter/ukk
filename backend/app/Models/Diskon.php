<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Diskon extends Model
{
    use HasFactory;

    protected $table = 'diskon';

    protected $fillable = [
        'maker_id',
        'id_owner',
        'nama_diskon',
        'persentase_diskon',
        'tanggal_awal',
        'tanggal_akhir',
        'is_active',
    ];

    /**
     * Scope query by owner.
     */
    public function scopeForOwner($query, int $ownerId)
    {
        return $query->where('id_owner', $ownerId);
    }


    protected $casts = [
        'persentase_diskon' => 'decimal:2',
        'tanggal_awal' => 'datetime',
        'tanggal_akhir' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relasi ke Maker.
     */
    public function maker(): BelongsTo
    {
        return $this->belongsTo(Maker::class);
    }

    /**
     * Accessor untuk check apakah diskon sedang aktif.
     */
    public function getIsActiveAttribute(): bool
    {
        $now = Carbon::now();

        return $now->between($this->tanggal_awal, $this->tanggal_akhir);
    }

    /**
     * Scope untuk filter by maker_id.
     */
    public function scopeForMaker($query, int $makerId)
    {
        return $query->where('maker_id', $makerId);
    }

    /**
     * Scope untuk filter diskon yang aktif.
     */
    public function scopeActive($query)
    {
        $now = Carbon::now();

        return $query->where('tanggal_awal', '<=', $now)
            ->where('tanggal_akhir', '>=', $now);
    }
}
