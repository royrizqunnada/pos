<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\User;

class ProductPolicy
{
    /** Both roles can browse the product / stock list. */
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Product $product): bool
    {
        return true;
    }

    /** Managing master products (incl. cost price) is owner-only. */
    public function create(User $user): bool
    {
        return $user->isPemilik();
    }

    public function update(User $user, Product $product): bool
    {
        return $user->isPemilik();
    }

    public function delete(User $user, Product $product): bool
    {
        return $user->isPemilik();
    }

    /** Stock add / adjustment is an owner operation. */
    public function manageStock(User $user, Product $product): bool
    {
        return $user->isPemilik();
    }
}
