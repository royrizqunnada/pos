<?php

namespace App\Models;

use Database\Factories\SettingFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    /** @use HasFactory<SettingFactory> */
    use HasFactory;

    protected $fillable = [
        'store_name',
        'store_address',
        'store_phone',
        'receipt_footer',
    ];

    /**
     * Get the single settings row, creating defaults if needed.
     */
    public static function current(): self
    {
        return static::query()->firstOrCreate([], [
            'store_name' => 'Berkah Jaya',
        ]);
    }
}
