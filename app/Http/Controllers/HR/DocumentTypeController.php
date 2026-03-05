<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\DocumentType;
use Illuminate\Http\Request;

class DocumentTypeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        if ($request->query('compact')) {
            return response()->json(DocumentType::select('id', 'name')->latest()->get());
        }
        $documentTypes = DocumentType::latest()->get();
        return response()->json($documentTypes);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_required' => 'required|boolean',
            'status' => 'required|in:active,inactive',
        ]);

        $documentType = DocumentType::create($request->all());

        return response()->json($documentType, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(DocumentType $documentType)
    {
        return response()->json($documentType);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, DocumentType $documentType)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_required' => 'required|boolean',
            'status' => 'required|in:active,inactive',
        ]);

        $documentType->update($request->all());

        return response()->json($documentType);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(DocumentType $documentType)
    {
        $documentType->delete();
        return response()->json(null, 204);
    }
}
