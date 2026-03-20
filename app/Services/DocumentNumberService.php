<?php

namespace App\Services;

use App\Models\DocumentSetting;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DocumentNumberService
{
    /**
     * Generate a unique document number based on settings.
     *
     * @param string $type The document type (e.g., 'purchase_order', 'stock_transfer')
     * @return string
     */
    public function generate(string $type): string
    {
        return DB::transaction(function () use ($type) {
            $setting = DocumentSetting::where('document_type', $type)->lockForUpdate()->first();

            if (!$setting) {
                // Create default setting if not exists
                $defaultPrefix = $this->getDefaultPrefix($type);
                $setting = DocumentSetting::create([
                    'document_type' => $type,
                    'prefix' => $defaultPrefix,
                    'number_padding' => 4,
                    'next_number' => 1,
                ]);
            }

            $this->checkAndReset($setting);

            $segments = [];
            $separator = $setting->separator ?? '';

            // 1. Prefix
            if ($setting->prefix) {
                $segments[] = $setting->prefix;
            }
            
            // 2. Date Segment
            if ($setting->date_format) {
                $segments[] = Carbon::now()->isoFormat($this->mapTokens($setting->date_format));
            }
            
            // 3. Sequential Number
            $segments[] = str_pad($setting->next_number, $setting->number_padding, '0', STR_PAD_LEFT);
            
            // 4. Suffix
            if ($setting->suffix) {
                $segments[] = $setting->suffix;
            }

            $generated = implode($separator, $segments);

            $setting->increment('next_number');
            $setting->touch(); 
            
            return $generated;
        });
    }

    /**
     * Map user-friendly tokens to Carbon isoFormat tokens if necessary.
     */
    private function mapTokens(string $format): string
    {
        // map specific user tokens to Carbon isoFormat tokens
        $map = [
            'DDMMYYYY' => 'DDMMYYYY',
            'DDMMYY' => 'DDMMYY',
            'MMDDYY' => 'MMDDYY',
            'YYMMDD' => 'YYMMDD',
            'DDMMMYY' => 'DDMMMYY',
        ];

        return $map[$format] ?? $format;
    }

    /**
     * Check if the numbering sequence should be reset based on year/month.
     *
     * @param DocumentSetting $setting
     * @return void
     */
    private function checkAndReset(DocumentSetting $setting): void
    {
        $now = Carbon::now();
        $lastReset = $setting->last_reset_date ? Carbon::parse($setting->last_reset_date) : null;
        $shouldReset = false;

        if ($setting->is_yearly_reset && (!$lastReset || $lastReset->year < $now->year)) {
            $shouldReset = true;
        } elseif ($setting->is_monthly_reset && (!$lastReset || $lastReset->format('Y-m') < $now->format('Y-m'))) {
            $shouldReset = true;
        }

        if ($shouldReset) {
            $setting->next_number = 1;
            $setting->last_reset_date = $now;
            $setting->save();
        }
    }

    /**
     * Get a default prefix based on document type if none exists.
     *
     * @param string $type
     * @return string
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
            'customer' => 'CUS-',
        ];

        return $map[$type] ?? strtoupper(substr($type, 0, 3)) . '-';
    }
}
