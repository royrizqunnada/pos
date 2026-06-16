<?php

namespace Database\Seeders;

use App\Models\Customer;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        $customers = [
            ['name' => 'Tukang Budi', 'phone' => '081234500001', 'address' => 'Perum Griya Asri Blok C2', 'note' => 'Langganan borongan'],
            ['name' => 'Proyek Pak Hadi', 'phone' => '081234500002', 'address' => 'Jl. Cempaka No. 9', 'note' => 'Bangun ruko 2 lantai'],
            ['name' => 'CV Maju Bangun', 'phone' => '081234500003', 'address' => 'Jl. Industri No. 45', 'note' => 'Kontraktor'],
            ['name' => 'Ibu Sri', 'phone' => '081234500004', 'address' => 'Gang Melati No. 3', 'note' => null],
            ['name' => 'Tukang Joko', 'phone' => '081234500005', 'address' => 'Kp. Sukamaju RT 04', 'note' => null],
            ['name' => 'Pak Anton', 'phone' => '081234500006', 'address' => 'Jl. Mawar No. 12', 'note' => 'Renovasi rumah'],
        ];

        foreach ($customers as $c) {
            Customer::updateOrCreate(['name' => $c['name']], $c);
        }
    }
}
