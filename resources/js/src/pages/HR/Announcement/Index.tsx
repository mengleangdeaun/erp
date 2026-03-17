import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { IconBell, IconStar, IconSpeakerphone } from '@tabler/icons-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';

const AnnouncementIndex = () => {
    const navigate = useNavigate();

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
                {/* Status Filter */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 font-medium whitespace-nowrap">Status:</span>
                    <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val === 'ALL' ? '' : val); setCurrentPage(1); }}>
                        <SelectTrigger className="h-10 w-[140px] shadow-sm">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Statuses</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Type Filter */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 font-medium whitespace-nowrap">Type:</span>
                    <Select value={typeFilter} onValueChange={(val) => { setTypeFilter(val === 'ALL' ? '' : val); setCurrentPage(1); }}>
                        <SelectTrigger className="h-10 w-[130px] shadow-sm">
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Types</SelectItem>
                            <SelectItem value="info">Info</SelectItem>
                            <SelectItem value="success">Success</SelectItem>
                            <SelectItem value="warning">Warning</SelectItem>
                            <SelectItem value="danger">Danger</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Date Range */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 font-medium whitespace-nowrap">Date:</span>
                    <DateRangePicker
                        value={dateRange}
                        onChange={(range) => { setDateRange(range); setCurrentPage(1); }}
                        placeholder="Published date..."
                        className="w-[220px]"
                    />
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
                                    <SortableHeader label="Type"         value="type"         currentSortBy={sortBy} currentDirection={sortDir} onSort={handleSort} className="px-6 py-4" />
                                    <SortableHeader label="Targeting"    value="targeting_type" currentSortBy={sortBy} currentDirection={sortDir} onSort={handleSort} className="px-6 py-4" />
                                    <SortableHeader label="Status"       value="status"       currentSortBy={sortBy} currentDirection={sortDir} onSort={handleSort} className="px-6 py-4" />
                                    <th className="px-6 py-4">Views</th>
                                    <SortableHeader label="Published At" value="published_at" currentSortBy={sortBy} currentDirection={sortDir} onSort={handleSort} className="px-6 py-4" />
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {paginated.map(a => (
                                    <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {a.is_featured && (
                                                    <IconStar className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                                                )}
                                                <span className="font-semibold text-gray-900 dark:text-white">{a.title}</span>
                                            </div>
                                            {a.short_description && (
                                                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[260px]">{a.short_description}</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase border ${typeColors[a.type] || ''}`}>
                                                {a.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 capitalize text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                            {a.targeting_type === 'all' ? 'All Employees' : a.targeting_type}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase border ${statusColors[a.status] || ''}`}>
                                                {a.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                            {a.views_count ?? 0}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                            {a.published_at ? dayjs(a.published_at).format('MMM D, YYYY') : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <ActionButtons
                                                skipDeleteConfirm
                                                onEdit={() => navigate(`/hr/announcements/${a.id}/edit`)}
                                                onDelete={() => confirmDelete(a.id)}
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
