import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { setPageTitle } from '@/store/themeConfigSlice';
import { 
    IconTools, 
    IconClock, 
    IconLoader2, 
    IconChecks, 
    IconExternalLink, 
    IconChevronRight, 
    IconFilter,
    IconSearch,
    IconRefresh,
    IconX,
    IconDotsVertical,
    IconUser,
    IconClipboardList,
    IconChartBar
} from '@tabler/icons-react';
import { X, LayoutGrid, List, RotateCcw, MoreVertical } from 'lucide-react';
import { useJobCards, useCreateReplacementJob, useReplacementTypes, useUpdateJobCard } from '@/hooks/useJobCardData';
import { useHRBranches } from '@/hooks/useHRData';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import FilterBar from '@/components/ui/FilterBar';
import Pagination from '@/components/ui/Pagination';
import JobCardDialog from './JobCardDialog';
import ReplacementJobDialog from './ReplacementJobDialog';
import QCReviewDialog from './QCReviewDialog';
import StockDeductDialog from './StockDeductDialog';
import TableSkeleton from '@/components/ui/TableSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import ActionButtons from '@/components/ui/ActionButtons';
import ConfirmationModal from '@/components/ConfirmationModal';
import { getStatusConfig, JOB_CARD_STATUS_KEYS } from '@/constants/statusConfig';
import { cn } from '@/lib/utils';

// Grid skeleton for workshop cards
const JobCardSkeleton = () => (
    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 flex flex-col gap-6 shadow-sm overflow-hidden animate-pulse">
        <div className="flex justify-between items-center mb-2">
            <div className="h-6 w-24 bg-gray-100 dark:bg-gray-800 rounded-full" />
            <div className="h-5 w-16 bg-gray-50 dark:bg-gray-800 rounded-lg" />
        </div>
        <div className="space-y-3">
            <div className="h-9 w-3/4 bg-gray-100 dark:bg-gray-800 rounded-xl" />
            <div className="h-4 w-1/2 bg-gray-50 dark:bg-gray-800 rounded-lg" />
        </div>
        <div className="py-5 border-y border-gray-50 dark:border-gray-800/50 space-y-4">
            <div className="flex justify-between items-end">
                <div className="h-3 w-16 bg-gray-100 dark:bg-gray-800 rounded-full" />
                <div className="h-3 w-8 bg-gray-100 dark:bg-gray-800 rounded-full" />
            </div>
            <div className="h-2 w-full bg-gray-50 dark:bg-gray-800 rounded-full" />
        </div>
        <div className="flex justify-between items-center mt-auto">
            <div className="flex gap-2">
                <div className="w-9 h-9 bg-gray-100 dark:bg-gray-800 rounded-xl" />
                <div className="space-y-1">
                    <div className="h-2 w-12 bg-gray-100 dark:bg-gray-800 rounded-full" />
                    <div className="h-3 w-20 bg-gray-50 dark:bg-gray-800 rounded-full" />
                </div>
            </div>
            <div className="h-8 w-16 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        </div>
    </div>
);

