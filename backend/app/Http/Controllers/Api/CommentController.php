<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Comment;
use App\Models\Notification;
use App\Models\Ticket;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function index(Request $request, Ticket $ticket)
    {
        $this->authorize('create', [Comment::class, $ticket]);

        $onlyPublic = $request->boolean('public_only')
            || $request->user()->isCustomer();

        $comments = $ticket->comments()
            ->when($onlyPublic, fn ($q) => $q->where('is_internal', false))
            ->with('author:id,name,email')
            ->latest()
            ->paginate($request->integer('per_page', 50));

        return response()->json($comments);
    }

    public function store(Request $request, Ticket $ticket)
    {
        $this->authorize('create', [Comment::class, $ticket]);

        $data = $request->validate([
            'body' => ['required', 'string'],
            'is_internal' => ['sometimes', 'boolean'],
        ]);

        if ($request->user()->isCustomer()) {
            $data['is_internal'] = false;
        }

        $comment = $ticket->comments()->create([
            'organization_id' => $ticket->organization_id,
            'author_id' => $request->user()->id,
            'body' => $data['body'],
            'is_internal' => $data['is_internal'] ?? false,
        ]);

        ActivityLog::create([
            'ticket_id' => $ticket->id,
            'actor_id' => $request->user()->id,
            'action' => 'comment_added',
            'meta' => [
                'comment_id' => $comment->id,
                'is_internal' => $comment->is_internal,
            ],
        ]);

        // Notify requester and assignee (not the comment author)
        $recipients = collect([$ticket->requester_id, $ticket->assignee_id])
            ->filter()
            ->unique()
            ->reject(fn ($uid) => $uid === $request->user()->id);

        foreach ($recipients as $uid) {
            Notification::create([
                'user_id' => $uid,
                'organization_id' => $ticket->organization_id,
                'type' => 'comment_added',
                'message' => "New comment on \"{$ticket->subject}\"",
                'ticket_id' => $ticket->id,
            ]);
        }

        return response()->json($comment->load('author:id,name,email'), 201);
    }

    public function update(Request $request, Comment $comment)
    {
        $this->authorize('update', $comment);

        $data = $request->validate([
            'body' => ['sometimes', 'string'],
            'is_internal' => ['sometimes', 'boolean'],
        ]);

        $comment->update($data);

        return response()->json($comment->load('author:id,name,email'));
    }

    public function destroy(Comment $comment)
    {
        $this->authorize('delete', $comment);

        $comment->delete();

        return response()->json(['message' => 'Comment deleted.'], 200);
    }
}
