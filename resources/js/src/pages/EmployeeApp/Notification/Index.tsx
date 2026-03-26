import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconBell, IconBellOff, IconChevronRight, IconCalendarPlus, IconCircleCheck, IconCircleX, IconCheck, IconPaperclip } from '@tabler/icons-react';
import PageHeader from '../../../components/ui/PageHeader';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    data: any;
    read_at: string | null;
    created_at: string;
}

const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
    announcement: { icon: IconBell, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    leave_request: { icon: IconCalendarPlus, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    leave_approved: { icon: IconCircleCheck, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
    leave_rejected: { icon: IconCircleX, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
};

export default function NotificationIndex() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem('employee_auth_token');

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/employee-app/notifications', {
                headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                setNotifications(await res.json());
            }
        } catch {
            toast.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        dispatch(setPageTitle(t('notifications', 'Notifications')));
    }, [dispatch, t]);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAllRead = async () => {
        await fetch('/api/employee-app/notifications/mark-all-read', {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
        });
        setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
        toast.success('All marked as read');
    };

    const handleNotificationClick = async (notif: Notification) => {
        // Mark as read
        if (!notif.read_at) {
            await fetch(`/api/employee-app/notifications/${notif.id}/read`, {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
            });
            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read_at: new Date().toISOString() } : n));
        }

        // Navigate to relevant page
        if (notif.type === 'announcement' && notif.data?.announcement_id) {
            navigate(`/employee/announcements/${notif.data.announcement_id}`);
        } else if (notif.type === 'leave_request' || notif.type === 'leave_approved' || notif.type === 'leave_rejected') {
            navigate('/employee/leave');
        }
    };

    const unreadCount = notifications.filter(n => !n.read_at).length;

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            <PageHeader 
                title="Notifications"
                rightAction={unreadCount > 0 ? (
                    <button
                        onClick={markAllRead}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-primary/10 text-primary active:scale-90 transition-all"
                        title="Mark all read"
                    >
                        <IconCheck className="w-5 h-5" />
                    </button>
                ) : null}
            />
            {unreadCount > 0 && (
                <div className="px-5 py-2 bg-primary/5 border-b border-primary/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">{unreadCount} unread notifications</p>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="p-4 space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-4 animate-pulse">
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center px-8">
                        <div className="w-16 h-16 rounded-3xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                            <IconBellOff className="w-7 h-7 text-gray-400" />
                        </div>
                        <p className="text-base font-black text-gray-700 dark:text-gray-300">All caught up!</p>
                        <p className="text-sm text-gray-400 mt-1">You have no notifications yet.</p>
                    </div>
                ) : (
                    <div className="p-4 space-y-2.5">
                        {notifications.map(notif => {
                            const config = typeConfig[notif.type] || typeConfig.announcement;
                            const Icon = config.icon;
                            const isUnread = !notif.read_at;

                            return (
                                <button
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif)}
                                    className={`w-full text-left bg-white dark:bg-gray-800 rounded-2xl p-4 border transition-all active:scale-[0.98] ${isUnread ? 'border-primary/20 shadow-sm' : 'border-gray-100 dark:border-gray-700'}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden ${config.bg}`}>
                                            {(notif.type === 'announcement' && notif.data?.featured_image) ? (
                                                <img 
                                                    src={`/storage/${notif.data.featured_image}`} 
                                                    className="w-full h-full object-cover" 
                                                    alt=""
                                                />
                                            ) : (notif.type === 'announcement' && notif.data?.has_attachments) ? (
                                                <IconPaperclip className={`w-5 h-5 ${config.color}`} />
                                            ) : (
                                                <Icon className={`w-5 h-5 ${config.color}`} />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={`text-sm font-bold ${isUnread ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                                                    {notif.title}
                                                    {isUnread && <span className="inline-block w-2 h-2 bg-primary rounded-full ml-2 mb-0.5" />}
                                                </p>
                                                <span className="text-[10px] text-gray-400 shrink-0">{dayjs(notif.created_at).fromNow()}</span>
                                            </div>
                                            {notif.message && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                                            )}
                                        </div>
                                        {(notif.type === 'announcement' || notif.type === 'leave_request') && (
                                            <IconChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
