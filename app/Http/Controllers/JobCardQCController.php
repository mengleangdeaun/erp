<?php

namespace App\Http\Controllers;

use App\Models\JobCard;
use App\Models\JobCardItem;
use App\Models\JobCardQCReport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class JobCardQCController extends Controller
{
    public function index(Request $request)
    {
        $query = JobCardQCReport::with(['jobCard', 'qcPerson', 'reworkTechnician']);

        if ($request->has('decision')) {
            $query->where('decision', $request->decision);
        }

        if ($request->has('technician_id')) {
            $query->whereHas('reworkTechnician', function($q) use ($request) {
                $q->where('id', $request->technician_id);
            });
        }

        return $query->latest()->paginate(20);
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

            // Sync item-level statuses if failures exist
            if (!empty($validated['item_evaluations'])) {
                foreach ($validated['item_evaluations'] as $itemId => $evaluation) {
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
        return JobCardQCReport::with(['qcPerson', 'reworkTechnician'])
            ->where('job_card_id', $jobCardId)
            ->latest()
            ->first();
    }
}
