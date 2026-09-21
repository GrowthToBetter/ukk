<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'maker_id',
        'username',
        'password',
        'role',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Password hashing hanya di casts() untuk konsistensi.
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    /**
     * Relasi ke Maker.
     */
    public function maker(): BelongsTo
    {
        return $this->belongsTo(Maker::class);
    }

    /**
     * Relasi ke Member (one-to-one).
     */
    public function member(): HasOne
    {
        return $this->hasOne(Member::class);
    }

    /**
     * Relasi ke SpaceOwner (one-to-one).
     */
    public function spaceOwner(): HasOne
    {
        return $this->hasOne(SpaceOwner::class);
    }

    /**
     * Scope query by maker_id untuk multi-tenancy.
     */
    public function scopeForMaker($query, int $makerId)
    {
        return $query->where('maker_id', $makerId);
    }

    /**
     * Check if user is a member.
     */
    public function isMember(): bool
    {
        return $this->role === 'member';
    }

    /**
     * Check if user is an admin space.
     */
    public function isAdminSpace(): bool
    {
        return $this->role === 'admin_space';
    }
}
