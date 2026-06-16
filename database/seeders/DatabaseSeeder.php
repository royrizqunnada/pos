<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Setting;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with realistic Berkah Jaya demo data.
     */
    public function run(): void
    {
        // --- Store profile (single row) ---
        Setting::query()->updateOrCreate(['id' => 1], [
            'store_name' => 'Berkah Jaya',
            'store_address' => 'Jl. Raya Material No. 12, Bandung',
            'store_phone' => '0822-1100-2200',
            'receipt_footer' => 'Barang yang sudah dibeli tidak dapat dikembalikan.'."\n".'Terima kasih telah berbelanja di Berkah Jaya.',
        ]);

        // --- Accounts: 1 owner + 1 cashier ---
        User::query()->updateOrCreate(['email' => 'pemilik@berkahjaya.test'], [
            'name' => 'Pak Berkah',
            'password' => bcrypt('password'),
            'role' => User::ROLE_PEMILIK,
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        User::query()->updateOrCreate(['email' => 'kasir@berkahjaya.test'], [
            'name' => 'Siti Kasir',
            'password' => bcrypt('password'),
            'role' => User::ROLE_KASIR,
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        // --- Categories (color tags) ---
        $categories = [
            ['name' => 'Semen & Perekat', 'color' => '#6E665A'],
            ['name' => 'Besi & Baja', 'color' => '#262F33'],
            ['name' => 'Kayu & Triplek', 'color' => '#8A6D3B'],
            ['name' => 'Material Curah', 'color' => '#D9A441'],
            ['name' => 'Cat & Pelapis', 'color' => '#E15A12'],
            ['name' => 'Pipa & Sanitasi', 'color' => '#1B7F46'],
            ['name' => 'Keramik & Lantai', 'color' => '#BD352B'],
            ['name' => 'Alat & Lainnya', 'color' => '#3B6EA5'],
        ];
        foreach ($categories as $c) {
            Category::query()->updateOrCreate(['name' => $c['name']], $c);
        }

        // --- Units ---
        foreach (['sak', 'batang', 'lembar', 'm³', 'kaleng', 'kg', 'dus', 'biji', 'buah', 'roll', 'pcs'] as $unit) {
            Unit::query()->updateOrCreate(['name' => $unit], ['name' => $unit]);
        }

        // Later phases extend the demo data set.
        $this->call([
            ProductSeeder::class,
            SupplierSeeder::class,
            CustomerSeeder::class,
            TransactionSeeder::class,
        ]);
    }
}
