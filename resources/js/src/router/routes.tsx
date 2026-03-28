import { lazy } from 'react';
const Index = lazy(() => import('../pages/Index'));
const Login = lazy(() => import('../pages/Auth/login'));
const ForgotPassword = lazy(() => import('../pages/Auth/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/Auth/ResetPassword'));
const LockScreen = lazy(() => import('../pages/Auth/LockScreen'));
const ProfileSetting = lazy(() => import('../pages/Profile/ProfileSetting'));
const BranchIndex = lazy(() => import('../pages/HR/Branch/Index'));
const DepartmentIndex = lazy(() => import('../pages/HR/Department/Index'));
const DocumentTypeIndex = lazy(() => import('../pages/HR/DocumentType/Index'));
const DesignationIndex = lazy(() => import('../pages/HR/Designation/Index'));
const WorkingShiftIndex = lazy(() => import('../pages/Attendance/WorkingShift/Index'));
const AttendancePolicyIndex = lazy(() => import('../pages/Attendance/AttendancePolicy/Index'));
const AttendanceRecordIndex = lazy(() => import('../pages/Attendance/AttendanceRecord/Index'));
const EmployeeIndex = lazy(() => import('../pages/HR/Employee/Index'));
const EmployeeCreate = lazy(() => import('../pages/HR/Employee/Create'));
const EmployeeEdit = lazy(() => import('../pages/HR/Employee/Edit'));
const BranchEmployeeIndex = lazy(() => import('../pages/HR/BranchEmployees/Index'));
const EmployeeConfigIndex = lazy(() => import('../pages/Attendance/EmployeeConfig/Index'));
const AwardTypeIndex = lazy(() => import('../pages/HR/AwardType/Index'));
const AwardIndex = lazy(() => import('../pages/HR/Award/Index'));
const PromotionIndex = lazy(() => import('../pages/HR/Promotion/Index'));
const ResignationIndex = lazy(() => import('../pages/HR/Resignation/Index'));
const TerminationIndex = lazy(() => import('../pages/HR/Termination/Index'));
const WarningIndex = lazy(() => import('../pages/HR/Warning/Index'));
const HolidayIndex = lazy(() => import('../pages/HR/Holiday/Index'));

// Leave Management
const CompanyFeedbackIndex = lazy(() => import('../pages/HR/CompanyFeedback/Index'));
const LeaveTypeIndex = lazy(() => import('../pages/HR/LeaveType/Index'));
const LeavePolicyIndex = lazy(() => import('../pages/HR/LeavePolicy/Index'));
const LeaveAllocationIndex = lazy(() => import('../pages/HR/LeaveAllocation/Index'));
const LeaveRecordIndex = lazy(() => import('../pages/HR/LeaveRecord/Index'));
const LeaveBalanceIndex = lazy(() => import('../pages/HR/LeaveBalance/Index'));

// Announcements & Telegram
const AnnouncementIndex = lazy(() => import('../pages/HR/Announcement/Index'));
const AnnouncementForm = lazy(() => import('../pages/HR/Announcement/Form'));
const TelegramSettings = lazy(() => import('../pages/HR/Announcement/TelegramSettings'));
const PrefixSuffixSettings = lazy(() => import('../pages/Settings/PrefixSuffix/Index'));
const SystemLogsIndex = lazy(() => import('../pages/Settings/SystemLogs/Index'));

const UserPreferences = lazy(() => import('../pages/Profile/UserPreferences'));

const MediaLibrary = lazy(() => import('../pages/Apps/MediaLibrary'));
const Error = lazy(() => import('../components/Error'));

const BranchQrSetup = lazy(() => import('../pages/Attendance/BranchQr/Index'));
const MobileEmployeeLogin = lazy(() => import('../pages/Attendance/EmployeeApp/Login/Index'));
const MobileEmployeeScan = lazy(() => import('../pages/Attendance/EmployeeApp/Scan/Index'));

