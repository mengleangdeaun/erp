import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { IconActivity, IconPlus, IconMapPin, IconCalendarEvent, IconCheck, IconAlertTriangle, IconClock } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import PageHeader from '@/components/ui/PageHeader';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { useTranslation } from 'react-i18next';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    submitted: { label: 'Submitted', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: <IconClock className="w-3 h-3" /> },
    reviewed: { label: 'Reviewed', color: 'text-green-600 bg-green-50 border-green-200', icon: <IconCheck className="w-3 h-3" /> },
    flagged: { label: 'Flagged', color: 'text-red-600 bg-red-50 border-red-200', icon: <IconAlertTriangle className="w-3 h-3" /> },
};

export default function EmployeePwaActivity() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState<any[]>([]);
    const token = localStorage.getItem('employee_auth_token');

    const fetchActivities = async () => {
        if (!token) { navigate('/attendance/login'); return; }
        try {
            const res = await fetch('/api/employee-app/activities', {
                headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
            });
            if (res.status === 401) { localStorage.removeItem('employee_auth_token'); navigate('/attendance/login'); return; }
            if (res.ok) {
                const data = await res.json();
                setActivities(data.data || []);
            }
        } catch { toast.error('Network error'); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        dispatch(setPageTitle(t('activity', 'Activity')));
    }, [dispatch, t]);

    useEffect(() => { fetchActivities(); }, []);

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-[#060818]">
            <PageHeader
                title="Activity"
                icon={<IconActivity className="w-4 h-4" />}
                rightAction={
                    <button
                        onClick={() => navigate('/employee/activity/create')}
                        className="w-9 h-9 bg-primary text-white rounded-xl flex items-center justify-center shadow-md shadow-primary/30 active:scale-90 transition-all"
                        aria-label="New Activity"
                    >
                        <IconPlus className="w-4 h-4" />
                    </button>
                }
            />

            <div className="p-4 space-y-3 pb-28 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                    </div>
                ) : activities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                            <IconActivity className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 dark:text-white">No Activities Yet</h3>
                        <p className="text-sm text-gray-400 mt-1 px-8">Tap the + button to log your first field activity.</p>
                        <button
                            onClick={() => navigate('/employee/activity/create')}
                            className="mt-6 px-6 py-3 bg-primary text-white rounded-2xl font-bold text-sm shadow-md shadow-primary/30 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <IconPlus className="w-4 h-4" />
                            New Activity
                        </button>
                    </div>
                ) : (
                    activities.map(act => {
                        const status = STATUS_CONFIG[act.status] ?? STATUS_CONFIG.submitted;
                        return (
                            <div key={act.id} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
                                {/* Photo */}
                                <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-900">
                                    <img
                                        src={act.photo_url}
                                        alt="Activity"
                                        className="w-full h-full object-cover"
                                    />
                                    {/* Status Badge */}
                                    <span className={cn('absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border', status.color)}>
                                        {status.icon}{status.label}
                                    </span>
                                </div>

                                {/* Details */}
                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                            <IconCalendarEvent className="w-3.5 h-3.5" />
                                            {new Date(act.submitted_at).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                            {' · '}
                                            {new Date(act.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>

                                    {act.comment && (
                                        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium leading-relaxed line-clamp-2">{act.comment}</p>
                                    )}

                                    {(act.latitude || act.location_name) && (
                                        <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400 font-medium">
                                            <IconMapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                                            <span className="truncate">{act.location_name ?? `${parseFloat(act.latitude).toFixed(5)}, ${parseFloat(act.longitude).toFixed(5)}`}</span>
                                        </div>
                                    )}

                                    {act.admin_note && (
                                        <div className="mt-3 px-3 py-2 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Admin Note</p>
                                            <p className="text-xs font-medium text-gray-600 dark:text-gray-300">{act.admin_note}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
