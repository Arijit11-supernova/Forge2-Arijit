<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CannedResponse;
use Illuminate\Http\Request;

class CannedResponseController extends Controller
{
    public function index(Request $request)
    {
        $responses = CannedResponse::where('organization_id', $request->user()->organization_id)
            ->orderBy('title')
            ->get(['id', 'title', 'body']);

        return response()->json(['data' => $responses]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string'],
        ]);

        $response = CannedResponse::create([
            ...$data,
            'organization_id' => $request->user()->organization_id,
        ]);

        return response()->json($response, 201);
    }

    public function destroy(Request $request, CannedResponse $cannedResponse)
    {
        $cannedResponse->delete();

        return response()->json(['message' => 'Deleted.']);
    }
}
