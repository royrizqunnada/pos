<?php

namespace App\Http\Controllers;

use App\Http\Requests\PayDebtRequest;
use App\Http\Requests\StoreCustomerRequest;
use App\Http\Requests\UpdateCustomerRequest;
use App\Models\Customer;
use App\Models\CustomerPayment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Customer::class);

        $customers = Customer::query()
            ->when($request->string('search')->toString(), function ($q, $search) {
                $q->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->when($request->boolean('with_debt'), fn ($q) => $q->withDebt())
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('pelanggan/index', [
            'customers' => $customers,
            'filters' => [
                'search' => $request->string('search')->toString(),
                'with_debt' => $request->boolean('with_debt'),
            ],
            'summary' => [
                'total_customers' => Customer::count(),
                'debtor_count' => Customer::withDebt()->count(),
                'total_debt' => (int) Customer::sum('debt'),
            ],
            'can' => [
                'delete' => $request->user()->isPemilik(),
            ],
        ]);
    }

    public function show(Customer $customer): Response
    {
        $this->authorize('view', $customer);

        $customer->load([
            'sales' => fn ($q) => $q->latest()->limit(20),
            'payments' => fn ($q) => $q->with('user:id,name')->latest('paid_at')->limit(20),
        ]);

        return Inertia::render('pelanggan/show', [
            'customer' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'phone' => $customer->phone,
                'address' => $customer->address,
                'note' => $customer->note,
                'debt' => (int) $customer->debt,
            ],
            'sales' => $customer->sales->map(fn ($s) => [
                'id' => $s->id,
                'invoice_no' => $s->invoice_no,
                'created_at' => $s->created_at->toIso8601String(),
                'total' => (int) $s->total,
                'status' => $s->status,
            ]),
            'payments' => $customer->payments->map(fn (CustomerPayment $p) => [
                'id' => $p->id,
                'amount' => (int) $p->amount,
                'note' => $p->note,
                'paid_at' => $p->paid_at->toIso8601String(),
                'cashier' => $p->user?->name,
            ]),
        ]);
    }

    public function store(StoreCustomerRequest $request): RedirectResponse
    {
        Customer::create($request->validated());

        return back()->with('success', 'Pelanggan berhasil ditambahkan.');
    }

    public function update(UpdateCustomerRequest $request, Customer $customer): RedirectResponse
    {
        $customer->update($request->validated());

        return back()->with('success', 'Pelanggan berhasil diperbarui.');
    }

    public function destroy(Customer $customer): RedirectResponse
    {
        $this->authorize('delete', $customer);

        if ((int) $customer->debt > 0) {
            return back()->with('error', 'Pelanggan masih memiliki utang dan tidak dapat dihapus.');
        }

        $customer->delete();

        return redirect()->route('pelanggan.index')->with('success', 'Pelanggan berhasil dihapus.');
    }

    public function payDebt(PayDebtRequest $request, Customer $customer): RedirectResponse
    {
        $amount = (int) $request->validated('amount');

        DB::transaction(function () use ($request, $customer, $amount) {
            $locked = Customer::query()->lockForUpdate()->findOrFail($customer->id);

            $pay = min($amount, (int) $locked->debt);
            $locked->decrement('debt', $pay);

            $locked->payments()->create([
                'user_id' => $request->user()->id,
                'amount' => $pay,
                'note' => $request->validated('note'),
                'paid_at' => now(),
            ]);
        });

        return back()->with('success', 'Pembayaran utang berhasil dicatat.');
    }
}
