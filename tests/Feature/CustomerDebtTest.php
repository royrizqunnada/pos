<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerDebtTest extends TestCase
{
    use RefreshDatabase;

    public function test_payment_reduces_debt_and_is_recorded(): void
    {
        $cashier = User::factory()->kasir()->create();
        $customer = Customer::factory()->create(['debt' => 500000]);

        $this->actingAs($cashier)
            ->post("/pelanggan/{$customer->id}/bayar", ['amount' => 200000, 'note' => 'Cicilan 1'])
            ->assertRedirect();

        $this->assertEquals(300000, $customer->fresh()->debt);
        $this->assertDatabaseHas('customer_payments', [
            'customer_id' => $customer->id,
            'user_id' => $cashier->id,
            'amount' => 200000,
            'note' => 'Cicilan 1',
        ]);
    }

    public function test_full_payment_clears_debt(): void
    {
        $cashier = User::factory()->kasir()->create();
        $customer = Customer::factory()->create(['debt' => 150000]);

        $this->actingAs($cashier)->post("/pelanggan/{$customer->id}/bayar", ['amount' => 150000]);

        $this->assertEquals(0, $customer->fresh()->debt);
    }

    public function test_payment_cannot_exceed_debt(): void
    {
        $cashier = User::factory()->kasir()->create();
        $customer = Customer::factory()->create(['debt' => 100000]);

        $this->actingAs($cashier)
            ->from("/pelanggan/{$customer->id}")
            ->post("/pelanggan/{$customer->id}/bayar", ['amount' => 200000])
            ->assertSessionHasErrors('amount');

        $this->assertEquals(100000, $customer->fresh()->debt);
        $this->assertDatabaseCount('customer_payments', 0);
    }

    public function test_cashier_can_create_customer(): void
    {
        $cashier = User::factory()->kasir()->create();

        $this->actingAs($cashier)
            ->post('/pelanggan', ['name' => 'Tukang Baru', 'phone' => '0811111'])
            ->assertRedirect();

        $this->assertDatabaseHas('customers', ['name' => 'Tukang Baru']);
    }

    public function test_cashier_cannot_delete_customer(): void
    {
        $cashier = User::factory()->kasir()->create();
        $customer = Customer::factory()->create(['debt' => 0]);

        $this->actingAs($cashier)
            ->delete("/pelanggan/{$customer->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('customers', ['id' => $customer->id]);
    }

    public function test_customer_with_debt_cannot_be_deleted(): void
    {
        $owner = User::factory()->pemilik()->create();
        $customer = Customer::factory()->create(['debt' => 50000]);

        $this->actingAs($owner)
            ->from('/pelanggan')
            ->delete("/pelanggan/{$customer->id}")
            ->assertSessionHas('error');

        $this->assertDatabaseHas('customers', ['id' => $customer->id]);
    }
}
