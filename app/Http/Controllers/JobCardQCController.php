<?php

namespace App\Http\Controllers;

use App\Models\JobCard;
use App\Models\JobCardItem;
use App\Models\JobCardQCReport;
use App\Models\JobCardQCItem;
use App\Models\JobCardDamage;
use App\Models\JobCardMaterialUsage;
use App\Models\HR\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class JobCardQCController extends Controller
{
    public function index(Request $request)
    {
        $query = JobCardQCReport::with([
            'jobCard.customer', 
            'jobCard.leadTechnician',
            'jobCard.branch',
            'qcPerson', 
            'reworkTechnician',
            'qcItems.jobCardItem.part',
            'qcItems.reworkTechnician',
            'qcItems.replacementType'
        ]);
        
        $this->applyQCFilters($query, $request);

        // Calculate stats based on filtered query (excluding pagination)
        $statsQuery = clone $query;
        $stats = [
            'total_failures' => (clone $statsQuery)->where('decision', 'FAIL')->count(),
            'avg_rating' => round((clone $statsQuery)->avg('rating') ?: 0, 1),
            'total_audits' => (clone $statsQuery)->count(),
            'rework_tasks' => (clone $statsQuery)->whereNotNull('rework_technician_id')->count(),
        ];

        /** @var \Illuminate\Pagination\LengthAwarePaginator $paginated */
        $paginated = $query->latest()->paginate($request->per_page ?? 15);

        return response()->json(array_merge($paginated->toArray(), ['stats' => $stats]));
    }

    private function applyQCFilters($query, Request $request)
    {
        // Archival Filter
        $query->where('is_archived', $request->boolean('archived', false));

        // Branch Filter (via JobCard)
        if ($request->filled('branch_id')) {
            $query->whereHas('jobCard', function($q) use ($request) {
                $q->where('branch_id', $request->branch_id);
            });
        }

        // Auditor Filter
        if ($request->filled('qc_person_id')) {
            $query->where('qc_person_id', $request->qc_person_id);
        }

        // Date Range Filter
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('created_at', [
                $request->start_date . ' 00:00:00',
                $request->end_date . ' 23:59:59'
            ]);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereHas('jobCard', function($q) use ($search) {
                    $q->where('job_no', 'like', "%{$search}%");
                })
                ->orWhereHas('reworkTechnician', function($q) use ($search) {
                    $q->where('full_name', 'like', "%{$search}%")
                      ->orWhere('name', 'like', "%{$search}%");
                })
                ->orWhereHas('qcPerson', function($q) use ($search) {
                    $q->where('full_name', 'like', "%{$search}%")
                      ->orWhere('name', 'like', "%{$search}%");
                });
            });
        }

        if ($request->has('decision')) {
            $query->where('decision', $request->decision);
        }

        if ($request->has('technician_id')) {
            $query->whereHas('reworkTechnician', function($q) use ($request) {
                $q->where('id', $request->technician_id);
            });
        }

        if ($request->boolean('has_damage')) {
            $query->whereNotNull('damages')
                  ->where('damages', '!=', '[]')
                  ->where('damages', '!=', 'null');
        }
    }

    public function exportQC(Request $request)
    {
        $query = JobCardQCReport::with([
            'jobCard.customer', 
            'jobCard.branch',
            'qcPerson'
        ]);

        $this->applyQCFilters($query, $request);

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=qc_audit_reports_" . date('Y-m-d') . ".csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $columns = ['#', 'Audit Date', 'Job Card #', 'Customer', 'Branch', 'QC Person', 'Decision', 'Rating', 'Notes'];

        $callback = function() use($query, $columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);

            $index = 1;
            $query->latest()->chunk(200, function($reports) use($file, &$index) {
                foreach ($reports as $report) {
                    fputcsv($file, [
                        $index++,
                        $report->created_at->format('Y-m-d H:i'),
                        $report->jobCard->job_no ?? 'N/A',
                        $report->jobCard->customer->name ?? 'N/A',
                        $report->jobCard->branch->name ?? 'N/A',
                        $report->qcPerson->full_name ?? 'N/A',
                        $report->decision,
                        $report->rating . ' / 5',
                        $report->notes
                    ]);
                }
            });

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'job_card_id' => 'required|exists:job_cards,id',
            'qc_person_id' => 'required|exists:employees,id',
            'rating' => 'required|integer|min:1|max:5',
            'decision' => 'required|in:PASS,FAIL',
            'damages' => 'nullable|array',
            'item_evaluations' => 'nullable|array',
            'rework_technician_id' => 'nullable|exists:employees,id', // Legacy/Default for report
            'rework_technician_ids' => 'nullable|array', // Default for report
            'notes' => 'nullable|string'
        ]);

        return DB::transaction(function() use ($validated) {
            $report = JobCardQCReport::create($validated);
            
            $jobCard = JobCard::findOrFail($validated['job_card_id']);
            $newStatus = $validated['decision'] === 'PASS' ? 'Ready' : 'Rework';
            
            $jobCard->update([
                'status' => $newStatus,
                'notes' => $validated['notes'] ? $jobCard->notes . "\nQC Notes: " . $validated['notes'] : $jobCard->notes
            ]);

            // Save item-level evaluations to the new table
            if (!empty($validated['item_evaluations'])) {
                foreach ($validated['item_evaluations'] as $itemId => $evaluation) {
                    JobCardQCItem::create([
                        'qc_report_id' => $report->id,
                        'job_card_item_id' => $itemId,
                        'rating' => $evaluation['rating'] ?? 5,
                        'status' => $evaluation['status'] ?? 'PASS',
                        'replacement_type_id' => $evaluation['replacement_type_id'] ?? null,
                        'rework_technician_id' => !empty($evaluation['rework_technician_ids']) ? $evaluation['rework_technician_ids'][0] : null,
                        'notes' => $evaluation['notes'] ?? null,
                    ]);

                    if (isset($evaluation['status']) && $evaluation['status'] === 'FAIL') {
                        $item = JobCardItem::findOrFail($itemId);
                        
                        // Handle replacement_reason_id if sent from frontend instead of replacement_type_id
                        $reasonId = $evaluation['replacement_type_id'] ?? $evaluation['replacement_reason_id'] ?? null;
                        
                        // Capture Mistake Technicians
                        $mistakeTechIds = $item->technicians()->pluck('employees.id')->toArray();
                        if (empty($mistakeTechIds) && $item->technician_id) {
                            $mistakeTechIds = [$item->technician_id];
                        }

                        // Create Dedicated Damage Record
                        JobCardDamage::create([
                            'job_card_id' => $jobCard->id,
                            'job_card_item_id' => $itemId,
                            'qc_report_id' => $report->id,
                            'mistake_staff_ids' => $mistakeTechIds,
                            'rework_staff_ids' => $evaluation['rework_technician_ids'] ?? [],
                            'reason_id' => $reasonId,
                            'rating' => $evaluation['rating'] ?? 1,
                            'notes' => $evaluation['notes'] ?? null,
                            'status' => 'unfixed'
                        ]);

                        // --- AUTO MATERIAL REPLICATION ---
                        // Find original materials for this item and create rework copies
                        $originalMaterials = JobCardMaterialUsage::where('job_card_id', $jobCard->id)
                            ->where('job_card_item_id', $itemId)
                            ->where('is_damage', false)
                            ->get();

                        foreach ($originalMaterials as $mat) {
                            JobCardMaterialUsage::create([
                                'job_card_id' => $jobCard->id,
                                'job_card_item_id' => $itemId,
                                'product_id' => $mat->product_id,
                                'unit' => $mat->unit,
                                'spent_qty' => $mat->spent_qty, // Carry over the default qty
                                'width_on_car' => $mat->width_on_car, // Preset dimensions if available
                                'height_on_car' => $mat->height_on_car,
                                'is_damage' => true
                            ]);
                        }

                        $item->update([
                            'status' => 'Reworking',
                            'completion_percentage' => 95 // Set back slightly for rework
                        ]);

                        if (!empty($evaluation['rework_technician_ids'])) {
                            $item->technicians()->sync($evaluation['rework_technician_ids']);
                        }
                    }
                }
            }

            return $report->load(['qcPerson', 'reworkTechnician']);
        });
    }

    public function show($jobCardId)
    {
        return JobCardQCReport::with([
                'qcPerson', 
                'reworkTechnician',
                'qcItems.jobCardItem.part',
                'qcItems.reworkTechnician',
                'qcItems.replacementType'
            ])
            ->where('job_card_id', $jobCardId)
            ->latest()
            ->first();
    }

    public function damages(Request $request)
    {
        $query = JobCardDamage::with([
            'jobCard.customer',
            'jobCardItem.part',
            'qcReport.qcPerson',
            'reason'
        ]);

        $this->applyDamageFilters($query, $request);

        return $query->latest()->paginate($request->per_page ?? 15)->through(function ($damage) {
            $staffIds = array_unique(array_merge($damage->mistake_staff_ids ?? [], $damage->rework_staff_ids ?? []));
            $staffNames = Employee::whereIn('id', $staffIds)->pluck('full_name', 'id');
            
            $damage->mistake_staff_names = collect($damage->mistake_staff_ids)->map(fn($id) => $staffNames[$id] ?? 'Unknown')->toArray();
            $damage->rework_staff_names = collect($damage->rework_staff_ids)->map(fn($id) => $staffNames[$id] ?? 'Unknown')->toArray();
            
            return $damage;
        });
    }

    private function applyDamageFilters($query, Request $request)
    {
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereHas('jobCard', function($q2) use ($search) {
                    $q2->where('job_no', 'like', "%{$search}%")
                       ->orWhereHas('customer', function($q3) use ($search) {
                           $q3->where('name', 'like', "%{$search}%");
                       });
                })->orWhereHas('jobCardItem.part', function($q2) use ($search) {
                    $q2->where('name', 'like', "%{$search}%");
                });
            });
        }

        if ($request->has('mistake_staff_id')) {
            $staffId = (int)$request->mistake_staff_id;
            $query->whereJsonContains('mistake_staff_ids', $staffId);
        }

        if ($request->has('reason_id')) {
            $query->where('reason_id', $request->reason_id);
        }

        if ($request->has('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->has('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }
    }

    public function exportDamages(Request $request)
    {
        $query = JobCardDamage::with([
            'jobCard.customer',
            'jobCardItem.part',
            'reason'
        ]);

        $this->applyDamageFilters($query, $request);

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=technical_damage_reports_" . date('Y-m-d') . ".csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $columns = ['#', 'Incident Date', 'Job Card #', 'Customer', 'Component', 'Failure Reason', 'Mistake Liability', 'Rework Team', 'Notes'];

        $callback = function() use($query, $columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);

            $index = 1;
            $query->latest()->chunk(200, function($damages) use($file, &$index) {
                // Collect all staff IDs for bulk lookup
                $allStaffIds = $damages->flatMap(function($d) {
                    return array_merge($d->mistake_staff_ids ?? [], $d->rework_staff_ids ?? []);
                })->unique()->filter()->toArray();

                $staffNames = Employee::whereIn('id', $allStaffIds)->pluck('full_name', 'id');

                foreach ($damages as $damage) {
                    $mistakeNames = collect($damage->mistake_staff_ids)->map(fn($id) => $staffNames[$id] ?? 'Unknown')->implode(', ');
                    $reworkNames = collect($damage->rework_staff_ids)->map(fn($id) => $staffNames[$id] ?? 'Unknown')->implode(', ');

                    fputcsv($file, [
                        $index++,
                        $damage->created_at->format('Y-m-d H:i'),
                        $damage->jobCard->job_no ?? 'N/A',
                        $damage->jobCard->customer->name ?? 'N/A',
                        $damage->jobCardItem->part->name ?? 'N/A',
                        $damage->reason->name ?? 'N/A',
                        $mistakeNames ?: 'N/A',
                        $reworkNames ?: 'N/A',
                        $damage->notes
                    ]);
                }
            });

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function archive($id)
    {
        $report = JobCardQCReport::findOrFail($id);
        $report->update(['is_archived' => true]);
        return response()->json(['message' => 'Report archived successfully']);
    }

    public function unarchive($id)
    {
        $report = JobCardQCReport::findOrFail($id);
        $report->update(['is_archived' => false]);
        return response()->json(['message' => 'Report restored successfully']);
    }

    public function bulkArchive(Request $request)
    {
        $request->validate(['ids' => 'required|array', 'ids.*' => 'exists:job_card_qc_reports,id']);
        JobCardQCReport::whereIn('id', $request->ids)->update(['is_archived' => true]);
        return response()->json(['message' => count($request->ids) . ' reports archived successfully']);
    }

    public function bulkUnarchive(Request $request)
    {
        $request->validate(['ids' => 'required|array', 'ids.*' => 'exists:job_card_qc_reports,id']);
        JobCardQCReport::whereIn('id', $request->ids)->update(['is_archived' => false]);
        return response()->json(['message' => count($request->ids) . ' reports restored successfully']);
    }
}
