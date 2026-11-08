<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * v2: the tapper became two arcade games (Promise Catcher + Whack-a-Politician).
 * Every finished run is stored; per-game leaderboards are the best run score
 * per player inside the period.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_runs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('mode', 16);                 // catcher | whack
            $table->unsignedInteger('score');
            $table->unsignedInteger('submitted_score'); // what the client sent (before clamping)
            $table->unsignedInteger('duration_ms');
            $table->unsignedInteger('max_combo')->default(0);
            $table->string('character_id', 64)->nullable();
            $table->boolean('flagged')->default(false); // clamped by anti-cheat
            $table->timestamp('created_at')->useCurrent();

            $table->index(['mode', 'created_at', 'score']);
            $table->index(['user_id', 'mode']);
        });

        Schema::table('player_progress', function (Blueprint $table) {
            $table->unsignedInteger('best_catcher')->default(0)->after('best_combo');
            $table->unsignedInteger('best_whack')->default(0)->after('best_catcher');
            $table->unsignedInteger('total_runs')->default(0)->after('best_whack');
        });

        Schema::table('player_progress', function (Blueprint $table) {
            $table->dropColumn(['best_boss', 'best_duel', 'boss_level']);
        });
    }

    public function down(): void
    {
        Schema::table('player_progress', function (Blueprint $table) {
            $table->unsignedInteger('best_boss')->default(0);
            $table->unsignedInteger('best_duel')->default(0);
            $table->unsignedInteger('boss_level')->default(1);
            $table->dropColumn(['best_catcher', 'best_whack', 'total_runs']);
        });
        Schema::dropIfExists('game_runs');
    }
};
