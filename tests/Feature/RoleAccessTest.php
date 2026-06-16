<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Tests\TestCase;

class RoleAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_passes_owner_only_gates(): void
    {
        $owner = User::factory()->pemilik()->create();

        $this->assertTrue(Gate::forUser($owner)->allows('manage-master'));
        $this->assertTrue(Gate::forUser($owner)->allows('view-profit'));
        $this->assertTrue(Gate::forUser($owner)->allows('manage-users'));
    }

    public function test_cashier_is_denied_owner_only_gates(): void
    {
        $cashier = User::factory()->kasir()->create();

        $this->assertFalse(Gate::forUser($cashier)->allows('manage-master'));
        $this->assertFalse(Gate::forUser($cashier)->allows('view-profit'));
        $this->assertFalse(Gate::forUser($cashier)->allows('manage-users'));
    }

    public function test_role_helpers_reflect_role(): void
    {
        $this->assertTrue(User::factory()->pemilik()->create()->isPemilik());
        $this->assertTrue(User::factory()->kasir()->create()->isKasir());
    }

    public function test_default_user_role_is_kasir(): void
    {
        $this->assertSame(User::ROLE_KASIR, User::factory()->create()->role);
    }
}
