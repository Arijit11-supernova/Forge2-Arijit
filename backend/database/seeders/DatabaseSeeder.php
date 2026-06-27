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

        $acmeAgent1 = User::create([
            'name' => 'Alex Agent',
            'email' => 'agent@acme.test',
            'password' => Hash::make('password'),
            'organization_id' => $acme->id,
            'role' => 'agent',
        ]);

        $acmeAgent2 = User::create([
            'name' => 'Amy Agent',
            'email' => 'agent2@acme.test',
            'password' => Hash::make('password'),
            'organization_id' => $acme->id,
            'role' => 'agent',
        ]);

        $acmeCustomer1 = User::create([
            'name' => 'Charlie Customer',
            'email' => 'customer@acme.test',
            'password' => Hash::make('password'),
            'organization_id' => $acme->id,
            'role' => 'customer',
        ]);

        $acmeCustomer2 = User::create([
            'name' => 'Carol Customer',
            'email' => 'customer2@acme.test',
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

        // Acme tickets (~12)
        $acmeTickets = [
            ['Login page returns 500 error', 'When I try to log in, the page shows a 500 error. This started happening this morning.', 'open', 'urgent', $acmeCustomer1->id, $acmeAgent1->id],
            ['Cannot reset password', 'The password reset email never arrives. Checked spam folder too.', 'open', 'high', $acmeCustomer2->id, $acmeAgent1->id],
            ['Dashboard not loading', 'The dashboard shows a blank screen after login. Console shows JS errors.', 'pending', 'high', $acmeCustomer1->id, $acmeAgent2->id],
            ['Export to CSV broken', 'When I click Export, nothing happens. No download starts.', 'open', 'medium', $acmeCustomer2->id, $acmeAgent2->id],
            ['Slow response times', 'The app is very slow during peak hours. Pages take 10+ seconds to load.', 'pending', 'medium', $acmeCustomer1->id, $acmeAgent1->id],
            ['Mobile layout broken', 'On iPhone the sidebar overlaps the main content making it unusable.', 'open', 'medium', $acmeCustomer2->id, null],
            ['2FA not working', 'After enabling 2FA, I cannot log in even with the correct code.', 'resolved', 'urgent', $acmeCustomer1->id, $acmeAgent1->id],
            ['Billing page error', 'The billing page shows an error when trying to update payment method.', 'open', 'high', $acmeCustomer2->id, $acmeAgent2->id],
            ['Search not returning results', 'Search for known ticket subjects returns no results.', 'pending', 'low', $acmeCustomer1->id, $acmeAgent2->id],
            ['Email notifications delayed', 'Email notifications are arriving hours late or not at all.', 'open', 'medium', $acmeCustomer2->id, $acmeAgent1->id],
            ['Cannot attach files', 'File attachment button does nothing when clicked.', 'closed', 'low', $acmeCustomer1->id, $acmeAgent2->id],
            ['Dark mode not saving', 'Every time I log out, dark mode preference is reset to light.', 'open', 'low', $acmeCustomer2->id, null],
        ];

        foreach ($acmeTickets as [$subject, $description, $status, $priority, $requesterId, $assigneeId]) {
            $ticket = Ticket::create([
                'organization_id' => $acme->id,
                'subject' => $subject,
                'description' => $description,
                'status' => $status,
                'priority' => $priority,
                'requester_id' => $requesterId,
                'assignee_id' => $assigneeId,
            ]);

            Comment::create([
                'organization_id' => $acme->id,
                'ticket_id' => $ticket->id,
                'author_id' => $acmeAgent1->id,
                'body' => 'Thanks for reporting. We are looking into this.',
                'is_internal' => false,
            ]);

            Comment::create([
                'organization_id' => $acme->id,
                'ticket_id' => $ticket->id,
                'author_id' => $acmeAdmin->id,
                'body' => 'Internal note: assigned and being tracked.',
                'is_internal' => true,
            ]);
        }

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

        $globexAgent = User::create([
            'name' => 'Gary Agent',
            'email' => 'agent@globex.test',
            'password' => Hash::make('password'),
            'organization_id' => $globex->id,
            'role' => 'agent',
        ]);

        $globexCustomer1 = User::create([
            'name' => 'Gina Globex',
            'email' => 'customer@globex.test',
            'password' => Hash::make('password'),
            'organization_id' => $globex->id,
            'role' => 'customer',
        ]);

        $globexCustomer2 = User::create([
            'name' => 'George Globex',
            'email' => 'customer2@globex.test',
            'password' => Hash::make('password'),
            'organization_id' => $globex->id,
            'role' => 'customer',
        ]);

        // Globex tickets (for isolation proof)
        $globexTickets = [
            ['Globex private ticket', 'This should never be visible to Acme users.', 'open', 'medium', $globexCustomer1->id, $globexAgent->id],
            ['Globex billing issue', 'Private Globex billing problem.', 'open', 'high', $globexCustomer2->id, $globexAgent->id],
            ['Globex API integration', 'Our API integration stopped working.', 'pending', 'urgent', $globexCustomer1->id, $globexAdmin->id],
        ];

        foreach ($globexTickets as [$subject, $description, $status, $priority, $requesterId, $assigneeId]) {
            $ticket = Ticket::create([
                'organization_id' => $globex->id,
                'subject' => $subject,
                'description' => $description,
                'status' => $status,
                'priority' => $priority,
                'requester_id' => $requesterId,
                'assignee_id' => $assigneeId,
            ]);

            Comment::create([
                'organization_id' => $globex->id,
                'ticket_id' => $ticket->id,
                'author_id' => $globexAdmin->id,
                'body' => 'Internal Globex discussion — not for Acme eyes.',
                'is_internal' => true,
            ]);
        }
    }
}
