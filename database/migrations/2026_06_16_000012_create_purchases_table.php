<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchases', function (Blueprint $table) {
            $table->id();
            $table->string('ref_no');
            $table->foreignId('supplier_id')->constrained()->restrictOnDelete();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->bigInteger('total');
            $table->string('note')->nullable();
            $table->date('purchased_at');
            $table->timestamps();

            $table->index('purchased_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchases');
    }
};
