import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { IconTools, IconExternalLink, IconHistory } from '@tabler/icons-react';
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

    const filteredJobs = jobs; // Filtered by backend now

    const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
    const paginatedJobs = filteredJobs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const getStatusColor = (status: string): any => {
        switch (status) {
            case 'Pending': return 'warning';
            case 'In Progress': return 'secondary';
            case 'Testing': return 'secondary';
            case 'Completed': return 'success';
            case 'Cancelled': return 'destructive';
            default: return 'secondary';
        }
    };

    return (
        <div className="space-y-6">
            <FilterBar 
                icon={<IconTools className="w-6 h-6 text-primary" />}
                title={t('workshop_jobs', 'Workshop Jobs')}
                description="Monitor active installations and technician progress."
                search={search}
                setSearch={setSearch}
                onRefresh={() => { refetch(); }}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
            />

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {Array.from({ length: 9 }).map((_, index) => (
                        <div key={index} className="h-64 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 space-y-5 animate-pulse shadow-sm">
                            <div className="flex justify-between">
                                <Skeleton className="h-6 w-24 rounded-full" />
                                <Skeleton className="h-6 w-16 rounded-full" />
                            </div>
                            <div className="space-y-2 pt-2">
                                <Skeleton className="h-8 w-3/4 rounded-lg" />
                                <Skeleton className="h-4 w-1/2 rounded-lg" />
                            </div>
                            <div className="py-4 border-y border-gray-50 dark:border-gray-800/50">
                                <Skeleton className="h-8 w-full rounded-lg" />
                            </div>
                            <div className="flex justify-between mt-auto">
                                <Skeleton className="h-6 w-24 rounded-full" />
                                <Skeleton className="h-10 w-10 rounded-full" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredJobs.length === 0 ? (
                <EmptyState 
                    isSearch={!!search}
                    searchTerm={search}
                    title="No Jobs In Queue"
                    description={search ? "Adjust your search parameters." : "Completed jobs will appear in history."}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {paginatedJobs.map((job: any) => (
                        <div key={job.id} 
                            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 flex flex-col gap-5 shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all cursor-pointer group"
                            onClick={() => { setSelectedJob(job); setDialogOpen(true); }}
                        >
                            <div className="flex items-start justify-between">
                                <Badge variant={getStatusColor(job.status)} className="px-5 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-sm">
                                    {job.status}
                                </Badge>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-full">
                                    {job.job_no}
                                </span>
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white leading-none tracking-tight">
                                    {job.vehicle?.plate_number}
                                </h3>
                                <p className="text-xs font-bold text-secondary uppercase tracking-widest opacity-80">
                                    {job.vehicle?.brand?.name} {job.vehicle?.model?.name}
                                </p>
                            </div>

                            <div className="flex items-center gap-4 py-3 border-y border-gray-50 dark:border-gray-800/50">
                                <div className="flex flex-col flex-1">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Customer</span>
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200 truncate">{job.customer?.name}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Initiated</span>
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                                        {format(new Date(job.created_at), 'dd MMM HH:mm')}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-auto pt-2">
                                <div className="flex -space-x-3 overflow-hidden flex-1 items-center">
                                    {job.items?.length > 0 ? (
                                        <div className="flex items-center gap-2">
                                            <div className="text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-tighter">
                                                {job.items.filter((i: any) => i.status === 'Completed').length} / {job.items.length} Parts Done
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] text-gray-400 italic">No parts mapped</span>
                                    )}
                                </div>
                                <Button variant="ghost" size="sm" className="rounded-full w-10 h-10 p-0 text-gray-300 group-hover:text-primary group-hover:bg-primary/5 transition-colors">
                                    <IconExternalLink size={20} />
                                </Button>
                            </div>
                        </div>
                    ))}
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
