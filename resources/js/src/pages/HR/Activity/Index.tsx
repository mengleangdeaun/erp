import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { IconActivity, IconCamera, IconMapPin, IconUser, IconCalendarEvent, IconCheck, IconAlertTriangle, IconClock, IconEye, IconExternalLink, IconFilter } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Textarea } from '@/components/ui/textarea';

// Standard Components
import FilterBar from '@/components/ui/FilterBar';
import TableSkeleton from '@/components/ui/TableSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import SortableHeader from '@/components/ui/SortableHeader';
import DeleteModal from '@/components/DeleteModal';
import ActionButtons from '@/components/ui/ActionButtons';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useHRActivities, useHRFilterEmployees, useHRUpdateActivityStatus, useHRDeleteActivity } from '@/hooks/useHRData';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useQueryClient } from '@tanstack/react-query';

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    submitted: { label: 'Submitted', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: <IconClock size={12} /> },
    reviewed: { label: 'Reviewed', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: <IconCheck size={12} /> },
    flagged: { label: 'Flagged', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: <IconAlertTriangle size={12} /> },
};

export default function HrActivityIndex() {
    const queryClient = useQueryClient();

    // UI State
    const [selected, setSelected] = useState<any | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [adminNote, setAdminNote] = useState('');
    const [newStatus, setNewStatus] = useState('');

    // Deletion
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    // Filters & Sorting
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [employeeFilter, setEmployeeFilter] = useState('all');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [sortBy, setSortBy] = useState('submitted_at');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // TanStack Query
    const queryParams = useMemo(() => {
        const params: any = {
            page: currentPage,
            per_page: itemsPerPage,
            sort_by: sortBy,
            sort_dir: sortDirection
        };
        if (search) params.search = search;
        if (statusFilter !== 'all') params.status = statusFilter;
        if (employeeFilter !== 'all') params.employee_id = employeeFilter;
        if (dateRange?.from) params.date_from = format(dateRange.from, 'yyyy-MM-dd');
        if (dateRange?.to) params.date_to = format(dateRange.to, 'yyyy-MM-dd');
        return params;
    }, [currentPage, itemsPerPage, sortBy, sortDirection, search, statusFilter, employeeFilter, dateRange]);

    const { data: pagination, isLoading: rawLoading } = useHRActivities(queryParams);
    const loading = useDelayedLoading(rawLoading, 500);
    const activities = pagination?.data ?? [];

    const { data: employees = [] } = useHRFilterEmployees(true);
    
    const updateStatusMutation = useHRUpdateActivityStatus();
    const deleteMutation = useHRDeleteActivity();

    const handleSort = (column: string) => {
        if (sortBy === column) setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        else { setSortBy(column); setSortDirection('desc'); }
        setCurrentPage(1);
    };

    const openDetail = (act: any) => {
        setSelected(act);
        setNewStatus(act.status);
        setAdminNote(act.admin_note ?? '');
        setDetailOpen(true);
    };

    const saveStatus = async () => {
        if (!selected) return;
        updateStatusMutation.mutate({ id: selected.id, status: newStatus, admin_note: adminNote }, {
            onSuccess: () => {
                toast.success('Activity updated');
                setDetailOpen(false);
            },
            onError: (err: any) => {
                toast.error(err.response?.data?.message || 'Failed to update');
            }
        });
    };

    const confirmDelete = (id: number) => {
        setItemToDelete(id);
        setDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!itemToDelete) return;
        deleteMutation.mutate(itemToDelete, {
            onSuccess: () => {
                toast.success('Activity deleted');
                setDeleteModalOpen(false);
                setItemToDelete(null);
            },
            onError: () => {
                toast.error('Failed to delete');
            }
        });
    };

    const employeeOptions = useMemo(() => [
        { value: 'all', label: 'All Employees' },
        ...employees.map((e: any) => ({ value: String(e.id), label: `${e.full_name} (${e.employee_id})` }))
    ], [employees]);

    const hasActiveFilters = search !== '' || statusFilter !== 'all' || employeeFilter !== 'all' || dateRange !== undefined;

    return (
        <div>
            <FilterBar
                icon={<IconCamera className="w-6 h-6 text-primary" />}
                title="Activity Log"
                description="Monitor field activities submitted by outdoor sales staff"
                search={searchInput}
                setSearch={setSearchInput}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
                onRefresh={() => queryClient.invalidateQueries({ queryKey: ['hr-activities'] })}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={() => {
                    setSearchInput('');
                    setSearch('');
                    setStatusFilter('all');
                    setEmployeeFilter('all');
                    setDateRange(undefined);
                    setCurrentPage(1);
                }}
            >
                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Date Range</span>
                    <DateRangePicker
                        value={dateRange}
                        onChange={(range) => { setDateRange(range); setCurrentPage(1); }}
                        placeholder="All Dates"
                    />
                </div>

                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Status</span>
                    <Select
                        value={statusFilter}
                        onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
                    >
                        <SelectTrigger className="h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="font-medium">All Statuses</SelectItem>
                            <SelectItem value="submitted" className="font-medium">Submitted</SelectItem>
                            <SelectItem value="reviewed" className="font-medium">Reviewed</SelectItem>
                            <SelectItem value="flagged" className="font-medium">Flagged</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Employee</span>
                    <SearchableSelect
                        options={employeeOptions}
                        value={employeeFilter}
                        onChange={(val) => { setEmployeeFilter(String(val)); setCurrentPage(1); }}
                        placeholder="All Employees"
                    />
                </div>
            </FilterBar>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <TableSkeleton columns={6} rows={itemsPerPage} />
                    ) : activities.length === 0 ? (
                        <EmptyState
                            isSearch={hasActiveFilters}
                            searchTerm={search}
                            onClearFilter={() => {
                                setSearch(''); setStatusFilter('all'); setEmployeeFilter('all');
                                setDateRange(undefined); setCurrentPage(1);
                            }}
                            title="No activities found"
                            description="Records will appear here once employees submit their field activities via the PWA."
                        />
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 dark:bg-gray-800 border-y border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4 w-20">Photo</th>
                                    <SortableHeader label="Employee" value="employee.full_name" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <SortableHeader label="Submitted" value="submitted_at" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <th className="px-6 py-4">Location</th>
                                    <SortableHeader label="Status" value="status" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 font-medium">
                                {activities.map((act: any) => {
                                    const status = STATUS_CONFIG[act.status] ?? STATUS_CONFIG.submitted;
                                    return (
                                        <tr key={act.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            {/* Photo Thumbnail */}
                                            <td className="px-6 py-3">
                                                <div
                                                    className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 cursor-pointer hover:scale-110 transition-transform"
                                                    onClick={() => openDetail(act)}
                                                >
                                                    <img src={act.photo_url} alt="" className="w-full h-full object-cover" />
                                                </div>
                                            </td>

                                            {/* Employee */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div>
                                                        <div className="text-gray-900 dark:text-white font-bold">{act.employee?.full_name}</div>
                                                        <div className="text-xs text-gray-400 font-medium">{act.employee?.employee_id}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Date */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-gray-700 dark:text-gray-300">
                                                    {new Date(act.submitted_at).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </div>
                                                <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-0.5">
                                                    {new Date(act.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>

                                            {/* Location */}
                                            <td className="px-6 py-4">
                                                {act.latitude ? (
                                                    <a
                                                        href={`https://www.google.com/maps?q=${act.latitude},${act.longitude}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="group inline-flex items-center gap-1.5 text-primary hover:text-primary-dark transition-colors"
                                                    >
                                                        <IconMapPin size={14} className="shrink-0 group-hover:animate-bounce" />
                                                        <span className="truncate max-w-[150px] font-bold">
                                                            {act.location_name ?? 'View Map'}
                                                        </span>
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-300 font-normal italic">No GPS</span>
                                                )}
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-4">
                                                <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border', status.className)}>
                                                    {status.icon} {status.label}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 text-right">
                                                <ActionButtons
                                                    skipDeleteConfirm={true}
                                                    onDelete={() => confirmDelete(act.id)}
                                                    onView={() => openDetail(act)}
                                                    viewLabel="Review Activity"
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
                {pagination && pagination.total > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={pagination.last_page}
                        totalItems={pagination.total}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                )}
            </div>

            {/* Review Detail Panel - Shadcn Dialog Version */}
            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="sm:max-w-xl w-[95vw] h-[90vh] flex flex-col p-0 border-0 shadow-2xl rounded-2xl overflow-hidden">
                    {/* Header - Gradient with Icon */}
                    <div className="shrink-0 bg-gradient-to-r from-primary/10 to-transparent px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
                        <div className="bg-primary/20 p-3 rounded-2xl shadow-sm">
                            <IconActivity className="text-primary w-7 h-7" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                                Activity Review
                            </DialogTitle>
                            <p className="text-sm text-gray-500 mt-1">
                                Review details and update status for {selected?.employee?.full_name || 'activity'}.
                            </p>
                        </div>
                    </div>

                    {/* Scrollable Content Area */}
                    <ScrollArea className="flex-1 min-h-0">
                        <div className="p-6 space-y-6">
                            
                            {/* Photo Display - Enhanced */}
                            <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-xl overflow-hidden shadow-lg group">
                            <img
                                src={selected?.photo_url}
                                alt="Activity"
                                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                            />
                            
                            {/* Gradient overlay for better button visibility */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            
                            {/* Action button */}
                            <a
                                href={selected?.photo_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute top-3 right-3 p-2.5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-gray-800 dark:text-gray-200 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-900 hover:scale-110 transition-all duration-200"
                                title="Open full image in new tab"
                            >
                                <IconExternalLink size={18} />
                            </a>

                            {/* Optional caption (could show file name or dimensions) */}
                            {selected?.photo_url && (
                                <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full text-xs font-medium text-white truncate max-w-[70%]">
                                Activity Photo
                                </div>
                            )}
                            </div>

                            {/* Header Info */}
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                        Outdoor Activity
                                    </p>
                                    <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight">
                                        {selected?.employee?.full_name}
                                    </h3>
                                    <p className="text-sm font-bold text-primary flex items-center gap-1.5">
                                        <IconUser size={16} />
                                        {selected?.employee?.designation?.name} · {selected?.employee?.branch?.name}
                                    </p>
                                </div>
                                <span
                                    className={cn(
                                        'flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-xs font-black border uppercase shadow-sm',
                                        (STATUS_CONFIG[selected?.status] ?? STATUS_CONFIG.submitted).className
                                    )}
                                >
                                    {(STATUS_CONFIG[selected?.status] ?? STATUS_CONFIG.submitted).icon}{' '}
                                    {selected?.status}
                                </span>
                            </div>

                            {/* Metadata Grid */}
                            <div className="grid grid-cols-2 gap-6 py-6 border-y border-gray-100 dark:border-gray-800">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                        <IconCalendarEvent size={12} /> Date & Time
                                    </div>
                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                        {selected?.submitted_at && new Date(selected.submitted_at).toLocaleString([], {
                                            dateStyle: 'medium',
                                            timeStyle: 'short',
                                        })}
                                    </p>
                                </div>
                                <div className="space-y-1 text-right sm:text-left">
                                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 justify-end sm:justify-start">
                                        <IconMapPin size={12} /> Location
                                    </div>
                                    {selected?.latitude ? (
                                        <a
                                            href={`https://www.google.com/maps?q=${selected.latitude},${selected.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm font-black text-primary hover:underline block"
                                        >
                                            {selected.location_name ??
                                                `${parseFloat(selected.latitude).toFixed(4)}, ${parseFloat(
                                                    selected.longitude
                                                ).toFixed(4)}`}
                                        </a>
                                    ) : (
                                        <p className="text-sm font-bold text-gray-400">Unavailable</p>
                                    )}
                                </div>
                            </div>

                            {/* Staff Comment */}
                            {selected?.comment && (
                                <div className="border border-l-primary border-l-4 p-4 rounded-lg">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                                        Staff Comment
                                    </p>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-relaxed italic">
                                        "{selected.comment}"
                                    </p>
                                </div>
                            )}

                            {/* Status Update Form */}
                            <div className="space-y-4 pt-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                        Manager Review
                                    </p>
                                    <div className="flex gap-2">
                                        {['submitted', 'reviewed', 'flagged'].map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => setNewStatus(s)}
                                                className={cn(
                                                    'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all active:scale-90',
                                                    newStatus === s
                                                        ? STATUS_CONFIG[s].className +
                                                        ' ring-2 ring-primary ring-offset-2 dark:ring-offset-[#0e1726]'
                                                        : 'bg-transparent text-gray-400 border-gray-100 dark:border-gray-800 grayscale opacity-50'
                                                )}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <Textarea
                                    rows={3}
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                    placeholder="Enter your private notes or reason for flagging..."
                                />
                            </div>
                        </div>
                    </ScrollArea>

                    {/* Sticky Footer */}
                    <div className="shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-background">
                        <Button
                            type="button"
                            variant="ghost"
                            className="px-5"
                            onClick={() => setDetailOpen(false)}
                        >
                            Discard
                        </Button>
                        <Button
                            type="button"
                            variant="default"
                            className="px-7 bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
                            onClick={saveStatus}
                            disabled={updateStatusMutation.isPending}
                        >
                            {updateStatusMutation.isPending ? 'Saving...' : 'Confirm Review'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Modal */}
            <DeleteModal
                isOpen={deleteModalOpen}
                setIsOpen={setDeleteModalOpen}
                onConfirm={executeDelete}
                isLoading={deleteMutation.isPending}
                title="Delete Activity Log"
                message="Are you sure you want to delete this activity record and its photo content? This cannot be undone."
            />
        </div>
    );
}
