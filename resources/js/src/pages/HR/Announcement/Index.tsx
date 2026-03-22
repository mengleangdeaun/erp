import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { IconBell, IconStar, IconSpeakerphone, IconDotsVertical, IconEye, IconEyeOff, IconLoader2 } from '@tabler/icons-react';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { DateRange } from 'react-day-picker';
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import DeleteModal from '../../../components/DeleteModal';
import ActionButtons from '../../../components/ui/ActionButtons';
import SortableHeader from '../../../components/ui/SortableHeader';
import { DateRangePicker } from '../../../components/ui/date-range-picker';
import { Badge } from '../../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import StatsDialog from './StatsDialog';
import { useFormatDate } from '@/hooks/useFormatDate';

const AnnouncementIndex = () => {
    const navigate = useNavigate();
    const { formatDate, formatTime } = useFormatDate();

    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [sortBy, setSortBy] = useState('created_at');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState<number | null>(null);
    const [statsModalOpen, setStatsModalOpen] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);

    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const fetchData = () => {
        setLoading(true);
        fetch('/api/hr/announcements', {
            headers: { 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' },
            credentials: 'include',
        })
            .then(res => res.json())
            .then(data => {
                setAnnouncements(Array.isArray(data) ? data : []);
            })
            .catch(() => toast.error('Failed to load announcements'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchData(); }, []);

    const handleSort = (col: string) => {
        setSortBy(prev => {
            if (prev === col) {
                setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                return prev;
            }
            setSortDir('asc');
            return col;
        });
        setCurrentPage(1);
    };

    const filteredItems = useMemo(() => {
        let items = [...announcements];

        if (search) {
            const q = search.toLowerCase();
            items = items.filter(a =>
                a.title?.toLowerCase().includes(q) ||
                a.short_description?.toLowerCase().includes(q)
            );
        }
        if (statusFilter) items = items.filter(a => a.status === statusFilter);
        if (typeFilter) items = items.filter(a => a.type === typeFilter);
        if (dateRange?.from) {
            const from = dayjs(dateRange.from).startOf('day');
            const to = dateRange.to ? dayjs(dateRange.to).endOf('day') : from.endOf('day');
            items = items.filter(a => {
                const d = dayjs(a.published_at || a.created_at);
                return d.isSameOrAfter(from) && d.isSameOrBefore(to);
            });
        }

        items.sort((a, b) => {
            let av = a[sortBy] ?? '';
            let bv = b[sortBy] ?? '';
            if (typeof av === 'string') av = av.toLowerCase();
            if (typeof bv === 'string') bv = bv.toLowerCase();
            if (av < bv) return sortDir === 'asc' ? -1 : 1;
            if (av > bv) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

        return items;
    }, [announcements, search, statusFilter, typeFilter, dateRange, sortBy, sortDir]);

    const paginated = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

    const confirmDelete = (id: number) => { setItemToDelete(id); setDeleteModalOpen(true); };

    const executeDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        try {
            await fetch('/sanctum/csrf-cookie');
            const res = await fetch(`/api/hr/announcements/${itemToDelete}`, {
                method: 'DELETE',
                headers: { 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' },
                credentials: 'include',
            });
            if (res.ok || res.status === 204) {
                toast.success('Announcement deleted');
                fetchData();
            } else {
                toast.error('Failed to delete');
            }
        } catch {
            toast.error('An error occurred');
        } finally {
            setIsDeleting(false);
            setDeleteModalOpen(false);
            setItemToDelete(null);
        }
    };

    const handleToggleStatus = async (id: number, currentStatus: boolean) => {
        setIsUpdatingStatus(id);
        try {
            await fetch('/sanctum/csrf-cookie');
            const res = await fetch(`/api/hr/announcements/${id}`, {
                method: 'PUT',
                headers: { 
                    'Accept': 'application/json', 
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' 
                },
                body: JSON.stringify({ is_published: !currentStatus }),
                credentials: 'include',
            });
            if (res.ok) {
                toast.success(`Announcement ${!currentStatus ? 'published' : 'hidden'}`);
                fetchData();
            } else {
                toast.error('Failed to update status');
            }
        } catch {
            toast.error('An error occurred');
        } finally {
            setIsUpdatingStatus(null);
        }
    };

    const hasActiveFilters = !!(statusFilter || typeFilter || dateRange?.from);

    const typeColors: Record<string, string> = {
        info:    'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
        success: 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
        warning: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
        danger:  'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
    };

    const statusColors: Record<string, string> = {
        draft:     'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
        published: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
        expired:   'bg-red-100 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
        scheduled: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
        off:       'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700',
    };

    const getStatusInfo = (a: any) => {
        if (a.status === 'draft') return { label: 'Draft', color: statusColors.draft };
        if (!a.is_published) return { label: 'Off', color: statusColors.off };

        const now = dayjs();
        const start = a.start_date ? dayjs(a.start_date) : null;
        const end = a.end_date ? dayjs(a.end_date) : null;
        const pub = a.published_at ? dayjs(a.published_at) : null;

        if (end && now.isAfter(end)) return { label: 'Expired', color: statusColors.expired };
        if (pub && pub.isAfter(now)) return { label: 'Scheduled', color: statusColors.scheduled };
        if (start && start.isAfter(now)) return { label: 'Scheduled', color: statusColors.scheduled };
        
        return { label: 'Live', color: statusColors.published };
    };

    return (
        <div>
            <FilterBar
                icon={<IconSpeakerphone className="w-6 h-6 text-primary" />}
                title="Announcements"
                description="Manage and broadcast company announcements"
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
                onRefresh={fetchData}
                onAdd={() => navigate('/hr/announcements/create')}
                addLabel="New Announcement"
                hasActiveFilters={hasActiveFilters}
                onClearFilters={() => { setStatusFilter(''); setTypeFilter(''); setDateRange(undefined); }}
            >
                {/* Date Range */}
                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Date Range</span>
                    <DateRangePicker
                        value={dateRange}
                        onChange={(range) => { setDateRange(range); setCurrentPage(1); }}
                        placeholder="Published date..."
                    />
                </div>

                {/* Status Filter */}
                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Status</span>
                    <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val === 'ALL' ? '' : val); setCurrentPage(1); }}>
                        <SelectTrigger className="h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm transition-all focus:ring-primary">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL" className="font-medium">All Statuses</SelectItem>
                            <SelectItem value="draft" className="font-medium">Draft</SelectItem>
                            <SelectItem value="published" className="font-medium">Published</SelectItem>
                            <SelectItem value="expired" className="font-medium">Expired</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Type Filter */}
                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Type</span>
                    <Select value={typeFilter} onValueChange={(val) => { setTypeFilter(val === 'ALL' ? '' : val); setCurrentPage(1); }}>
                        <SelectTrigger className="h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm transition-all focus:ring-primary">
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL" className="font-medium">All Types</SelectItem>
                            <SelectItem value="info" className="font-medium">Info</SelectItem>
                            <SelectItem value="success" className="font-medium">Success</SelectItem>
                            <SelectItem value="warning" className="font-medium">Warning</SelectItem>
                            <SelectItem value="danger" className="font-medium">Danger</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </FilterBar>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <TableSkeleton columns={7} rows={5} />
                    ) : paginated.length === 0 ? (
                        <EmptyState
                            isSearch={!!search || hasActiveFilters}
                            searchTerm={search}
                            onClearFilter={() => { setSearch(''); setStatusFilter(''); setTypeFilter(''); setDateRange(undefined); }}
                            title="No Announcements Found"
                            description="Create your first company announcement to get started."
                        />
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 dark:bg-gray-800 border-y border-gray-100 dark:border-gray-700">
                                <tr>
                                    <SortableHeader label="Title"        value="title"        currentSortBy={sortBy} currentDirection={sortDir} onSort={handleSort} className="px-6 py-4" />
                                    <SortableHeader label="Status"       value="status"       currentSortBy={sortBy} currentDirection={sortDir} onSort={handleSort} className="px-6 py-4" />
                                    <SortableHeader label="Targeting"    value="targeting_type" currentSortBy={sortBy} currentDirection={sortDir} onSort={handleSort} className="px-6 py-4" />
                                    <th className="px-6 py-4">Engagement</th>
                                    <SortableHeader label="Published At" value="published_at" currentSortBy={sortBy} currentDirection={sortDir} onSort={handleSort} className="px-6 py-4" />
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {paginated.map(a => (
                                    <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    {a.is_featured && (
                                                        <IconStar className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                                                    )}
                                                    <span className="font-bold text-gray-900 dark:text-white leading-tight">{a.title}</span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase border ${typeColors[a.type] || ''}`}>
                                                        {a.type}
                                                    </span>
                                                    {a.short_description && (
                                                        <span className="text-[11px] text-gray-400 truncate max-w-[200px]">{a.short_description}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 group/status">
                                                {(() => {
                                                    const info = getStatusInfo(a);
                                                    return (
                                                        <div className="flex flex-col gap-1">
                                                            <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase border leading-none ${info.color}`}>
                                                                {info.label}
                                                            </span>
                                                            {info.label === 'Scheduled' && a.published_at && (
                                                                <span className="text-[10px] text-gray-400 font-medium">
                                                                    {formatDate(a.published_at)} {formatTime(a.published_at)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                                
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <button 
                                                            className={`p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-all opacity-0 group-hover/status:opacity-100 ${isUpdatingStatus === a.id ? 'opacity-100' : ''}`}
                                                            disabled={isUpdatingStatus !== null}
                                                        >
                                                            {isUpdatingStatus === a.id ? (
                                                                <IconLoader2 size={14} className="animate-spin text-primary" />
                                                            ) : (
                                                                <IconDotsVertical size={14} />
                                                            )}
                                                        </button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="p-1 bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden">
                                                        <div className="flex flex-col">
                                                            <div className="px-2 py-1.5 border-b border-gray-50 dark:border-gray-800 mb-1">
                                                                <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Visibility</span>
                                                            </div>
                                                            <button 
                                                                onClick={() => handleToggleStatus(a.id, !!a.is_published)}
                                                                className={`flex items-center gap-2 px-2 py-2 rounded-md transition-colors text-sm font-medium ${a.is_published ? 'text-gray-600 hover:bg-rose-50 hover:text-rose-600' : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-600'}`}
                                                            >
                                                                {a.is_published ? (
                                                                    <>
                                                                        <IconEyeOff size={16} />
                                                                        <span>Hide Announcement</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <IconEye size={16} />
                                                                        <span>Live Now</span>
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 capitalize">{a.targeting_type === 'all' ? 'All Employees' : a.targeting_type}</span>
                                                {a.target_ids && a.target_ids.length > 0 && (
                                                    <span className="text-[10px] text-gray-400">{a.target_ids.length} selected</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-900 dark:text-white">{a.views_count ?? 0}</span>
                                                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">Unique Views</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap font-medium">
                                            {a.published_at ? (
                                                <div className="flex flex-col">
                                                    <span>{formatDate(a.published_at)}</span>
                                                    <span className="text-[10px] text-gray-400">{formatTime(a.published_at)}</span>
                                                </div>
                                            ) : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <ActionButtons
                                                skipDeleteConfirm
                                                onEdit={() => navigate(`/hr/announcements/${a.id}/edit`)}
                                                onDelete={() => confirmDelete(a.id)}
                                                onStats={() => { setSelectedAnnouncement(a); setStatsModalOpen(true); }}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {!loading && filteredItems.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredItems.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                )}
            </div>

            <StatsDialog
                open={statsModalOpen}
                onOpenChange={setStatsModalOpen}
                announcementId={selectedAnnouncement?.id}
                announcementTitle={selectedAnnouncement?.title}
            />

            <DeleteModal
                isOpen={deleteModalOpen}
                setIsOpen={setDeleteModalOpen}
                onConfirm={executeDelete}
                isLoading={isDeleting}
                title="Delete Announcement"
                message="Are you sure you want to delete this announcement? This action cannot be undone."
            />
        </div>
    );
};

export default AnnouncementIndex;
