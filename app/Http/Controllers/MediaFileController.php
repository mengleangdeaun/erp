<?php

namespace App\Http\Controllers;

use App\Models\MediaFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Exception;

class MediaFileController extends Controller
{
    public function index(Request $request)
    {
        $query = MediaFile::query();

        if ($request->filled('folder_id')) {
            $query->where('folder_id', $request->folder_id);
        } else {
            // Include all files if no folder specifically requested,
            // or maybe limit to root only? The frontend UI "All Files" means any folder!
            // Wait, when activeFolderId is null, it wants "All files", or root files?
            // Checking MediaLibrary.tsx: activeFolderId === null means All Files.
            // If we want root only, maybe we should pass `folder_id=root`.
            // But frontend passes NO folder_id when it wants all files.
        }

        if ($request->filled('file_type') && $request->file_type !== 'all') {
            $query->where('file_type', $request->file_type);
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->boolean('favorites')) {
            $query->where('is_favorite', true);
        }

        $files = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 12));
        
        return response()->json($files);
    }

    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:51200', // 50MB max
            'folder_id' => 'nullable|exists:media_folders,id',
        ]);

        $file = $request->file('file');
        $originalName = $file->getClientOriginalName();
        $extension = $file->getClientOriginalExtension();
        $mime = $file->getMimeType();
        $size = $file->getSize();

        // Determine File Type
        $type = 'other';
        if (str_starts_with($mime, 'image/')) $type = 'photo';
        elseif (str_starts_with($mime, 'video/')) $type = 'video';
        elseif (str_starts_with($mime, 'audio/')) $type = 'audio';
        elseif (in_array(strtolower($extension), ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv'])) $type = 'document';

        // Size Formatting
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $power = $size > 0 ? floor(log($size, 1024)) : 0;
        $sizeHuman = number_format($size / pow(1024, $power), 2, '.', ',') . ' ' . $units[$power];

        // Determine Storage Disk
        $activeSetting = \App\Models\StorageSetting::where('is_active', true)->first();
        $disk = $activeSetting && $activeSetting->provider !== 'local' ? $activeSetting->provider : 'public';

        // Store File
        try {
            $path = \Illuminate\Support\Facades\Storage::disk($disk)->putFile('media', $file);
            if ($path === false) {
                throw new \Exception("Storage::putFile returned false silently");
            }
        } catch (\Exception $e) {
            return response()->json([
                'message' => "Failed to upload file to {$disk}: " . $e->getMessage()
            ], 400);
        }

        // Generate URL
        if ($disk === 'public' || $disk === 'local') {
            $url = '/storage/' . $path;
        } else {
            // For S3 or GDrive
            $url = \Illuminate\Support\Facades\Storage::disk($disk)->url($path);
            
            // Fix Google Drive image preview: browsers often block 'uc?export=media' in <img> tags
            if ($disk === 'gdrive' && $type === 'photo') {
                parse_str(parse_url($url, PHP_URL_QUERY), $query);
                if (isset($query['id'])) {
                    $url = 'https://drive.google.com/thumbnail?id=' . $query['id'] . '&sz=w1000';
                }
            }
        }

        $mediaFile = MediaFile::create([
            'name' => pathinfo($originalName, PATHINFO_FILENAME),
            'extension' => strtolower($extension),
            'file_type' => $type,
            'size_bytes' => $size,
            'size_human' => $sizeHuman,
            'mime_type' => $mime,
            'url' => $url,
            'path' => $path,
            'disk' => $disk,
            'folder_id' => $request->folder_id,
        ]);

        return response()->json($mediaFile, 201);
    }

    public function update(Request $request, MediaFile $file)
    {
        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'folder_id' => 'nullable|exists:media_folders,id'
        ]);
        
        $data = [];
        if ($request->has('name')) {
            $data['name'] = $request->name;
        }
        if ($request->has('folder_id')) {
            $data['folder_id'] = $request->folder_id;
        }

        $file->update($data);
        return response()->json($file);
    }
    
    public function favorite(MediaFile $file)
    {
        $file->update(['is_favorite' => !$file->is_favorite]);
        return response()->json($file);
    }

    public function destroy(MediaFile $file)
    {
        $file->delete(); // File is deleted automatically by booted event
        return response()->json(['message' => 'Deleted']);
    }

    public function storageInfo()
    {
        $usedBytes = MediaFile::sum('size_bytes');
        
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $power = $usedBytes > 0 ? floor(log($usedBytes, 1024)) : 0;
        $usedHuman = number_format($usedBytes / pow(1024, $power), 2, '.', ',') . ' ' . $units[$power];

        return response()->json([
            'used_bytes' => $usedBytes,
            'used_human' => $usedHuman,
            'limit_mb' => null,
            'limit_bytes' => null,
            'used_pct' => 0,
            'unlimited' => true,
        ]);
    }
}
