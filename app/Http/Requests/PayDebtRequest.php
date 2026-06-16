<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PayDebtRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('recordPayment', $this->route('customer')) ?? false;
    }

    public function rules(): array
    {
        $debt = (int) $this->route('customer')->debt;

        return [
            'amount' => ['required', 'integer', 'min:1', "max:{$debt}"],
            'note' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'amount.max' => 'Pembayaran melebihi sisa utang pelanggan.',
        ];
    }

    public function attributes(): array
    {
        return ['amount' => 'jumlah pembayaran'];
    }
}
