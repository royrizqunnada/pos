<?php

use App\Http\Controllers\ProductController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('dashboard');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

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
