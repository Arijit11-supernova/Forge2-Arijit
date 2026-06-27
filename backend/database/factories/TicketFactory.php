<?php

namespace Database\Factories;

use App\Models\Ticket;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Ticket>
 */
class TicketFactory extends Factory
{
    public function definition(): array
    {
        $priorities = ['low', 'medium', 'high', 'urgent'];
        $statuses = ['open', 'pending', 'resolved', 'closed'];

        return [
            'subject' => fake()->sentence(),
            'description' => fake()->paragraph(),
            'status' => fake()->randomElement($statuses),
            'priority' => fake()->randomElement($priorities),
        ];
    }
}
