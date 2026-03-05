<?php

namespace App\Http\Controllers;

use App\Models\MediaItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Exception;

class MediaItemController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $parentId = $request->query('parent_id');
        
        $query = MediaItem::query();
        
        if ($parentId) {
            $query->where('parent_id', $parentId);
        } else {
            $query->whereNull('parent_id');
        }

        $items = $query->orderBy('type')->orderBy('name')->get();

        return response()->json($items);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:folder,file',
            'parent_id' => 'nullable|exists:media_items,id',
            'file' => 'nullable|file|max:51200' // 50MB max
        ]);

        try {
            DB::beginTransaction();
            
            $mediaItem = new MediaItem();
            $mediaItem->name = $request->name;
            $mediaItem->parent_id = $request->parent_id;

            if ($request->type === 'folder') {
                $mediaItem->type = 'folder';
            } else if ($request->hasFile('file')) {
                $file = $request->file('file');
                $path = $file->store('media', 'public');
                
                $mediaItem->path = $path;
                $mediaItem->extension = $file->getClientOriginalExtension();
                $mediaItem->size = $this->formatSizeUnits($file->getSize());
                
                // Determine type
                $mimeType = $file->getMimeType();
                if (str_starts_with($mimeType, 'image/')) {
                    $mediaItem->type = 'image';
                } elseif (str_starts_with($mimeType, 'video/')) {
                    $mediaItem->type = 'video';
                } elseif (str_starts_with($mimeType, 'application/') || str_starts_with($mimeType, 'text/')) {
                    $mediaItem->type = 'document';
                } else {
                    $mediaItem->type = 'other';
                }
            } else {
                return response()->json(['message' => 'File is required when creating a file item.'], 400);
            }

            $mediaItem->save();
            DB::commit();

            return response()->json($mediaItem, 201);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create media item: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(MediaItem $mediaItem)
    {
        return response()->json($mediaItem);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, MediaItem $mediaItem)
    {
        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'is_favorite' => 'sometimes|required|boolean',
            'parent_id' => 'sometimes|nullable|exists:media_items,id',
        ]);

        if ($request->has('name')) {
            $mediaItem->name = $request->name;
        }

        if ($request->has('is_favorite')) {
            $mediaItem->is_favorite = $request->is_favorite;
        }

        if ($request->has('parent_id')) {
            // Prevent circular references basic check
            if ($request->parent_id != $mediaItem->id) {
                $mediaItem->parent_id = $request->parent_id;
            }
        }

        $mediaItem->save();

        return response()->json($mediaItem);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(MediaItem $mediaItem)
    {
        try {
            DB::beginTransaction();

            // If it's a file, delete it from storage
            if ($mediaItem->type !== 'folder' && $mediaItem->path) {
                Storage::disk('public')->delete($mediaItem->path);
            }

            // Note: Since we have onDelete('cascade') on the foreign key, database takes care of child records.
            // But we ideally need to delete actual files of all children if it's a folder.
            if ($mediaItem->type === 'folder') {
                $this->deleteFolderContents($mediaItem);
            }

            $mediaItem->delete();

            DB::commit();
            return response()->json(null, 204);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to delete media item: ' . $e->getMessage()], 500);
        }
    }

    private function deleteFolderContents(MediaItem $folder) {
        $children = $folder->children()->get();
        foreach($children as $child) {
            if ($child->type === 'folder') {
                $this->deleteFolderContents($child);
            } else if ($child->path) {
                 Storage::disk('public')->delete($child->path);
            }
        }
    }

    private function formatSizeUnits($bytes)
    {
        if ($bytes >= 1073741824) {
            $bytes = number_format($bytes / 1073741824, 2) . ' GB';
        } elseif ($bytes >= 1048576) {
            $bytes = number_format($bytes / 1048576, 2) . ' MB';
        } elseif ($bytes >= 1024) {
            $bytes = number_format($bytes / 1024, 2) . ' KB';
        } elseif ($bytes > 1) {
            $bytes = $bytes . ' bytes';
        } elseif ($bytes == 1) {
            $bytes = $bytes . ' byte';
        } else {
            $bytes = '0 bytes';
        }

        return $bytes;
    }
}