const JobCardIndex: React.FC = () => {
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();

    // Reverb Sync
    useEffect(() => {
        if (!(window as any).Echo) return;

        const channel = (window as any).Echo.channel('job-cards');
        channel.listen('JobCardUpdated', (e: any) => {
            queryClient.invalidateQueries({ queryKey: ['job-cards'] });
        });

        return () => {
            (window as any).Echo.leaveChannel('job-cards');
        };
    }, [queryClient]);
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const [selectedJob, setSelectedJob] = useState<any>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [replacementDialogOpen, setReplacementDialogOpen] = useState(false);
    const [qcDialogOpen, setQcDialogOpen] = useState(false);
    const [stockDeductOpen, setStockDeductOpen] = useState(false);
    
    // Search and Pagination state
    const jobIdParam = searchParams.get('id');
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [status, setStatus] = useState<string>('all');
    const [type, setType] = useState<string>('all');
    const [branchId, setBranchId] = useState<string>('all');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const { data: branches = [] } = useHRBranches();
    const createReplacementMutation = useCreateReplacementJob();
    const updateJobMutation = useUpdateJobCard();

    const { data: jobs = [], isLoading, refetch } = useJobCards({ 
        search, 
        status: status === 'all' ? undefined : status,
        type: type === 'all' ? undefined : type,
        branch_id: branchId === 'all' ? null : parseInt(branchId),
        from_date: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : null,
        to_date: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : null,
    });

    useEffect(() => {
        if (jobIdParam) {
            setSelectedJob({ id: parseInt(jobIdParam) });
            setDialogOpen(true);
        }
    }, [jobIdParam]);

    useEffect(() => {
        dispatch(setPageTitle(t('workshop_jobs', 'Service Center')));
    }, [dispatch, t]);

    const handleClearFilters = () => {
        setSearch('');
        setStatus('all');
        setType('all');
        setBranchId('all');
        setDateRange(undefined);
    };

    const filteredJobs = jobs; 

    const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
    const paginatedJobs = filteredJobs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleOpenDialog = (job: any, setter: (open: boolean) => void) => {
        setSelectedJob(job);
        setter(true);
    };

    const getStatusUI = (status: string) => {
        const config = getStatusConfig(status);
        
        return { 
            label: config.label === 'Unknown' ? status : config.label, 
            variant: 'secondary' as any, // fallback variant
            icon: status.toLowerCase().includes('progress') ? <IconLoader2 className="w-3.5 h-3.5 animate-spin" /> : 
                  status.toLowerCase().includes('pending') ? <IconClock className="w-3.5 h-3.5" /> :
                  (status.toLowerCase().includes('ready') || status.toLowerCase().includes('completed') || status.toLowerCase().includes('pass')) ? <IconChecks className="w-3.5 h-3.5" /> :
                  status.toLowerCase().includes('rework') ? <RotateCcw className="w-3.5 h-3.5" /> :
                  status.toLowerCase().includes('delivered') ? <IconExternalLink className="w-3.5 h-3.5" /> :
                  status.toLowerCase().includes('cancelled') ? <X className="w-3.5 h-3.5" /> : null,
            class: `${config.bg} ${config.text} ${config.border} dark:bg-opacity-20`
        };
    };

    return (
        <div className="space-y-8 pb-10">
            <FilterBar 
                icon={<IconTools className="w-6 h-6 text-primary" />}
                title="Service Center"
                description="Live workflow orchestration for vehicle enhancements."
                search={search}
                setSearch={setSearch}
                onRefresh={() => { refetch(); }}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                hasActiveFilters={status !== 'all' || type !== 'all' || branchId !== 'all' || !!dateRange}
                onClearFilters={handleClearFilters}
                extraActions={
<div className="flex items-center">
  <div className="flex items-center gap-1 p-1 rounded-lg border bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
    
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setViewMode('grid')}
      className={`h-8 w-8 p-0 rounded-md transition-all
        ${viewMode === 'grid'
          ? 'bg-white dark:bg-slate-800 shadow text-primary'
          : 'text-slate-500 dark:text-slate-400 hover:text-primary'
        }`}
    >
      <LayoutGrid className="w-4 h-4" />
    </Button>

    <Button
      variant="ghost"
      size="sm"
      onClick={() => setViewMode('list')}
      className={`h-8 w-8 p-0 rounded-md transition-all
        ${viewMode === 'list'
          ? 'bg-white dark:bg-slate-800 shadow text-primary'
          : 'text-slate-500 dark:text-slate-400 hover:text-primary'
        }`}
    >
      <List className="w-4 h-4" />
    </Button>

  </div>
</div>
                }
            >
                <div>
                     <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Status</span>
                     <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="QC Review">QC Review</SelectItem>
                            <SelectItem value="Rework">Rework</SelectItem>
                            <SelectItem value="Ready">Ready</SelectItem>
                            <SelectItem value="Delivered">Delivered</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                     </Select>
                </div>
                <div>
                     <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Job Type</span>
                     <Select value={type} onValueChange={setType}>
                        <SelectTrigger className="h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="installation">First Installation</SelectItem>
                            <SelectItem value="replacement">Warranty Replacement</SelectItem>
                        </SelectContent>
                     </Select>
                </div>
                <div>
                     <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Location</span>
                     <Select value={branchId} onValueChange={setBranchId}>
                        <SelectTrigger className="h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <SelectValue placeholder="All branches" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Branches</SelectItem>
                            {branches.map((b: any) => (
                                <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                            ))}
                        </SelectContent>
                     </Select>
                </div>
                <div className="lg:col-span-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Registered Date</span>
                    <DateRangePicker 
                        value={dateRange} 
                        onChange={setDateRange}
                        className="w-full"
                    />
                </div>
            </FilterBar>

            {isLoading ? (
                viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, index) => <JobCardSkeleton key={index} />)}
                    </div>
                ) : (
                    <TableSkeleton columns={5} rows={8} />
                )
            ) : filteredJobs.length === 0 ? (
                <EmptyState 
                    isSearch={status !== 'all' || search !== ''}
                    searchTerm={search}
                    onClearFilter={handleClearFilters}
                    title={search ? "No Matches Found" : "Workflow Is Idle"}
                    description={search ? "Adjust parameters to locate specific job logs." : "No active installations detected in the current queue."}
                />
            ) : (
                viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {paginatedJobs.map((job: any) => {
                            const statusCfg = getStatusConfig(job.status);
                            const completedItems = job.items?.filter((i: any) => i.status === 'Completed').length || 0;
                            const totalItems = job.items?.length || 0;
                            const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

                            return (
                                <div 
                                    key={job.id} 
                                    className="group relative bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 p-6 flex flex-col gap-5 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 cursor-pointer overflow-hidden border-b-4 border-b-transparent hover:border-b-primary/40"
                                    onClick={() => { setSelectedJob(job); setDialogOpen(true); }}
                                >                                    
                                    <div className="flex justify-between items-start relative z-10">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 bg-primary/5 px-2 py-0.5 rounded-md">
                                                    {job.type || 'Standard'}
                                                </span>
                                                {job.replacements_count > 0 && (
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 bg-rose-500/5 px-2 py-0.5 rounded-md">
                                                        Reworked
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white mt-1 uppercase">
                                                {job.job_no}
                                            </h3>
                                        </div>

                                        <div onClick={(e) => e.stopPropagation()}>
                                            <Select
                                                value={job.status}
                                                onValueChange={(val) => {
                                                    updateJobMutation.mutate({ id: job.id, updates: { status: val } });
                                                }}
                                            >
                                                <SelectTrigger
                                                    className={cn(
                                                        'h-7 w-32 text-[10px] font-black uppercase tracking-wider border px-2 shadow-none gap-1.5 focus:ring-0 rounded transition-all',
                                                        statusCfg.bg,
                                                        statusCfg.text,
                                                        statusCfg.border,
                                                    )}
                                                >
                                                    {updateJobMutation.isPending && updateJobMutation.variables?.id === job.id && (
                                                        <IconLoader2 className="size-3 animate-spin shrink-0" />
                                                    )}
                                                    <SelectValue />
                                                </SelectTrigger>

                                                <SelectContent position="popper" align="end" className="rounded-md border-gray-100 dark:border-gray-800 shadow-2xl">
                                                    {JOB_CARD_STATUS_KEYS.map((key) => {
                                                        const cfg = getStatusConfig(key);
                                                        return (
                                                            <SelectItem key={key} value={key} className="text-[10px] font-black uppercase tracking-widest focus:bg-primary/5">
                                                                <span className="flex items-center gap-2">
                                                                    <span className={cn('size-1.5 shrink-0 rounded-full', cfg.dot)} />
                                                                    {cfg.label}
                                                                </span>
                                                            </SelectItem>
                                                        );
                                                    })}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-4 py-4 border-y border-gray-50 dark:border-gray-800/50 relative z-10">
                                        <div className="flex flex-col">
                                            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
                                                {job.vehicle?.plate_number || (job.vehicle?.vin_last_4 ? `VIN: ${job.vehicle.vin_last_4}` : 'N/A')}
                                                <span className="mx-2 text-primary/20 font-light">/</span>
                                                <span className="text-lg text-slate-500 font-bold">{job.customer?.name}</span>
                                            </span>
                                            <span className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                                                {job.vehicle?.brand?.name} {job.vehicle?.model?.name}
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Completion</span>
                                                <span className="text-[10px] font-black text-primary">{Math.round(progress)}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-50 dark:bg-slate-800/50 rounded-full overflow-hidden border border-slate-100 dark:border-slate-800">
                                                <div 
                                                    className={cn("h-full transition-all duration-1000 ease-out", statusCfg.solidBg)} 
                                                    style={{ width: `${progress}%` }} 
                                                />
                                            </div>
                                            <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                                <span>{completedItems} tasks done</span>
                                                <span>{totalItems} total</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-auto relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-primary/5 p-2 rounded-xl border border-primary/10">
                                                <IconUser className="w-4 h-4 text-primary" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mb-0.5 whitespace-nowrap">Assigned Lead</span>
                                                <span className="text-xs font-black text-slate-900 dark:text-slate-100 line-clamp-1 uppercase tracking-tight">
                                                    {job.lead_technician ? (
                                                        <>
                                                            {job.lead_technician.full_name}
                                                            <span className="ml-1 text-[10px] text-primary/60 font-mono">({job.lead_technician.employee_id})</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-slate-400 italic">Unassigned</span>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                        <div onClick={(e) => e.stopPropagation()} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ActionButtons 
                                                onApprove={['Review', 'QC Review'].map(s => s.toLowerCase()).includes(job.status?.toLowerCase()) ? (() => handleOpenDialog(job, setQcDialogOpen)) : undefined}
                                                onReceive={job.status?.toLowerCase() === 'delivered' && job.type?.toLowerCase() === 'installation' ? (() => handleOpenDialog(job, setReplacementDialogOpen)) : undefined}
                                                onStats={() => handleOpenDialog(job, (open) => {
                                                    setSelectedJob(job);
                                                    setStockDeductOpen(open);
                                                })}
                                                onEdit={() => handleOpenDialog(job, setDialogOpen)}
                                                approveLabel="QC"
                                                statsLabel="Stock Deduct"
                                                statsIcon={IconClipboardList}
                                                receiveLabel="Replacement"
                                                receiveIcon={RotateCcw}
                                                size="sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-dark rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest">Entry</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest">Vehicle</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest">Status</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest">Progress</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedJobs.map((job: any) => {
                                    const statusCfg = getStatusConfig(job.status);
                                    const completedItems = job.items?.filter((i: any) => i.status === 'Completed').length || 0;
                                    const totalItems = job.items?.length || 0;
                                    const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

                                    return (
                                        <TableRow key={job.id} className="group cursor-pointer" onClick={() => { setSelectedJob(job); setDialogOpen(true); }}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold font-mono">{job.job_no}</span>
                                                    <span className="text-[10px] text-gray-400 font-bold">{format(new Date(job.created_at), 'dd/MM/yyyy')}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-base font-black tracking-tight">
                                                            {job.vehicle?.plate_number || (job.vehicle?.vin_last_4 ? `VIN: ${job.vehicle.vin_last_4}` : 'N/A')}
                                                        </span>
                                                        <span className="text-xs text-primary/30 font-bold">/</span>
                                                        <span className="text-sm text-slate-600 font-bold">{job.customer?.name}</span>
                                                    </div>
                                                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{job.vehicle?.brand?.name} {job.vehicle?.model?.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <Select
                                                    value={job.status}
                                                    onValueChange={(val) => {
                                                        updateJobMutation.mutate({ id: job.id, updates: { status: val } });
                                                    }}
                                                >
                                                    <SelectTrigger
                                                        className={cn(
                                                            'h-7 w-32 text-[10px] font-black uppercase tracking-widest border px-2 shadow-none gap-1.5 focus:ring-0 rounded-lg transition-all',
                                                            statusCfg.bg,
                                                            statusCfg.text,
                                                            statusCfg.border,
                                                        )}
                                                    >
                                                        {updateJobMutation.isPending && updateJobMutation.variables?.id === job.id && (
                                                            <IconLoader2 className="size-3 animate-spin shrink-0" />
                                                        )}
                                                        <SelectValue />
                                                    </SelectTrigger>

                                                    <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800 shadow-2xl">
                                                        {JOB_CARD_STATUS_KEYS.map((key) => {
                                                            const cfg = getStatusConfig(key);
                                                            return (
                                                                <SelectItem key={key} value={key} className="text-[10px] font-black uppercase tracking-widest focus:bg-primary/5">
                                                                    <span className="flex items-center gap-2">
                                                                        <span className={cn('size-1.5 shrink-0 rounded-full', cfg.dot)} />
                                                                        {cfg.label}
                                                                    </span>
                                                                </SelectItem>
                                                            );
                                                        })}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="w-[200px]">
                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between items-center text-[9px] font-black text-gray-400 uppercase">
                                                        <span>{Math.round(progress)}%</span>
                                                        <span>{completedItems}/{totalItems} Tasks</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-800">
                                                        <div 
                                                            className={cn("h-full transition-all duration-1000", statusCfg.solidBg)} 
                                                            style={{ width: `${progress}%` }} 
                                                        />
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    <ActionButtons 
                                                        onApprove={['Review', 'QC Review'].includes(job.status) ? (() => handleOpenDialog(job, setQcDialogOpen)) : undefined}
                                                        onReceive={job.status === 'Delivered' && job.type === 'installation' ? (() => handleOpenDialog(job, setReplacementDialogOpen)) : undefined}
                                                        onStats={() => handleOpenDialog(job, (open) => {
                                                            setSelectedJob(job);
                                                            setStockDeductOpen(open);
                                                        })}
                                                        onEdit={() => handleOpenDialog(job, setDialogOpen)}
                                                        approveLabel="QC"
                                                        statsLabel="Stock Deduct"
                                                        statsIcon={IconClipboardList}
                                                        receiveLabel="Replacement"
                                                        receiveIcon={RotateCcw}
                                                        size="sm"
                                                    />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )
            )}

            {totalPages > 1 && (
                    <Pagination 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredJobs.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
            )}

            <JobCardDialog 
                isOpen={dialogOpen} 
                setIsOpen={setDialogOpen} 
                jobId={selectedJob?.id} 
                onSave={refetch} 
            />

            <ReplacementJobDialog 
                isOpen={replacementDialogOpen}
                setIsOpen={setReplacementDialogOpen}
                originalJob={selectedJob}
                onSave={refetch}
            />

            <StockDeductDialog 
                isOpen={stockDeductOpen}
                setIsOpen={setStockDeductOpen}
                jobId={selectedJob?.id}
                onSave={refetch}
            />

            <QCReviewDialog 
                isOpen={qcDialogOpen}
                setIsOpen={setQcDialogOpen}
                jobId={selectedJob?.id}
                jobNo={selectedJob?.job_no}
                onSave={refetch}
            />
        </div>
    );
};

export default JobCardIndex;
