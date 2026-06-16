<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AddStockRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manageStock', $this->route('product')) ?? false;
    }

    public function rules(): array
    {
        return [
            'qty' => ['required', 'numeric', 'min:0.01'],
            'note' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function attributes(): array
    {
        return ['qty' => 'jumlah'];
    }
}
