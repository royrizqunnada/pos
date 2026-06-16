<?php

namespace Database\Seeders;

use App\Models\Supplier;
use Illuminate\Database\Seeder;

class SupplierSeeder extends Seeder
{
    public function run(): void
    {
        $suppliers = [
            ['name' => 'PT Semen Nusantara', 'phone' => '0217001001', 'address' => 'Jakarta', 'note' => 'Distributor semen'],
            ['name' => 'Toko Besi Sejahtera', 'phone' => '0227001002', 'address' => 'Bandung', 'note' => 'Besi & baja'],
            ['name' => 'UD Kayu Makmur', 'phone' => '0247001003', 'address' => 'Semarang', 'note' => 'Kayu & triplek'],
            ['name' => 'CV Cat Warna Abadi', 'phone' => '0317001004', 'address' => 'Surabaya', 'note' => 'Cat & pelapis'],
            ['name' => 'PT Pipa Sentosa', 'phone' => '0217001005', 'address' => 'Tangerang', 'note' => 'Pipa & sanitasi'],
        ];

        foreach ($suppliers as $s) {
            Supplier::updateOrCreate(['name' => $s['name']], $s);
        }
    }
}
