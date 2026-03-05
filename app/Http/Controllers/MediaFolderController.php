<?php

namespace App\Http\Controllers;

use App\Models\MediaFolder;
use Illuminate\Http\Request;

class MediaFolderController extends Controller
{
    public function index()
    {
        $folders = MediaFolder::with('children_recursive')->whereNull('parent_id')->get();
        return response()->json($folders);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:media_folders,id',
            'color' => 'nullable|string|max:7',
        ]);

        $folder = MediaFolder::create($validated);
        return response()->json($folder, 201);
    }

    public function update(Request $request, MediaFolder $folder)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'color' => 'nullable|string|max:7',
        ]);

        $folder->update($validated);
        return response()->json($folder);
    }

    public function destroy(MediaFolder $folder)
    {
        // DB constraints will cascade delete DB records,
        // Model events will delete physical files.
        // Wait, cascadeOnDelete() happens at the database level and bypasses Eloquent model events!
        // We must fetch and delete files manually to trigger physical deletion.
        
        $this->deleteFolderAndFiles($folder);
        return response()->json(['message' => 'Folder deleted']);
    }
    
    private function deleteFolderAndFiles(MediaFolder $folder)
    {
        foreach ($folder->files as $file) {
            $file->delete(); // triggers event
        }
        foreach ($folder->children as $child) {
            $this->deleteFolderAndFiles($child);
        }
        $folder->delete();
    }
}