const EmployeePwaDashboard = lazy(() => import('../pages/EmployeeApp/Dashboard/Index'));
const EmployeePwaCalendar = lazy(() => import('../pages/EmployeeApp/Calendar/Index'));
const EmployeePwaProfile = lazy(() => import('../pages/EmployeeApp/Profile/Index'));
const EmployeePwaFeedbackCreate = lazy(() => import('../pages/EmployeeApp/Feedback/Create'));
const EmployeePwaScan = lazy(() => import('../pages/EmployeeApp/Scan/Index'));
const EmployeePwaLeave = lazy(() => import('../pages/EmployeeApp/Leave/Index'));
const EmployeePwaLeaveCreate = lazy(() => import('../pages/EmployeeApp/Leave/Create'));
const EmployeePwaActivity = lazy(() => import('../pages/EmployeeApp/Activity/Index'));
const EmployeePwaActivityCreate = lazy(() => import('../pages/EmployeeApp/Activity/Create'));
const EmployeePwaHistory = lazy(() => import('../pages/EmployeeApp/History/Index'));
const EmployeePwaSettings = lazy(() => import('../pages/EmployeeApp/Settings/Index'));
const EmployeePwaNotifications = lazy(() => import('../pages/EmployeeApp/Notification/Index'));
const EmployeePwaAnnouncementDetail = lazy(() => import('../pages/EmployeeApp/Notification/AnnouncementDetail'));

// HR - Activity Log
const HrActivityIndex = lazy(() => import('../pages/HR/Activity/Index'));
const InventoryDashboard = lazy(() => import('../pages/Dashboard/Inventory'));

// Inventory Module
const InventoryTagIndex = lazy(() => import('../pages/Inventory/Tags/Index'));
const InventoryUomIndex = lazy(() => import('../pages/Inventory/Uom/Index'));
const InventoryLocationIndex = lazy(() => import('../pages/Inventory/Locations/Index'));
const InventoryCategoryIndex = lazy(() => import('../pages/Inventory/Categories/Index'));
const InventoryProductIndex = lazy(() => import('../pages/Inventory/Products/Index'));
const InventoryStockIndex = lazy(() => import('../pages/Inventory/Stocks/Index'));
const InventoryStockMovementIndex = lazy(() => import('../pages/Inventory/StockMovements/Index'));
// Procurement Module
const InventorySupplierIndex = lazy(() => import('../pages/Inventory/Suppliers/Index'));
const InventoryPurchaseOrderIndex = lazy(() => import('../pages/Inventory/PurchaseOrders/Index'));
const InventoryPurchaseReceiveIndex = lazy(() => import('../pages/Inventory/PurchaseReceives/Index'));
const InventoryStockAdjustmentIndex = lazy(() => import('../pages/Inventory/StockAdjustments/Index'));
const InventoryStockAdjustmentForm = lazy(() => import('../pages/Inventory/StockAdjustments/Form'));
const InventoryStockTransferIndex = lazy(() => import('../pages/Inventory/StockTransfers/Index'));
const InventoryStockTransferForm = lazy(() => import('../pages/Inventory/StockTransfers/Form'));
const InventoryBranchProductIndex = lazy(() => import('../pages/Inventory/BranchProducts/Index'));
const InventoryBranchServiceIndex = lazy(() => import('../pages/Inventory/BranchServices/Index'));
const InventorySerialIndex = lazy(() => import('../pages/Inventory/Serials/Index'));
const InventoryStockBalanceIndex = lazy(() => import('../pages/Inventory/StockBalance/Index'));
const InventorySerialMovementIndex = lazy(() => import('../pages/Inventory/SerialMovements/Index'));

// CRM Module
const CRM_CustomerTypeIndex = lazy(() => import('../pages/Customers/Types/Index'));
const CRM_CustomerIndex = lazy(() => import('../pages/Customers/Index'));
const CRM_CustomerVehicleIndex = lazy(() => import('../pages/Customers/Vehicles/Index'));

