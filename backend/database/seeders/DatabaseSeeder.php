<?php

namespace Database\Seeders;

use App\Models\Comment;
use App\Models\Organization;
use App\Models\SlaPolicy;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Organization A — Acme
        $acme = Organization::create([
            'name' => 'Acme Corp',
            'slug' => 'acme',
        ]);

        $acmeAdmin = User::create([
            'name' => 'Alice Admin',
            'email' => 'admin@acme.test',
            'password' => Hash::make('password'),
            'organization_id' => $acme->id,
            'role' => 'admin',
        ]);

        $acmeAgent = User::create([
            'name' => 'Alex Agent',
            'email' => 'agent@acme.test',
            'password' => Hash::make('password'),
            'organization_id' => $acme->id,
            'role' => 'agent',
        ]);

        $acmeCustomer = User::create([
            'name' => 'Charlie Customer',
            'email' => 'customer@acme.test',
            'password' => Hash::make('password'),
            'organization_id' => $acme->id,
            'role' => 'customer',
        ]);

        // SLA policies for Acme
        foreach ([
            ['urgent', 30, 480],
            ['high', 60, 960],
            ['medium', 120, 1440],
            ['low', 480, 2880],
        ] as [$priority, $resp, $res]) {
            SlaPolicy::create([
                'organization_id' => $acme->id,
                'priority' => $priority,
                'response_minutes' => $resp,
                'resolution_minutes' => $res,
            ]);
        }

        // Acme ticket + comments
        $acmeTicket = Ticket::create([
            'organization_id' => $acme->id,
            'subject' => 'Login page returns 500 error',
            'description' => 'When I try to log in, the page shows a 500 error. This started happening this morning.',
            'status' => 'open',
            'priority' => 'urgent',
            'requester_id' => $acmeCustomer->id,
            'assignee_id' => $acmeAgent->id,
        ]);

        Comment::create([
            'ticket_id' => $acmeTicket->id,
            'author_id' => $acmeAgent->id,
            'body' => 'Looking into this now. Can you share the exact URL?',
            'is_internal' => false,
        ]);

        Comment::create([
            'ticket_id' => $acmeTicket->id,
            'author_id' => $acmeAdmin->id,
            'body' => 'Escalating — possible database connection issue.',
            'is_internal' => true,
        ]);

        // Organization B — Globex (for isolation testing)
        $globex = Organization::create([
            'name' => 'Globex Inc',
            'slug' => 'globex',
        ]);

        $globexAdmin = User::create([
            'name' => 'Greg Globex',
            'email' => 'admin@globex.test',
            'password' => Hash::make('password'),
            'organization_id' => $globex->id,
            'role' => 'admin',
        ]);

        $globexCustomer = User::create([
            'name' => 'Gina Globex',
            'email' => 'customer@globex.test',
            'password' => Hash::make('password'),
            'organization_id' => $globex->id,
            'role' => 'customer',
        ]);

        // Globex ticket + comment
        $globexTicket = Ticket::create([
            'organization_id' => $globex->id,
            'subject' => 'Globex private ticket',
            'description' => 'This should never be visible to Acme users.',
            'status' => 'open',
            'priority' => 'medium',
            'requester_id' => $globexCustomer->id,
        ]);

        Comment::create([
            'ticket_id' => $globexTicket->id,
            'author_id' => $globexAdmin->id,
            'body' => 'Internal Globex discussion — not for Acme eyes.',
            'is_internal' => true,
        ]);
    }
}
