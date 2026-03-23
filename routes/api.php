<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Inventory\PurchaseReceiveController;


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

Route::post('login', [App\Http\Controllers\Auth\LoginController::class, 'login']);
Route::post('forgot-password', [App\Http\Controllers\Auth\PasswordResetController::class, 'sendResetLinkEmail']);
Route::post('reset-password', [App\Http\Controllers\Auth\PasswordResetController::class, 'reset']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('user', function (Request $request) {
        return $request->user()->load('roles');
    });
    
    Route::post('/profile/update', [App\Http\Controllers\ProfileController::class, 'update']);
    Route::post('/profile/password', [App\Http\Controllers\ProfileController::class, 'updatePassword']);
    Route::post('/profile/email', [App\Http\Controllers\ProfileController::class, 'updateEmail']);
    Route::put('/user/preferences', [App\Http\Controllers\ProfileController::class, 'updatePreferences']);

    Route::post('/email/verification-notification', function (Request $request) {
        $request->user()->sendEmailVerificationNotification();
        return response()->json(['message' => 'Verification link sent!']);
    })->middleware(['throttle:6,1'])->name('verification.send');
    Route::prefix('hr')->group(function () {
        Route::apiResource('branches', App\Http\Controllers\HR\BranchController::class);
        Route::post('branches/{id}/link-location', [App\Http\Controllers\HR\BranchController::class, 'linkLocation']);
        Route::get('branches/{id}/products', [App\Http\Controllers\HR\BranchProductController::class, 'index']);
        Route::post('branches/{id}/products/sync', [App\Http\Controllers\HR\BranchProductController::class, 'sync']);
        Route::get('branches/{id}/services', [App\Http\Controllers\HR\BranchServiceController::class, 'index']);
        Route::post('branches/{id}/services/sync', [App\Http\Controllers\HR\BranchServiceController::class, 'sync']);
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

        // Announcements
        Route::apiResource('announcements', App\Http\Controllers\HR\AnnouncementController::class);
        Route::get('announcements/{announcement}/statistics', [App\Http\Controllers\HR\AnnouncementController::class, 'statistics']);
        Route::get('announcements-form-data', [App\Http\Controllers\HR\AnnouncementController::class, 'formData']);

        // Telegram Settings
        Route::get('telegram-settings', [App\Http\Controllers\HR\TelegramSettingController::class, 'show']);
        Route::post('telegram-settings', [App\Http\Controllers\HR\TelegramSettingController::class, 'save']);
        Route::post('telegram-settings/test', [App\Http\Controllers\HR\TelegramSettingController::class, 'test']);
    });

    Route::prefix('attendance')->group(function () {
        Route::apiResource('working-shifts', App\Http\Controllers\Attendance\WorkingShiftController::class);
        Route::apiResource('attendance-policies', App\Http\Controllers\Attendance\AttendancePolicyController::class);
        Route::apiResource('records', App\Http\Controllers\Attendance\AttendanceRecordController::class)->only(['index']);
        
        Route::get('employee-config', [App\Http\Controllers\Attendance\EmployeeConfigController::class, 'index']);
        Route::put('employee-config/{employee}', [App\Http\Controllers\Attendance\EmployeeConfigController::class, 'updateField']);
        Route::get('branch-qr/{branch}', [App\Http\Controllers\Attendance\QrAttendanceController::class, 'generateBranchQr']);
        Route::get('employee-qr/{employee}', [App\Http\Controllers\Attendance\QrAttendanceController::class, 'generateEmployeeQr']);
    });

    Route::prefix('media')->group(function () {
        Route::get('folders', [App\Http\Controllers\MediaFolderController::class, 'index']);
        Route::post('folders', [App\Http\Controllers\MediaFolderController::class, 'store']);
        Route::put('folders/{folder}', [App\Http\Controllers\MediaFolderController::class, 'update']);
        Route::delete('folders/{folder}', [App\Http\Controllers\MediaFolderController::class, 'destroy']);

        Route::get('files', [App\Http\Controllers\MediaFileController::class, 'index']);
        Route::post('files/upload', [App\Http\Controllers\MediaFileController::class, 'upload']);
        Route::put('files/{file}', [App\Http\Controllers\MediaFileController::class, 'update']);
        Route::delete('files/{file}', [App\Http\Controllers\MediaFileController::class, 'destroy']);
        Route::put('files/{file}/favorite', [App\Http\Controllers\MediaFileController::class, 'favorite']);
        Route::get('storage-info', [App\Http\Controllers\MediaFileController::class, 'storageInfo']);
    });

    Route::prefix('settings')->group(function () {
        Route::get('storage', [App\Http\Controllers\StorageSettingController::class, 'index']);
        Route::put('storage/{provider}', [App\Http\Controllers\StorageSettingController::class, 'update']);
        Route::get('document-numbers', [App\Http\Controllers\Settings\DocumentSettingController::class, 'index']);
        Route::put('document-numbers/{id}', [App\Http\Controllers\Settings\DocumentSettingController::class, 'update']);
        Route::get('system-logs', [App\Http\Controllers\Settings\SystemActivityLogController::class, 'index']);
        Route::delete('system-logs', [App\Http\Controllers\Settings\SystemActivityLogController::class, 'destroy']);
    });

    Route::prefix('inventory')->group(function () {
        Route::apiResource('categories', \App\Http\Controllers\Inventory\CategoryController::class);
        Route::apiResource('tags', \App\Http\Controllers\Inventory\TagController::class);
        Route::apiResource('uoms', \App\Http\Controllers\Inventory\UomController::class);
        Route::apiResource('locations', \App\Http\Controllers\Inventory\LocationController::class);
        Route::apiResource('products', \App\Http\Controllers\Inventory\ProductController::class);
        Route::apiResource('stocks', \App\Http\Controllers\Inventory\StockController::class)->except(['update', 'destroy', 'show']);
        Route::put('stocks/{id}/adjust', [\App\Http\Controllers\Inventory\StockController::class, 'adjust']);

        // Procurement
        Route::apiResource('suppliers', \App\Http\Controllers\Inventory\SupplierController::class);
        Route::apiResource('purchase-orders', \App\Http\Controllers\Inventory\PurchaseOrderController::class);
        Route::apiResource('purchase-receives', PurchaseReceiveController::class)->except(['update']);
        Route::get('purchase-orders/{id}/pending-items', [PurchaseReceiveController::class, 'getPendingItems']);
        
        // Stock Movements
        Route::get('stock-movements', [\App\Http\Controllers\Inventory\StockMovementController::class, 'index']);
        Route::get('stock-movements/{id}', [\App\Http\Controllers\Inventory\StockMovementController::class, 'show']);

        // Stock Adjustments
        Route::apiResource('stock-adjustments', \App\Http\Controllers\Inventory\StockAdjustmentController::class);
        Route::post('stock-adjustments/{id}/approve', [\App\Http\Controllers\Inventory\StockAdjustmentController::class, 'approve']);
        Route::post('stock-adjustments/{id}/reject', [\App\Http\Controllers\Inventory\StockAdjustmentController::class, 'reject']);
        Route::post('stock-adjustments/{id}/complete', [\App\Http\Controllers\Inventory\StockAdjustmentController::class, 'complete']);

        // Stock Transfers
        Route::post('stock-transfers/{id}/approve', [\App\Http\Controllers\Inventory\StockTransferController::class, 'approve']);
        Route::post('stock-transfers/{id}/reject', [\App\Http\Controllers\Inventory\StockTransferController::class, 'reject']);
        Route::apiResource('stock-transfers', \App\Http\Controllers\Inventory\StockTransferController::class);
    });

    Route::prefix('crm')->group(function () {
        Route::get('customers/next-code', [\App\Http\Controllers\CustomerController::class, 'getNextCode']);
        Route::apiResource('customer-types', \App\Http\Controllers\CustomerTypeController::class);
        Route::apiResource('customers', \App\Http\Controllers\CustomerController::class);
        Route::apiResource('customer-vehicles', \App\Http\Controllers\CustomerVehicleController::class);
    });

    Route::prefix('services')->group(function () {
        Route::apiResource('list', \App\Http\Controllers\ServiceController::class);
        Route::apiResource('parts', \App\Http\Controllers\JobPartController::class);
        Route::apiResource('vehicle-brands', \App\Http\Controllers\VehicleBrandController::class);
        Route::apiResource('vehicle-models', \App\Http\Controllers\VehicleModelController::class);
        
        // Job Cards
        Route::get('job-cards', [\App\Http\Controllers\JobCardController::class, 'index']);
        Route::get('job-cards/{id}', [\App\Http\Controllers\JobCardController::class, 'show']);
        Route::put('job-cards/items/{itemId}', [\App\Http\Controllers\JobCardController::class, 'updateItem']);
        Route::put('job-cards/material-usage/{usageId}', [\App\Http\Controllers\JobCardController::class, 'updateMaterialUsage']);
        Route::post('job-cards/{id}/complete', [\App\Http\Controllers\JobCardController::class, 'complete']);
    });

    Route::prefix('sales')->group(function () {
        Route::apiResource('orders', \App\Http\Controllers\SalesOrderController::class);
        Route::post('orders/{id}/cancel', [\App\Http\Controllers\SalesOrderController::class, 'cancel']);
        Route::post('orders/{id}/deposits', [\App\Http\Controllers\SalesOrderController::class, 'addDeposit']);
    });

    Route::prefix('finance')->group(function () {
        Route::apiResource('payment-accounts', \App\Http\Controllers\Finance\PaymentAccountController::class);
    });

    // Access Control Routes
    Route::prefix('access-control')->group(function () {
        Route::apiResource('users', \App\Http\Controllers\Auth\UserController::class);
        Route::apiResource('roles', \App\Http\Controllers\Auth\RoleController::class);
        Route::get('permissions', [\App\Http\Controllers\Auth\PermissionController::class, 'index']);
        Route::post('unlock', [\App\Http\Controllers\Auth\LockScreenController::class, 'unlock']);
    });

});

