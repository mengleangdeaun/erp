import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { IconAlertTriangle, IconUserCircle, IconSearch, IconCalendar, IconChevronRight, IconStarFilled, IconHistory, IconEye } from '@tabler/icons-react';
import { toast } from 'sonner';
import TableSkeleton from '@/components/ui/TableSkeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
    notes: string;
    created_at: string;
}

const DamageReportsIndex = () => {
    const [reports, setReports] = useState<QCReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<QCReport | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const response = await fetch('/api/services/job-cards/qc');
            const data = await response.json();
            setReports(data.data || []);
        } catch (error) {
            toast.error('Failed to fetch damage reports');
        } finally {
            setLoading(false);
        }
    };

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
        if (decision === 'PASS') {
            return (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black tracking-widest uppercase border border-emerald-100">
                    PASS
                </div>
            );
        }
        return (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-[10px] font-black tracking-widest uppercase border border-rose-100">
                <IconAlertTriangle size={12} /> FAIL
            </div>
        );
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
        <div className="p-6 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3">
                        <div className="p-2.5 bg-rose-500/10 text-rose-600 rounded-2xl">
                            <IconAlertTriangle size={32} />
                        </div>
                        Damage & Accountability
                    </h1>
                    <p className="text-muted-foreground font-medium text-lg">Mistake tracking and quality control audit trail</p>
                </div>
                
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            placeholder="Find Job # or Technician..." 
                            className="w-full h-12 pl-12 pr-4 bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                    </div>
                    <Button variant="outline" className="h-12 rounded-2xl border-slate-100 px-5 font-black uppercase text-[10px] tracking-widest gap-2">
                        <IconCalendar size={18} /> Filter Date
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Failures', value: reports.filter(r => r.decision === 'FAIL').length, color: 'rose' },
                    { label: 'Avg Rating', value: (reports.reduce((acc, r) => acc + r.rating, 0) / (reports.length || 1)).toFixed(1), color: 'amber' },
                    { label: 'Rework Tasks', value: reports.filter(r => r.rework_technician).length, color: 'blue' },
                    { label: 'Active Issues', value: reports.filter(r => r.decision === 'FAIL').length, color: 'zinc' },
                ].map((stat, i) => (
                    <div key={i} className="p-6 bg-white dark:bg-zinc-950 rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-sm flex flex-col gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</span>
                        <span className="text-3xl font-black tracking-tight">{stat.value}</span>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-[2.5rem] overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-100 dark:border-zinc-800">
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Job Reference</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Mistake By (Mistake Owner)</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">QC Status</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 w-32 text-center">Rating</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Date/Time</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right text-slate-400">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-900">
                        {loading ? (
                            Array.from({length: 5}).map((_, i) => (
                                <tr key={i}><td colSpan={6} className="px-8 py-4"><div className="h-8 bg-slate-50 animate-pulse rounded-xl w-full"></div></td></tr>
                            ))
                        ) : reports.map((report) => (
                            <tr key={report.id} className="group hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 transition-all cursor-pointer" onClick={() => { setSelectedReport(report); setIsDetailsOpen(true); }}>
                                <td className="px-8 py-6">
                                    <div className="flex flex-col">
                                        <span className="font-black text-rose-600">#{report.job_card?.job_no}</span>
                                        <span className="text-xs font-bold text-slate-400">{report.job_card?.customer?.name}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden border-2 border-white shadow-sm">
                                            {report.rework_technician ? report.rework_technician.name[0] : <IconUserCircle />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm tracking-tight">{report.rework_technician?.name || 'Unassigned'}</span>
                                            <span className="text-[10px] font-black uppercase text-rose-500 tracking-widest">Technician</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
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

            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-2xl p-0 border-none rounded-[2.5rem] overflow-hidden shadow-2xl">
                    <DialogHeader className="p-10 bg-rose-500 text-white border-none flex flex-row justify-between items-center">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Audit Log Record</span>
                            <DialogTitle className="text-4xl font-black tracking-tighter">Report #{selectedReport?.job_card?.job_no}</DialogTitle>
                        </div>
                        <div className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20">
                            <span className="text-white font-black text-xl">{selectedReport?.decision}</span>
                        </div>
                    </DialogHeader>
                    
                    <div className="p-10 bg-white dark:bg-zinc-950 space-y-8 max-h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-2 gap-8">
                            <div className="p-6 bg-slate-50 dark:bg-zinc-900 rounded-3xl border border-slate-100/50">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-3">Audited By (QC)</span>
                                <div className="flex items-center gap-3 font-bold">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">QC</div>
                                    {selectedReport?.qc_person?.name}
                                </div>
                            </div>
                            <div className="p-6 bg-rose-50 dark:bg-rose-950/10 rounded-3xl border border-rose-100/50">
                                <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 block mb-3">Accountable Technician</span>
                                <div className="flex items-center gap-3 font-bold text-rose-600">
                                    <IconUserCircle size={20} />
                                    {selectedReport?.rework_technician?.name || 'N/A'}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Part-Level Incident Log</Label>
                            <div className="space-y-3">
                                {selectedReport && Object.entries(selectedReport.item_evaluations || {}).map(([id, evalData]: [string, any]) => (
                                    <div key={id} className={`p-4 rounded-2xl border flex items-center justify-between ${evalData.status === 'FAIL' ? 'bg-rose-50/50 border-rose-100' : 'bg-slate-50/50 border-slate-100'}`}>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black uppercase tracking-tight">Component ID: {id}</span>
                                            <span className="text-xs font-bold text-slate-500 italic">"Items identified for rework"</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {renderStars(evalData.rating)}
                                            {getDecisionBadge(evalData.status)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">QC Performance Notes</Label>
                            <div className="p-6 bg-zinc-900 text-white rounded-[2rem] font-medium leading-relaxed italic">
                                "{selectedReport?.notes || "No additional comments provided for this audit record."}"
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default DamageReportsIndex;
