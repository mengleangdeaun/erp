<?php

namespace App\Http\Controllers;

use App\Models\StorageSetting;
use Illuminate\Http\Request;

class StorageSettingController extends Controller
{
    public function index()
    {
        $settings = StorageSetting::all()->map(function ($setting) {
            return [
                'provider' => $setting->provider,
                'is_active' => $setting->is_active,
                'credentials' => $setting->credentials,
            ];
        });
        
        return response()->json($settings);
    }

    public function update(Request $request, $provider)
    {
        $request->validate([
            'is_active' => 'boolean',
            'credentials' => 'nullable|array'
        ]);

        $setting = StorageSetting::firstOrCreate(['provider' => $provider]);

        if ($request->has('credentials')) {
            // merge existing credentials if partial update
            $creds = $setting->credentials ?? [];
            foreach ($request->credentials as $key => $val) {
                if (!empty($val)) {
                    $creds[$key] = $val;
                }
            }
            $setting->credentials = $creds;
        }

        if ($request->has('is_active') && $request->is_active) {
            // Deactivate others
            StorageSetting::where('provider', '!=', $provider)->update(['is_active' => false]);
            $setting->is_active = true;
        }

        $setting->save();

        return response()->json(['message' => 'Settings updated successfully']);
    }
}
