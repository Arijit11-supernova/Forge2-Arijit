<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrg;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CannedResponse extends Model
{
    use BelongsToOrg, HasFactory;

    protected $fillable = ['organization_id', 'title', 'body'];
}
