<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AdjustStockRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manageStock', $this->route('product')) ?? false;
    }

    public function rules(): array
    {
        return [
            'stock' => ['required', 'numeric', 'min:0'],
            'reason' => ['required', 'string', 'max:255'],
        ];
    }

    public function attributes(): array
    {
        return [
            'stock' => 'stok aktual',
            'reason' => 'alasan',
        ];
    }
}
