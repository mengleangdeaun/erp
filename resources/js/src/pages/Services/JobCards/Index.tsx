import React, { useState, useEffect } from 'react';
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
    IconCar,
    IconDotsVertical,
    IconUser
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
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const [selectedJob, setSelectedJob] = useState<any>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [replacementDialogOpen, setReplacementDialogOpen] = useState(false);
    const [qcDialogOpen, setQcDialogOpen] = useState(false);
    const [stockDeductOpen, setStockDeductOpen] = useState(false);
    
    // Search and Pagination state
    const [searchParams] = useSearchParams();
    const jobIdParam = searchParams.get('id');
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [status, setStatus] = useState<string>('all');
    const [type, setType] = useState<string>('all');
    const [branchId, setBranchId] = useState<string>('all');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);

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
        switch (status) {
            case 'PENDING': 
            case 'Pending': 
                return { 
                    label: 'Pending', 
                    variant: 'warning', 
                    icon: <IconClock className="w-3.5 h-3.5" />,
                    class: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
                };
            case 'In Progress': 
                return { 
                    label: 'In Progress', 
                    variant: 'secondary', 
                    icon: <IconLoader2 className="w-3.5 h-3.5 animate-spin" />,
                    class: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
                };
            case 'Review':
            case 'QC Review': 
                return { 
                    label: 'QC Review', 
                    variant: 'secondary', 
                    icon: <IconChecks className="w-3.5 h-3.5" />,
                    class: 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800'
                };
            case 'Rework': 
                return { 
                    label: 'Needs Rework', 
                    variant: 'destructive', 
                    icon: <RotateCcw className="w-3.5 h-3.5" />,
                    class: 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800'
                };
            case 'Ready': 
                return { 
                    label: 'Ready', 
                    variant: 'success', 
                    icon: <IconChecks className="w-3.5 h-3.5" />,
                    class: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                };
            case 'Delivered': 
                return { 
                    label: 'Delivered', 
                    variant: 'success', 
                    icon: <IconExternalLink className="w-3.5 h-3.5" />,
                    class: 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800'
                };
            case 'Cancelled': 
                return { 
                    label: 'Cancelled', 
                    variant: 'destructive', 
                    icon: <X className="w-3.5 h-3.5" />,
                    class: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                };
            default: 
                return { 
                    label: status, 
                    variant: 'secondary', 
                    icon: null,
                    class: 'bg-gray-50 text-gray-700 border-gray-100 dark:bg-gray-800 dark:text-gray-400'
                };
        }
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
                    <div className="flex items-center gap-2">
                        <div className="h-10 flex bg-white dark:bg-dark p-1 bg-white border rounded-md dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-primary border-slate-200 dark:border-slate-800 shadow-sm">
                            <Button
                                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => setViewMode('grid')}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </Button>
                            <Button
                                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                                size="sm"
                                className="h-7 w-7 p-0 "
                                onClick={() => setViewMode('list')}
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
                            const statusUI = getStatusUI(job.status);
                            const completedItems = job.items?.filter((i: any) => i.status === 'Completed').length || 0;
                            const totalItems = job.items?.length || 0;
                            const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

                            return (
                                <div key={job.id} 
                                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 flex flex-col gap-5 shadow-sm hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20 transition-all cursor-pointer group relative overflow-hidden"
                                >
                                    {/* Gradient interaction layer */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-700" />

                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="flex gap-2 items-center">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest shadow-sm cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all ${statusUI.class}`}>
                                                        {statusUI.icon}
                                                        {statusUI.label}
                                                    </div>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start" className="w-48 rounded-xl border-gray-100 dark:border-gray-800 shadow-xl">
                                                    <div className="px-2 py-1.5 border-b dark:border-gray-800 mb-1">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Transition State</span>
                                                    </div>
                                                    <DropdownMenuItem onClick={() => updateJobMutation.mutate({ id: job.id, updates: { status: 'Pending' } })} className="text-[10px] font-bold uppercase tracking-widest py-2">Set Pending</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => updateJobMutation.mutate({ id: job.id, updates: { status: 'In Progress' } })} className="text-[10px] font-bold uppercase tracking-widest py-2 text-blue-500">Start Work</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => updateJobMutation.mutate({ id: job.id, updates: { status: 'QC Review' } })} className="text-[10px] font-bold uppercase tracking-widest py-2 text-indigo-500">Move to QC</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => updateJobMutation.mutate({ id: job.id, updates: { status: 'Rework' } })} className="text-[10px] font-bold uppercase tracking-widest py-2 text-orange-500">Needs Rework</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => updateJobMutation.mutate({ id: job.id, updates: { status: 'Ready' } })} className="text-[10px] font-bold uppercase tracking-widest py-2 text-emerald-500">Mark Ready</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => updateJobMutation.mutate({ id: job.id, updates: { status: 'Delivered' } })} className="text-[10px] font-bold uppercase tracking-widest py-2 text-slate-700">Set Delivered</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => updateJobMutation.mutate({ id: job.id, updates: { status: 'Cancelled' } })} className="text-[10px] font-bold uppercase tracking-widest py-2 text-red-500">Cancel Job</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <div className="flex gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                                            {job.type === 'replacement' && (
                                                <Badge variant="destructive" className="text-[8px] px-1.5 h-4 font-black uppercase">REPLACEMENT</Badge>
                                            )}
                                            {job.replacements_count > 0 && (
                                                <Badge variant="secondary" className="text-[8px] px-1.5 h-4 font-black uppercase bg-red-100 text-red-700">{job.replacements_count}X RETURN</Badge>
                                            )}
                                            <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-50/50 dark:bg-gray-800/50 px-2 py-0.5 rounded border border-gray-100 dark:border-gray-800">
                                                {job.job_no}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-1 relative z-10" onClick={() => { setSelectedJob(job); setDialogOpen(true); }}>
                                        <h3 className="text-3xl font-black text-gray-900 dark:text-white leading-tight tracking-tighter flex items-center gap-2">
                                            {job.vehicle?.plate_number}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            <IconCar className="w-3.5 h-3.5 text-primary/60" />
                                            {job.vehicle?.brand?.name} {job.vehicle?.model?.name}
                                        </div>
                                    </div>

                                    <div className="py-4 border-y border-gray-100 dark:border-gray-800/50 space-y-3 relative z-10">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Progression</span>
                                            <span className="text-xs font-black text-primary">{Math.round(progress)}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                                            <div 
                                                className="h-full bg-gradient-to-r from-primary to-primary-600 transition-all duration-1000 ease-out relative"
                                                style={{ width: `${progress}%` }}
                                            >
                                                <div className="absolute inset-0 bg-white/20 animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                            <span>{completedItems} Done</span>
                                            <span>{totalItems} Items</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-auto pt-6 relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                                                <IconUser className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Customer</span>
                                                <span className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{job.customer?.name}</span>
                                            </div>
                                        </div>
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <ActionButtons 
                                                onApprove={['Review', 'QC Review'].includes(job.status) ? (() => handleOpenDialog(job, setQcDialogOpen)) : undefined}
                                                onReceive={job.status === 'Delivered' && job.type === 'installation' ? (() => handleOpenDialog(job, setReplacementDialogOpen)) : undefined}
                                                onStats={() => handleOpenDialog(job, (open) => {
                                                    setSelectedJob(job);
                                                    setStockDeductOpen(open);
                                                })}
                                                onEdit={() => handleOpenDialog(job, setDialogOpen)}
                                                approveLabel="QC Review"
                                                receiveLabel="Replacement"
                                                statsLabel="Stock Deduct"
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
                                    const statusUI = getStatusUI(job.status);
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
                                                    <span className="text-base font-black tracking-tight">{job.vehicle?.plate_number}</span>
                                                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{job.vehicle?.brand?.name} {job.vehicle?.model?.name}</span>
                                                </div>
                                            </TableCell>
                                             <TableCell onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest shadow-sm cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all ${statusUI.class}`}>
                                                            {statusUI.icon}
                                                            {statusUI.label}
                                                        </div>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="start" className="w-48 rounded-xl border-gray-100 dark:border-gray-800 shadow-xl">
                                                        <DropdownMenuItem onClick={() => updateJobMutation.mutate({ id: job.id, updates: { status: 'Pending' } })} className="text-[10px] font-bold uppercase tracking-widest">Set Pending</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => updateJobMutation.mutate({ id: job.id, updates: { status: 'In Progress' } })} className="text-[10px] font-bold uppercase tracking-widest text-blue-500">Start Work</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => updateJobMutation.mutate({ id: job.id, updates: { status: 'QC Review' } })} className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">Move to QC</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => updateJobMutation.mutate({ id: job.id, updates: { status: 'Rework' } })} className="text-[10px] font-bold uppercase tracking-widest text-orange-500">Needs Rework</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => updateJobMutation.mutate({ id: job.id, updates: { status: 'Ready' } })} className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Mark Ready</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => updateJobMutation.mutate({ id: job.id, updates: { status: 'Delivered' } })} className="text-[10px] font-bold uppercase tracking-widest text-slate-700">Set Delivered</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => updateJobMutation.mutate({ id: job.id, updates: { status: 'Cancelled' } })} className="text-[10px] font-bold uppercase tracking-widest text-red-500">Cancel Job</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                            <TableCell className="w-[200px]">
                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between items-center text-[9px] font-black text-gray-400 uppercase">
                                                        <span>{Math.round(progress)}%</span>
                                                        <span>{completedItems}/{totalItems} Items</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
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
                                                        approveLabel="QC Review"
                                                        receiveLabel="Replacement"
                                                        statsLabel="Stock Deduct"
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
                <div className="mt-8 flex justify-center">
                    <Pagination 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredJobs.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                </div>
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
