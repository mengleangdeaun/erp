<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schema;

echo "Columns in branches: " . implode(', ', Schema::getColumnListing('branches')) . "\n";

try {
    echo "Running migration...\n";
    $exitCode = Artisan::call('migrate', [
        '--path' => 'database/migrations/2026_03_20_140308_add_inventory_location_id_to_branches_table.php',
        '--force' => true
    ]);
    echo "Exit Code: " . $exitCode . "\n";
    echo "Output: " . Artisan::output() . "\n";
} catch (Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "FILE: " . $e->getFile() . " LINE: " . $e->getLine() . "\n";
}
