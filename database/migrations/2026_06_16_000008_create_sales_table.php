<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_no')->unique();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->bigInteger('subtotal');
            $table->bigInteger('discount')->default(0);
            $table->bigInteger('total');
            $table->string('payment_method'); // tunai | utang
            $table->bigInteger('paid_amount')->default(0);
            $table->bigInteger('change_amount')->default(0);
            $table->string('status'); // lunas | utang
            $table->string('note')->nullable();
            $table->timestamps();

            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
