<?php

namespace Tests\Feature;

use App\Models\Comment;
use App\Models\Organization;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommentApiTest extends TestCase
{
    use RefreshDatabase;

    private Organization $org;

    private User $admin;

    private User $agent;

    private User $customer;

    private Ticket $ticket;

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
        $this->ticket = Ticket::factory()->create([
            'organization_id' => $this->org->id,
            'requester_id' => $this->customer->id,
        ]);
    }

    private function auth(User $user): array
    {
        return ['Authorization' => 'Bearer '.$user->createToken('test')->plainTextToken];
    }

    public function test_anyone_in_org_can_comment(): void
    {
        $resp = $this->withHeaders($this->auth($this->customer))
            ->postJson("/api/tickets/{$this->ticket->id}/comments", [
                'body' => 'Public reply',
            ]);

        $resp->assertStatus(201)
            ->assertJsonPath('body', 'Public reply')
            ->assertJsonPath('is_internal', false);
    }

    public function test_agent_can_add_internal_note(): void
    {
        $resp = $this->withHeaders($this->auth($this->agent))
            ->postJson("/api/tickets/{$this->ticket->id}/comments", [
                'body' => 'Internal investigation notes',
                'is_internal' => true,
            ]);

        $resp->assertStatus(201)
            ->assertJsonPath('is_internal', true);
    }

    public function test_customer_cannot_create_internal_note(): void
    {
        $resp = $this->withHeaders($this->auth($this->customer))
            ->postJson("/api/tickets/{$this->ticket->id}/comments", [
                'body' => 'Trying to be internal',
                'is_internal' => true,
            ]);

        $resp->assertStatus(201)
            ->assertJsonPath('is_internal', false);
    }

    public function test_customer_only_sees_public_comments(): void
    {
        Comment::create([
            'organization_id' => $this->org->id,
            'ticket_id' => $this->ticket->id,
            'author_id' => $this->agent->id,
            'body' => 'Public comment',
            'is_internal' => false,
        ]);
        Comment::create([
            'organization_id' => $this->org->id,
            'ticket_id' => $this->ticket->id,
            'author_id' => $this->agent->id,
            'body' => 'Secret internal',
            'is_internal' => true,
        ]);

        $resp = $this->withHeaders($this->auth($this->customer))
            ->getJson("/api/tickets/{$this->ticket->id}/comments");

        $resp->assertStatus(200);
        $this->assertEquals(1, $resp->json('total'));
        $this->assertEquals('Public comment', $resp->json('data.0.body'));
    }

    public function test_agent_sees_all_comments(): void
    {
        Comment::create([
            'organization_id' => $this->org->id,
            'ticket_id' => $this->ticket->id,
            'author_id' => $this->agent->id,
            'body' => 'Public',
            'is_internal' => false,
        ]);
        Comment::create([
            'organization_id' => $this->org->id,
            'ticket_id' => $this->ticket->id,
            'author_id' => $this->agent->id,
            'body' => 'Internal',
            'is_internal' => true,
        ]);

        $resp = $this->withHeaders($this->auth($this->agent))
            ->getJson("/api/tickets/{$this->ticket->id}/comments");

        $resp->assertStatus(200);
        $this->assertEquals(2, $resp->json('total'));
    }

    public function test_author_can_edit_own_comment(): void
    {
        $comment = Comment::create([
            'organization_id' => $this->org->id,
            'ticket_id' => $this->ticket->id,
            'author_id' => $this->agent->id,
            'body' => 'Original',
            'is_internal' => false,
        ]);

        $resp = $this->withHeaders($this->auth($this->agent))
            ->putJson("/api/comments/{$comment->id}", ['body' => 'Edited']);

        $resp->assertStatus(200)
            ->assertJsonPath('body', 'Edited');
    }

    public function test_non_author_non_admin_cannot_edit_comment(): void
    {
        $comment = Comment::create([
            'organization_id' => $this->org->id,
            'ticket_id' => $this->ticket->id,
            'author_id' => $this->agent->id,
            'body' => 'Agent wrote this',
            'is_internal' => false,
        ]);

        $resp = $this->withHeaders($this->auth($this->customer))
            ->putJson("/api/comments/{$comment->id}", ['body' => 'Hacked']);

        $resp->assertStatus(403);
    }

    public function test_admin_can_delete_any_comment(): void
    {
        $comment = Comment::create([
            'organization_id' => $this->org->id,
            'ticket_id' => $this->ticket->id,
            'author_id' => $this->agent->id,
            'body' => 'To be deleted',
            'is_internal' => true,
        ]);

        $resp = $this->withHeaders($this->auth($this->admin))
            ->deleteJson("/api/comments/{$comment->id}");

        $resp->assertStatus(200);
        $this->assertDatabaseMissing('comments', ['id' => $comment->id]);
    }

    public function test_cross_org_comment_denied(): void
    {
        $orgB = Organization::create(['name' => 'Globex', 'slug' => 'globex']);
        $userB = User::create([
            'name' => 'B', 'email' => 'b@globex.test', 'password' => 'Password123!',
            'organization_id' => $orgB->id, 'role' => 'admin',
        ]);

        $resp = $this->withHeaders($this->auth($userB))
            ->postJson("/api/tickets/{$this->ticket->id}/comments", ['body' => 'Intrusion']);

        // 404 because the BelongsToOrg global scope hides the ticket
        // from the other-org user before the policy is even checked
        $resp->assertStatus(404);
    }
}
