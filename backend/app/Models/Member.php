<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Member extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'maker_id',
        'id_owner',
        'nama_member',
        'instansi',
        'alamat',
        'telp',
        'foto',
        'status',
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

    /**
     * Accessor untuk foto URL.
     */
    public function getFotoUrlAttribute(): ?string
    {
        if (! $this->foto) {
            return null;
        }

        return url('storage/members/'.$this->foto);
    }
}
