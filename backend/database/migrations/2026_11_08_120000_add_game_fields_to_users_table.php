<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // guests play with just a device id + nickname; email/password are optional (account upgrade)
            $table->string('email')->nullable()->change();
            $table->string('password')->nullable()->change();
            $table->string('device_id', 64)->nullable()->unique()->after('id');
            $table->string('avatar', 16)->default('😎')->after('name');
            $table->boolean('is_admin')->default(false);
            $table->boolean('is_banned')->default(false);
            $table->timestamp('last_seen_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['device_id']);
            $table->dropColumn(['device_id', 'avatar', 'is_admin', 'is_banned', 'last_seen_at']);
        });
    }
};
