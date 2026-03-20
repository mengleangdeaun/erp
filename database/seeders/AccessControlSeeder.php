<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Auth\Role;
use App\Models\Auth\Permission;
use App\Models\User;
use Illuminate\Support\Str;

class AccessControlSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Define Modules and Permissions
        $modules = [
            'Users' => ['view_users', 'create_users', 'edit_users', 'delete_users'],
            'Roles' => ['view_roles', 'create_roles', 'edit_roles', 'delete_roles'],
            'HR' => ['view_hr', 'manage_employees', 'manage_branches'],
            'Inventory' => ['view_inventory', 'manage_inventory', 'manage_stock'],
            'Sales' => ['view_sales', 'create_sales', 'manage_sales'],
            'CRM' => ['view_customers', 'manage_customers'],
        ];

        $allPermissionIds = [];

        foreach ($modules as $module => $permissions) {
            foreach ($permissions as $permissionName) {
                $permission = Permission::updateOrCreate(
                    ['slug' => $permissionName],
                    [
                        'name' => Str::title(str_replace('_', ' ', $permissionName)),
                        'module' => $module
                    ]
                );
                $allPermissionIds[] = $permission->id;
            }
        }

        // Create Super Admin Role
        $superAdminRole = Role::updateOrCreate(
            ['slug' => 'super-admin'],
            ['name' => 'Super Admin', 'description' => 'System administrator with full access.']
        );
        $superAdminRole->permissions()->sync($allPermissionIds);

        // Assign to first user if exists
        $user = User::first();
        if ($user) {
            $user->roles()->sync([$superAdminRole->id]);
        }
    }
}
