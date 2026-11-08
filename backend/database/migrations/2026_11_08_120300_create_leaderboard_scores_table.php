<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leaderboard_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('period', 8);        // daily | weekly | all
            $table->string('period_key', 16);   // 2026-11-08 | 2026-W45 | all
            $table->unsignedBigInteger('score')->default(0);
            $table->timestamps();

            $table->unique(['user_id', 'period', 'period_key']);
            $table->index(['period', 'period_key', 'score']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leaderboard_scores');
    }
};
