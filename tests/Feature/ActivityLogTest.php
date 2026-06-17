<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Category;
use App\Models\Product;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ActivityLogTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_is_logged(): void
    {
        $user = User::factory()->pemilik()->create(['password' => bcrypt('password')]);

        $this->post('/login', ['email' => $user->email, 'password' => 'password']);

        $this->assertDatabaseHas('activity_logs', [
            'event' => 'auth.login',
            'user_id' => $user->id,
        ]);
    }

    public function test_logout_is_logged(): void
    {
        $user = User::factory()->kasir()->create();

        $this->actingAs($user)->post('/logout');

        $this->assertDatabaseHas('activity_logs', [
            'event' => 'auth.logout',
            'user_id' => $user->id,
        ]);
    }

    public function test_creating_a_product_is_logged(): void
    {
        $owner = User::factory()->pemilik()->create();
        $category = Category::factory()->create();
        $unit = Unit::factory()->create();

        $this->actingAs($owner)->post('/barang', [
            'name' => 'Semen Gresik 40kg',
            'category_id' => $category->id,
            'unit_id' => $unit->id,
            'cost_price' => 60000,
            'sell_price' => 65000,
            'stock' => 10,
            'min_stock' => 2,
        ])->assertRedirect();

        $this->assertDatabaseHas('activity_logs', [
            'event' => 'barang.buat',
            'user_id' => $owner->id,
        ]);
    }

    public function test_owner_can_view_the_activity_log_page(): void
    {
        $owner = User::factory()->pemilik()->create();
        ActivityLog::record('penjualan.buat', 'Contoh aktivitas.');

        $this->actingAs($owner)->get('/pengaturan/log')->assertOk();
    }

    public function test_cashier_cannot_view_the_activity_log(): void
    {
        $cashier = User::factory()->kasir()->create();

        $this->actingAs($cashier)->get('/pengaturan/log')->assertForbidden();
    }

    public function test_record_resolves_the_authenticated_user_and_subject(): void
    {
        $owner = User::factory()->pemilik()->create();
        $product = Product::factory()->create();

        $this->actingAs($owner);
        $log = ActivityLog::record('barang.ubah', 'Mengubah barang.', $product);

        $this->assertSame($owner->id, $log->user_id);
        $this->assertSame($product->id, $log->subject_id);
        $this->assertSame($product->getMorphClass(), $log->subject_type);
    }
}
