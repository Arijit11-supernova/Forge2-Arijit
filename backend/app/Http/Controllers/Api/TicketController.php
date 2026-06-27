<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Notification;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\Request;

class TicketController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('create', Ticket::class);

        $tickets = Ticket::query()
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->status))
            ->when($request->filled('priority'), fn ($q) => $q->where('priority', $request->priority))
            ->when($request->filled('assignee_id'), fn ($q) => $q->where('assignee_id', $request->assignee_id))
            ->when($request->filled('requester_id'), fn ($q) => $q->where('requester_id', $request->requester_id))
            ->when($request->filled('search'), function ($q) use ($request) {
                $q->where(function ($q) use ($request) {
                    $q->where('subject', 'like', "%{$request->search}%")
                        ->orWhere('description', 'like', "%{$request->search}%");
                });
            })
            ->with(['requester:id,name,email', 'assignee:id,name,email'])
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return response()->json($tickets);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Ticket::class);

        $data = $request->validate([
            'subject' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'priority' => ['sometimes', 'in:low,medium,high,urgent'],
            'assignee_id' => ['sometimes', 'exists:users,id'],
        ]);

        $data['status'] = $data['status'] ?? 'open';
        $data['priority'] = $data['priority'] ?? 'medium';
        $data['requester_id'] = $request->user()->id;

        if (isset($data['assignee_id'])) {
            $assignee = User::find($data['assignee_id']);
            if ($assignee?->organization_id !== $request->user()->organization_id) {
                return response()->json(['message' => 'Assignee must be in the same organization.'], 422);
            }
        }

        $ticket = Ticket::create($data);

        return response()->json($ticket->load(['requester:id,name,email', 'assignee:id,name,email']), 201);
    }

    public function show(Ticket $ticket)
    {
        $this->authorize('view', $ticket);

        return response()->json($ticket->load([
            'requester:id,name,email',
            'assignee:id,name,email',
            'comments.author:id,name,email',
        ]));
    }

    public function update(Request $request, Ticket $ticket)
    {
        $this->authorize('update', $ticket);

        $data = $request->validate([
            'subject' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'string'],
            'status' => ['sometimes', 'in:open,pending,resolved,closed'],
            'priority' => ['sometimes', 'in:low,medium,high,urgent'],
            'assignee_id' => ['sometimes', 'nullable', 'exists:users,id'],
        ]);

        if (array_key_exists('assignee_id', $data) && $data['assignee_id']) {
            $assignee = User::find($data['assignee_id']);
            if ($assignee?->organization_id !== $request->user()->organization_id) {
                return response()->json(['message' => 'Assignee must be in the same organization.'], 422);
            }
        }

        $oldStatus = $ticket->status;
        $oldAssignee = $ticket->assignee_id;

        $ticket->update($data);

        // Activity log for status change
        if (isset($data['status']) && $data['status'] !== $oldStatus) {
            ActivityLog::create([
                'ticket_id' => $ticket->id,
                'actor_id' => $request->user()->id,
                'action' => 'status_changed',
                'meta' => ['from' => $oldStatus, 'to' => $data['status']],
            ]);
        }

        // Activity log for assignment change + notify new assignee
        if (array_key_exists('assignee_id', $data)) {
            $newAssignee = $data['assignee_id'];
            if ($newAssignee !== $oldAssignee) {
                ActivityLog::create([
                    'ticket_id' => $ticket->id,
                    'actor_id' => $request->user()->id,
                    'action' => 'assignee_changed',
                    'meta' => [
                        'from' => $oldAssignee,
                        'to' => $newAssignee,
                    ],
                ]);

                if ($newAssignee && $newAssignee !== $request->user()->id) {
                    Notification::create([
                        'user_id' => $newAssignee,
                        'organization_id' => $ticket->organization_id,
                        'type' => 'ticket_assigned',
                        'message' => "You have been assigned to \"{$ticket->subject}\"",
                        'ticket_id' => $ticket->id,
                    ]);
                }
            }
        }

        return response()->json($ticket->load(['requester:id,name,email', 'assignee:id,name,email']));
    }

    public function destroy(Ticket $ticket)
    {
        $this->authorize('delete', $ticket);

        $ticket->delete();

        return response()->json(['message' => 'Ticket deleted.'], 200);
    }
}
