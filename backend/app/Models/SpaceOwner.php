<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SpaceOwner extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'maker_id',
        'nama_coworking',
        'nama_pemilik',
        'telp',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relasi ke User.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relasi ke Maker.
     */
    public function maker(): BelongsTo
    {
        return $this->belongsTo(Maker::class);
    }

    /**
     * Scope query by maker_id untuk multi-tenancy.
     */
    public function scopeForMaker($query, int $makerId)
    {
        return $query->where('maker_id', $makerId);
    }
}
