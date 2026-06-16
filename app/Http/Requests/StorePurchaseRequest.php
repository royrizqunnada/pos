<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePurchaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage-purchases') ?? false;
    }

    public function rules(): array
    {
        return [
            'supplier_id' => ['required', 'integer', 'exists:suppliers,id'],
            'ref_no' => ['nullable', 'string', 'max:100'],
            'note' => ['nullable', 'string', 'max:255'],
            'purchased_at' => ['nullable', 'date'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.qty' => ['required', 'numeric', 'min:0.01'],
            'items.*.cost_price' => ['required', 'integer', 'min:0'],
        ];
    }

    public function attributes(): array
    {
        return [
            'supplier_id' => 'pemasok',
            'items' => 'daftar barang',
        ];
    }

    public function messages(): array
    {
        return [
            'items.required' => 'Tambahkan minimal satu barang.',
            'items.min' => 'Tambahkan minimal satu barang.',
        ];
    }
}
