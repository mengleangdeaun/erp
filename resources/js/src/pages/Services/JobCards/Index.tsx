import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { IconTools, IconCar, IconUser, IconClock, IconSearch, IconX, IconCheck, IconExternalLink, IconSettings, IconFilter, IconCalendar } from '@tabler/icons-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import FilterBar from '@/components/ui/FilterBar';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/badge';
import JobCardDialog from './JobCardDialog';
import { format } from 'date-fns';

const JobCardIndex: React.FC = () => {
    const { t } = useTranslation();
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState<any>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    
    // Search and Pagination state
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/services/job-cards');
            const data = await response.json();
            setJobs(data);
        } catch (error) {
            toast.error('Failed to load workshop jobs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    const filteredJobs = useMemo(() => {
        if (!search) return jobs;
        const q = search.toLowerCase();
        return jobs.filter(j => 
            j.job_no.toLowerCase().includes(q) ||
            (j.customer?.name || '').toLowerCase().includes(q) ||
            (j.vehicle?.plate_number || '').toLowerCase().includes(q)
        );
    }, [jobs, search]);

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
                title={t('workshop_jobs', 'Workshop Jobs (Job Cards)')}
                description="Monitor active installations and technician progress."
                search={search}
                setSearch={setSearch}
                onRefresh={fetchJobs}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
            />

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="h-64 bg-gray-50 dark:bg-gray-800 rounded-3xl animate-pulse border border-gray-100 dark:border-gray-800 shadow-sm"></div>
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
                    {paginatedJobs.map((job) => (
                        <div key={job.id} 
                            className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-6 flex flex-col gap-5 shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all cursor-pointer group"
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
                onSave={fetchJobs} 
            />
        </div>
    );
};

export default JobCardIndex;
