<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
        $org = Organization::create(['name' => 'Test Org']);
        $user = User::create([
            'name' => 'Test User',
            'email' => 'login@test.com',
            'password' => 'Password123!',
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
        $org = Organization::create(['name' => 'Test Org']);
        $user = User::create([
            'name' => 'Me User',
            'email' => 'me@test.com',
            'password' => 'Password123!',
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
        $orgA = Organization::create(['name' => 'Org A']);
        $orgB = Organization::create(['name' => 'Org B']);

        $userA = User::create([
            'name' => 'User A',
            'email' => 'a@org-a.test',
            'password' => 'Password123!',
            'organization_id' => $orgA->id,
            'role' => 'admin',
        ]);

        $userB = User::create([
            'name' => 'User B',
            'email' => 'b@org-b.test',
            'password' => 'Password123!',
            'organization_id' => $orgB->id,
            'role' => 'admin',
        ]);

        // Create ticket in Org B
        Ticket::create([
            'organization_id' => $orgB->id,
            'subject' => 'Org B Secret',
            'description' => 'Should not be visible to Org A',
            'status' => 'open',
            'priority' => 'high',
            'requester_id' => $userB->id,
        ]);

        // User A should NOT see Org B's tickets via global scope
        $tokenA = $userA->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$tokenA)
            ->getJson('/api/tickets');

        // Endpoint doesn't exist yet (Issue #2) but the scope test is about the model
        // Test model-level isolation directly
        $this->actingAs($userA);
        $ticketsVisibleToA = Ticket::count();
        $this->assertEquals(0, $ticketsVisibleToA, 'Org A user should see 0 tickets from Org B');

        $this->actingAs($userB);
        $ticketsVisibleToB = Ticket::count();
        $this->assertEquals(1, $ticketsVisibleToB, 'Org B user should see their own ticket');
    }

    public function test_user_role_helpers(): void
    {
        $org = Organization::create(['name' => 'Role Org']);
        $admin = User::create([
            'name' => 'Admin',
            'email' => 'role-admin@test.com',
            'password' => 'Password123!',
            'organization_id' => $org->id,
            'role' => 'admin',
        ]);
        $agent = User::create([
            'name' => 'Agent',
            'email' => 'role-agent@test.com',
            'password' => 'Password123!',
            'organization_id' => $org->id,
            'role' => 'agent',
        ]);
        $customer = User::create([
            'name' => 'Customer',
            'email' => 'role-customer@test.com',
            'password' => 'Password123!',
            'organization_id' => $org->id,
            'role' => 'customer',
        ]);

        $this->assertTrue($admin->isAdmin());
        $this->assertTrue($agent->isAgent());
        $this->assertTrue($customer->isCustomer());
        $this->assertFalse($admin->isCustomer());
    }
}
