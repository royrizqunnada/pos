<?php

namespace Database\Factories;

use App\Models\Setting;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Setting>
 */
class SettingFactory extends Factory
{
    public function definition(): array
    {
        return [
            'store_name' => 'Berkah Jaya',
            'store_address' => fake()->address(),
            'store_phone' => fake()->phoneNumber(),
            'receipt_footer' => 'Terima kasih telah berbelanja.',
        ];
    }
}
