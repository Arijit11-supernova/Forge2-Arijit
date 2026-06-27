<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CannedResponseController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PortalController;
use App\Http\Controllers\Api\PublicTicketController;
use App\Http\Controllers\Api\TicketController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Public ticket submission (throttled)
Route::middleware('throttle:10,1')->post('/public/tickets', [PublicTicketController::class, 'store']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'stats']);
    Route::get('/tickets/{ticket}/activity', [DashboardController::class, 'activity']);
    Route::get('/tickets/{ticket}/sla', [DashboardController::class, 'sla']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead']);

    // Tickets
    Route::get('/tickets/export', [TicketController::class, 'export']);
    Route::patch('/tickets/bulk', [TicketController::class, 'bulkUpdate']);
    Route::post('/tickets/{ticket}/csat', [TicketController::class, 'submitCsat']);
    Route::post('/tickets/{ticket}/merge', [TicketController::class, 'merge']);
    Route::apiResource('tickets', TicketController::class);

    // Comments (nested under tickets for create + index; standalone for update/delete)
    Route::get('/tickets/{ticket}/comments', [CommentController::class, 'index']);
    Route::post('/tickets/{ticket}/comments', [CommentController::class, 'store']);
    Route::put('/comments/{comment}', [CommentController::class, 'update']);
    Route::delete('/comments/{comment}', [CommentController::class, 'destroy']);

    // Canned Responses
    Route::get('/canned-responses', [CannedResponseController::class, 'index']);
    Route::post('/canned-responses', [CannedResponseController::class, 'store']);
    Route::delete('/canned-responses/{cannedResponse}', [CannedResponseController::class, 'destroy']);

    // Customer Portal (own tickets only)
    Route::get('/portal/tickets', [PortalController::class, 'myTickets']);
});
