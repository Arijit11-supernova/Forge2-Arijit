<?php

namespace Database\Factories;

use App\Models\SlaPolicy;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SlaPolicy>
 */
class SlaPolicyFactory extends Factory
{
    public function definition(): array
    {
        return [
            'priority' => fake()->randomElement(['low', 'medium', 'high', 'urgent']),
            'response_minutes' => fake()->numberBetween(30, 480),
            'resolution_minutes' => fake()->numberBetween(480, 2880),
        ];
    }
}
