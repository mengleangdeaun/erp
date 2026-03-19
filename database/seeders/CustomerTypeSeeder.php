<?php

namespace Database\Seeders;

use App\Models\CustomerType;
use Illuminate\Database\Seeder;

class CustomerTypeSeeder extends Seeder
{
    public function run(): void
    {
        CustomerType::updateOrCreate(['name' => 'Regular'], [
            'description' => 'Regular individual customers',
            'is_default' => true,
        ]);

        CustomerType::updateOrCreate(['name' => 'VIP'], [
            'description' => 'High-value loyal customers',
            'is_default' => false,
        ]);

        CustomerType::updateOrCreate(['name' => 'Wholesale'], [
            'description' => 'B2B/Wholesale bulk buyers',
            'is_default' => false,
        ]);
    }
}
