<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Cloudinary\Cloudinary;

class Space extends Model
{
    use HasFactory;

    protected $fillable = [
        'maker_id',
        'id_owner',
        'nama_space',
        'harga_per_jam',
        'tipe',
        'kapasitas',
        'deskripsi',
        'foto',
    ];

    protected $appends = ['foto_url'];

    protected $casts = [
        'harga_per_jam' => 'integer',
        'kapasitas' => 'integer',
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
     * Relasi ke SpaceOwner.
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(SpaceOwner::class, 'id_owner');
    }

    /**
     * Accessor untuk foto URL.
     */
    public function getFotoUrlAttribute(): ?string
    {
        if (!$this->foto) {
            return null;
        }

        if (filter_var($this->foto, FILTER_VALIDATE_URL)) {
            return $this->foto;
        }

        // Use Cloudinary SDK to generate URL
        try {
            $cloudinary = new Cloudinary(env('CLOUDINARY_URL'));
            return $cloudinary->image($this->foto)->toUrl();
        } catch (\Exception $e) {
            \Log::error('Error generating Cloudinary URL: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Scope untuk filter by maker_id.
     */
    public function scopeForMaker($query, int $makerId)
    {
        return $query->where('maker_id', $makerId);
    }

    /**
     * Scope untuk filter by tipe.
     */
    public function scopeByTipe($query, string $tipe)
    {
        return $query->where('tipe', $tipe);
    }

    /**
     * Scope untuk search nama_space atau deskripsi.
     */
    public function scopeSearch($query, string $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('nama_space', 'like', "%{$search}%")
                ->orWhere('deskripsi', 'like', "%{$search}%");
        });
    }
}
