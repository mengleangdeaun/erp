import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    IconCalendarEvent,
    IconClock,
    IconMapPin,
    IconCalendarCheck,
    IconCalendarPlus,
    IconConfetti,
    IconChevronRight,
    IconInfoCircle,
    IconCircleCheckFilled
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { format, isSameDay, parseISO, startOfMonth, startOfDay } from 'date-fns';
import { EmployeeCalendar } from '@/components/ui/EmployeeCalendar';
import PageHeader from '@/components/ui/PageHeader';
import { NavLink } from 'react-router-dom';

export default function EmployeePwaCalendar() {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(startOfDay(new Date()));
    const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>({
        attendance: [],
        holidays: [],
        leaves: [],
        working_days: [],
        working_shift: null
    });
    const [activeTab, setActiveTab] = useState<'workday' | 'holiday' | 'leave'>('workday');

    const fetchCalendarData = async (date: Date) => {
        const token = localStorage.getItem('employee_auth_token');
        if (!token) {
            navigate('/attendance/login');
            return;
        }

        setLoading(true);
        try {
            const month = date.getMonth() + 1;
            const year = date.getFullYear();
            const res = await fetch(`/api/employee-app/calendar-data?month=${month}&year=${year}`, {
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

            const jsonData = await res.json();
            if (res.ok) {
                setData(jsonData);
            } else {
                toast.error(jsonData.message || 'Failed to load calendar data');
            }
        } catch (e) {
            toast.error('Network error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCalendarData(currentMonth);
    }, [currentMonth]);

    // Find schedule for selected date
    const selectedSchedule = useMemo(() => {
        if (!selectedDate || !data.working_days) return null;
        const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const dayName = days[selectedDate.getDay()];
        return Array.isArray(data.working_days) ? data.working_days[selectedDate.getDay()] : data.working_days[dayName];
    }, [selectedDate, data.working_days]);

    // Find data for selected date (Normalized with startOfDay)
    const selectedAttendance = useMemo(() => {
        if (!selectedDate || !Array.isArray(data.attendance)) return null;
        const sDate = startOfDay(selectedDate);
        return data.attendance.find((a: any) => isSameDay(startOfDay(parseISO(a.date)), sDate));
    }, [selectedDate, data.attendance]);

    const selectedHoliday = useMemo(() => {
        if (!selectedDate || !Array.isArray(data.holidays)) return null;
        const sDate = startOfDay(selectedDate);
        return data.holidays.find((h: any) => {
            const start = startOfDay(parseISO(h.start_date));
            const end = startOfDay(parseISO(h.end_date));
            return sDate >= start && sDate <= end;
        });
    }, [selectedDate, data.holidays]);

    const selectedLeave = useMemo(() => {
        if (!selectedDate || !Array.isArray(data.leaves)) return null;
        const sDate = startOfDay(selectedDate);
        return data.leaves.find((l: any) => {
            const start = startOfDay(parseISO(l.start_date));
            const end = startOfDay(parseISO(l.end_date));
            return sDate >= start && sDate <= end;
        });
    }, [selectedDate, data.leaves]);

    // Switch tab automatically if data exists for that tab
    useEffect(() => {
        if (selectedHoliday) setActiveTab('holiday');
        else if (selectedLeave) setActiveTab('leave');
        else setActiveTab('workday');
    }, [selectedDate, selectedHoliday, selectedLeave]);

    const formatTime = (timeString: string | null) => {
        if (!timeString) return '--:--';
        // Handle HH:mm:ss or ISO
        if (timeString.includes(':') && timeString.length <= 8) return timeString.substring(0, 5);
        try {
            const d = new Date(timeString);
            if (isNaN(d.getTime())) return timeString;
            return format(d, 'hh:mm a');
        } catch (e) {
            return timeString;
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-[#060818]">
            <PageHeader
                title="My Calendar"
                icon={<IconCalendarEvent className="w-4 h-4" />}
                rightAction={
                    <NavLink
                        to="/employee/leave/create"
                        className="p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-all active:scale-95 flex items-center justify-center"
                        title="Request Leave"
                    >
                        <IconCalendarPlus className="w-5 h-5" />
                    </NavLink>
                }
            />

            <div className="flex-1 overflow-y-auto pb-24">
                {/* Calendar Card */}
                <div className="m-4 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <EmployeeCalendar
                        selected={selectedDate}
                        onSelect={(date) => setSelectedDate(date ? startOfDay(date) : undefined)}
                        onMonthChange={setCurrentMonth}
                        month={currentMonth}
                        attendance={data.attendance}
                        holidays={data.holidays}
                        leaves={data.leaves}
                        workingDays={data.working_days}
                    />

                    <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex flex-wrap justify-around gap-y-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800"></div> Day Off
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div> Present
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-amber-500"></div> Holiday
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-pink-500"></div> Leave
                        </div>
                    </div>
                </div>

                {/* Details Section */}
                <div className="px-4 space-y-4">
                    <div className="flex bg-white dark:bg-gray-800 p-1 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <button
                            onClick={() => setActiveTab('workday')}
                            className={cn(
                                "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                                activeTab === 'workday' ? "bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]" : "text-gray-500 dark:text-gray-400"
                            )}
                        >
                            <IconClock className="w-4 h-4" /> Workday
                        </button>
                        <button
                            onClick={() => setActiveTab('holiday')}
                            className={cn(
                                "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                                activeTab === 'holiday' ? "bg-amber-500 text-white shadow-md shadow-amber-500/20 scale-[1.02]" : "text-gray-500 dark:text-gray-400"
                            )}
                        >
                            <IconConfetti className="w-4 h-4" /> Holiday
                        </button>
                        <button
                            onClick={() => setActiveTab('leave')}
                            className={cn(
                                "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                                activeTab === 'leave' ? "bg-pink-500 text-white shadow-md shadow-pink-500/20 scale-[1.02]" : "text-gray-500 dark:text-gray-400"
                            )}
                        >
                            <IconCalendarPlus className="w-4 h-4" /> Leave
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {activeTab === 'workday' && (
                            <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-black text-xs uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">Weekly Schedule</h3>
                                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{data.working_shift?.name}</span>
                                </div>
                                <div className="space-y-3">
                                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                                        const schedule = data.working_days?.[day];
                                        const isToday = format(new Date(), 'eeee').toLowerCase() === day;

                                        if (!schedule || (!schedule.is_working && schedule.is_working !== 0)) return null;

                                        return (
                                            <div
                                                key={day}
                                                className={cn(
                                                    "p-4 rounded-2xl border transition-all",
                                                    isToday
                                                        ? "bg-primary/5 border-primary/20 ring-1 ring-primary/10 scale-[1.02]"
                                                        : "bg-gray-50/50 dark:bg-gray-900/30 border-gray-100 dark:border-gray-800"
                                                )}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className={cn(
                                                        "text-xs font-black uppercase tracking-widest",
                                                        isToday ? "text-primary" : "text-gray-900 dark:text-white"
                                                    )}>
                                                        {day}
                                                        {isToday && <span className="ml-2 text-[8px] bg-primary text-white px-1.5 py-0.5 rounded-sm">TODAY</span>}
                                                    </span>
                                                    <span className={cn(
                                                        "text-[9px] font-black uppercase px-2 py-0.5 rounded-full",
                                                        schedule.is_working ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400" : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400"
                                                    )}>
                                                        {schedule.is_working ? 'Required' : 'Day Off'}
                                                    </span>
                                                </div>

                                                {schedule.is_working ? (
                                                    <div className="space-y-2">
                                                        {data.working_shift?.shift_type === 'split' ? (
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div className="bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-100 dark:border-gray-700">
                                                                    <span className="text-[8px] font-black text-blue-500 uppercase block mb-1">Session 1</span>
                                                                    <p className="text-[11px] font-bold text-gray-700 dark:text-gray-300">{formatTime(schedule.start_time)} - {formatTime(schedule.break_start)}</p>
                                                                </div>
                                                                <div className="bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-100 dark:border-gray-700">
                                                                    <span className="text-[8px] font-black text-blue-500 uppercase block mb-1">Session 2</span>
                                                                    <p className="text-[11px] font-bold text-gray-700 dark:text-gray-300">{formatTime(schedule.break_end)} - {formatTime(schedule.end_time)}</p>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700">
                                                                <div className="flex-1">
                                                                    <span className="text-[8px] font-black text-primary uppercase block mb-0.5">Working Hours</span>
                                                                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}</p>
                                                                </div>
                                                                {schedule.has_break && (
                                                                    <div className="border-l border-gray-100 dark:border-gray-700 pl-4">
                                                                        <span className="text-[8px] font-black text-orange-500 uppercase block mb-0.5">Break</span>
                                                                        <p className="text-[10px] font-bold text-gray-500">{formatTime(schedule.break_start)} - {formatTime(schedule.break_end)}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-[11px] font-bold text-red-400 italic">No working sessions scheduled.</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {activeTab === 'holiday' && (
                            <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-black text-xs uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">Monthly Holidays</h3>
                                    <IconConfetti className="w-4 h-4 text-amber-500" />
                                </div>
                                {data.holidays && data.holidays.length > 0 ? (
                                    <div className="space-y-3">
                                        {data.holidays.map((holiday: any) => (
                                            <div key={holiday.id} className="p-4 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-2xl">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-black text-sm text-gray-900 dark:text-white tracking-tight">{holiday.name}</h4>
                                                    <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 rounded-full">
                                                        {holiday.category}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                                    <IconCalendarCheck className="w-3 h-3" />
                                                    {format(parseISO(holiday.start_date), 'MMM dd')} - {format(parseISO(holiday.end_date), 'MMM dd')}
                                                </div>
                                                {holiday.description && (
                                                    <p className="mt-2 text-[11px] text-gray-500 italic leading-relaxed line-clamp-2">
                                                        {holiday.description}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 opacity-30">
                                        <IconConfetti className="w-10 h-10 mx-auto mb-2" />
                                        <p className="text-xs font-bold uppercase tracking-widest">No holidays this month</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'leave' && (
                            <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-black text-xs uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">Monthly Leaves</h3>
                                    <IconCalendarPlus className="w-4 h-4 text-pink-500" />
                                </div>
                                {data.leaves && data.leaves.length > 0 ? (
                                    <div className="space-y-3">
                                        {data.leaves.map((leave: any) => (
                                            <div key={leave.id} className="p-4 bg-pink-50/50 dark:bg-pink-900/10 border border-pink-100 dark:border-pink-900/20 rounded-2xl">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h4 className="font-black text-sm text-gray-900 dark:text-white tracking-tight">{leave.leave_type?.name || 'Leave'}</h4>
                                                        <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-0.5">
                                                            {format(parseISO(leave.start_date), 'MMM dd')} - {format(parseISO(leave.end_date), 'MMM dd')}
                                                        </p>
                                                    </div>
                                                    <span className={cn(
                                                        "text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm",
                                                        leave.status === 'approved' ? "bg-green-500 text-white" : "bg-amber-500 text-white"
                                                    )}>
                                                        {leave.status}
                                                    </span>
                                                </div>
                                                {leave.reason && (
                                                    <div className="mt-2.5 pt-2.5 border-t border-pink-100/50 dark:border-pink-900/20">
                                                        <p className="text-[11px] text-gray-500 italic leading-relaxed line-clamp-2">
                                                            "{leave.reason}"
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 opacity-30">
                                        <IconCalendarPlus className="w-10 h-10 mx-auto mb-2" />
                                        <p className="text-xs font-bold uppercase tracking-widest">No leave records this month</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
