import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconAlertTriangle, IconUserCircle, IconEye, IconHistory, IconStarFilled, IconLoader2, IconX } from '@tabler/icons-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { toast } from 'sonner';
import TableSkeleton from '@/components/ui/TableSkeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import FilterBar from '@/components/ui/FilterBar';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import HighlightText from '@/components/ui/HighlightText';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { useJobCardQCReports } from '@/hooks/useJobCardData';
import { useQueryClient } from '@tanstack/react-query';

interface QCReport {
    id: number;
    job_card_id: number;
    job_card?: {
        job_no: string;
        customer?: { name: string };
    };
    qc_person?: { name: string };
    rework_technician?: { name: string };
    decision: 'PASS' | 'FAIL';
    rating: number;
    damages: any[];
    item_evaluations: any;
    qc_items?: Array<{
        id: number;
        job_card_item?: { part?: { name: string } };
        rating: number;
        status: 'PASS' | 'FAIL';
        replacement_type?: { name: string };
        rework_technician?: { name: string; full_name?: string };
        notes: string;
    }>;
    notes: string;
    created_at: string;
}

const DamageReportsIndex = () => {
    const queryClient = useQueryClient();
    
    // Pagination & Filters
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(20);

    // Reports query
    const { data: qcData, isLoading: loading } = useJobCardQCReports({
        page: currentPage,
        per_page: perPage,
        search,
    });

    const reports = qcData?.data || [];
    const stats = qcData?.stats || { total_failures: 0, avg_rating: 0, rework_tasks: 0, active_issues: 0 };
    const totalItems = qcData?.total || 0;
    const totalPages = qcData?.last_page || 1;

    const [selectedReport, setSelectedReport] = useState<QCReport | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getDecisionBadge = (decision: string) => {
        return <StatusBadge status={decision} variant="solid" className="h-6 px-4" />;
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <IconStarFilled 
                        key={star} 
                        size={14} 
                        className={star <= rating ? "text-amber-400" : "text-slate-200 dark:text-zinc-800"} 
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6 pb-12">
            <FilterBar
                icon={<IconAlertTriangle className="w-6 h-6 text-primary" />}
                title="Damage & Accountability"
                description="Mistake tracking and quality control audit trail"
                search={search}
                setSearch={setSearch}
                onRefresh={() => queryClient.invalidateQueries({ queryKey: ['job-card-qc-reports'] })}
                itemsPerPage={perPage}
                setItemsPerPage={setPerPage}
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Failures', value: stats.total_failures, color: 'rose' },
                    { label: 'Avg Rating', value: stats.avg_rating, color: 'amber' },
                    { label: 'Rework Tasks', value: stats.rework_tasks, color: 'blue' },
                    { label: 'Active Issues', value: stats.active_issues, color: 'zinc' },
                ].map((stat, i) => (
                    <div key={i} className="p-6 bg-white dark:bg-dark rounded-xl border border-slate-100 dark:border-zinc-900 shadow-sm flex flex-col gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</span>
                        <span className="text-3xl font-black tracking-tight">{stat.value}</span>
                    </div>
                ))}
            </div>

            {loading ? (
                <TableSkeleton columns={6} rows={5} />
            ) : reports.length === 0 ? (
                <EmptyState
                    isSearch={!!search}
                    searchTerm={search}
                    title={search ? 'No reports found' : 'No quality control records'}
                    description={search ? "We couldn't find any reports matching your search query." : "Looks like everything is running smoothly. No QC incidents recorded yet."}
                    onClearFilter={() => setSearch('')}
                />
            ) : (
                <div className="panel bg-white dark:bg-gray-900 border-none shadow-sm overflow-hidden p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-white-dark/5 text-gray-500 uppercase text-[10px] font-bold tracking-wider">
                                <tr>
                                    <th className="px-8 py-5 text-left">Job Reference</th>
                                    <th className="px-8 py-5 text-left">Mistake By</th>
                                    <th className="px-8 py-5 text-center">QC Status</th>
                                    <th className="px-8 py-5 text-center">Rating</th>
                                    <th className="px-8 py-5 text-left">Date/Time</th>
                                    <th className="px-8 py-5 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {reports.map((report: QCReport) => (
                                    <tr 
                                        key={report.id} 
                                        className="group hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 transition-all cursor-pointer" 
                                        onClick={() => { setSelectedReport(report); setIsDetailsOpen(true); }}
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="font-black text-rose-600">
                                                    <HighlightText text={`#${report.job_card?.job_no}`} highlight={search} />
                                                </span>
                                                <span className="text-xs font-bold text-slate-400">
                                                    <HighlightText text={report.job_card?.customer?.name || ''} highlight={search} />
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 overflow-hidden border-2 border-white dark:border-zinc-900 shadow-sm font-bold text-xs">
                                                    {report.rework_technician?.name ? report.rework_technician.name[0] : (
                                                        report.qc_items?.find(item => item.rework_technician)?.rework_technician?.name?.[0] || <IconUserCircle />
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm tracking-tight text-gray-900 dark:text-gray-100">
                                                        <HighlightText 
                                                            text={report.rework_technician?.name || report.qc_items?.find(item => item.rework_technician)?.rework_technician?.name || 'Unassigned'} 
                                                            highlight={search} 
                                                        />
                                                    </span>
                                                    <span className="text-[10px] font-black uppercase text-rose-500 tracking-widest">Technician</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            {getDecisionBadge(report.decision)}
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex justify-center">
                                                {renderStars(report.rating)}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-xs font-bold text-slate-500">{formatDate(report.created_at)}</span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl group-hover:bg-primary group-hover:text-white transition-all shadow-lg shadow-transparent group-hover:shadow-primary/20">
                                                <IconEye size={18} />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!loading && totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={perPage}
                    onPageChange={setCurrentPage}
                />
            )}

            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-2xl flex flex-col p-0 border-0 shadow-xl rounded-2xl overflow-hidden bg-white dark:bg-zinc-950 ring-1 ring-black/5 dark:ring-white/5">
                    <DialogHeader className="shrink-0 px-8 py-6 bg-rose-600 text-white border-0 relative">
                         <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setIsDetailsOpen(false)}
                            className="absolute right-4 top-4 h-8 w-8 rounded-lg hover:bg-white/10 text-white transition-colors z-20"
                        >
                            <IconX size={18} />
                        </Button>
                        <div className="flex flex-row justify-between items-center relative z-10">
                            <div className="space-y-1">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-70">Audit Log Record</span>
                                <DialogTitle className="text-2xl font-black tracking-tight uppercase leading-none">Report #{selectedReport?.job_card?.job_no}</DialogTitle>
                                <DialogDescription className="text-white/70 font-bold text-[10px] uppercase tracking-wider">Detailed quality control audit report.</DialogDescription>
                            </div>
                            <div className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-xl border border-white/20">
                                <span className="text-white font-black text-xl tracking-widest">{selectedReport?.decision}</span>
                            </div>
                        </div>
                    </DialogHeader>
                    
                    <PerfectScrollbar options={{ suppressScrollX: true }} className="flex-1 min-h-0">
                        <div className="p-8 bg-white dark:bg-zinc-950 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-5 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 block mb-2.5">Audited By (QC)</span>
                                    <div className="flex items-center gap-2.5 font-black text-[11px] uppercase tracking-tight">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">QC</div>
                                        {selectedReport?.qc_person?.name}
                                    </div>
                                </div>
                                <div className="p-5 bg-rose-50/50 dark:bg-rose-950/10 rounded-xl border border-rose-100 dark:border-rose-900/50">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-rose-400 block mb-2.5">Accountable Staff</span>
                                    <div className="flex items-center gap-2.5 font-black text-[11px] uppercase tracking-tight text-rose-600">
                                        <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center"><IconUserCircle size={18} /></div>
                                        {selectedReport?.rework_technician?.name || 'N/A'}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Part-Level Incident Log</Label>
                                <div className="space-y-3">
                                    {(selectedReport?.qc_items?.length ? selectedReport.qc_items : []).map((qcItem) => (
                                        <div key={qcItem.id} className={`p-4 rounded-2xl border ${qcItem.status === 'FAIL' ? 'bg-rose-50/50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900' : 'bg-slate-50/50 border-slate-100 dark:bg-zinc-900 dark:border-zinc-800'}`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black uppercase tracking-tight">{qcItem.job_card_item?.part?.name || `Item ID: ${qcItem.id}`}</span>
                                                    <div className="flex items-center gap-2">
                                                        {renderStars(qcItem.rating)}
                                                        {getDecisionBadge(qcItem.status)}
                                                    </div>
                                                </div>
                                                {qcItem.status === 'FAIL' && (
                                                    <div className="flex flex-col items-end text-right">
                                                        <span className="text-[10px] font-black uppercase text-rose-500 tracking-tight">{qcItem.replacement_type?.name || 'General Failure'}</span>
                                                        <span className="text-[9px] font-bold text-slate-400">Mistake by: {qcItem.rework_technician?.name || 'Unassigned'}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {qcItem.notes && (
                                                <div className="mt-2 p-2 rounded-lg bg-white/50 dark:bg-zinc-950/50 border border-slate-100 dark:border-zinc-800 text-[10px] font-medium italic text-slate-500">
                                                    "{qcItem.notes}"
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {selectedReport && (!selectedReport.qc_items || selectedReport.qc_items.length === 0) && (
                                        <div className="p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900 text-center text-xs font-bold text-slate-400 italic">
                                            No item-level evaluations recorded in the new table.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4 pb-4">
                                <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">QC Performance Audit</Label>
                                <div className="p-6 bg-zinc-950 text-white rounded-2xl font-bold text-xs leading-relaxed italic border border-white/5 shadow-xl">
                                    "{selectedReport?.notes || "No additional comments provided for this audit record."}"
                                </div>
                            </div>
                        </div>
                    </PerfectScrollbar>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default DamageReportsIndex;
