<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateStoreSettingRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\ActivityLog;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
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
            'logs' => $this->mapLogs(
                ActivityLog::with('user:id,name')->latest()->limit(15)->get()
            ),
        ]);
    }

    /** Full, paginated & filterable activity log. */
    public function activity(Request $request): Response
    {
        $logs = ActivityLog::query()
            ->with('user:id,name')
            ->when($request->string('event')->toString(), fn ($q, $e) => $q->where('event', $e))
            ->when($request->date('from'), fn ($q, $d) => $q->where('created_at', '>=', $d->startOfDay()))
            ->when($request->date('to'), fn ($q, $d) => $q->where('created_at', '<=', $d->endOfDay()))
            ->when($request->string('search')->toString(), fn ($q, $s) => $q->where('description', 'like', "%{$s}%"))
            ->latest()
            ->paginate(30)
            ->withQueryString();

        return Inertia::render('pengaturan/log', [
            'logs' => $logs->through(fn (ActivityLog $l) => $this->mapLog($l)),
            'events' => ActivityLog::query()->distinct()->orderBy('event')->pluck('event'),
            'filters' => [
                'event' => $request->string('event')->toString() ?: null,
                'from' => $request->string('from')->toString() ?: null,
                'to' => $request->string('to')->toString() ?: null,
                'search' => $request->string('search')->toString(),
            ],
        ]);
    }

    /** @param  Collection<int, ActivityLog>  $logs */
    private function mapLogs($logs): array
    {
        return $logs->map(fn (ActivityLog $l) => $this->mapLog($l))->all();
    }

    private function mapLog(ActivityLog $log): array
    {
        return [
            'id' => $log->id,
            'event' => $log->event,
            'description' => $log->description,
            'user' => $log->user?->name ?? 'Sistem',
            'ip_address' => $log->ip_address,
            'created_at' => $log->created_at->toIso8601String(),
        ];
    }

    public function updateStore(UpdateStoreSettingRequest $request): RedirectResponse
    {
        Setting::current()->update($request->validated());

        ActivityLog::record('pengaturan.toko', 'Memperbarui profil toko.');

        return back()->with('success', 'Profil toko berhasil disimpan.');
    }

    public function storeUser(StoreUserRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => bcrypt($data['password']),
            'role' => $data['role'],
            'is_active' => $data['is_active'] ?? true,
            'email_verified_at' => now(),
        ]);

        ActivityLog::record('pengaturan.pengguna.buat', "Membuat akun {$user->role} \"{$user->name}\".", $user);

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

        ActivityLog::record('pengaturan.pengguna.ubah', "Memperbarui akun \"{$user->name}\".", $user);

        return back()->with('success', 'Akun pengguna berhasil diperbarui.');
    }
}
