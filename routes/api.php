<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::post('/login', [App\Http\Controllers\Auth\LoginController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    
    Route::post('/profile/update', [App\Http\Controllers\ProfileController::class, 'update']);
    Route::post('/profile/password', [App\Http\Controllers\ProfileController::class, 'updatePassword']);
    Route::post('/profile/email', [App\Http\Controllers\ProfileController::class, 'updateEmail']);

    Route::post('/email/verification-notification', function (Request $request) {
        $request->user()->sendEmailVerificationNotification();
        return response()->json(['message' => 'Verification link sent!']);
    })->middleware(['throttle:6,1'])->name('verification.send');
    Route::prefix('hr')->group(function () {
        Route::apiResource('branches', App\Http\Controllers\HR\BranchController::class);
        Route::apiResource('departments', App\Http\Controllers\HR\DepartmentController::class);
        Route::apiResource('designations', App\Http\Controllers\HR\DesignationController::class);
        Route::apiResource('document-types', App\Http\Controllers\HR\DocumentTypeController::class);
        Route::apiResource('employees', App\Http\Controllers\HR\EmployeeController::class);
        Route::post('employees/{employee}/documents', [App\Http\Controllers\HR\EmployeeController::class, 'uploadDocument']);
        Route::delete('employees/{employee}/documents/{document}', [App\Http\Controllers\HR\EmployeeController::class, 'deleteDocument']);
        Route::apiResource('award-types', App\Http\Controllers\HR\AwardTypeController::class);
        Route::apiResource('awards', App\Http\Controllers\HR\AwardController::class);
        Route::apiResource('promotions', App\Http\Controllers\HR\PromotionController::class);
        Route::apiResource('resignations', App\Http\Controllers\HR\ResignationController::class);
        Route::apiResource('terminations', App\Http\Controllers\HR\TerminationController::class);
        Route::apiResource('warnings', App\Http\Controllers\HR\WarningController::class);
        Route::apiResource('holidays', App\Http\Controllers\HR\HolidayController::class);

        // Activity Log
        Route::get('activities', [App\Http\Controllers\HR\ActivityController::class, 'index']);
        Route::get('activities/{activity}', [App\Http\Controllers\HR\ActivityController::class, 'show']);
        Route::put('activities/{activity}/status', [App\Http\Controllers\HR\ActivityController::class, 'updateStatus']);
        Route::delete('activities/{activity}', [App\Http\Controllers\HR\ActivityController::class, 'destroy']);
        
        Route::apiResource('company-feedbacks', App\Http\Controllers\HR\CompanyFeedbackController::class)->only(['index', 'destroy']);

        // Leave Management
        Route::apiResource('leave-types', App\Http\Controllers\HR\LeaveTypeController::class);
        Route::apiResource('leave-policies', App\Http\Controllers\HR\LeavePolicyController::class);
        Route::apiResource('leave-balances', App\Http\Controllers\HR\LeaveBalanceController::class);
        Route::apiResource('leave-allocations', App\Http\Controllers\HR\EmployeeLeaveAllocationController::class);
        
        Route::apiResource('leave-requests', App\Http\Controllers\HR\LeaveRequestController::class)->except(['store', 'update']);
        Route::post('leave-requests/{id}/approve', [App\Http\Controllers\HR\LeaveRequestController::class, 'approve']);
        Route::post('leave-requests/{id}/reject', [App\Http\Controllers\HR\LeaveRequestController::class, 'reject']);
    });

    Route::prefix('attendance')->group(function () {
        Route::apiResource('working-shifts', App\Http\Controllers\Attendance\WorkingShiftController::class);
        Route::apiResource('attendance-policies', App\Http\Controllers\Attendance\AttendancePolicyController::class);
        Route::apiResource('records', App\Http\Controllers\Attendance\AttendanceRecordController::class)->only(['index']);
        
        // QR Code Attendance Routes
        Route::get('branch-qr/{branch}', [App\Http\Controllers\Attendance\QrAttendanceController::class, 'generateBranchQr']);
        Route::get('employee-qr/{employee}', [App\Http\Controllers\Attendance\QrAttendanceController::class, 'generateEmployeeQr']);
        Route::post('employee-login', [App\Http\Controllers\Attendance\QrAttendanceController::class, 'employeeLogin']);
        Route::post('scan/clock', [App\Http\Controllers\Attendance\QrAttendanceController::class, 'scanClock']);

        Route::get('employee-config', [App\Http\Controllers\Attendance\EmployeeConfigController::class, 'index']);
        Route::put('employee-config/{employee}', [App\Http\Controllers\Attendance\EmployeeConfigController::class, 'updateField']);
    });

    // Employee PWA Routes (Auth handled via custom header token in controller)
    Route::prefix('employee-app')->group(function () {
        Route::get('dashboard', [App\Http\Controllers\EmployeeApp\EmployeeAppController::class, 'dashboard']);
        Route::get('history', [App\Http\Controllers\EmployeeApp\EmployeeAppController::class, 'history']);
        Route::get('profile', [App\Http\Controllers\EmployeeApp\EmployeeAppController::class, 'profile']);
        Route::post('profile/avatar', [App\Http\Controllers\EmployeeApp\EmployeeAppController::class, 'updateAvatar']);
        Route::get('calendar-data', [App\Http\Controllers\EmployeeApp\EmployeeAppController::class, 'calendarData']);
        Route::get('my-leave-balances', [App\Http\Controllers\EmployeeApp\LeaveController::class, 'myBalances']);
        Route::get('leave-requests', [App\Http\Controllers\EmployeeApp\LeaveRequestController::class, 'index']);
        Route::post('leave-requests', [App\Http\Controllers\EmployeeApp\LeaveRequestController::class, 'store']);
        Route::put('leave-requests/{id}/cancel', [App\Http\Controllers\EmployeeApp\LeaveRequestController::class, 'cancel']);
        Route::get('preferences', [App\Http\Controllers\EmployeeApp\EmployeeAppController::class, 'getPreferences']);
        Route::put('preferences', [App\Http\Controllers\EmployeeApp\EmployeeAppController::class, 'updatePreferences']);
        
        Route::post('feedback', [App\Http\Controllers\EmployeeApp\FeedbackController::class, 'store']);

        // Activity
        Route::get('activities', [App\Http\Controllers\EmployeeApp\ActivityController::class, 'index']);
        Route::post('activities', [App\Http\Controllers\EmployeeApp\ActivityController::class, 'store']);
    });

    // Cloud Storage Settings
    Route::get('settings/storage', [App\Http\Controllers\StorageSettingController::class, 'index']);
    Route::put('settings/storage/{provider}', [App\Http\Controllers\StorageSettingController::class, 'update']);

    Route::prefix('media')->group(function () {
        Route::get('storage-info', [App\Http\Controllers\MediaFileController::class, 'storageInfo']);
        
        Route::apiResource('folders', App\Http\Controllers\MediaFolderController::class)->except(['show']);
        Route::post('files/upload', [App\Http\Controllers\MediaFileController::class, 'upload']);
        Route::put('files/{file}/favorite', [App\Http\Controllers\MediaFileController::class, 'favorite']);
        Route::apiResource('files', App\Http\Controllers\MediaFileController::class)->except(['store', 'show']);
    });
});

Route::get('/email/verify/{id}/{hash}', function (Request $request, $id, $hash) {
    $user = \App\Models\User::findOrFail($id);

    if (! hash_equals((string) $id, (string) $user->getKey())) {
        abort(403);
    }

    if (! hash_equals(sha1($user->getEmailForVerification()), (string) $hash)) {
        abort(403);
    }
    
    if (! $user->hasVerifiedEmail()) {
        $user->markEmailAsVerified();
        event(new \Illuminate\Auth\Events\Verified($user));
    }

    return redirect('/profile/settings?verified=1');
})->middleware(['signed'])->name('verification.verify');
