<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SlaPolicy;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        $orgId = $request->user()->organization_id;

        $statusCounts = Ticket::where('organization_id', $orgId)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        $priorityCounts = Ticket::where('organization_id', $orgId)
            ->select('priority', DB::raw('count(*) as count'))
            ->groupBy('priority')
            ->pluck('count', 'priority');

        $total = Ticket::where('organization_id', $orgId)->count();

        return response()->json([
            'total' => $total,
            'by_status' => [
                'open' => $statusCounts->get('open', 0),
                'pending' => $statusCounts->get('pending', 0),
                'resolved' => $statusCounts->get('resolved', 0),
                'closed' => $statusCounts->get('closed', 0),
            ],
            'by_priority' => [
                'low' => $priorityCounts->get('low', 0),
                'medium' => $priorityCounts->get('medium', 0),
                'high' => $priorityCounts->get('high', 0),
                'urgent' => $priorityCounts->get('urgent', 0),
            ],
        ]);
    }

    public function activity(Request $request, Ticket $ticket)
    {
        $this->authorize('view', $ticket);

        $logs = $ticket->activityLogs()
            ->with('actor:id,name,email')
            ->latest()
            ->get();

        return response()->json($logs);
    }

    public function sla(Request $request, Ticket $ticket)
    {
        $this->authorize('view', $ticket);

        $policy = SlaPolicy::where('organization_id', $ticket->organization_id)
            ->where('priority', $ticket->priority)
            ->first();

        if (! $policy) {
            return response()->json(['has_policy' => false]);
        }

        $createdAt = $ticket->created_at;
        $responseDue = $createdAt->copy()->addMinutes($policy->response_minutes);
        $resolutionDue = $createdAt->copy()->addMinutes($policy->resolution_minutes);
        $now = now();

        return response()->json([
            'has_policy' => true,
            'response_minutes' => $policy->response_minutes,
            'resolution_minutes' => $policy->resolution_minutes,
            'response_due_at' => $responseDue->toIso8601String(),
            'resolution_due_at' => $resolutionDue->toIso8601String(),
            'response_breached' => $now->gt($responseDue),
            'resolution_breached' => $now->gt($resolutionDue),
            'response_remaining_minutes' => max(0, $now->diffInMinutes($responseDue, false)),
            'resolution_remaining_minutes' => max(0, $now->diffInMinutes($resolutionDue, false)),
        ]);
    }
}
