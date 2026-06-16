<?php

namespace App\Policies;

use App\Models\Customer;
use App\Models\User;

class CustomerPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Customer $customer): bool
    {
        return true;
    }

    /** Cashiers may add and edit customers. */
    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Customer $customer): bool
    {
        return true;
    }

    /** Cashiers may record debt payments. */
    public function recordPayment(User $user, Customer $customer): bool
    {
        return true;
    }

    /** Deleting master data is owner-only. */
    public function delete(User $user, Customer $customer): bool
    {
        return $user->isPemilik();
    }
}
