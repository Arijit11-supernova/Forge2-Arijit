<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TicketCrudApiTest extends TestCase
{
    use RefreshDatabase;

    private Organization $org;

    private User $admin;

    private User $agent;

    private User $customer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->org = Organization::create(['name' => 'Acme', 'slug' => 'acme']);
        $this->admin = User::create([
            'name' => 'Admin', 'email' => 'admin@acme.test', 'password' => 'Password123!',
            'organization_id' => $this->org->id, 'role' => 'admin',
        ]);
        $this->agent = User::create([
            'name' => 'Agent', 'email' => 'agent@acme.test', 'password' => 'Password123!',
            'organization_id' => $this->org->id, 'role' => 'agent',
        ]);
        $this->customer = User::create([
            'name' => 'Customer', 'email' => 'cust@acme.test', 'password' => 'Password123!',
            'organization_id' => $this->org->id, 'role' => 'customer',
        ]);
    }

    private function auth(User $user): array
    {
        return ['Authorization' => 'Bearer '.$user->createToken('test')->plainTextToken];
    }

    public function test_customer_can_create_ticket(): void
    {
        $resp = $this->withHeaders($this->auth($this->customer))
            ->postJson('/api/tickets', [
                'subject' => 'My ticket',
                'description' => 'Something is broken',
            ]);

        $resp->assertStatus(201)
            ->assertJsonPath('subject', 'My ticket')
            ->assertJsonPath('status', 'open')
            ->assertJsonPath('priority', 'medium')
            ->assertJsonPath('requester_id', $this->customer->id);
    }

    public function test_index_returns_paginated_tickets(): void
    {
        Ticket::factory()->count(3)->create([
            'organization_id' => $this->org->id,
            'requester_id' => $this->customer->id,
        ]);

        $resp = $this->withHeaders($this->auth($this->agent))
            ->getJson('/api/tickets');

        $resp->assertStatus(200)
            ->assertJsonStructure([
                'data' => [['id', 'subject', 'status', 'priority']],
                'current_page',
                'total',
            ]);
        $this->assertEquals(3, $resp->json('total'));
    }

    public function test_index_filters_by_status(): void
    {
        Ticket::factory()->create(['organization_id' => $this->org->id, 'requester_id' => $this->customer->id, 'status' => 'open']);
        Ticket::factory()->create(['organization_id' => $this->org->id, 'requester_id' => $this->customer->id, 'status' => 'closed']);

        $resp = $this->withHeaders($this->auth($this->agent))
            ->getJson('/api/tickets?status=open');

        $resp->assertStatus(200);
        $this->assertEquals(1, $resp->json('total'));
        $this->assertEquals('open', $resp->json('data.0.status'));
    }

    public function test_index_search(): void
    {
        Ticket::factory()->create([
            'organization_id' => $this->org->id, 'requester_id' => $this->customer->id,
            'subject' => 'Login broken',
        ]);
        Ticket::factory()->create([
            'organization_id' => $this->org->id, 'requester_id' => $this->customer->id,
            'subject' => 'Billing question',
        ]);

        $resp = $this->withHeaders($this->auth($this->agent))
            ->getJson('/api/tickets?search=Login');

        $resp->assertStatus(200);
        $this->assertEquals(1, $resp->json('total'));
        $this->assertStringContainsString('Login', $resp->json('data.0.subject'));
    }

    public function test_show_returns_ticket_with_relations(): void
    {
        $ticket = Ticket::factory()->create([
            'organization_id' => $this->org->id,
            'requester_id' => $this->customer->id,
        ]);

        $resp = $this->withHeaders($this->auth($this->agent))
            ->getJson("/api/tickets/{$ticket->id}");

        $resp->assertStatus(200)
            ->assertJsonPath('id', $ticket->id)
            ->assertJsonStructure(['requester', 'assignee', 'comments']);
    }

    public function test_agent_can_update_ticket(): void
    {
        $ticket = Ticket::factory()->create([
            'organization_id' => $this->org->id,
            'requester_id' => $this->customer->id,
        ]);

        $resp = $this->withHeaders($this->auth($this->agent))
            ->putJson("/api/tickets/{$ticket->id}", [
                'status' => 'resolved',
                'priority' => 'low',
            ]);

        $resp->assertStatus(200)
            ->assertJsonPath('status', 'resolved')
            ->assertJsonPath('priority', 'low');
    }

    public function test_customer_cannot_update_ticket(): void
    {
        $ticket = Ticket::factory()->create([
            'organization_id' => $this->org->id,
            'requester_id' => $this->customer->id,
        ]);

        $resp = $this->withHeaders($this->auth($this->customer))
            ->putJson("/api/tickets/{$ticket->id}", ['status' => 'resolved']);

        $resp->assertStatus(403);
    }

    public function test_admin_can_delete_ticket(): void
    {
        $ticket = Ticket::factory()->create([
            'organization_id' => $this->org->id,
            'requester_id' => $this->customer->id,
        ]);

        $resp = $this->withHeaders($this->auth($this->admin))
            ->deleteJson("/api/tickets/{$ticket->id}");

        $resp->assertStatus(200);
        $this->assertDatabaseMissing('tickets', ['id' => $ticket->id]);
    }

    public function test_agent_cannot_delete_ticket(): void
    {
        $ticket = Ticket::factory()->create([
            'organization_id' => $this->org->id,
            'requester_id' => $this->customer->id,
        ]);

        $resp = $this->withHeaders($this->auth($this->agent))
            ->deleteJson("/api/tickets/{$ticket->id}");

        $resp->assertStatus(403);
    }

    public function test_cross_org_ticket_access_denied(): void
    {
        $orgB = Organization::create(['name' => 'Globex', 'slug' => 'globex']);
        $userB = User::create([
            'name' => 'B', 'email' => 'b@globex.test', 'password' => 'Password123!',
            'organization_id' => $orgB->id, 'role' => 'admin',
        ]);
        $ticketB = Ticket::factory()->create([
            'organization_id' => $orgB->id, 'requester_id' => $userB->id,
        ]);

        // Acme admin cannot see Globex ticket
        $resp = $this->withHeaders($this->auth($this->admin))
            ->getJson("/api/tickets/{$ticketB->id}");

        $resp->assertStatus(404); // global scope hides it → not found

        // Acme admin cannot update
        $resp = $this->withHeaders($this->auth($this->admin))
            ->putJson("/api/tickets/{$ticketB->id}", ['status' => 'closed']);

        $resp->assertStatus(404);

        // Acme admin cannot delete
        $resp = $this->withHeaders($this->auth($this->admin))
            ->deleteJson("/api/tickets/{$ticketB->id}");

        $resp->assertStatus(404);
    }

    public function test_assignee_must_be_same_org(): void
    {
        $orgB = Organization::create(['name' => 'Globex', 'slug' => 'globex']);
        $userB = User::create([
            'name' => 'B', 'email' => 'b@globex.test', 'password' => 'Password123!',
            'organization_id' => $orgB->id, 'role' => 'agent',
        ]);

        $resp = $this->withHeaders($this->auth($this->agent))
            ->postJson('/api/tickets', [
                'subject' => 'Test',
                'description' => 'Test',
                'assignee_id' => $userB->id,
            ]);

        $resp->assertStatus(422);
    }
}
