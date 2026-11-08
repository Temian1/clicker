<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('characters', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('title');
            $table->text('bio');
            $table->unsignedBigInteger('unlock_cost')->default(0);
            $table->decimal('coin_bonus', 6, 2)->default(1);
            $table->json('look');               // layered SVG config (colours, headwear, props…)
            $table->json('lines')->nullable();  // voice lines per stage
            $table->json('promises')->nullable();
            $table->boolean('coming_soon')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('characters');
    }
};
