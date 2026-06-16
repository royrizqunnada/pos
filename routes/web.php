<?php

use App\Http\Controllers\ProductController;
use App\Http\Controllers\SaleController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('dashboard');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // --- Kasir / POS ---
    Route::get('kasir', [SaleController::class, 'index'])->name('kasir.index');
    Route::post('kasir', [SaleController::class, 'store'])->name('kasir.store');

    // --- Barang / Stok ---
    Route::get('barang', [ProductController::class, 'index'])->name('barang.index');
    Route::post('barang', [ProductController::class, 'store'])->name('barang.store');
    Route::put('barang/{product}', [ProductController::class, 'update'])->name('barang.update');
    Route::delete('barang/{product}', [ProductController::class, 'destroy'])->name('barang.destroy');
    Route::post('barang/{product}/stok', [ProductController::class, 'addStock'])->name('barang.add-stock');
    Route::post('barang/{product}/penyesuaian', [ProductController::class, 'adjust'])->name('barang.adjust');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
