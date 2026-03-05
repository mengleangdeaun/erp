import { lazy } from 'react';
const Index = lazy(() => import('../pages/Index'));
const Login = lazy(() => import('../pages/Auth/login'));
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

// HR - Activity Log
const HrActivityIndex = lazy(() => import('../pages/HR/Activity/Index'));

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
    // profile
    {
        path: '/profile/settings',
        element: <ProfileSetting />,
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
        layout: 'mobile',
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
    {
        path: '*',
        element: <Error />,
        layout: 'blank',
    },
];

export { routes };
