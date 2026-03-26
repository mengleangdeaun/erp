import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { IconHistory, IconCalendar, IconClock } from '@tabler/icons-react';
import PageHeader from '@/components/ui/PageHeader';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { useTranslation } from 'react-i18next';

export default function EmployeePwaHistory() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState<any[]>([]);

    const fetchHistory = async () => {
        const token = localStorage.getItem('employee_auth_token');
        if (!token) {
            navigate('/attendance/login');
            return;
        }

        try {
            const res = await fetch('/api/employee-app/history', {
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
                // Laravel pagination returns an array in `data.data`
                setHistory(data.data || []);
            } else {
                toast.error(data.message || 'Failed to load history');
            }
        } catch (e) {
            toast.error('Network error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        dispatch(setPageTitle(t('attendance_history', 'Attendance History')));
    }, [dispatch, t]);

    useEffect(() => {
        fetchHistory();
    }, []);

    const formatTime = (timeString: string | null) => {
        if (!timeString) return '--:--';
        return new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return {
            day: date.toLocaleDateString([], { weekday: 'short' }),
            dateStr: date.toLocaleDateString([], { day: 'numeric', month: 'short' })
        };
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-[#060818]">
            <PageHeader title="Attendance" icon={<IconHistory className="w-4 h-4" />} />

            <div className="p-4 space-y-4">
                {loading ? (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : history.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                        <IconCalendar className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Records Yet</h3>
                        <p className="text-sm text-gray-500 mt-1">Your clock-in history will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {history.map((record) => {
                            const dateInfo = formatDate(record.date);

                            // Visual indicator for missing a clock out
                            const isMissingOut1 = record.status === 'Present' && !record.clock_out_time && !record.session_2_clock_in_time;
                            const isMissingOut2 = record.status === 'Present' && record.session_2_clock_in_time && !record.session_2_clock_out_time;

                            return (
                                <div key={record.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex items-start gap-4">
                                    {/* Date Bubble */}
                                    <div className="flex flex-col items-center justify-center w-14 h-14 bg-blue-50 dark:bg-gray-700 rounded-xl shrink-0 border border-blue-100 dark:border-gray-600 mt-1">
                                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest leading-none">{dateInfo.day}</span>
                                        <span className="text-lg font-black text-gray-900 dark:text-white leading-tight mt-0.5">{dateInfo.dateStr.split(' ')[0]}</span>
                                    </div>

                                    {/* Timeline Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${record.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {record.status}
                                            </span>
                                        </div>

                                        <div className="space-y-3">
                                            {/* Session 1 */}
                                            <div>
                                                {record.session_2_clock_in_time && (
                                                    <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 mb-1 uppercase tracking-wide">Session 1</div>
                                                )}
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                                            {formatTime(record.clock_in_time)}
                                                        </span>
                                                    </div>

                                                    <div className="h-px bg-gray-200 dark:bg-gray-600 w-4"></div>

                                                    <div className="flex items-center gap-1.5">
                                                        <div className={`w-2 h-2 rounded-full ${isMissingOut1 ? 'bg-orange-400 animate-pulse' : 'bg-blue-500'}`}></div>
                                                        <span className={`text-sm font-semibold ${isMissingOut1 ? 'text-orange-500 italic' : 'text-gray-800 dark:text-gray-200'}`}>
                                                            {isMissingOut1 ? 'Active' : formatTime(record.clock_out_time)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Session 2 (Optional) */}
                                            {record.session_2_clock_in_time && (
                                                <div className="pt-2 border-t border-dashed border-gray-100 dark:border-gray-700">
                                                    <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 mb-1 uppercase tracking-wide">Session 2</div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                                                {formatTime(record.session_2_clock_in_time)}
                                                            </span>
                                                        </div>

                                                        <div className="h-px bg-gray-200 dark:bg-gray-600 w-4"></div>

                                                        <div className="flex items-center gap-1.5">
                                                            <div className={`w-2 h-2 rounded-full ${isMissingOut2 ? 'bg-orange-400 animate-pulse' : 'bg-blue-500'}`}></div>
                                                            <span className={`text-sm font-semibold ${isMissingOut2 ? 'text-orange-500 italic' : 'text-gray-800 dark:text-gray-200'}`}>
                                                                {isMissingOut2 ? 'Active' : formatTime(record.session_2_clock_out_time)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="h-6"></div>
        </div>
    );
}
