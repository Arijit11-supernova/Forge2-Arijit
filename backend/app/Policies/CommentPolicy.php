<?php

namespace App\Policies;

use App\Models\Comment;
use App\Models\Ticket;
use App\Models\User;

class CommentPolicy
{
    public function view(User $user, Comment $comment): bool
    {
        return $user->organization_id === $comment->organization_id;
    }

    public function create(User $user, Ticket $ticket): bool
    {
        return $user->organization_id === $ticket->organization_id;
    }

    public function update(User $user, Comment $comment): bool
    {
        if ($user->organization_id !== $comment->organization_id) {
            return false;
        }

        return $user->id === $comment->author_id || $user->isAdmin();
    }

    public function delete(User $user, Comment $comment): bool
    {
        if ($user->organization_id !== $comment->organization_id) {
            return false;
        }

        return $user->id === $comment->author_id || $user->isAdmin();
    }
}
