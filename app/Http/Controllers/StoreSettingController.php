<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateStoreSettingRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class StoreSettingController extends Controller
{
    public function index(): Response
    {
        $setting = Setting::current();

        return Inertia::render('pengaturan/index', [
            'setting' => [
                'store_name' => $setting->store_name,
                'store_address' => $setting->store_address,
                'store_phone' => $setting->store_phone,
                'receipt_footer' => $setting->receipt_footer,
            ],
            'users' => User::orderBy('name')->get()->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => $u->role,
                'is_active' => $u->is_active,
            ]),
        ]);
    }

    public function updateStore(UpdateStoreSettingRequest $request): RedirectResponse
    {
        Setting::current()->update($request->validated());

        return back()->with('success', 'Profil toko berhasil disimpan.');
    }

    public function storeUser(StoreUserRequest $request): RedirectResponse
    {
        $data = $request->validated();
        User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => bcrypt($data['password']),
            'role' => $data['role'],
            'is_active' => $data['is_active'] ?? true,
            'email_verified_at' => now(),
        ]);

        return back()->with('success', 'Akun pengguna berhasil dibuat.');
    }

    public function updateUser(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $data = $request->validated();

        // Prevent owners from locking themselves out of their own account.
        if ($user->id === $request->user()->id && ($data['is_active'] ?? true) === false) {
            return back()->with('error', 'Anda tidak dapat menonaktifkan akun sendiri.');
        }

        $user->fill([
            'name' => $data['name'],
            'email' => $data['email'],
            'role' => $data['role'],
            'is_active' => $data['is_active'] ?? $user->is_active,
        ]);

        if (! empty($data['password'])) {
            $user->password = bcrypt($data['password']);
        }

        $user->save();

        return back()->with('success', 'Akun pengguna berhasil diperbarui.');
    }
}
