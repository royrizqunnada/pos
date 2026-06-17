<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ImportProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage-master') ?? false;
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'max:5120', 'extensions:xlsx,csv'],
        ];
    }

    public function messages(): array
    {
        return [
            'file.extensions' => 'Format file harus .xlsx atau .csv.',
            'file.max' => 'Ukuran file maksimal 5 MB.',
        ];
    }
}