// Sale & Service Module
const ServiceIndex = lazy(() => import('../pages/Services/Index'));
const ServicePartIndex = lazy(() => import('../pages/Services/Parts/Index'));
const VehicleBrandIndex = lazy(() => import('../pages/Services/Vehicles/Brands/Index'));
const VehicleModelIndex = lazy(() => import('../pages/Services/Vehicles/Models/Index'));
const SalesOrderIndex = lazy(() => import('../pages/Sales/Index'));
const SalesCreate = lazy(() => import('../pages/Sales/Create'));
const PaymentAccountIndex = lazy(() => import('../pages/Finance/PaymentAccounts/Index'));
const JobCardIndex = lazy(() => import('../pages/Services/JobCards/Index'));
const DamageReportsIndex = lazy(() => import('../pages/Services/JobCards/DamageReportsIndex'));
const ReplacementTypeIndex = lazy(() => import('../pages/Services/JobCards/ReplacementTypeIndex'));
const SaleRemarkIndex = lazy(() => import('../pages/Sales/SaleRemarks/Index'));
const QCReportsIndex = lazy(() => import('../pages/Services/JobCards/QCReportsIndex'));

// Access Control
const RoleManagement = lazy(() => import('../pages/AccessControl/Roles'));
const UserManagement = lazy(() => import('../pages/AccessControl/Users'));

