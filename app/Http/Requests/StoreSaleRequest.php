<?php

namespace App\Http\Requests;

use App\Models\Sale;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Both pemilik and kasir may process sales.
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.qty' => ['required', 'numeric', 'min:0.01'],
            'customer_id' => ['nullable', 'integer', 'exists:customers,id', Rule::requiredIf($this->input('payment_method') === Sale::PAYMENT_UTANG)],
            'payment_method' => ['required', Rule::in([Sale::PAYMENT_TUNAI, Sale::PAYMENT_UTANG])],
            'paid_amount' => ['nullable', 'integer', 'min:0', Rule::requiredIf($this->input('payment_method') === Sale::PAYMENT_TUNAI)],
            'discount' => ['nullable', 'integer', 'min:0'],
            'note' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'items.required' => 'Keranjang masih kosong.',
            'items.min' => 'Keranjang masih kosong.',
            'customer_id.required' => 'Pelanggan wajib dipilih untuk transaksi utang.',
            'paid_amount.required' => 'Uang yang diterima wajib diisi untuk pembayaran tunai.',
        ];
    }
}
