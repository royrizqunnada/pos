<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            // Who performed the action (nullable so a deleted user keeps the trail).
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            // Machine key, e.g. "penjualan.buat", "auth.login".
            $table->string('event');
            // Human-readable Indonesian sentence shown in the UI.
            $table->string('description');
            // Optional polymorphic reference to the affected record.
            $table->string('subject_type')->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            // Extra context (amounts, before/after, etc.).
            $table->json('properties')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['user_id', 'created_at']);
            $table->index('event');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
