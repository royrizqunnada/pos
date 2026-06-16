<?php

namespace App\Models;

use Database\Factories\SaleFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sale extends Model
{
    /** @use HasFactory<SaleFactory> */
    use HasFactory;

    public const PAYMENT_TUNAI = 'tunai';

    public const PAYMENT_UTANG = 'utang';

    public const STATUS_LUNAS = 'lunas';

    public const STATUS_UTANG = 'utang';

    protected $fillable = [
        'invoice_no',
        'user_id',
        'customer_id',
        'subtotal',
        'discount',
        'total',
        'payment_method',
        'paid_amount',
        'change_amount',
        'status',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'integer',
            'discount' => 'integer',
            'total' => 'integer',
            'paid_amount' => 'integer',
            'change_amount' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }
}
