<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\DocumentSetting;
use Illuminate\Http\Request;

class DocumentSettingController extends Controller
{
    /**
     * Get all document numbering settings.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        // Define standard types we want to ensure exist
        $types = [
            'purchase_order' => 'Purchase Order',
            'purchase_receive' => 'Purchase Receive',
            'stock_adjustment' => 'Stock Adjustment',
            'stock_transfer' => 'Stock Transfer',
            'invoice' => 'Invoice',
            'quote' => 'Quote',
        ];

        foreach ($types as $type => $label) {
            DocumentSetting::firstOrCreate(
                ['document_type' => $type],
                [
                    'prefix' => $this->getDefaultPrefix($type),
                    'number_padding' => 4,
                    'next_number' => 1,
                ]
            );
        }

        $settings = DocumentSetting::orderBy('document_type')->get()->map(function($setting) use ($types) {
            $setting->label = $types[$setting->document_type] ?? ucfirst(str_replace('_', ' ', $setting->document_type));
            return $setting;
        });

        return response()->json($settings);
    }

    /**
     * Update a document naming setting.
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        $setting = DocumentSetting::findOrFail($id);
        
        $validated = $request->validate([
            'prefix' => 'nullable|string|max:20',
            'suffix' => 'nullable|string|max:20',
            'number_padding' => 'required|integer|min:0|max:10',
            'next_number' => 'required|integer|min:1',
            'is_yearly_reset' => 'required|boolean',
            'is_monthly_reset' => 'required|boolean',
        ]);

        $setting->update($validated);

        return response()->json($setting);
    }

    /**
     * Helper to get default prefixes.
     */
    private function getDefaultPrefix(string $type): string
    {
        $map = [
            'purchase_order' => 'PO',
            'purchase_receive' => 'PR',
            'stock_adjustment' => 'ADJ',
            'stock_transfer' => 'TRF',
            'invoice' => 'INV',
            'quote' => 'QT',
        ];

        return $map[$type] ?? strtoupper(substr($type, 0, 3)) . '-';
    }
}
