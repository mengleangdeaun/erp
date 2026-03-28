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
     * @param string $type The document type (e.g., 'sales_order', 'job_card', 'replacement')
     * @param int|null $branchId The ID of the branch for contextual numbering
     * @return string
     */
    public function generate(string $type, ?int $branchId = null): string
    {
        return DB::transaction(function () use ($type, $branchId) {
            // Priority 1: Branch-specific setting
            $setting = null;
            if ($branchId) {
                $setting = DocumentSetting::where('document_type', $type)
                    ->where('branch_id', $branchId)
                    ->lockForUpdate()
                    ->first();
            }

            // Priority 2: Global setting (branch_id is null)
            if (!$setting) {
                $setting = DocumentSetting::where('document_type', $type)
                    ->whereNull('branch_id')
                    ->lockForUpdate()
                    ->first();
            }

            // Priority 3: Create default global setting if still not exists
            if (!$setting) {
                $defaultPrefix = $this->getDefaultPrefix($type);
                $setting = DocumentSetting::create([
                    'document_type' => $type,
                    'prefix' => $defaultPrefix,
                    'number_padding' => 4,
                    'next_number' => 1,
                    'branch_id' => null, // Initial defaults are always global
                ]);
            }

            $this->checkAndReset($setting);

            $segments = [];
            $separator = $setting->separator ?? '';

            // 0. Optional Branch Code (Dynamic Prefix)
            if ($setting->include_branch_code && $branchId) {
                $branch = \App\Models\HR\Branch::find($branchId);
                if ($branch && $branch->code) {
                    $segments[] = $branch->code;
                }
            }

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
            'YYYY-MM-DD' => 'YYYY-MM-DD',
            'DD-MM-YYYY' => 'DD-MM-YYYY',
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
            'sales_order' => 'SO',
            'job_card' => 'JC',
            'replacement' => 'REP',
        ];

        return $map[$type] ?? strtoupper(substr($type, 0, 3)) . '-';
    }
}
