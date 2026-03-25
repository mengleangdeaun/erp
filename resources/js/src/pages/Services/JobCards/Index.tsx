import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
    IconTools, 
    IconExternalLink, 
    IconClock, 
    IconChecks, 
    IconLoader2, 
    IconCar, 
    IconUser, 
    IconChevronRight 
} from '@tabler/icons-react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import FilterBar from '@/components/ui/FilterBar';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/badge';
import JobCardDialog from './JobCardDialog';
import { format } from 'date-fns';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { useJobCards } from '@/hooks/useJobCardData';
import { Skeleton } from '@/components/ui/skeleton';

const JobCardSkeleton = () => (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 flex flex-col gap-5 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-lg font-mono" />
        </div>
        <div className="space-y-3">
            <Skeleton className="h-8 w-1/2 rounded-xl" />
            <Skeleton className="h-4 w-1/3 rounded-lg" />
        </div>
        <div className="py-4 border-y border-gray-50 dark:border-gray-800/50 space-y-3">
            <div className="flex justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
        </div>
        <div className="flex justify-between mt-auto pt-2">
            <div className="flex gap-2">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="h-4 w-24 self-center" />
            </div>
            <Skeleton className="w-10 h-10 rounded-full" />
        </div>
    </div>
);

const JobCardIndex: React.FC = () => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const [selectedJob, setSelectedJob] = useState<any>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    
    // Search and Pagination state
    const [searchParams] = useSearchParams();
    const jobIdParam = searchParams.get('id');
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const { data: jobs = [], isLoading, refetch } = useJobCards({ search });

    useEffect(() => {
        if (jobIdParam) {
            setSelectedJob({ id: parseInt(jobIdParam) });
            setDialogOpen(true);
        }
    }, [jobIdParam]);

    useEffect(() => {
        dispatch(setPageTitle('Workshop Jobs'));
    }, [dispatch]);

    const filteredJobs = jobs; 

    const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
    const paginatedJobs = filteredJobs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const getStatusUI = (status: string) => {
        switch (status) {
            case 'Pending': 
                return { 
                    label: 'Service Queue', 
                    variant: 'warning', 
                    icon: <IconClock className="w-3.5 h-3.5" />,
                    class: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
                };
            case 'In Progress': 
                return { 
                    label: 'Live Installation', 
                    variant: 'secondary', 
                    icon: <IconLoader2 className="w-3.5 h-3.5 animate-spin" />,
                    class: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
                };
            case 'Testing': 
                return { 
                    label: 'Quality Audit', 
                    variant: 'secondary', 
                    icon: <IconChecks className="w-3.5 h-3.5" />,
                    class: 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800'
                };
            case 'Completed': 
                return { 
                    label: 'Ready For Pickup', 
                    variant: 'success', 
                    icon: <IconChecks className="w-3.5 h-3.5" />,
                    class: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                };
            case 'Cancelled': 
                return { 
                    label: 'Halted', 
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
                title="Service Command Center"
                description="Live workflow orchestration for vehicle enhancements."
                search={search}
                setSearch={setSearch}
                onRefresh={() => { refetch(); }}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
            />

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, index) => <JobCardSkeleton key={index} />)}
                </div>
            ) : filteredJobs.length === 0 ? (
                <EmptyState 
                    isSearch={!!search}
                    searchTerm={search}
                    title="Workflow Is Idle"
                    description={search ? "Adjust parameters to locate specific job logs." : "No active installations detected in the current queue."}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedJobs.map((job: any) => {
                        const statusUI = getStatusUI(job.status);
                        const completedItems = job.items?.filter((i: any) => i.status === 'Completed').length || 0;
                        const totalItems = job.items?.length || 0;
                        const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

                        return (
                            <div key={job.id} 
                                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 flex flex-col gap-5 shadow-sm hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20 transition-all cursor-pointer group relative overflow-hidden"
                                onClick={() => { setSelectedJob(job); setDialogOpen(true); }}
                            >
                                {/* Gradient interaction layer */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-700" />

                                <div className="flex items-center justify-between relative z-10">
                                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest shadow-sm ${statusUI.class}`}>
                                        {statusUI.icon}
                                        {statusUI.label}
                                    </div>
                                    <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-50/50 dark:bg-gray-800/50 px-2 py-0.5 rounded border border-gray-100 dark:border-gray-800">
                                        {job.job_no}
                                    </span>
                                </div>

                                <div className="space-y-1 relative z-10">
                                    <h3 className="text-3xl font-black text-gray-900 dark:text-white leading-tight tracking-tighter flex items-center gap-2">
                                        {job.vehicle?.plate_number}
                                        <IconChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                    </h3>
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-[0.15em]">
                                        <IconCar className="w-3.5 h-3.5 text-primary/60" />
                                        {job.vehicle?.brand?.name} {job.vehicle?.model?.name}
                                    </div>
                                </div>

                                <div className="py-4 border-y border-gray-100 dark:border-gray-800/50 space-y-3 relative z-10">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Component Progress</span>
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
                                        <span>{totalItems} Mapped</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-auto pt-2 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-xl border border-white dark:border-gray-700 shadow-sm">
                                            <IconUser className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-none mb-1">Customer</span>
                                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{job.customer?.name}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                            <IconClock className="w-3.5 h-3.5 text-primary" />
                                            {format(new Date(job.created_at), 'dd MMM')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
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
        </div>
    );
};

export default JobCardIndex;
