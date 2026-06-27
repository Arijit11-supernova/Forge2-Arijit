<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use Illuminate\Http\Request;

class PortalController extends Controller
{
    public function myTickets(Request $request)
    {
        $tickets = Ticket::where('requester_id', $request->user()->id)
            ->with(['assignee:id,name'])
            ->latest()
            ->paginate(15);

        return response()->json($tickets);
    }
}
