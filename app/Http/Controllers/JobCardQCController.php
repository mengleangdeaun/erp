<?php

namespace App\Http\Controllers;

use App\Models\JobCard;
use App\Models\JobCardItem;
use App\Models\JobCardQCReport;
use App\Models\JobCardQCItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class JobCardQCController extends Controller
{
    public function index(Request $request)
    {
        $query = JobCardQCReport::with([
            'jobCard.customer', 
            'qcPerson', 
            'reworkTechnician',
            'qcItems.jobCardItem.part',
            'qcItems.reworkTechnician',
            'qcItems.replacementType'
        ]);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereHas('jobCard', function($q) use ($search) {
                    $q->where('job_no', 'like', "%{$search}%");
                })
                ->orWhereHas('reworkTechnician', function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                })
                ->orWhereHas('qcPerson', function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
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

        $paginated = $query->latest()->paginate($request->per_page ?? 20);

        $stats = [
            'total_failures' => JobCardQCReport::where('decision', 'FAIL')->count(),
            'avg_rating' => round(JobCardQCReport::avg('rating') ?: 0, 1),
            'rework_tasks' => JobCardQCReport::whereNotNull('rework_technician_id')->count(),
            'active_issues' => JobCardQCReport::where('decision', 'FAIL')->count(), // Same as failures for now
        ];

        return response()->json(array_merge($paginated->toArray(), ['stats' => $stats]));
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
            'rework_technician_id' => 'required_if:decision,FAIL|nullable|exists:employees,id',
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
                        'rework_technician_id' => $evaluation['rework_technician_id'] ?? null,
                        'notes' => $evaluation['notes'] ?? null,
                    ]);

                    if (isset($evaluation['status']) && $evaluation['status'] === 'FAIL') {
                        JobCardItem::where('id', $itemId)->update([
                            'status' => 'Reworking',
                            'completion_percentage' => 95 // Set back slightly for rework
                        ]);
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
}
