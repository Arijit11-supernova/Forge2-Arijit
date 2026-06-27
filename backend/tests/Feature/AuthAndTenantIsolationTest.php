<?php

namespace Tests\Feature;

use App\Models\Comment;
use App\Models\Organization;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthAndTenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_and_receive_token(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'New User',
            'email' => 'new@test.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'organization_name' => 'New Org',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['user' => ['id', 'name', 'email'], 'token']);
    }

    public function test_user_can_login_and_receive_token(): void
    {
        $org = Organization::create(['name' => 'Test Org', 'slug' => 'test-org']);
        User::create([
            'name' => 'Test User',
            'email' => 'login@test.com',
            'password' => Hash::make('Password123!'),
            'organization_id' => $org->id,
            'role' => 'admin',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'login@test.com',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['user' => ['id', 'name', 'email'], 'token']);
    }

    public function test_invalid_credentials_rejected(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'nonexistent@test.com',
            'password' => 'wrong',
        ]);

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_access_me(): void
    {
        $org = Organization::create(['name' => 'Test Org', 'slug' => 'test-org-2']);
        $user = User::create([
            'name' => 'Me User',
            'email' => 'me@test.com',
            'password' => Hash::make('Password123!'),
            'organization_id' => $org->id,
            'role' => 'admin',
        ]);

        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/me');

        $response->assertStatus(200)
            ->assertJsonPath('user.email', 'me@test.com');
    }

    public function test_ticket_tenant_isolation(): void
    {
        $orgA = Organization::create(['name' => 'Org A', 'slug' => 'org-a']);
        $orgB = Organization::create(['name' => 'Org B', 'slug' => 'org-b']);

        $userA = User::create([
            'name' => 'User A',
            'email' => 'a@org-a.test',
            'password' => Hash::make('Password123!'),
            'organization_id' => $orgA->id,
            'role' => 'admin',
        ]);

        $userB = User::create([
            'name' => 'User B',
            'email' => 'b@org-b.test',
            'password' => Hash::make('Password123!'),
            'organization_id' => $orgB->id,
            'role' => 'admin',
        ]);

        Ticket::create([
            'organization_id' => $orgB->id,
            'subject' => 'Org B Secret',
            'description' => 'Should not be visible to Org A',
            'status' => 'open',
            'priority' => 'high',
            'requester_id' => $userB->id,
        ]);

        $this->actingAs($userA);
        $this->assertEquals(0, Ticket::count(), 'Org A user should see 0 tickets from Org B');

        $this->actingAs($userB);
        $this->assertEquals(1, Ticket::count(), 'Org B user should see their own ticket');
    }

    public function test_comment_tenant_isolation(): void
    {
        $orgA = Organization::create(['name' => 'Org A', 'slug' => 'org-a-2']);
        $orgB = Organization::create(['name' => 'Org B', 'slug' => 'org-b-2']);

        $userA = User::create([
            'name' => 'User A',
            'email' => 'ca@org-a.test',
            'password' => Hash::make('Password123!'),
            'organization_id' => $orgA->id,
            'role' => 'admin',
        ]);

        $userB = User::create([
            'name' => 'User B',
            'email' => 'cb@org-b.test',
            'password' => Hash::make('Password123!'),
            'organization_id' => $orgB->id,
            'role' => 'admin',
        ]);

        $ticketB = Ticket::create([
            'organization_id' => $orgB->id,
            'subject' => 'Org B Ticket',
            'description' => 'For comment isolation test',
            'status' => 'open',
            'priority' => 'medium',
            'requester_id' => $userB->id,
        ]);

        Comment::create([
            'organization_id' => $orgB->id,
            'ticket_id' => $ticketB->id,
            'author_id' => $userB->id,
            'body' => 'Org B internal comment',
            'is_internal' => true,
        ]);

        $this->actingAs($userA);
        $this->assertEquals(0, Comment::count(), 'Org A user should see 0 comments from Org B');

        $this->actingAs($userB);
        $this->assertEquals(1, Comment::count(), 'Org B user should see their own comment');
    }

    public function test_user_role_helpers(): void
    {
        $org = Organization::create(['name' => 'Role Org', 'slug' => 'role-org']);
        $admin = User::create([
            'name' => 'Admin',
            'email' => 'role-admin@test.com',
            'password' => Hash::make('Password123!'),
            'organization_id' => $org->id,
            'role' => 'admin',
        ]);
        $agent = User::create([
            'name' => 'Agent',
            'email' => 'role-agent@test.com',
            'password' => Hash::make('Password123!'),
            'organization_id' => $org->id,
            'role' => 'agent',
        ]);
        $customer = User::create([
            'name' => 'Customer',
            'email' => 'role-customer@test.com',
            'password' => Hash::make('Password123!'),
            'organization_id' => $org->id,
            'role' => 'customer',
        ]);

        $this->assertTrue($admin->isAdmin());
        $this->assertTrue($agent->isAgent());
        $this->assertTrue($customer->isCustomer());
        $this->assertFalse($admin->isCustomer());
    }
}
