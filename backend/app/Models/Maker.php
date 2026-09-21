<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;

class Maker extends Model
{
    use HasApiTokens, HasFactory;

    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'app_key',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Password hashing hanya di casts() untuk konsistensi dengan Model User.
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    /**
     * Boot model untuk auto-generate app_key saat create.
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Maker $maker): void {
            if (empty($maker->app_key)) {
                $maker->app_key = 'mk_'.bin2hex(random_bytes(16));
            }
        });
    }
}
