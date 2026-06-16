<?php

namespace App\Http\Requests;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Product::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'sku' => ['nullable', 'string', 'max:100', Rule::unique('products', 'sku')],
            'barcode' => ['nullable', 'string', 'max:100', Rule::unique('products', 'barcode')],
            'category_id' => ['required', 'exists:categories,id'],
            'unit_id' => ['required', 'exists:units,id'],
            'cost_price' => ['required', 'integer', 'min:0'],
            'sell_price' => ['required', 'integer', 'min:0'],
            'wholesale_price' => ['nullable', 'integer', 'min:0'],
            'wholesale_min_qty' => ['nullable', 'numeric', 'min:0.01', 'required_with:wholesale_price'],
            'stock' => ['required', 'numeric', 'min:0'],
            'min_stock' => ['required', 'numeric', 'min:0'],
            'is_active' => ['boolean'],
        ];
    }

    public function attributes(): array
    {
        return [
            'name' => 'nama barang',
            'category_id' => 'kategori',
            'unit_id' => 'satuan',
            'cost_price' => 'harga modal',
            'sell_price' => 'harga jual',
            'wholesale_price' => 'harga grosir',
            'wholesale_min_qty' => 'minimal qty grosir',
            'stock' => 'stok',
            'min_stock' => 'stok minimum',
        ];
    }
}
