<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PublicTicketController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'subject' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string', 'max:5000'],
            'organization_slug' => ['sometimes', 'string', 'exists:organizations,slug'],
        ]);

        $org = $data['organization_slug'] ?? 'acme';
        $organization = Organization::where('slug', $org)->firstOrFail();

        // Find or create a user for this email within the org
        $user = User::firstOrCreate(
            ['email' => $data['email'], 'organization_id' => $organization->id],
            [
                'name' => $data['name'],
                'password' => bcrypt(Str::random(32)),
                'role' => 'customer',
                'organization_id' => $organization->id,
            ]
        );

        $ticket = Ticket::create([
            'subject' => $data['subject'],
            'description' => $data['body'],
            'status' => 'open',
            'priority' => 'medium',
            'requester_id' => $user->id,
            'organization_id' => $organization->id,
        ]);

        return response()->json([
            'message' => 'Ticket submitted successfully.',
            'ticket_id' => $ticket->id,
        ], 201);
    }
}
