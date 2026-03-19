import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IconTools, IconUser, IconClock, IconCheck, IconX, IconInfoCircle, IconPackage, IconArrowRight, IconLoader2, IconCar, IconDots } from '@tabler/icons-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

interface JobCardDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    jobId: number | null;
    onSave: () => void;
}

const JobCardDialog = ({ isOpen, setIsOpen, jobId, onSave }: JobCardDialogProps) => {
    const [job, setJob] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [employees, setEmployees] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen && jobId) {
            fetchJobDetail();
            fetchEmployees();
        }
    }, [isOpen, jobId]);

    const fetchJobDetail = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/services/job-cards/${jobId}`);
            const data = await response.json();
            setJob(data);
        } catch (error) {
            toast.error('Failed to load job details');
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await fetch('/api/employees'); // Assuming this exists
            const data = await response.json();
            setEmployees(data);
        } catch (error) {
            // Silently fail or use dummy
        }
    };

    const handleUpdateItem = async (itemId: number, updates: any) => {
        try {
            const response = await fetch(`/api/services/job-cards/items/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
                body: JSON.stringify(updates),
            });
            if (response.ok) {
                toast.success('Part status updated');
                fetchJobDetail();
            }
        } catch (error) {
            toast.error('Update failed');
        }
    };

    const handleUpdateMaterial = async (usageId: number, actualQty: number) => {
        try {
            const response = await fetch(`/api/services/job-cards/material-usage/${usageId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
                body: JSON.stringify({ actual_qty: actualQty }),
            });
            if (response.ok) {
                toast.success('Material tracking updated');
                fetchJobDetail();
            }
        } catch (error) {
            toast.error('Tracking failed');
        }
    };

    const handleCompleteJob = async () => {
        if (!confirm('Are you sure you want to finalize this Job Card?')) return;
        setSaving(true);
        try {
            const response = await fetch(`/api/services/job-cards/${jobId}/complete`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
            });
            if (response.ok) {
                toast.success('Job marked as Completed!');
                onSave();
                setIsOpen(false);
            }
        } catch (error) {
            toast.error('Finalization failed');
        } finally {
            setSaving(false);
        }
    };

    const getStatusColor = (status: string): any => {
        switch (status) {
            case 'Pending': return 'warning';
            case 'In Progress': return 'secondary';
            case 'Completed': return 'success';
            case 'Cancelled': return 'destructive';
            default: return 'secondary';
        }
    };

    if (!job && loading) return null;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden border-0 shadow-2xl rounded-3xl bg-gray-50 dark:bg-gray-900">
                <DialogHeader className="p-8 bg-white dark:bg-gray-950 border-b dark:border-gray-800 shrink-0 relative overflow-hidden">
                    {/* Background Accent */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    
                    <div className="flex items-start justify-between relative z-10">
                        <div className="flex items-start gap-5">
                            <div className="p-4 rounded-3xl bg-primary/10 text-primary shadow-sm border border-primary/20 animate-in zoom-in duration-500">
                                <IconTools className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase text-primary tracking-[0.3em] flex items-center gap-2">
                                    <IconClock size={12} /> Workshop Operations
                                </span>
                                <DialogTitle className="text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
                                    {job?.job_no}
                                </DialogTitle>
                                <div className="flex items-center gap-2 mt-2">
                                    <Badge variant={getStatusColor(job?.status)} className="px-3 h-5 text-[9px] font-black uppercase tracking-widest rounded-full">
                                        {job?.status}
                                    </Badge>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                        | INITIATED {job && format(new Date(job.created_at), 'dd MMM yyyy')}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 px-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-3xl border dark:border-gray-800 shadow-sm">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Target Vehicle</span>
                            <span className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tighter">{job?.vehicle?.plate_no}</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{job?.vehicle?.brand?.name} {job?.vehicle?.model?.name}</span>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                    {/* Part Management Section */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between border-b dark:border-gray-800 pb-3">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                                Installation Components
                                <Badge variant="secondary" className="rounded-full h-5 min-w-[20px] p-0 flex items-center justify-center text-[10px] font-bold">
                                    {job?.items?.length}
                                </Badge>
                            </h3>
                            <span className="text-[10px] font-bold text-primary/70 uppercase tracking-widest bg-primary/5 px-3 py-1 rounded-full">
                                Assign Technicians Per Part
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                            {job?.items?.map((item: any) => (
                                <div key={item.id} className="group relative flex flex-col md:flex-row md:items-center gap-4 p-5 rounded-3xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-primary/20 transition-all">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className={`p-3 rounded-2xl ${item.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gray-50 dark:bg-gray-900 text-gray-400'} border dark:border-gray-800 group-hover:bg-primary/5 group-hover:text-primary transition-colors`}>
                                            {item.status === 'Completed' ? <IconCheck size={20} /> : <IconDots size={20} />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-black text-gray-900 dark:text-white tracking-tight">{item.part?.name}</span>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest opacity-70">
                                                {item.service?.name}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 shrink-0">
                                        <div className="flex flex-col gap-1 min-w-[140px]">
                                            <Label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider ml-1">Assign Technician</Label>
                                            <Select 
                                                value={item.technician_id?.toString()} 
                                                onValueChange={(val) => handleUpdateItem(item.id, { technician_id: val })}
                                            >
                                                <SelectTrigger className="h-9 text-[11px] font-bold uppercase tracking-widest bg-gray-50/50 dark:bg-gray-900/50 border-0 rounded-xl focus:ring-1 focus:ring-primary/30">
                                                    <SelectValue placeholder="No Staff Assigned" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                                    {employees.map(e => (
                                                        <SelectItem key={e.id} value={e.id.toString()} className="text-[11px] font-bold uppercase tracking-widest">{e.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex flex-col gap-1 min-w-[140px]">
                                            <Label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider ml-1">Part Status</Label>
                                            <Select 
                                                value={item.status} 
                                                onValueChange={(val) => handleUpdateItem(item.id, { status: val })}
                                            >
                                                <SelectTrigger className={`h-9 text-[11px] font-black uppercase tracking-widest border-0 rounded-xl focus:ring-1 focus:ring-primary/30 bg-opacity-10 ${item.status === 'Completed' ? 'bg-emerald-500 text-emerald-600' : 'bg-gray-50 dark:bg-gray-900 text-gray-400'}`}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                                    <SelectItem value="Pending" className="text-[11px] font-black uppercase tracking-widest">Pending</SelectItem>
                                                    <SelectItem value="In Progress" className="text-[11px] font-black uppercase tracking-widest text-blue-500">In Progress</SelectItem>
                                                    <SelectItem value="Completed" className="text-[11px] font-black uppercase tracking-widest text-emerald-500">Completed</SelectItem>
                                                    <SelectItem value="On Hold" className="text-[11px] font-black uppercase tracking-widest text-amber-500">On Hold</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Material Usage Tracking Section */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between border-b dark:border-gray-800 pb-3">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                                Material Consumption Tracking
                                <IconPackage size={14} className="text-primary" />
                            </h3>
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full">
                                Real-time Usage Audit
                            </span>
                        </div>

                        <div className="bg-white dark:bg-gray-950 rounded-[2rem] border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 dark:bg-gray-900/50">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Inventory Item</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Expected</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center w-36">Actual Used</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Delta</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {job?.material_usage?.map((usage: any) => {
                                        const delta = (parseFloat(usage.actual_qty) || 0) - parseFloat(usage.spent_qty);
                                        return (
                                            <tr key={usage.id} className="hover:bg-gray-50/20 dark:hover:bg-gray-900/20 transition-colors">
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-900 dark:text-gray-100">{usage.product?.name}</span>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{usage.product?.code}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="font-black text-gray-500 tracking-tighter">{usage.spent_qty}</span>
                                                        <span className="text-[9px] font-black text-gray-300 uppercase">{usage.unit}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="relative flex items-center justify-center">
                                                        <Input 
                                                            type="number" 
                                                            value={usage.actual_qty}
                                                            onChange={(e) => handleUpdateMaterial(usage.id, parseFloat(e.target.value) || 0)}
                                                            className="h-10 text-center font-black rounded-xl border-gray-100 bg-gray-50 dark:bg-gray-900 focus-visible:ring-primary/20 transition-all hover:border-primary/50"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <Badge 
                                                        variant={delta === 0 ? 'secondary' : delta > 0 ? 'destructive' : 'success'} 
                                                        className="h-5 px-3 text-[10px] font-black tracking-widest"
                                                    >
                                                        {delta > 0 ? `+${delta}` : delta === 0 ? 'MATCHED' : delta} {usage.unit}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {job?.material_usage?.length === 0 && (
                                <div className="p-12 text-center text-gray-400 italic text-sm font-medium tracking-tight bg-white dark:bg-gray-950">
                                    No consumable materials mapped to this job.
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                <DialogFooter className="p-8 bg-white dark:bg-gray-950 border-t dark:border-gray-800 shrink-0 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
                    <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-3">
                            <IconInfoCircle className="text-gray-300 w-5 h-5 ml-1" />
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest max-w-[200px]">
                                Finalizing will lock the material usage and sync with inventory audits.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setIsOpen(false)} className="h-14 px-8 rounded-3xl border-gray-200 dark:border-gray-800 text-xs font-black uppercase tracking-[0.2em] transition-all hover:bg-gray-50 dark:hover:bg-gray-800">
                                Close Overlay
                            </Button>
                            <Button 
                                onClick={handleCompleteJob} 
                                disabled={saving || job?.status === 'Completed'}
                                className="h-14 px-10 rounded-3xl text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] gap-3"
                            >
                                {saving ? <IconLoader2 className="animate-spin" /> : <IconCheck size={20} />}
                                {job?.status === 'Completed' ? 'JOB FINALIZED' : 'VERIFY & FINISH'}
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default JobCardDialog;
