import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSystemActivityLogs } from '@/hooks/useSystemActivityLogs';
import { useFormatDate } from '@/hooks/useFormatDate';
import FilterBar from '@/components/ui/FilterBar';
import TableSkeleton from '@/components/ui/TableSkeleton';
import Pagination from '@/components/ui/Pagination';
import DateRangePicker from '@/components/ui/date-range-picker';
import EmptyState from '@/components/ui/EmptyState';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import DeleteModal from '@/components/DeleteModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IconHistory, IconBox, IconClock, IconTrash, IconEraser } from '@tabler/icons-react';
import { DateRange } from "react-day-picker";
import { format } from 'date-fns';
import { toast } from 'sonner';

const SystemLogsIndex = () => {
    const { data, loading, fetchLogs, total, deleteLogs, clearAllLogs } = useSystemActivityLogs();
    const { formatDateTime } = useFormatDate();

    // Filters state
    const [search, setSearch] = useState('');
    const [eventFilter, setEventFilter] = useState('all');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(15);

    // Selection & Modal state
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteConfig, setDeleteConfig] = useState<{
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        title: '',
        message: '',
        onConfirm: () => {}
    });

    const loadData = useCallback((p = currentPage, l = itemsPerPage) => {
        const filters: any = {};
        
        if (eventFilter !== 'all') filters.event = eventFilter;
        if (search) filters.subject_type = search; 
        
        if (dateRange?.from) filters.start_date = format(dateRange.from, 'yyyy-MM-dd');
        if (dateRange?.to) filters.end_date = format(dateRange.to, 'yyyy-MM-dd');

        fetchLogs(p, l, filters);
        setSelectedIds([]); 
    }, [eventFilter, search, dateRange, fetchLogs]);

    useEffect(() => {
        loadData(currentPage, itemsPerPage);
    }, [currentPage, itemsPerPage, eventFilter, dateRange]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentPage !== 1) {
                setCurrentPage(1);
            } else {
                loadData(1, itemsPerPage);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const handleClearFilters = () => {
        setSearch('');
        setEventFilter('all');
        setDateRange(undefined);
        setCurrentPage(1);
    };

    // Selection Handlers
    const toggleSelectAll = () => {
        if (selectedIds.length === data.length && data.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(data.map(log => log.id));
        }
    };

    const toggleSelect = (id: number) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // Delete Handlers
    const confirmDeleteSelected = () => {
        if (!selectedIds.length) return;
        
        setDeleteConfig({
            title: 'Delete Selected Logs',
            message: `Are you sure you want to delete ${selectedIds.length} selected activity logs? This action is permanent and cannot be undone.`,
            onConfirm: async () => {
                const success = await deleteLogs(selectedIds);
                if (success) {
                    toast.success('Selected logs deleted successfully');
                    loadData(currentPage, itemsPerPage);
                    setIsDeleteModalOpen(false);
                } else {
                    toast.error('Failed to delete selected logs');
                }
            }
        });
        setIsDeleteModalOpen(true);
    };

    const confirmClearAll = () => {
        setDeleteConfig({
            title: 'Clear All System Logs',
            message: 'CRITICAL: This will permanently delete EVERY activity log in the database. This action is extremely destructive and cannot be reversed.',
            onConfirm: async () => {
                const success = await clearAllLogs();
                if (success) {
                    toast.success('All system logs have been cleared');
                    loadData(1, itemsPerPage);
                    setIsDeleteModalOpen(false);
                } else {
                    toast.error('Failed to clear system logs');
                }
            }
        });
        setIsDeleteModalOpen(true);
    };

    return (
        <div className="space-y-4">
            <FilterBar
                icon={<IconHistory className="w-6 h-6 text-primary" />}
                title="System Activity Logs"
                description="Audit trail of all data changes and user actions in the system."
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onRefresh={() => loadData(currentPage, itemsPerPage)}
                hasActiveFilters={eventFilter !== 'all' || !!dateRange || !!search}
                onClearFilters={handleClearFilters}
                extraActions={
                    <div className="flex items-center gap-2">
                         {selectedIds.length > 0 && (
                            <Button 
                                variant="soft-destructive" 
                                onClick={confirmDeleteSelected}
                                className="font-bold h-9 sm:h-10 text-xs sm:text-sm"
                            >
                                <IconTrash size={16} className="sm:mr-2" />
                                <span className="hidden xs:inline">Delete ({selectedIds.length})</span>
                                <span className="xs:hidden">({selectedIds.length})</span>
                            </Button>
                        )}

                        <Button 
                            variant="soft-destructive" 
                            onClick={confirmClearAll}
                            className="h-9 sm:h-10 text-xs sm:text-sm"
                        >
                            <IconEraser size={18} className="sm:mr-2" />
                            <span className="hidden sm:inline">Clear All</span>
                        </Button>
                    </div>
                }
            >
                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Date Range</span>
                    <DateRangePicker 
                        value={dateRange} 
                        onChange={setDateRange} 
                        placeholder="Filter by Date Range"
                    />
                </div>
                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Event Type</span>
                    <Select value={eventFilter} onValueChange={(val) => { setEventFilter(val); setCurrentPage(1); }}>
                        <SelectTrigger className="h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                            <SelectValue placeholder="All Events" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="font-medium">All Events</SelectItem>
                            <SelectItem value="created" className="font-medium">Created</SelectItem>
                            <SelectItem value="updated" className="font-medium">Updated</SelectItem>
                            <SelectItem value="deleted" className="font-medium">Deleted</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </FilterBar>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    {loading ? (
                        <TableSkeleton columns={6} rows={10} />
                    ) : (
                        <>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
                                    <tr>
                                        <th className="px-6 py-4 w-10 text-center">
                                            <Checkbox 
                                                checked={data.length > 0 && selectedIds.length === data.length}
                                                onCheckedChange={toggleSelectAll}
                                                aria-label="Select all"
                                            />
                                        </th>
                                        <th className="px-6 py-4">Timestamp</th>
                                        <th className="px-6 py-4">Causer</th>
                                        <th className="px-6 py-4">Event</th>
                                        <th className="px-6 py-4">Module / ID</th>
                                        <th className="px-6 py-4">Details & Changes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {data.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                                <EmptyState 
                                                    isSearch={!!search || eventFilter !== 'all' || !!dateRange}
                                                    searchTerm={search}
                                                    onClearFilter={handleClearFilters}
                                                    title="No activity logs found"
                                                    description="We couldn't find any log entries matching your current filters."
                                                />
                                            </td>
                                        </tr>
                                    ) : (
                                        data.map((log) => (
                                            <tr key={log.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${selectedIds.includes(log.id) ? 'bg-primary/5 dark:bg-primary/10' : ''}`}>
                                                <td className="px-6 py-4 text-center">
                                                    <Checkbox 
                                                        checked={selectedIds.includes(log.id)}
                                                        onCheckedChange={() => toggleSelect(log.id)}
                                                        aria-label={`Select log ${log.id}`}
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-slate-900 dark:text-slate-200">
                                                            {formatDateTime(log.created_at)}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-mono">
                                                            #{log.id}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {log.causer ? (
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                                {log.causer.name?.charAt(0)}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-slate-700 dark:text-slate-300">{log.causer.name}</span>
                                                                <span className="text-[10px] text-slate-400 uppercase">User</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-slate-400 italic text-[11px]">
                                                            <IconClock size={14} />
                                                            System Process
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                                                        ${log.event === 'created' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : ''}
                                                        ${log.event === 'updated' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : ''}
                                                        ${log.event === 'deleted' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ''}
                                                    `}>
                                                        {log.event}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-1.5 font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded w-fit">
                                                            <IconBox size={12} className="text-slate-400" />
                                                            <span className="text-slate-700 dark:text-slate-300">
                                                                {log.subject_type.split('\\').pop()}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] text-slate-400 ml-1">
                                                            Subject ID: {log.subject_id}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 max-w-md">
                                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 font-medium">
                                                        {log.description}
                                                    </p>
                                                    {log.properties?.attributes && (
                                                        <div className="relative group">
                                                            <div className="text-[10px] font-mono bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 max-h-32 overflow-y-auto scrollbar-thin shadow-inner">
                                                                <pre className="whitespace-pre-wrap text-slate-700 dark:text-slate-400">
                                                                    {JSON.stringify(log.properties.attributes, null, 2)}
                                                                </pre>
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                            
                            <Pagination
                                currentPage={currentPage}
                                totalPages={Math.ceil(total / itemsPerPage)}
                                totalItems={total}
                                itemsPerPage={itemsPerPage}
                                onPageChange={setCurrentPage}
                            />
                        </>
                    )}
                </div>
            </div>

            <DeleteModal 
                isOpen={isDeleteModalOpen}
                setIsOpen={setIsDeleteModalOpen}
                title={deleteConfig.title}
                message={deleteConfig.message}
                onConfirm={deleteConfig.onConfirm}
                isLoading={loading}
            />
        </div>
    );
};

export default SystemLogsIndex;