// Public/Employee Attendance Routes (Token-based)
Route::prefix('attendance')->group(function () {
    Route::post('employee-login', [App\Http\Controllers\Attendance\QrAttendanceController::class, 'employeeLogin']);
    Route::post('login-credentials', [App\Http\Controllers\Attendance\QrAttendanceController::class, 'loginWithCredentials']);
    Route::post('scan/clock', [App\Http\Controllers\Attendance\QrAttendanceController::class, 'scanClock']);
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
    Route::get('leave-requests/approvals', [App\Http\Controllers\EmployeeApp\LeaveRequestController::class, 'approvals']);
    Route::post('leave-requests', [App\Http\Controllers\EmployeeApp\LeaveRequestController::class, 'store']);
    Route::post('leave-requests/{id}/approve', [App\Http\Controllers\EmployeeApp\LeaveRequestController::class, 'approve']);
    Route::post('leave-requests/{id}/reject', [App\Http\Controllers\EmployeeApp\LeaveRequestController::class, 'reject']);
    Route::put('leave-requests/{id}/cancel', [App\Http\Controllers\EmployeeApp\LeaveRequestController::class, 'cancel']);
    Route::get('preferences', [App\Http\Controllers\EmployeeApp\EmployeeAppController::class, 'getPreferences']);
    Route::put('preferences', [App\Http\Controllers\EmployeeApp\EmployeeAppController::class, 'updatePreferences']);
    
    Route::post('feedback', [App\Http\Controllers\EmployeeApp\FeedbackController::class, 'store']);

    // Activity
    Route::get('activities', [App\Http\Controllers\EmployeeApp\ActivityController::class, 'index']);
    Route::post('activities', [App\Http\Controllers\EmployeeApp\ActivityController::class, 'store']);

    // Notifications
    Route::get('notifications', [App\Http\Controllers\EmployeeApp\NotificationController::class, 'index']);
    Route::get('notifications/unread-count', [App\Http\Controllers\EmployeeApp\NotificationController::class, 'unreadCount']);
    Route::post('notifications/mark-all-read', [App\Http\Controllers\EmployeeApp\NotificationController::class, 'markAllRead']);
    Route::post('notifications/{id}/read', [App\Http\Controllers\EmployeeApp\NotificationController::class, 'markRead']);

    // Announcements (PWA)
    Route::get('announcements', [App\Http\Controllers\EmployeeApp\AnnouncementController::class, 'index']);
    Route::get('announcements/featured', [App\Http\Controllers\EmployeeApp\AnnouncementController::class, 'featured']);
    Route::get('announcements/{id}', [App\Http\Controllers\EmployeeApp\AnnouncementController::class, 'show']);
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
