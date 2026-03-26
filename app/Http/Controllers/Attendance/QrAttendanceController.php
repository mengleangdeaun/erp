<?php

namespace App\Http\Controllers\Attendance;

use App\Http\Controllers\Controller;
use App\Models\HR\Branch;
use App\Models\HR\Employee;
use App\Models\Attendance\AttendanceRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class QrAttendanceController extends Controller
{
    /**
     * Helper to calculate distance between two lat/lng points in meters using the Haversine formula
     */
    private function calculateDistanceMeters($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371000; // in meters

        $latDelta = deg2rad($lat2 - $lat1);
        $lonDelta = deg2rad($lon2 - $lon1);

        $a = sin($latDelta / 2) * sin($latDelta / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($lonDelta / 2) * sin($lonDelta / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    /**
     * Generate the static encoded payload for a specific Branch.
     * Accessible by Admins to print the Wall QR.
     */
    public function generateBranchQr(Branch $branch)
    {
        $branchCode = $branch->code;
        // Generate a cryptographic signature to prevent tampering with the branch code
        $signature = hash_hmac('sha256', $branchCode, config('app.key'));

        return response()->json([
            'branch' => $branch->name,
            'url' => config('app.url') . "/attendance/scan?b={$branchCode}&s={$signature}"
        ]);
    }

    /**
     * Generate the personal login QR payload for an Employee.
     * Accessible by Admins.
     */
    public function generateEmployeeQr(Employee $employee)
    {
        // Regenerate auth_token if missing
        if (!$employee->auth_token) {
            $employee->auth_token = Str::random(60);
            $employee->save();
        }

        // Encrypt the sensitive token so the QR itself is safer
        $secretPayload = [
            'type' => 'employee_login',
            'employee_code' => $employee->employee_code,
            'auth_token' => Crypt::encryptString($employee->auth_token),
        ];

        $encoded = base64_encode(json_encode($secretPayload));

        return response()->json([
            'employee' => $employee->full_name,
            'payload' => $encoded,
            'url' => config('app.url') . "/attendance/login?payload={$encoded}"
        ]);
    }

    /**
     * Authenticate an employee via Email and Password for the PWA.
     */
    public function loginWithCredentials(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        \Illuminate\Support\Facades\Log::info('Login Attempt', ['email' => $request->email]);
        $employee = Employee::where('email', $request->email)->first();

        if (!$employee) {
            \Illuminate\Support\Facades\Log::warning('Login Failed: Employee not found', ['email' => $request->email]);
            return response()->json(['message' => 'Invalid email or password.'], 401);
        }

        if (!Hash::check($request->password, $employee->password)) {
            \Illuminate\Support\Facades\Log::warning('Login Failed: Password mismatch', ['email' => $request->email]);
            return response()->json(['message' => 'Invalid email or password.'], 401);
        }

        // Regenerate auth_token if missing
        if (!$employee->auth_token) {
            $employee->auth_token = Str::random(60);
            $employee->save();
        }

        return response()->json([
            'message' => 'Login successful',
            'employee' => [
                'name' => $employee->full_name,
                'code' => $employee->employee_code,
                'profile_image' => $employee->profile_image
            ],
            'auth_token' => $employee->auth_token
        ]);
    }

    /**
     * The endpoint hit by the Employee App when scanning their personal Auth QR.
     * We decrypt and exchange the payload for the raw token safely inside their localstorage.
     */
    public function employeeLogin(Request $request)
    {
        $request->validate([
            'payload' => 'required|string'
        ]);

        try {
            // Debugging what we receive from the PWA scanner
            \Illuminate\Support\Facades\Log::info('QR Login Attempt', ['payload_received' => $request->payload]);

            $decoded = json_decode(base64_decode($request->payload), true);
            
            if (!$decoded || !isset($decoded['type']) || $decoded['type'] !== 'employee_login') {
                \Illuminate\Support\Facades\Log::error('QR Login Decode Failed', ['decoded_data' => $decoded]);
                return response()->json(['message' => 'Invalid QR Code format. Please scan a Personal QR Code (not a Branch QR).'], 400);
            }

            $rawToken = Crypt::decryptString($decoded['auth_token']);
            $employee = Employee::where('employee_code', $decoded['employee_code'])
                                ->where('auth_token', $rawToken)
                                ->first();

            if (!$employee) {
                \Illuminate\Support\Facades\Log::warning('QR Login Auth Mismatch', [
                    'scanned_code' => $decoded['employee_code'],
                    'scanned_token' => $rawToken
                ]);
                return response()->json(['message' => 'Invalid or expired credentials.'], 401);
            }

            return response()->json([
                'message' => 'Login successful',
                'employee' => [
                    'name' => $employee->full_name,
                    'code' => $employee->employee_code,
                    'profile_image' => $employee->profile_image
                ],
                'auth_token' => $rawToken // The frontend saves this and sends it for daily clock-ins
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to process QR Code. ' . $e->getMessage()], 400);
        }
    }

    /**
     * The daily clock-in/clock-out endpoint.
     * Requires the saved auth_token, the branch code, and the device's live GPS.
     */
    public function scanClock(Request $request)
    {
        $request->validate([
            'auth_token' => 'required|string',
            'branch_code' => 'required|string',
            'signature' => 'required|string',
            'user_lat' => 'required|numeric',
            'user_lng' => 'required|numeric',
        ]);

        // 0. Verify QR Code Signature (Best Practice: Prevent tampering)
        $expectedSignature = hash_hmac('sha256', $request->branch_code, config('app.key'));
        if (!hash_equals($expectedSignature, $request->signature)) {
            return response()->json(['message' => 'Invalid or tampered QR Code signature. Access denied.'], 403);
        }

        // 1. Authenticate Employee via Token
        $employee = Employee::where('auth_token', $request->auth_token)->first();
        if (!$employee) {
            return response()->json(['message' => 'Unauthorized. Please scan your Personal Login QR again.'], 401);
        }

        // 2. Load Branch Config
        $branch = Branch::where('code', $request->branch_code)->first();
        if (!$branch) {
            return response()->json(['message' => 'Branch not found. Invalid QR code.'], 404);
        }

        if (!$branch->lat || !$branch->lng) {
            return response()->json(['message' => 'Branch GPS coordinates are not configured properly.'], 400);
        }

        $allowedRadius = $branch->allowed_radius ?? 50;

        // 3. Mathematical Distance Calculation
        $distance = $this->calculateDistanceMeters(
            $branch->lat, $branch->lng,
            $request->user_lat, $request->user_lng
        );

        if ($distance > $allowedRadius) {
            return response()->json([
                'message' => "You are too far from the branch. You must be within {$allowedRadius}m, but you are " . round($distance) . "m away.",
                'distance' => round($distance)
            ], 403);
        }

        // 4. Record Attendance Today
        $today = Carbon::today()->toDateString();
        $currentTime = Carbon::now();
        $locationString = $request->user_lat . ',' . $request->user_lng;

        $record = AttendanceRecord::where('employee_id', $employee->id)
            ->where('date', $today)
            ->first();

        // If no record exists today, CLOCK IN
        if (!$record) {
            $record = AttendanceRecord::create([
                'employee_id' => $employee->id,
                'date' => $today,
                'clock_in_time' => $currentTime,
                'clock_in_location' => $locationString,
                'status' => 'Present', // Further calculations for Late can be added here
            ]);

            return response()->json([
                'message' => 'Successfully Clocked IN!',
                'action' => 'clock_in',
                'time' => $currentTime->format('h:i A'),
                'record' => $record
            ]);
        } 
        
        // If record exists and no clock out, CLOCK OUT
        if (!$record->clock_out_time) {
            $record->update([
                'clock_out_time' => $currentTime,
                'clock_out_location' => $locationString,
            ]);

            return response()->json([
                'message' => 'Successfully Clocked OUT!',
                'action' => 'clock_out',
                'time' => $currentTime->format('h:i A'),
                'record' => $record
            ]);
        }

        // If already clocked out
        return response()->json([
            'message' => 'You have already completed your shift (Clocked In and Out) for today.',
            'action' => 'completed',
            'record' => $record
        ], 400);
    }
}
