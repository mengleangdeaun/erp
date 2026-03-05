<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::create([
            'name' => 'Mengleang Deaun',
            'email' => 'mengleangdeaun@gmail.com',
            'password' => Hash::make('111213'),
            'avatar' => null,
            'permission' => 'admin', // Assuming admin for now
        ]);
    }
}
