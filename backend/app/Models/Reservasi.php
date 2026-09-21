<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Cloudinary\Cloudinary;

class Reservasi extends Model
{
    use HasFactory;

    protected $table = 'reservasi';

    protected $fillable = [
        'maker_id',
        'kode_booking',
        'id_member',
        'id_space',
        'id_diskon',
        'tanggal_reservasi',
        'jam_mulai',
        'jam_selesai',
        'durasi_jam',
        'harga_per_jam',
        'total_harga_awal',
        'potongan_diskon',
        'total_bayar',
        'status',
        'bukti_bayar',
        'is_claimed',
        'claimed_at',
        'check_in_time',
        'check_out_time',
    ];

    protected $appends = ['bukti_bayar_url'];

    protected $casts = [
        'tanggal_reservasi' => 'date',
        'jam_mulai' => 'datetime:H:i',
        'jam_selesai' => 'datetime:H:i',
        'durasi_jam' => 'integer',
        'harga_per_jam' => 'integer',
        'total_harga_awal' => 'integer',
        'potongan_diskon' => 'integer',
        'total_bayar' => 'integer',
        'is_claimed' => 'boolean',
        'claimed_at' => 'datetime',
        'check_in_time' => 'datetime',
        'check_out_time' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Accessor untuk bukti bayar URL.
     */
    public function getBuktiBayarUrlAttribute(): ?string
    {
        if (!$this->bukti_bayar) {
            return null;
        }

        try {
            $cloudinary = new Cloudinary(env('CLOUDINARY_URL'));
            return $cloudinary->image($this->bukti_bayar)->toUrl();
        } catch (\Exception $e) {
            \Log::error('Error generating Cloudinary Bukti Bayar URL: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Relasi ke Maker.
     */
    public function maker(): BelongsTo
    {
        return $this->belongsTo(Maker::class);
    }

    /**
     * Relasi ke Member.
     */
    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class, 'id_member');
    }

    /**
     * Relasi ke Space.
     */
    public function space(): BelongsTo
    {
        return $this->belongsTo(Space::class, 'id_space');
    }

    /**
     * Relasi ke Diskon (nullable).
     */
    public function diskon(): BelongsTo
    {
        return $this->belongsTo(Diskon::class, 'id_diskon');
    }

    /**
     * Scope query by maker_id untuk multi-tenancy.
     */
    public function scopeForMaker($query, int $makerId)
    {
        return $query->where('maker_id', $makerId);
    }

    /**
     * Scope untuk filter by member.
     */
    public function scopeForMember($query, int $memberId)
    {
        return $query->where('id_member', $memberId);
    }

    /**
     * Scope untuk filter by status.
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Check if reservasi dapat dibatalkan.
     */
    public function canBeCancelled(): bool
    {
        return in_array($this->status, ['belum_dikonfirm', 'disetujui']);
    }
}
