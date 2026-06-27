<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $notifications = Notification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->with('ticket:id,subject')
            ->latest()
            ->limit(50)
            ->get();

        return response()->json([
            'data' => $notifications,
            'unread_count' => $notifications->count(),
        ]);
    }

    public function markRead(Request $request, $id)
    {
        $notification = Notification::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->firstOrFail();

        $notification->update(['read_at' => now()]);

        return response()->json(['message' => 'Marked as read.']);
    }
}
