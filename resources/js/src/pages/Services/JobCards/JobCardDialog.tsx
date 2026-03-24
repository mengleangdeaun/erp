import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IconTools, IconUser, IconClock, IconCheck, IconX, IconInfoCircle, IconPackage, IconArrowRight, IconLoader2, IconCar, IconDots, IconSettings } from '@tabler/icons-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { useJobCard, useUpdateJobCardItem, useUpdateMaterialUsage, useCompleteJobCard, useTechnicians } from '@/hooks/useJobCardData';
import { Skeleton } from '@/components/ui/skeleton';
import DeleteModal from '@/components/DeleteModal';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAvailableSerials } from '@/hooks/useJobCardData';

interface JobCardDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    jobId: number | null;
    onSave: () => void;
}

const JobCardDialog = ({ isOpen, setIsOpen, jobId, onSave }: JobCardDialogProps) => {
    const { data: job, isLoading } = useJobCard(jobId);
    const { data: employees = [] } = useTechnicians();
    
    const updateItemMutation = useUpdateJobCardItem();
    const updateMaterialMutation = useUpdateMaterialUsage();
    const completeJobMutation = useCompleteJobCard();

    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);

    const handleUpdateItem = (itemId: number, updates: any) => {
        updateItemMutation.mutate({ itemId, updates }, {
            onSuccess: () => toast.success('Part status updated')
        });
    };

    const handleUpdateMaterial = (usageId: number, updates: any) => {
        updateMaterialMutation.mutate({ usageId, ...updates }, {
            onSuccess: () => toast.success('Material tracking updated')
        });
    };

    const confirmComplete = () => {
        if (jobId) {
            completeJobMutation.mutate(jobId, {
                onSuccess: () => {
                    setIsCompleteModalOpen(false);
                    onSave();
                    setIsOpen(false);
                }
            });
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

    if (isLoading && !job) {
        return (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-4xl p-10 h-[80vh]">
                    <div className="space-y-8 animate-pulse">
                        <div className="flex gap-4">
                            <Skeleton className="w-16 h-16 rounded-2xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-8 w-64" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-[90vw] w-full h-[92vh] flex flex-col p-0 overflow-hidden border dark:border-gray-800 shadow-2xl rounded-xl bg-white dark:bg-gray-950">
                <DialogHeader className="px-6 py-4 bg-white dark:bg-gray-950 border-b dark:border-gray-800 shrink-0 relative overflow-hidden">
                    {/* Background Accent */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    
                    <div className="flex items-center justify-between relative z-10 w-full">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-primary/10 text-primary shadow-sm border border-primary/20">
                                <IconTools className="w-6 h-6" />
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-[10px] font-bold uppercase text-primary tracking-widest flex items-center gap-1.5">
                                    <IconClock size={12} /> Workshop Operations
                                </span>
                                <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight leading-none">
                                    {job?.job_no}
                                </DialogTitle>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant={getStatusColor(job?.status)} className="px-2 h-4 text-[8px] font-bold uppercase tracking-wider rounded-md">
                                        {job?.status}
                                    </Badge>
                                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">
                                        | Received {job && format(new Date(job.created_at), 'dd MMM yyyy')}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 px-4 py-2.5 bg-gray-50 dark:bg-gray-900 rounded-xl border dark:border-gray-800">
                            <div className="flex flex-col items-end border-r dark:border-gray-800 pr-4 mr-0">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Customer</span>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">{job?.customer?.name}</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Target Vehicle</span>
                                <div className="flex items-center gap-2">
                                   <span className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight">{job?.vehicle?.plate_number}</span>
                                   <Badge variant="outline" className="text-[9px] font-medium rounded-md h-4 px-1.5">{job?.vehicle?.brand?.name} {job?.vehicle?.model?.name}</Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1">
                    <div className="p-6 space-y-8">
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
                                            <div className={`p-2.5 rounded-lg ${item.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gray-50 dark:bg-gray-900 text-gray-400'} border dark:border-gray-800 transition-colors`}>
                                                {item.status === 'Completed' ? <IconCheck size={18} /> : <IconDots size={18} />}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-900 dark:text-white tracking-tight">{item.part?.name}</span>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider opacity-70">
                                                    {item.service?.name}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-6 shrink-0">
                                            {/* Completion Percentage */}
                                            <div className="flex flex-col gap-1.5 min-w-[140px]">
                                                <div className="flex justify-between items-center ml-1">
                                                    <Label className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Progress</Label>
                                                    <span className="text-[10px] font-bold text-primary">{item.completion_percentage || 0}%</span>
                                                </div>
                                                <Slider 
                                                    defaultValue={[item.completion_percentage || 0]} 
                                                    max={100} 
                                                    step={5}
                                                    onValueCommit={(val) => handleUpdateItem(item.id, { completion_percentage: val[0] })}
                                                    className="w-full"
                                                />
                                            </div>

                                            <div className="flex flex-col gap-1 min-w-[140px]">
                                                <Label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider ml-1">Assign Technician</Label>
                                                <Select 
                                                    value={item.technician_id?.toString() || "null"} 
                                                    onValueChange={(val) => handleUpdateItem(item.id, { technician_id: val === "null" ? null : val })}
                                                >
                                                    <SelectTrigger className="h-8 text-[11px] font-semibold uppercase tracking-widest bg-gray-50/50 dark:bg-gray-900/50 border-0 rounded-lg focus:ring-1 focus:ring-primary/30">
                                                        <SelectValue placeholder="Unassigned" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-lg border-gray-100 dark:border-gray-800">
                                                        <SelectItem value="null" className="text-[11px] font-semibold text-gray-400">UNASSIGN STAFF</SelectItem>
                                                        {employees.map((e: any) => (
                                                            <SelectItem key={e.id} value={e.id.toString()} className="text-[11px] font-bold uppercase tracking-widest">{e.full_name || e.name}</SelectItem>
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
                                                    <SelectTrigger className={`h-8 text-[11px] font-bold uppercase tracking-widest border-0 rounded-lg focus:ring-1 focus:ring-primary/30 bg-opacity-10 ${item.status === 'Completed' ? 'bg-emerald-500 text-emerald-600' : 'bg-gray-50 dark:bg-gray-900 text-gray-400'}`}>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-lg border-gray-100 dark:border-gray-800">
                                                        <SelectItem value="Pending" className="text-[11px] font-bold uppercase tracking-widest">Pending</SelectItem>
                                                        <SelectItem value="In Progress" className="text-[11px] font-bold uppercase tracking-widest text-blue-500">In Progress</SelectItem>
                                                        <SelectItem value="Completed" className="text-[11px] font-bold uppercase tracking-widest text-emerald-500">Completed</SelectItem>
                                                        <SelectItem value="On Hold" className="text-[11px] font-bold uppercase tracking-widest text-amber-500">On Hold</SelectItem>
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

                        <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 dark:bg-gray-900/50">
                                        <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Inventory Item</th>
                                        <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Serial Number</th>
                                        <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Dimension (Cut)</th>
                                        <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-center">Expected</th>
                                        <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-center">Actual Used</th>
                                        <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {job?.material_usage?.map((usage: any) => {
                                        const delta = (parseFloat(usage.actual_qty) || 0) - parseFloat(usage.spent_qty);
                                        return <MaterialUsageRow key={usage.id} usage={usage} onUpdate={(updates) => handleUpdateMaterial(usage.id, updates)} branchId={job.branch_id} />;
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
            </ScrollArea>

                <DialogFooter className="px-6 py-4 bg-white dark:bg-gray-950 border-t dark:border-gray-800 shrink-0">
                    <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-3">
                            <IconInfoCircle className="text-gray-300 w-4 h-4" />
                            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider max-w-[250px]">
                                Finalizing will lock the material usage and sync with inventory audits.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setIsOpen(false)} className="px-6 h-10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">
                                Close
                            </Button>
                            <Button 
                                onClick={() => setIsCompleteModalOpen(true)} 
                                disabled={completeJobMutation.isPending || job?.status === 'Completed'}
                                className="px-8 h-10 rounded-xl text-xs font-bold uppercase tracking-widest shadow-md gap-2"
                            >
                                {completeJobMutation.isPending ? <IconLoader2 className="animate-spin w-4 h-4" /> : <IconCheck size={16} />}
                                {job?.status === 'Completed' ? 'FINALIZED' : 'VERIFY & FINISH'}
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>

            <DeleteModal 
                isOpen={isCompleteModalOpen}
                setIsOpen={setIsCompleteModalOpen}
                onConfirm={confirmComplete}
                isLoading={completeJobMutation.isPending}
                title="Finalize Job Card"
                message="Are you sure you want to finalize this Job Card? This will lock the material usage and sync with inventory audits."
                confirmText="YES, FINALIZE"
            />
        </Dialog>
    );
};

const MaterialUsageRow = ({ usage, onUpdate, branchId }: { usage: any, onUpdate: (updates: any) => void, branchId?: number }) => {
    const { data: serials = [] } = useAvailableSerials(usage.product_id, branchId);
    const delta = (parseFloat(usage.actual_qty) || 0) - parseFloat(usage.spent_qty);

    const handleDimChange = (field: string, val: string) => {
        const numVal = parseFloat(val) || 0;
        const updates: any = { [field]: numVal };
        
        // Auto calculate actual_qty if both width and height are present
        if (field === 'width_cut' || field === 'height_cut') {
            const w = field === 'width_cut' ? numVal : (parseFloat(usage.width_cut) || 0);
            const h = field === 'height_cut' ? numVal : (parseFloat(usage.height_cut) || 0);
            if (w > 0 && h > 0) {
                updates.actual_qty = (w * h).toFixed(4);
            }
        }
        onUpdate(updates);
    };

    return (
        <tr className="hover:bg-gray-50/20 dark:hover:bg-gray-900/20 transition-colors border-b dark:border-gray-800 last:border-0">
            <td className="px-6 py-4">
                <div className="flex flex-col">
                    <span className="font-bold text-[13px] text-gray-900 dark:text-gray-100">{usage.product?.name}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{usage.product?.code}</span>
                </div>
            </td>
            <td className="px-6 py-4">
                <Select 
                    value={usage.serial_id?.toString() || "null"} 
                    onValueChange={(val) => onUpdate({ serial_id: val === "null" ? null : parseInt(val) })}
                >
                    <SelectTrigger className="h-8 w-40 text-[11px] font-bold uppercase tracking-tight bg-gray-50/50 dark:bg-gray-900/50 border-0 rounded-lg">
                        <SelectValue placeholder="No Serial" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border-gray-100 dark:border-gray-800">
                        <SelectItem value="null" className="text-[11px] font-bold">MANUAL STOCK</SelectItem>
                        {serials.map((s: any) => (
                            <SelectItem key={s.id} value={s.id.toString()} className="text-[11px] font-bold uppercase tracking-tight">
                                {s.serial_number} ({s.current_quantity}{usage.unit})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[8px] font-bold text-gray-400 uppercase ml-1">Width</span>
                        <Input 
                            type="number" 
                            defaultValue={usage.width_cut}
                            onBlur={(e) => handleDimChange('width_cut', e.target.value)}
                            className="h-8 w-16 text-center text-xs font-bold rounded-lg border-gray-100 bg-gray-50 dark:bg-gray-900"
                        />
                    </div>
                    <span className="text-gray-300 mt-4">×</span>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[8px] font-bold text-gray-400 uppercase ml-1">Length</span>
                        <Input 
                            type="number" 
                            defaultValue={usage.height_cut}
                            onBlur={(e) => handleDimChange('height_cut', e.target.value)}
                            className="h-8 w-16 text-center text-xs font-bold rounded-lg border-gray-100 bg-gray-50 dark:bg-gray-900"
                        />
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 text-center">
                <div className="flex flex-col items-center">
                    <span className="font-bold text-gray-500 text-xs tracking-tight">{usage.spent_qty}</span>
                    <span className="text-[8px] font-bold text-gray-300 uppercase">{usage.unit}</span>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center justify-center">
                    <Input 
                        type="number" 
                        value={usage.actual_qty}
                        onChange={(e) => onUpdate({ actual_qty: e.target.value })}
                        className="h-8 w-24 text-center text-xs font-bold rounded-lg border-gray-100 bg-gray-50 dark:bg-gray-900"
                    />
                </div>
            </td>
            <td className="px-6 py-4 text-center">
                <Badge 
                    variant={delta === 0 ? 'secondary' : delta > 0 ? 'destructive' : 'success'} 
                    className="h-5 px-2 text-[9px] font-bold tracking-tight rounded-md"
                >
                    {delta > 0 ? `+${delta}` : delta === 0 ? 'MATCH' : delta}
                </Badge>
            </td>
        </tr>
    );
};

export default JobCardDialog;
