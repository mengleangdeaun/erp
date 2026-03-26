<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Spatie\Health\Models\HealthCheckResultHistoryItem;
use Carbon\Carbon;

use Illuminate\Support\Facades\Cache;

class SystemHealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $cacheKey = 'system_health_results_cache';
        
        $data = Cache::remember($cacheKey, 60, function () {
            // Get the latest batch
            $latestItem = HealthCheckResultHistoryItem::latest()->first();

            if (!$latestItem) {
                return [
                    'finishedAt' => now()->timestamp,
                    'checkResults' => [],
                ];
            }

            $latestBatch = $latestItem->batch;
            $results = HealthCheckResultHistoryItem::where('batch', $latestBatch)->get();

            return [
                'finishedAt' => $latestItem->created_at->timestamp,
                'checkResults' => $results->map(function (HealthCheckResultHistoryItem $item) {
                    return [
                        'name' => $item->check_name,
                        'label' => $item->check_label,
                        'status' => $item->status,
                        'shortSummary' => $item->short_summary,
                        'notificationMessage' => $item->notification_message,
                    ];
                })->toArray(),
            ];
        });

        return response()->json($data);
    }
}
