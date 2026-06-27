<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
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
