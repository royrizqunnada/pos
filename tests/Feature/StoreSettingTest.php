<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StoreSettingTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_update_store_profile(): void
    {
        Setting::current();
        $owner = User::factory()->pemilik()->create();

        $this->actingAs($owner)->put('/pengaturan/toko', [
            'store_name' => 'Berkah Jaya Material',
            'store_address' => 'Jl. Baru No. 1',
            'store_phone' => '08123',
            'receipt_footer' => 'Terima kasih',
        ])->assertRedirect();

        $this->assertDatabaseHas('settings', ['store_name' => 'Berkah Jaya Material']);
    }

    public function test_owner_can_create_cashier_account(): void
    {
        $owner = User::factory()->pemilik()->create();

        $this->actingAs($owner)->post('/pengaturan/pengguna', [
            'name' => 'Kasir Baru',
            'email' => 'kasirbaru@berkahjaya.test',
            'password' => 'rahasia123',
            'role' => 'kasir',
            'is_active' => true,
        ])->assertRedirect();

        $this->assertDatabaseHas('users', ['email' => 'kasirbaru@berkahjaya.test', 'role' => 'kasir']);
    }

    public function test_owner_can_deactivate_a_cashier(): void
    {
        $owner = User::factory()->pemilik()->create();
        $cashier = User::factory()->kasir()->create(['is_active' => true]);

        $this->actingAs($owner)->put("/pengaturan/pengguna/{$cashier->id}", [
            'name' => $cashier->name,
            'email' => $cashier->email,
            'role' => 'kasir',
            'is_active' => false,
        ])->assertRedirect();

        $this->assertFalse($cashier->fresh()->is_active);
    }

    public function test_deactivated_user_cannot_log_in(): void
    {
        $user = User::factory()->kasir()->create(['is_active' => false, 'password' => bcrypt('password')]);

        $this->post('/login', ['email' => $user->email, 'password' => 'password'])
            ->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_cashier_cannot_access_settings(): void
    {
        $cashier = User::factory()->kasir()->create();

        $this->actingAs($cashier)->get('/pengaturan')->assertForbidden();
        $this->actingAs($cashier)->post('/pengaturan/pengguna', [
            'name' => 'X', 'email' => 'x@x.test', 'password' => 'password12', 'role' => 'kasir',
        ])->assertForbidden();
    }

    public function test_owner_cannot_deactivate_their_own_account(): void
    {
        $owner = User::factory()->pemilik()->create(['is_active' => true]);

        $this->actingAs($owner)
            ->from('/pengaturan')
            ->put("/pengaturan/pengguna/{$owner->id}", [
                'name' => $owner->name,
                'email' => $owner->email,
                'role' => 'pemilik',
                'is_active' => false,
            ])->assertSessionHas('error');

        $this->assertTrue($owner->fresh()->is_active);
    }
}
