<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

trait BelongsToOrg
{
    public static function bootBelongsToOrg(): void
    {
        static::addGlobalScope('organization', function (Builder $builder) {
            if (Auth::check() && Auth::user()->organization_id) {
                $builder->where($builder->getModel()->getTable().'.organization_id', Auth::user()->organization_id);
            }
        });

        static::creating(function ($model) {
            if (! $model->organization_id && Auth::check()) {
                $model->organization_id = Auth::user()->organization_id;
            }
        });
    }
}
