<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\Employee;
use App\Models\HR\EmployeeDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class EmployeeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Employee::with([
            'branch:id,name',
            'department:id,name',
            'designation:id,name',
            'workingShift:id,name',
            'attendancePolicy:id,name'
        ]);

        if ($request->has('is_technician')) {
            $query->where('is_technician', $request->is_technician);
            if ($request->is_technician == 1) {
                $query->where('is_active', 1);
            }
        }

        $employees = $query->latest()->get();

        return response()->json($employees);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'full_name'   => 'required|string|max:255',
            'employee_id' => 'required|string|max:100|unique:employees,employee_id',
            'email'       => 'required|email|unique:employees,email',
            'password'    => 'required|string|min:6',
            'gender'      => 'nullable|in:male,female,other',
            'branch_id'   => 'nullable|exists:branches,id',
            'department_id' => 'nullable|exists:departments,id',
            'designation_id' => 'nullable|exists:designations,id',
            'line_manager_id' => 'nullable|exists:employees,id',
            'working_shift_id' => 'nullable|exists:working_shifts,id',
            'attendance_policy_id' => 'nullable|exists:attendance_policies,id',
            'employment_type' => 'nullable|in:full_time,part_time,contract,intern,freelance',
            'is_active'       => 'nullable|boolean',
            // Allow profile_image to be a string (URL from MediaLibrary) or an image file
            'profile_image' => 'nullable', 
            'base_salary' => 'nullable|numeric|min:0',
            'documents'   => 'nullable|array',
            'documents.*.document_type_id' => 'nullable|exists:document_types,id',
            'documents.*.media_url' => 'required|string',
            'documents.*.media_name' => 'required|string',
        ]);

        $data = $request->except(['profile_image', 'password']);
        $data['password'] = Hash::make($request->password);

        if ($request->hasFile('profile_image')) {
            $data['profile_image'] = $request->file('profile_image')->store('employees/profile', 'public');
        } elseif ($request->filled('profile_image') && is_string($request->profile_image)) {
            // It's a URL from Media Library
            // e.g. "/storage/media/folders/..." -> we can store the relative path or full string
            // Strip the /storage/ prefix if present to keep it consistent
            $path = str_replace('/storage/', '', $request->profile_image);
            $data['profile_image'] = $path;
        }

        $employee = Employee::create($data);

        // Handle initial documents if provided
        if ($request->has('documents')) {
            foreach ($request->documents as $docData) {
                $path = str_replace('/storage/', '', $docData['media_url']);
                $employee->documents()->create([
                    'document_type_id' => $docData['document_type_id'],
                    'file_path'        => $path,
                    'original_name'    => $docData['media_name'],
                ]);
            }
        }

        return response()->json($employee->load(['branch', 'department', 'designation', 'documents.documentType']), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Employee $employee)
    {
        return response()->json(
            $employee->load([
                'branch:id,name',
                'department:id,name',
                'designation:id,name',
                'workingShift:id,name',
                'attendancePolicy:id,name',
                'documents.documentType:id,name'
            ])
        );
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Employee $employee)
    {
        $request->validate([
            'full_name'   => 'required|string|max:255',
            'employee_id' => 'required|string|max:100|unique:employees,employee_id,' . $employee->id,
            'email'       => 'required|email|unique:employees,email,' . $employee->id,
            'password'    => 'nullable|string|min:6',
            'gender'      => 'nullable|in:male,female,other',
            'branch_id'   => 'nullable|exists:branches,id',
            'department_id' => 'nullable|exists:departments,id',
            'designation_id' => 'nullable|exists:designations,id',
            'line_manager_id' => 'nullable|exists:employees,id',
            'working_shift_id' => 'nullable|exists:working_shifts,id',
            'attendance_policy_id' => 'nullable|exists:attendance_policies,id',
            'employment_type' => 'nullable|in:full_time,part_time,contract,intern,freelance',
            'is_active'       => 'nullable|boolean',
            'profile_image' => 'nullable',
            'base_salary' => 'nullable|numeric|min:0',
        ]);

        $data = $request->except(['profile_image', 'password']);

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        if ($request->hasFile('profile_image')) {
            // Delete the old image
            if ($employee->profile_image) {
                Storage::disk('public')->delete($employee->profile_image);
            }
            $data['profile_image'] = $request->file('profile_image')->store('employees/profile', 'public');
        } elseif ($request->filled('profile_image') && is_string($request->profile_image)) {
            $path = str_replace('/storage/', '', $request->profile_image);
            $data['profile_image'] = $path;
        }

        $employee->update($data);

        return response()->json($employee->load(['branch', 'department', 'designation']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Employee $employee)
    {
        $employee->delete();
        return response()->json(null, 204);
    }

    /**
     * Upload a document for the given employee.
     */
    public function uploadDocument(Request $request, Employee $employee)
    {
        $request->validate([
            'document_type_id' => 'nullable|exists:document_types,id',
            'file'             => 'nullable|file|max:10240',
            'media_url'        => 'nullable|string',
            'media_name'       => 'nullable|string',
        ]);

        if ($request->filled('media_url')) {
            // Handle Media Library logic
            $path = str_replace('/storage/', '', $request->media_url);
            $originalName = $request->media_name ?? basename($path);
        } elseif ($request->hasFile('file')) {
            // Original raw file logic
            $path = $request->file('file')->store('employees/documents', 'public');
            $originalName = $request->file('file')->getClientOriginalName();
        } else {
            return response()->json(['message' => 'No file or media url provided'], 422);
        }

        $doc = $employee->documents()->create([
            'document_type_id' => $request->document_type_id,
            'file_path'        => $path,
            'original_name'    => $originalName,
        ]);

        return response()->json($doc->load('documentType'), 201);
    }

    /**
     * Delete a specific document.
     */
    public function deleteDocument(Employee $employee, EmployeeDocument $document)
    {
        Storage::disk('public')->delete($document->file_path);
        $document->delete();
        return response()->json(null, 204);
    }
}
