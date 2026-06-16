<?php

use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\SupplierController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('dashboard');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // --- Laporan ---
    Route::get('laporan', [ReportController::class, 'index'])->name('laporan.index');
    Route::get('laporan/ekspor', [ReportController::class, 'export'])->name('laporan.export');

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

    // --- Pelanggan & Utang ---
    Route::get('pelanggan', [CustomerController::class, 'index'])->name('pelanggan.index');
    Route::get('pelanggan/{customer}', [CustomerController::class, 'show'])->name('pelanggan.show');
    Route::post('pelanggan', [CustomerController::class, 'store'])->name('pelanggan.store');
    Route::put('pelanggan/{customer}', [CustomerController::class, 'update'])->name('pelanggan.update');
    Route::delete('pelanggan/{customer}', [CustomerController::class, 'destroy'])->name('pelanggan.destroy');
    Route::post('pelanggan/{customer}/bayar', [CustomerController::class, 'payDebt'])->name('pelanggan.pay');

    // --- Pemasok & Pembelian (pemilik) ---
    Route::middleware('role:pemilik')->group(function () {
        Route::get('pemasok', [SupplierController::class, 'index'])->name('pemasok.index');
        Route::post('pemasok', [SupplierController::class, 'store'])->name('pemasok.store');
        Route::put('pemasok/{supplier}', [SupplierController::class, 'update'])->name('pemasok.update');
        Route::delete('pemasok/{supplier}', [SupplierController::class, 'destroy'])->name('pemasok.destroy');

        Route::get('pembelian', [PurchaseController::class, 'index'])->name('pembelian.index');
        Route::get('pembelian/baru', [PurchaseController::class, 'create'])->name('pembelian.create');
        Route::get('pembelian/{purchase}', [PurchaseController::class, 'show'])->name('pembelian.show');
        Route::post('pembelian', [PurchaseController::class, 'store'])->name('pembelian.store');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
