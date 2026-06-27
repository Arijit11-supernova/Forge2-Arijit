<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->tinyInteger('csat_rating')->nullable()->after('status');
            $table->text('csat_comment')->nullable()->after('csat_rating');
            $table->timestamp('csat_at')->nullable()->after('csat_comment');
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropColumn(['csat_rating', 'csat_comment', 'csat_at']);
        });
    }
};
