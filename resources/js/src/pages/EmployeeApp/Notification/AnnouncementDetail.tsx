import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IconCalendar, IconTag, IconUsers, IconBell, IconPaperclip, IconDownload, IconFile } from '@tabler/icons-react';
import PageHeader from '../../../components/ui/PageHeader';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import { IconInfoCircle, IconCircleCheck, IconAlertTriangle, IconAlertOctagon } from '@tabler/icons-react';
export default function AnnouncementDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [announcement, setAnnouncement] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem('employee_auth_token');

    useEffect(() => {
        const fetch_ = async () => {
            try {
                const res = await fetch(`/api/employee-app/announcements/${id}`, {
                    headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
                });
                if (res.ok) {
                    setAnnouncement(await res.json());
                } else {
                    toast.error('Announcement not found');
                    navigate(-1);
                }
            } catch {
                toast.error('Failed to load announcement');
                navigate(-1);
            } finally {
                setLoading(false);
            }
        };
        fetch_();
    }, [id]);

    const typeStyles: Record<string, { border: string; bg: string; text: string; badge: string }> = {
        info:    { border: 'border-blue-100 dark:border-blue-900/40', bg: 'bg-blue-50 dark:bg-blue-900/10', text: 'text-blue-700 dark:text-blue-300', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
        success: { border: 'border-green-100 dark:border-green-900/40', bg: 'bg-green-50 dark:bg-green-900/10', text: 'text-green-700 dark:text-green-300', badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
        warning: { border: 'border-yellow-100 dark:border-yellow-900/40', bg: 'bg-yellow-50 dark:bg-yellow-900/10', text: 'text-yellow-700 dark:text-yellow-300', badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500' },
        danger:  { border: 'border-red-100 dark:border-red-900/40', bg: 'bg-red-50 dark:bg-red-900/10', text: 'text-red-700 dark:text-red-300', badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    };

const typeIcons: Record<string, React.ReactNode> = {
  info: <IconInfoCircle size={12} />,
  success: <IconCircleCheck size={12} />,
  warning: <IconAlertTriangle size={12} />,
  danger: <IconAlertOctagon size={12} />,
};

    const style = typeStyles[announcement?.type ?? 'info'] ?? typeStyles.info;

    const formatSize = (bytes: number) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    if (loading) {
        return (
            <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 animate-pulse">
                <div className="h-16 bg-white dark:bg-gray-800" />
                <div className="p-5 space-y-4">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
                    <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-3xl" />
                </div>
            </div>
        );
    }

    if (!announcement) return null;

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 overflow-y-auto pb-28">
            <PageHeader title="Announcement"/>

            {/* Featured Image Banner */}
            {announcement.featured_image && (
                <div className="w-full aspect-[16/9] overflow-hidden">
                    <img 
                        src={`/storage/${announcement.featured_image}`} 
                        className="w-full h-full object-cover" 
                        alt={announcement.title}
                    />
                </div>
            )}

            {/* Banner pill */}
            <div className={`px-5 ${announcement.featured_image ? 'pt-4' : 'pt-5'} pb-2`}>
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${style.badge}`}>
                    {typeIcons[announcement.type]} {announcement.type.toUpperCase()}
                </span>
            </div>

            {/* Content card */}
            <div className="px-5 space-y-4">
                {/* Title */}
                <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">{announcement.title}</h1>

                {/* Meta */}
                <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                    {announcement.published_at && (
                        <span className="flex items-center gap-1">
                            <IconCalendar className="w-3.5 h-3.5" />
                            {dayjs(announcement.published_at).format('MMM D, YYYY')}
                        </span>
                    )}
                    <span className="flex items-center gap-1 capitalize">
                        <IconUsers className="w-3.5 h-3.5" />
                        {announcement.targeting_type === 'all' ? 'All Employees' : announcement.targeting_type}
                    </span>
                </div>

                {/* Short description */}
                {announcement.short_description && (
                    <div className={`p-4 rounded-2xl border ${style.border} ${style.bg}`}>
                        <p className={`text-sm font-semibold leading-relaxed ${style.text}`}>{announcement.short_description}</p>
                    </div>
                )}

                {/* Rich Content */}
                {announcement.content && (
                    <div
                        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
                        dangerouslySetInnerHTML={{ __html: announcement.content }}
                    />
                )}

                {/* Attachments Section */}
                {Array.isArray(announcement.attachments) && announcement.attachments.length > 0 && (
                    <div className="mt-6">
                        <div className="flex items-center gap-2 mb-3">
                            <IconPaperclip className="w-4 h-4 text-gray-400" />
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Attachments</h3>
                        </div>
                        <div className="space-y-2">
                            {announcement.attachments.map((file: any, i: number) => (
                                <a
                                    key={i}
                                    href={`/storage/${file.path}`}
                                    download={file.name}
                                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl active:scale-[0.98] transition-transform"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center shrink-0">
                                            <IconFile className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-gray-700 dark:text-gray-200 truncate">{file.name}</p>
                                            <p className="text-[10px] text-gray-400">{formatSize(file.size)} • {file.type.split('/')[1]?.toUpperCase() || 'FILE'}</p>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        <IconDownload className="w-4 h-4" />
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
