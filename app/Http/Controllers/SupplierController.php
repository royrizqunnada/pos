<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSupplierRequest;
use App\Http\Requests\UpdateSupplierRequest;
use App\Models\Supplier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SupplierController extends Controller
{
    public function index(Request $request): Response
    {
        $suppliers = Supplier::query()
            ->withCount('purchases')
            ->when($request->string('search')->toString(), function ($q, $search) {
                $q->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('pemasok/index', [
            'suppliers' => $suppliers,
            'filters' => ['search' => $request->string('search')->toString()],
        ]);
    }

    public function store(StoreSupplierRequest $request): RedirectResponse
    {
        Supplier::create($request->validated());

        return back()->with('success', 'Pemasok berhasil ditambahkan.');
    }

    public function update(UpdateSupplierRequest $request, Supplier $supplier): RedirectResponse
    {
        $supplier->update($request->validated());

        return back()->with('success', 'Pemasok berhasil diperbarui.');
    }

    public function destroy(Supplier $supplier): RedirectResponse
    {
        if ($supplier->purchases()->exists()) {
            return back()->with('error', 'Pemasok memiliki riwayat pembelian dan tidak dapat dihapus.');
        }

        $supplier->delete();

        return back()->with('success', 'Pemasok berhasil dihapus.');
    }
}
