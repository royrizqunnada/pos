<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Pemilik (owner) has full access to every gate.
        Gate::before(fn (User $user, string $ability) => $user->isPemilik() ? true : null);

        // Owner-only abilities. Kasir is implicitly denied (Gate::before returns null for them).
        Gate::define('manage-master', fn (User $user) => $user->isPemilik());
        Gate::define('manage-users', fn (User $user) => $user->isPemilik());
        Gate::define('manage-settings', fn (User $user) => $user->isPemilik());
        Gate::define('view-profit', fn (User $user) => $user->isPemilik());
        Gate::define('view-cost-price', fn (User $user) => $user->isPemilik());
        Gate::define('manage-purchases', fn (User $user) => $user->isPemilik());
    }
}