const routes = [
    // dashboard
    {
        path: '/',
        element: <Index />,
        layout: 'default',
    },
    // auth
    {
        path: '/auth/login',
        element: <Login />,
        layout: 'blank',
    },
    {
        path: '/auth/forgot-password',
        element: <ForgotPassword />,
        layout: 'blank',
    },
    {
        path: '/auth/reset-password',
        element: <ResetPassword />,
        layout: 'blank',
    },
    {
        path: '/auth/lockscreen',
        element: <LockScreen />,
        layout: 'blank',
    },
    // profile
    {
        path: '/users/profile',
        element: <ProfileSetting />,
        layout: 'default',
    },
    {
        path: '/users/preferences',
        element: <UserPreferences />,
        layout: 'default',
    },
    // Access Control
    {
        path: '/access-control/roles',
        element: <RoleManagement />,
        layout: 'default',
    },
    {
        path: '/access-control/users',
        element: <UserManagement />,
        layout: 'default',
    },
    // Branch (Single Page with Modal)
    {
        path: '/hr/branches',
        element: <BranchIndex />,
        layout: 'default',
    },
    // Departments
    {
        path: '/hr/departments',
        element: <DepartmentIndex />,
        layout: 'default',
    },
    // Designations
    {
        path: '/hr/designations',
        element: <DesignationIndex />,
        layout: 'default',
    },
    // Document Types
    {
        path: '/hr/document-types',
        element: <DocumentTypeIndex />,
        layout: 'default',
    },
    // Working Shifts
    {
        path: '/attendance/working-shifts',
        element: <WorkingShiftIndex />,
        layout: 'default',
    },
    // Attendance Policies
    {
        path: '/attendance/attendance-policies',
        element: <AttendancePolicyIndex />,
        layout: 'default',
    },
    // Attendance Records
    {
        path: '/attendance/records',
        element: <AttendanceRecordIndex />,
        layout: 'default',
    },
    // Employee Config
    {
        path: '/attendance/employee-config',
        element: <EmployeeConfigIndex />,
        layout: 'default',
    },
    // Branch QR Setup
    {
        path: '/attendance/branch-qr',
        element: <BranchQrSetup />,
        layout: 'default',
    },
    // Mobile Employee Kiosk
    {
        path: '/attendance/login',
        element: <MobileEmployeeLogin />,
        layout: 'blank', // no sidebar
    },
    {
        path: '/attendance/scan',
        element: <MobileEmployeeScan />,
        layout: 'blank', // no sidebar
    },
    // Employee PWA App Pages (uses BottomNav layout)
    {
        path: '/employee/dashboard',
        element: <EmployeePwaDashboard />,
        layout: 'mobile',
    },
    {
        path: '/employee/calendar',
        element: <EmployeePwaCalendar />,
        layout: 'mobile',
    },
    {
        path: '/employee/profile',
        element: <EmployeePwaProfile />,
        layout: 'mobile',
    },
    {
        path: '/employee/scan',
        element: <EmployeePwaScan />,
        layout: 'blank',
    },
    {
        path: '/employee/leave',
        element: <EmployeePwaLeave />,
        layout: 'mobile',
    },
    {
        path: '/employee/leave/create',
        element: <EmployeePwaLeaveCreate />,
        layout: 'mobile',
    },
    {
        path: '/employee/history',
        element: <EmployeePwaHistory />,
        layout: 'mobile',
    },
    {
        path: '/employee/settings',
        element: <EmployeePwaSettings />,
        layout: 'mobile',
    },
    // HR - Announcements
    {
        path: '/hr/announcements',
        element: <AnnouncementIndex />,
        layout: 'default',
    },
    {
        path: '/hr/announcements/create',
        element: <AnnouncementForm />,
        layout: 'default',
    },
    {
        path: '/hr/announcements/:id/edit',
        element: <AnnouncementForm />,
        layout: 'default',
    },
    {
        path: '/hr/telegram-settings',
        element: <TelegramSettings />,
        layout: 'default',
    },
    {
        path: '/settings/document-numbers',
        element: <PrefixSuffixSettings />,
        layout: 'default',
    },
    {
        path: '/settings/system-logs',
        element: <SystemLogsIndex />,
        layout: 'default',
    },
    // Employee App - Notifications
    {
        path: '/employee/notifications',
        element: <EmployeePwaNotifications />,
        layout: 'mobile',
    },
    {
        path: '/employee/announcements/:id',
        element: <EmployeePwaAnnouncementDetail />,
        layout: 'mobile',
    },
    // Employees
    {
        path: '/hr/employees',
        element: <EmployeeIndex />,
        layout: 'default',
    },
    {
        path: '/hr/employees/create',
        element: <EmployeeCreate />,
        layout: 'default',
    },
    {
        path: '/hr/employees/:id/edit',
        element: <EmployeeEdit />,
        layout: 'default',
    },
    {
        path: '/hr/branch-employees',
        element: <BranchEmployeeIndex />,
        layout: 'default',
    },
    // Awards
    {
        path: '/hr/award-types',
        element: <AwardTypeIndex />,
        layout: 'default',
    },
    {
        path: '/hr/awards',
        element: <AwardIndex />,
        layout: 'default',
    },
    {
        path: '/hr/promotions',
        element: <PromotionIndex />,
        layout: 'default',
    },
    {
        path: '/hr/resignations',
        element: <ResignationIndex />,
        layout: 'default',
    },
    {
        path: '/hr/terminations',
        element: <TerminationIndex />,
        layout: 'default',
    },
    {
        path: '/hr/warnings',
        element: <WarningIndex />,
        layout: 'default',
    },
    {
        path: '/hr/holidays',
        element: <HolidayIndex />,
        layout: 'default',
    },
    // Leave Management
    {
        path: '/hr/leave-types',
        element: <LeaveTypeIndex />,
        layout: 'default',
    },
    {
        path: '/hr/leave-policies',
        element: <LeavePolicyIndex />,
        layout: 'default',
    },
    {
        path: '/hr/leave-allocations',
        element: <LeaveAllocationIndex />,
        layout: 'default',
    },
    {
        path: '/hr/leave-records',
        element: <LeaveRecordIndex />,
        layout: 'default',
    },
    {
        path: '/hr/leave-balances',
        element: <LeaveBalanceIndex />,
        layout: 'default',
    },
    // HR - Activity Log
    {
        path: '/hr/activities',
        element: <HrActivityIndex />,
        layout: 'default',
    },
    {
        path: '/hr/company-feedbacks',
        element: <CompanyFeedbackIndex />,
        layout: 'default',
    },
    {
        path: '/apps/media-library',
        element: <MediaLibrary />,
        layout: 'default',
    },
    // Employee PWA routes
    {
        path: '/employee/activity',
        element: <EmployeePwaActivity />,
        layout: 'mobile',
    },
    {
        path: '/employee/activity/create',
        element: <EmployeePwaActivityCreate />,
        layout: 'mobile',
    },
    {
        path: '/employee/feedback/create',
        element: <EmployeePwaFeedbackCreate />,
        layout: 'mobile',
    },
    // Inventory Routes
    { path: '/dashboard/inventory', element: <InventoryDashboard />, layout: 'default' },
    { path: '/inventory/categories', element: <InventoryCategoryIndex />, layout: 'default' },
    { path: '/inventory/tags', element: <InventoryTagIndex />, layout: 'default' },
    { path: '/inventory/uoms', element: <InventoryUomIndex />, layout: 'default' },
    { path: '/inventory/locations', element: <InventoryLocationIndex />, layout: 'default' },
    { path: '/inventory/products', element: <InventoryProductIndex />, layout: 'default' },
    { path: '/inventory/stocks', element: <InventoryStockIndex />, layout: 'default' },
    { path: '/inventory/stock-movements', element: <InventoryStockMovementIndex />, layout: 'default' },
    { path: '/inventory/serial-movements', element: <InventorySerialMovementIndex />, layout: 'default' },
    { path: '/inventory/branch-products', element: <InventoryBranchProductIndex />, layout: 'default' },
    { path: '/inventory/branch-services', element: <InventoryBranchServiceIndex />, layout: 'default' },
    { path: '/inventory/serials', element: <InventorySerialIndex />, layout: 'default' },
    { path: '/inventory/stock-balance', element: <InventoryStockBalanceIndex />, layout: 'default' },
    // Procurement
    { path: '/inventory/suppliers', element: <InventorySupplierIndex />, layout: 'default' },
    { path: '/inventory/purchase-orders', element: <InventoryPurchaseOrderIndex />, layout: 'default' },
    { path: '/inventory/purchase-receives', element: <InventoryPurchaseReceiveIndex />, layout: 'default' },
    { path: '/inventory/stock-adjustments', element: <InventoryStockAdjustmentIndex />, layout: 'default' },
    { path: '/inventory/stock-adjustments/create', element: <InventoryStockAdjustmentForm />, layout: 'default' },
    { path: '/inventory/stock-adjustments/:id/edit', element: <InventoryStockAdjustmentForm />, layout: 'default' },
    { path: '/inventory/stock-transfers', element: <InventoryStockTransferIndex />, layout: 'default' },
    { path: '/inventory/stock-transfers/create', element: <InventoryStockTransferForm />, layout: 'default' },
    { path: '/inventory/stock-transfers/:id/edit', element: <InventoryStockTransferForm />, layout: 'default' },
    // CRM
    { path: '/crm/customer-types', element: <CRM_CustomerTypeIndex />, layout: 'default' },
    { path: '/crm/customers', element: <CRM_CustomerIndex />, layout: 'default' },
    { path: '/crm/customer-vehicles', element: <CRM_CustomerVehicleIndex />, layout: 'default' },

    // Sale & Service
    { path: '/services/list', element: <ServiceIndex />, layout: 'default' },
    { path: '/services/parts', element: <ServicePartIndex />, layout: 'default' },
    { path: '/services/vehicles/brands', element: <VehicleBrandIndex />, layout: 'default' },
    { path: '/services/vehicles/models', element: <VehicleModelIndex />, layout: 'default' },
    { path: '/services/job-cards', element: <JobCardIndex />, layout: 'default' },
    { path: '/job-cards/replacement-types', element: <ReplacementTypeIndex />, layout: 'default' },
    { path: '/sales/orders', element: <SalesOrderIndex />, layout: 'default' },
    { path: '/sales/create', element: <SalesCreate />, layout: 'default' },
    { path: '/sales/edit/:id', element: <SalesCreate />, layout: 'default' },
    { path: '/sales/remarks', element: <SaleRemarkIndex />, layout: 'default' },
    { path: '/services/qc-reports', element: <QCReportsIndex />, layout: 'default' },
    { path: '/services/damage-reports', element: <DamageReportsIndex />, layout: 'default' },
    { path: '/finance/payment-accounts', element: <PaymentAccountIndex />, layout: 'default' },
    {
        path: '*',
        element: <Error />,
        layout: 'blank',
    },
];

export { routes };
