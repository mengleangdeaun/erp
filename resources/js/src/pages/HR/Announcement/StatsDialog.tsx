import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { IconUsers, IconEye, IconChartBar, IconSearch, IconX, IconChartPie } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import { useFormatDate } from '@/hooks/useFormatDate';
import Pagination from '@/components/ui/Pagination';

interface StatsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    announcementId: number | null;
    announcementTitle?: string;
}

const StatsDialog: React.FC<StatsDialogProps> = ({ open, onOpenChange, announcementId, announcementTitle }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const { formatDate, formatTime } = useFormatDate();

    const fetchData = async () => {
        if (!announcementId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/hr/announcements/${announcementId}/statistics`, {
                headers: { 'Accept': 'application/json' },
            });
            const data = await res.json();
            setStats(data);
        } catch (error) {
            toast.error(t('failed_load_statistics_msg'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open && announcementId) {
            fetchData();
        } else {
            setStats(null);
            setSearch('');
            setCurrentPage(1);
        }
    }, [open, announcementId]);

    // Reset page if search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const viewers = stats?.viewers || [];
    const filteredViewers = viewers.filter((v: any) =>
        (v.employee?.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (v.employee?.employee_id || '').toLowerCase().includes(search.toLowerCase()) ||
        (v.employee?.department?.name || '').toLowerCase().includes(search.toLowerCase())
    );

    const totalViewed = Number(stats?.total_viewed || 0);
    const engagementRate = stats?.engagement_rate ?? 0;

    // Pagination
    const totalPages = Math.ceil(filteredViewers.length / itemsPerPage);
    const paginatedViewers = filteredViewers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] w-[95vw] max-h-[90vh] flex flex-col p-0 border-0 shadow-2xl rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="shrink-0 bg-gradient-to-r from-primary/10 to-transparent px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
                    <div className="bg-primary/20 p-3 rounded-2xl shadow-sm">
                        <IconChartPie className="text-primary w-7 h-7" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                            {t('announcement_statistics_title')}
                        </DialogTitle>
                        <p className="text-sm text-gray-500 mt-1">
                            {t('tracking_engagement_for_label')}: <span className="font-semibold text-gray-700 dark:text-gray-300">{announcementTitle}</span>
                        </p>
                    </div>
                </div>

                <ScrollArea className="flex-1 min-h-0">
                    {loading ? (
                        <div className="space-y-8 p-6">
                            {/* Summary Cards Skeletons */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                                        <div className="flex items-center justify-between mb-2">
                                            <Skeleton className="h-4 w-16" />
                                            <Skeleton className="h-4 w-4 rounded-full" />
                                        </div>
                                        <Skeleton className="h-8 w-12 mb-1" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                ))}
                            </div>

                            {/* Viewer List Skeleton */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-8 w-[240px] rounded-lg" />
                                </div>

                                <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800">
                                                <tr>
                                                    {[1, 2, 3].map((i) => (
                                                        <th key={i} className="px-4 py-3">
                                                            <Skeleton className="h-3 w-16" />
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                                {[1, 2, 3, 4, 5].map((row) => (
                                                    <tr key={row}>
                                                        <td className="px-4 py-3">
                                                            <div className="flex flex-col gap-1">
                                                                <Skeleton className="h-4 w-32" />
                                                                <Skeleton className="h-3 w-20" />
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <Skeleton className="h-5 w-16 rounded-md" />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex flex-col items-end gap-1">
                                                                <Skeleton className="h-4 w-24" />
                                                                <Skeleton className="h-3 w-16" />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8 p-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('targeted_label')}</span>
                                        <IconUsers className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {stats?.total_targeted || 0}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{t('potential_viewers_desc')}</p>
                                </div>

                                <div className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('unique_views_label')}</span>
                                        <IconEye className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {totalViewed}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{t('acknowledged_label')}</p>
                                </div>

                                <div className="p-5 rounded-xl border border-primary/20 bg-primary/5 dark:bg-primary/10 shadow-sm transition-all hover:shadow-md">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-primary uppercase tracking-wider">{t('engagement_label')}</span>
                                        <IconChartBar className="w-4 h-4 text-primary" />
                                    </div>
                                    <div className="text-2xl font-bold text-primary">
                                        {engagementRate}%
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mt-2 overflow-hidden">
                                        <div
                                            className="bg-primary h-full transition-all duration-1000 ease-out"
                                            style={{ width: `${engagementRate}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Viewer List Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                        {t('acknowledged_by_title')}
                                    </h3>
                                    <div className="relative w-full max-w-[240px]">
                                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                        <Input
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder={t('search_viewer_placeholder')}
                                            className="pl-9 h-8 text-xs bg-gray-50 dark:bg-gray-800/50"
                                        />
                                        {search && (
                                            <button
                                                onClick={() => setSearch('')}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                            >
                                                <IconX size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800">
                                                <tr>
                                                    <th className="px-4 py-3 text-gray-500 font-bold uppercase tracking-wider">{t('employee_label')}</th>
                                                    <th className="px-4 py-3 text-gray-500 font-bold uppercase tracking-wider">{t('department_label')}</th>
                                                    <th className="px-4 py-3 text-gray-500 font-bold uppercase tracking-wider text-right">{t('viewed_at_label')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                                                {paginatedViewers.length > 0 ? (
                                                    paginatedViewers.map((v: any, idx: number) => (
                                                        <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                                            <td className="px-4 py-3">
                                                                <div className="flex flex-col">
                                                                    <span className="font-semibold text-gray-900 dark:text-white">
                                                                        {v.employee?.full_name}
                                                                    </span>
                                                                    <span className="text-[10px] text-gray-400">#{v.employee?.employee_id}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-md font-medium uppercase text-[9px]">
                                                                    {v.employee?.department?.name || '—'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-right">
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                                                        {formatDate(v.viewed_at)}
                                                                    </span>
                                                                    <span className="text-[10px] text-gray-400">
                                                                        {formatTime(v.viewed_at)}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={3} className="px-4 py-12 text-center text-gray-400 italic font-medium">
                                                            {search ? t('no_matching_viewers_found_msg') : t('no_one_viewed_announcement_msg')}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                {filteredViewers.length > 0 && (
                                    <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-4">
                                        <Pagination
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                            totalItems={filteredViewers.length}
                                            itemsPerPage={itemsPerPage}
                                            onPageChange={setCurrentPage}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </ScrollArea>

                {/* Sticky Footer */}
                <div className="shrink-0 flex justify-end px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-background">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        {t('close_btn_label')}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default StatsDialog;