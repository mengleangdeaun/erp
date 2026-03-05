import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate, NavLink } from 'react-router-dom';
import {
    IconCalendarEvent,
    IconCalendarPlus,
    IconActivity,
    IconClockHour4,
    IconLogout,
    IconChevronRight
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';

export default function EmployeePwaDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [dashboardData, setDashboardData] = useState<any>(null);

    // Live clock ticker
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchDashboard = async () => {
        const token = localStorage.getItem('employee_auth_token');
        if (!token) {
            navigate('/attendance/login');
            return;
        }

        try {
            const res = await fetch('/api/employee-app/dashboard', {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.status === 401) {
                localStorage.removeItem('employee_auth_token');
                navigate('/attendance/login');
                return;
            }

            const data = await res.json();
            if (res.ok) {
                setDashboardData(data);
            } else {
                toast.error(data.message || 'Failed to load dashboard');
            }
        } catch (e) {
            toast.error('Network error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    const handleSignOut = () => {
        localStorage.removeItem('employee_auth_token');
        navigate('/attendance/login');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[60vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!dashboardData) return null;

    const { employee, today_status, clock_in_time, clock_out_time } = dashboardData;

    // Status indicator
    let statusBg = 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
    let statusText = today_status ?? 'Not Clocked In';
    let isActive = false;

    if (today_status === 'Present' && !clock_out_time) {
        statusBg = 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400';
        statusText = 'Clocked In · Active';
        isActive = true;
    } else if (today_status === 'Present' && clock_out_time) {
        statusBg = 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400';
        statusText = 'Shift Completed';
    }

    // Feature menu definition
    const features = [
        {
            label: 'Attendance',
            sub: 'View your history',
            icon: <IconClockHour4 className="w-7 h-7" />,
            iconBg: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
            path: '/employee/history',
        },
        {
            label: 'Activity',
            sub: 'Log field activity',
            icon: <IconActivity className="w-7 h-7" />,
            iconBg: 'bg-orange-100 dark:bg-orange-900/30 text-orange-500 dark:text-orange-400',
            path: '/employee/activity',
        },
        {
            label: 'Leave',
            sub: 'Request time off',
            icon: <IconCalendarPlus className="w-7 h-7" />,
            iconBg: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
            path: '/employee/leave/create',
        },
        {
            label: 'My Calendar',
            sub: 'View your schedule',
            icon: <IconCalendarEvent className="w-7 h-7" />,
            iconBg: 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400',
            path: '/employee/calendar',
        },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-[#060818]">
            {/* Hero Header */}
            <div className="bg-primary text-white px-5 pt-5 pb-10 sticky top-0 z-40 rounded-b-[2.5rem] shadow-lg shadow-primary/20">
                <div className="flex justify-between items-start mb-5">
                    <div>
                        <h1 className="text-xl font-black leading-tight">
                            Hey, {employee.name.split(' ')[0]} 👋
                        </h1>
                        <p className="text-white/70 text-sm font-medium mt-0.5">{employee.designation}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Avatar */}
                        <div
                            onClick={() => navigate('/employee/profile')}
                            className="w-11 h-11 rounded-full border-2 border-white/40 overflow-hidden bg-white/20 shrink-0 cursor-pointer active:scale-95 transition-transform"
                        >
                            {employee.profile_image ? (
                                <img
                                    src={employee.profile_image?.startsWith('http') ? employee.profile_image : `/storage/${employee.profile_image}`}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-lg font-black bg-white/10">
                                    {employee.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Sign out */}
                        <button
                            onClick={handleSignOut}
                            className="p-2.5 bg-white/15 hover:bg-white/25 rounded-xl transition-all active:scale-95"
                            aria-label="Sign Out"
                        >
                            <IconLogout className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Status pill */}
                <div className={cn('inline-flex items-center px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest', statusBg)}>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />}
                    {statusText}
                </div>
            </div>

            <div className="px-4 -mt-5 z-10 space-y-5 pb-28 animate-in fade-in slide-in-from-bottom-2 duration-500">

                {/* Live Clock Card */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl px-6 py-5 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center relative overflow-hidden">
                    {isActive && (
                        <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-green-400 via-emerald-400 to-green-400 animate-pulse" />
                    )}
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Current Time</p>
                    <div className="text-5xl font-black text-gray-900 dark:text-white tracking-tight tabular-nums">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <p className="text-gray-400 text-xs font-semibold mt-1">
                        {currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                {/* Feature Menu */}
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3 ml-1">Quick Access</p>
                    <div className="grid grid-cols-2 gap-3">
                        {features.map((feature) => (
                            <NavLink
                                key={feature.label}
                                to={feature.path}
                                className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-3 active:scale-[0.97] transition-transform"
                            >
                                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", feature.iconBg)}>
                                    {feature.icon}
                                </div>
                                <div>
                                    <p className="font-black text-sm text-gray-900 dark:text-white leading-tight">{feature.label}</p>
                                    <p className="text-[11px] text-gray-400 font-medium mt-0.5">{feature.sub}</p>
                                </div>
                                <IconChevronRight className="w-4 h-4 text-gray-300 self-end -mt-1" />
                            </NavLink>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
