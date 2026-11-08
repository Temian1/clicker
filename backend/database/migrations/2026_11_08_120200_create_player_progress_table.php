<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('player_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('total_earned')->default(0);
            $table->unsignedBigInteger('total_taps')->default(0);
            $table->unsignedInteger('best_combo')->default(0);
            $table->unsignedInteger('best_boss')->default(0);
            $table->unsignedInteger('best_duel')->default(0);
            $table->unsignedInteger('boss_level')->default(1);
            $table->string('selected_character')->nullable();
            $table->json('state')->nullable();      // full client save for cloud sync
            $table->timestamp('last_sync_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('player_progress');
    }
};
