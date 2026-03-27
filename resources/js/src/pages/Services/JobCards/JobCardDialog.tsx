import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IconTools, IconUser, IconClock, IconCheck, IconX, IconInfoCircle, IconPackage, IconArrowRight, IconLoader2, IconCar, IconDots, IconSettings } from '@tabler/icons-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { useJobCard, useUpdateJobCard, useUpdateJobCardItem, useUpdateMaterialUsage, useCompleteJobCard, useTechnicians, useAvailableSerials } from '@/hooks/useJobCardData';
import { Skeleton } from '@/components/ui/skeleton';
import TableSkeleton from '@/components/ui/TableSkeleton';
import ConfirmationModal from '@/components/ConfirmationModal';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import SearchableMultiSelect from '@/components/ui/SearchableMultiSelect';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';

const SideColumn = ({ title, items, employees, techOptions, onUpdate }: { title: string, items: any[], employees: any[], techOptions: any[], onUpdate: (id: number, updates: any) => void }) => (
    <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b dark:border-gray-800 pb-2 px-1">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                {title}
                <Badge variant="secondary" className="rounded-full h-4 min-w-[16px] p-0 flex items-center justify-center text-[8px] font-bold">
                    {items.length}
                </Badge>
            </h4>
        </div>
        <div className="space-y-3">
            {items.map((item) => (
                <JobItemRow key={item.id} item={item} employees={employees} techOptions={techOptions} onUpdate={onUpdate} />
            ))}
            {items.length === 0 && (
                <div className="py-8 text-center border-2 border-dashed border-gray-100 dark:border-gray-900 rounded-xl">
                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">No Components</span>
                </div>
            )}
        </div>
    </div>
);

const JobItemRow = ({ item, employees, techOptions, onUpdate }: { item: any, employees: any[], techOptions: any[], onUpdate: (id: number, updates: any) => void }) => {
    const handleProgressChange = (val: number) => {
        const newStatus = val === 100 ? 'Completed' : val > 0 ? 'In Progress' : 'Pending';
        onUpdate(item.id, { completion_percentage: val, status: newStatus });
    };


    return (
        <div className="group relative flex flex-col gap-3 p-4 rounded-xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-primary/20 transition-all">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${item.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gray-50 dark:bg-gray-900 text-gray-400'} border dark:border-gray-800 transition-colors`}>
                    {item.status === 'Completed' ? <IconCheck size={14} /> : <IconDots size={14} />}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-bold text-xs text-gray-900 dark:text-white tracking-tight truncate">{item.part?.name}</span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider opacity-70 truncate">
                        {item.service?.name}
                    </span>
                </div>
            </div>

            <div className="space-y-4 pt-1">
                {/* Completion Percentage */}
                <div className="space-y-1.5 px-0.5">
                    <div className="flex justify-between items-center px-0.5">
                        <Label className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Progress</Label>
                        <span className="text-[10px] font-bold text-primary">{item.completion_percentage}%</span>
                    </div>
                    <Slider
                        value={[item.completion_percentage || 0]}
                        max={100}
                        step={5}
                        onValueChange={(val) => handleProgressChange(val[0])}
                        className="w-full"
                    />
                </div>

                <div className="flex flex-col gap-3">
                    <div className="space-y-1.5 px-0.5">
                        <Label className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Assigned Workforce</Label>
                        <SearchableMultiSelect
                            options={techOptions}
                            value={item.technician_ids || []}
                            onChange={(vals) => onUpdate(item.id, { technician_ids: vals })}
                            placeholder="Assign Technicians"
                            searchPlaceholder="Search staff..."
                        />
                    </div>
                    
                    <div className="space-y-1.5 px-0.5">
                        <Label className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Activity State</Label>
                        <Select
                            value={item.status}
                            onValueChange={(val) => onUpdate(item.id, { status: val })}
                        >
                            <SelectTrigger className={`h-9 text-[9px] font-bold uppercase tracking-widest border border-gray-100 dark:border-gray-800 rounded-lg focus:ring-1 focus:ring-primary/30 bg-opacity-10 py-0 px-3 ${item.status === 'Completed' ? 'bg-emerald-500 text-emerald-600' : item.status === 'In Progress' ? 'bg-blue-500 text-blue-500' : 'bg-gray-50 dark:bg-gray-900 text-gray-400'}`}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg border-gray-100 dark:border-gray-800">
                                <SelectItem value="Pending" className="text-[10px] font-bold uppercase tracking-widest">Pending</SelectItem>
                                <SelectItem value="In Progress" className="text-[10px] font-bold uppercase tracking-widest text-blue-500">In Progress</SelectItem>
                                <SelectItem value="Completed" className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Completed</SelectItem>
                                <SelectItem value="On Hold" className="text-[10px] font-bold uppercase tracking-widest text-amber-500">On Hold</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        </div>
    );
};

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
    const updateJobMutation = useUpdateJobCard();
    const updateMaterialMutation = useUpdateMaterialUsage();
    const completeJobMutation = useCompleteJobCard();

    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
    const [localItems, setLocalItems] = useState<any[]>([]);
    const [localUsage, setLocalUsage] = useState<any[]>([]);
    const [leadTechnicianId, setLeadTechnicianId] = useState<number | null>(null);
    const [isDirty, setIsDirty] = useState(false);

    const techOptions = useMemo(() => (employees || []).map((e: any) => ({
        value: e.id.toString(),
        label: e.full_name || e.name || 'Technician'
    })), [employees]);

    useEffect(() => {
        if (job) {
            setLocalItems((job.items || []).map((i: any) => ({
                ...i,
                technician_ids: i.technicians?.map((t: any) => t.id.toString()) || []
            })));
            setLocalUsage(job.material_usage || []);
            setLeadTechnicianId(job.technician_lead_id);
            setIsDirty(false);
        }
    }, [job]);

    const handleUpdateItemLocal = (itemId: number, updates: any) => {
        setLocalItems(prev => prev.map(i => i.id === itemId ? { ...i, ...updates } : i));
        setIsDirty(true);
    };

    const handleUpdateUsageLocal = (usageId: number, updates: any) => {
        setLocalUsage(prev => prev.map(u => u.id === usageId ? { ...u, ...updates } : u));
        setIsDirty(true);
    };

    const saveChanges = async () => {
        try {
            // Process Job Card top-level updates (Lead Technician)
            let jobPromise = null;
            if (leadTechnicianId !== job.technician_lead_id) {
                jobPromise = updateJobMutation.mutateAsync({
                    id: job.id,
                    updates: { technician_lead_id: leadTechnicianId }
                });
            }

            // Process Items
            const itemPromises = localItems
                .filter(li => {
                    const original = job.items.find((i: any) => i.id === li.id);
                    const originalTechIds = original.technicians?.map((t: any) => t.id.toString()) || [];
                    const techChanged = JSON.stringify(originalTechIds.sort()) !== JSON.stringify([...li.technician_ids].sort());
                    return techChanged || original.status !== li.status || original.completion_percentage !== li.completion_percentage;
                })
                .map(li => updateItemMutation.mutateAsync({ 
                    itemId: li.id, 
                    updates: {
                        technician_ids: li.technician_ids,
                        status: li.status,
                        completion_percentage: li.completion_percentage
                    } 
                }));

            // Process Material Usage
            const usagePromises = localUsage
                .filter(lu => {
                    const original = job.material_usage.find((u: any) => u.id === lu.id);
                    return JSON.stringify(original) !== JSON.stringify(lu);
                })
                .map(lu => updateMaterialMutation.mutateAsync({ 
                    usageId: lu.id, 
                    ...lu 
                }));

            await Promise.all([jobPromise, ...itemPromises, ...usagePromises].filter(Boolean));
            setIsDirty(false);
            toast.success('Workforce and operations synchronized');
        } catch (error) {
            toast.error('Failed to sync changes');
        }
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

    const getStatusUI = (status: string) => {
        switch (status) {
            case 'Pending': return { class: 'bg-amber-500 text-white' };
            case 'In Progress': return { class: 'bg-blue-600 text-white' };
            case 'QC Review': return { class: 'bg-indigo-600 text-white' };
            case 'Ready': return { class: 'bg-emerald-600 text-white' };
            case 'Rework': return { class: 'bg-orange-500 text-white' };
            case 'Delivered': return { class: 'bg-slate-700 text-white' };
            case 'Cancelled': return { class: 'bg-destructive text-white' };
            default: return { class: 'bg-secondary text-secondary-foreground' };
        }
    };

    if (isLoading && !job) {
        return (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-6xl p-0 h-[80vh] overflow-hidden border dark:border-gray-800 shadow-2xl rounded-xl bg-white dark:bg-gray-950">
                    <div className="p-8 space-y-8">
                        <div className="flex justify-between items-start">
                            <div className="flex gap-4">
                                <Skeleton className="w-16 h-16 rounded-xl" />
                                <div className="space-y-2">
                                    <Skeleton className="h-8 w-64" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                            </div>
                            <Skeleton className="h-12 w-48 rounded-xl" />
                        </div>
                        <div className="grid grid-cols-3 gap-6">
                            <TableSkeleton columns={1} rows={3} rowsOnly />
                            <TableSkeleton columns={1} rows={3} rowsOnly />
                            <TableSkeleton columns={1} rows={3} rowsOnly />
                        </div>
                        <div className="pt-4">
                            <TableSkeleton columns={5} rows={3} />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    const itemsBySide = {
        Left: localItems.filter((i: any) => i.part?.side === 'Left') || [],
        Main: localItems.filter((i: any) => !i.part?.side || i.part?.side === 'Main' || i.part?.side === 'Center') || [],
        Right: localItems.filter((i: any) => i.part?.side === 'Right') || []
    };

    const totalSqm = localUsage.reduce((acc, u) => acc + (parseFloat(u.actual_qty) || 0), 0);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-[95vw] w-full h-[95vh] flex flex-col p-0 overflow-hidden border dark:border-gray-800 shadow-2xl rounded-xl bg-white dark:bg-gray-950">
                <DialogHeader className="px-8 py-6 bg-white dark:bg-gray-950 border-b dark:border-gray-800 shrink-0 relative overflow-hidden">
                    <div className="flex items-center justify-between relative z-10 w-full gap-8">
                        <div className="flex items-center gap-5 flex-1 min-w-0">
                            <div className="p-4 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-inner">
                                <IconTools className="w-8 h-8" />
                            </div>
                            <div className="space-y-1 flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[10px] font-black uppercase text-primary tracking-[0.2em] flex items-center gap-1.5 bg-primary/5 px-2 py-0.5 rounded">
                                        JOB CARD • {job?.job_no}
                                    </span>
                                    {isDirty && (
                                        <Badge className="bg-amber-500 text-white border-0 text-[8px] font-bold uppercase rounded px-1.5 h-4 animate-pulse">
                                            UNSAVED CHANGES
                                        </Badge>
                                    )}
                                </div>
                                <DialogTitle className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-none truncate">
                                    {job?.customer?.name}
                                </DialogTitle>
                                <div className="flex items-center gap-3 mt-1">
                                    <Select
                                        value={job?.status}
                                        onValueChange={(val) => {
                                            updateJobMutation.mutate({ id: job.id, updates: { status: val } });
                                        }}
                                    >
                                        <SelectTrigger className={`h-6 text-[9px] font-black uppercase tracking-widest border-none px-3 rounded-lg shadow-sm w-32 ${getStatusUI(job?.status).class}`}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800 shadow-2xl">
                                            <SelectItem value="Pending" className="text-[10px] font-bold uppercase tracking-widest">Pending</SelectItem>
                                            <SelectItem value="In Progress" className="text-[10px] font-bold uppercase tracking-widest">In Progress</SelectItem>
                                            <SelectItem value="QC Review" className="text-[10px] font-bold uppercase tracking-widest">QC Review</SelectItem>
                                            <SelectItem value="Rework" className="text-[10px] font-bold uppercase tracking-widest text-orange-500">Rework</SelectItem>
                                            <SelectItem value="Ready" className="text-[10px] font-bold uppercase tracking-widest">Ready</SelectItem>
                                            <SelectItem value="Delivered" className="text-[10px] font-bold uppercase tracking-widest">Delivered</SelectItem>
                                            <SelectItem value="Cancelled" className="text-[10px] font-bold uppercase tracking-widest text-destructive">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <IconClock size={12} className="opacity-50" />
                                        Inbound: {job && format(new Date(job.created_at), 'dd MMM yyyy, HH:mm')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 px-6 py-4 bg-gray-50/80 dark:bg-gray-900/40 rounded-2xl border border-gray-100/50 dark:border-gray-800/50 backdrop-blur-sm shadow-sm ring-1 ring-black/5 dark:ring-white/5">
                            <div className="flex flex-col items-end border-r dark:border-gray-800 pr-6">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Team Leadership</span>
                                <div className="w-56">
                                    <SearchableSelect
                                        options={techOptions}
                                        value={leadTechnicianId}
                                        onChange={(val) => {
                                            setLeadTechnicianId(val as number);
                                            setIsDirty(true);
                                        }}
                                        placeholder="Assign Lead"
                                        className="h-9 text-[10px] font-bold"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col items-end border-r dark:border-gray-800 pr-6">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Asset Identity</span>
                                <div className="flex items-center gap-2.5">
                                    <div className="flex flex-col items-end">
                                        <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider leading-none">{job?.vehicle?.plate_number}</span>
                                        <span className="text-[9px] font-bold text-gray-400 uppercase leading-none mt-1">{job?.vehicle?.brand?.name} · {job?.vehicle?.model?.name}</span>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-950 border dark:border-gray-800 flex items-center justify-center text-gray-400 shadow-sm">
                                        <IconCar size={20} stroke={2} />
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Assigned Branch</span>
                                <span className="text-xs font-black text-primary uppercase tracking-widest leading-none">{job?.branch?.name || 'Main HQ'}</span>
                                <span className="text-[9px] font-bold text-gray-400 uppercase leading-none mt-1">Operations Sector</span>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1">
                    <div className="p-6 space-y-10">
                        {/* Component Map */}
                        <section className="space-y-6">
                            <div className="flex items-center justify-between border-b dark:border-gray-800 pb-3">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                    Installation Map
                                    <Badge variant="secondary" className="rounded-full h-5 min-w-[20px] p-0 flex items-center justify-center text-[10px] font-bold">
                                        {localItems.length}
                                    </Badge>
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                                <SideColumn title="Side (Left)" items={itemsBySide.Left} employees={employees} techOptions={techOptions} onUpdate={handleUpdateItemLocal} />
                                <SideColumn title="Main / Center" items={itemsBySide.Main} employees={employees} techOptions={techOptions} onUpdate={handleUpdateItemLocal} />
                                <SideColumn title="Side (Right)" items={itemsBySide.Right} employees={employees} techOptions={techOptions} onUpdate={handleUpdateItemLocal} />
                            </div>
                        </section>

                        {/* Inventory Consumption */}
                        <section className="space-y-6">
                            <div className="flex items-center justify-between border-b dark:border-gray-800 pb-3">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                    Material Consumption
                                    <Badge variant="secondary" className="rounded-full h-5 min-w-[20px] p-0 flex items-center justify-center text-[10px] font-bold">
                                        {localUsage.length}
                                    </Badge>
                                </h3>
                            </div>

                            <div className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50/50 dark:bg-gray-900/50 border-b dark:border-gray-800">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Consumable</th>
                                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Batch / Serial</th>
                                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Dimensions On Car</th>
                                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Dimensions For Cut</th>
                                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">Total SQM</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {localUsage.map((usage: any) => (
                                            <MaterialUsageRow
                                                key={usage.id}
                                                usage={usage}
                                                branchId={job?.branch_id}
                                                onUpdate={(updates) => handleUpdateUsageLocal(usage.id, updates)}
                                            />
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-50/50 dark:bg-gray-900/30 border-t dark:border-gray-800">
                                        <tr>
                                            <td colSpan={4} className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Aggregated Use</td>
                                            <td className="px-6 py-4 text-base font-bold text-primary text-right">
                                                {totalSqm.toFixed(4)} <span className="text-[10px] font-normal uppercase ml-1">SQM</span>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                                {localUsage.length === 0 && (
                                    <div className="p-20 text-center bg-white dark:bg-gray-950">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-300">
                                                <IconPackage size={24} />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No materials linked</p>
                                            </div>
                                        </div>
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
                                Modifications here will sync with operational audits and inventory levels.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setIsOpen(false)} className="px-6 h-10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">
                                Close
                            </Button>
                            
                            {isDirty && (
                                <Button 
                                    onClick={saveChanges}
                                    isLoading={updateItemMutation.isPending || updateMaterialMutation.isPending}
                                    className="px-8 h-10 rounded-xl text-xs font-bold uppercase tracking-widest bg-amber-500 hover:bg-amber-600 text-white shadow-sm border-0"
                                >
                                    <IconPackage size={14} className="mr-2" />
                                    Save Changes
                                </Button>
                            )}

                            <Button
                                onClick={() => setIsCompleteModalOpen(true)}
                                disabled={isDirty || completeJobMutation.isPending || job?.status === 'Completed'}
                                className="px-8 h-10 rounded-xl text-xs font-bold uppercase tracking-widest shadow-md gap-2"
                            >
                                {completeJobMutation.isPending ? <IconLoader2 className="animate-spin w-4 h-4" /> : <IconCheck size={16} />}
                                {job?.status === 'Completed' ? 'FINALIZED' : 'VERIFY & FINISH'}
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>

            <ConfirmationModal
                isOpen={isCompleteModalOpen}
                setIsOpen={setIsCompleteModalOpen}
                title="Review & Finalize Job Card"
                description={
                    <div className="space-y-6 pt-2">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-tight leading-relaxed">
                            Verify all measurements and assignments before completion. This will permanently deduct inventory and lock the operational audit.
                        </p>
                        
                        <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                            <div className="space-y-2">
                                <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                                    <IconPackage size={14} className="opacity-70" /> Material Consumption
                                </h4>
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
                                    {localUsage.map(u => (
                                        <div key={u.id} className="flex items-center justify-between px-3 py-2.5">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-bold text-gray-900 dark:text-gray-100">{u.product?.name}</span>
                                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{u.serial_id ? 'Serialized' : 'Manual Stock'}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-black text-primary">{u.actual_qty || '0.00' }</span>
                                                <span className="text-[9px] font-bold text-gray-400 ml-1">SQM</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                                    <IconTools size={14} className="opacity-70" /> Installation Map
                                </h4>
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
                                    {localItems.map(i => (
                                        <div key={i.id} className="flex items-center justify-between px-3 py-2.5">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-bold text-gray-900 dark:text-gray-100">{i.part?.name}</span>
                                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                                    <IconUser size={10} /> 
                                                    {(() => {
                                                        if (!i.technician_ids || i.technician_ids.length === 0) return 'Unassigned';
                                                        return i.technician_ids.map((tid: string) => {
                                                            const tech = employees.find((e: any) => e.id.toString() === tid);
                                                            return tech ? (tech.full_name || tech.name) : 'Unknown';
                                                        }).join(', ');
                                                    })()}
                                                </span>
                                            </div>
                                            <Badge className={`text-[9px] h-5 font-black uppercase ${i.completion_percentage === 100 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'} border-0`}>
                                                {i.completion_percentage}% Done
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                }
                onConfirm={confirmComplete}
                confirmText="CONFIRM & FINALIZED"
                confirmVariant="success"
                loading={completeJobMutation.isPending}
            />
        </Dialog>
    );
};

const MaterialUsageRow = ({ usage, onUpdate, branchId }: { usage: any, onUpdate: (updates: any) => void, branchId?: number }) => {
    const { data: serials = [] } = useAvailableSerials(usage.product_id, branchId);

    const handleDimChange = (field: string, val: string) => {
        const numVal = parseFloat(val) || 0;
        const updates: any = { [field]: numVal };

        if (field === 'width_cut' || field === 'height_cut') {
            const w = field === 'width_cut' ? numVal : (parseFloat(usage.width_cut) || 0);
            const h = field === 'height_cut' ? numVal : (parseFloat(usage.height_cut) || 0);
            updates.actual_qty = (w * h).toFixed(4);
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
                    <SelectTrigger className="h-9 w-44 text-[10px] font-bold uppercase tracking-tight bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg">
                        <SelectValue placeholder="No Serial" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border-gray-200 dark:border-gray-800">
                        <SelectItem value="null" className="text-[10px] font-bold">MANUAL STOCK</SelectItem>
                        {serials.map((s: any) => (
                            <SelectItem key={s.id} value={s.id.toString()} className="text-[10px] font-bold uppercase tracking-tight">
                                {s.serial_number} ({s.current_quantity}{usage.unit})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </td>
            {/* Dimensions On Car */}
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1">
                        <span className="text-[7px] font-bold text-gray-400 uppercase ml-1">Width</span>
                        <Input
                            type="number"
                            value={usage.width_on_car}
                            onChange={(e) => handleDimChange('width_on_car', e.target.value)}
                            className="h-9 w-20 text-center text-xs font-bold rounded-lg border-gray-200 bg-white dark:bg-gray-950 focus:ring-1 focus:ring-primary/30"
                        />
                    </div>
                    <span className="text-gray-300 mt-5 font-light">×</span>
                    <div className="flex flex-col gap-1">
                        <span className="text-[7px] font-bold text-gray-400 uppercase ml-1">Length</span>
                        <Input
                            type="number"
                            value={usage.height_on_car}
                            onChange={(e) => handleDimChange('height_on_car', e.target.value)}
                            className="h-9 w-20 text-center text-xs font-bold rounded-lg border-gray-200 bg-white dark:bg-gray-950 focus:ring-1 focus:ring-primary/30"
                        />
                    </div>
                </div>
            </td>
            {/* Dimensions For Cut */}
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1">
                        <span className="text-[7px] font-black text-primary uppercase ml-1 opacity-70">Width</span>
                        <Input
                            type="number"
                            value={usage.width_cut}
                            onChange={(e) => handleDimChange('width_cut', e.target.value)}
                            className="h-9 w-20 text-center text-xs font-black rounded-lg border-primary/20 bg-primary/5 dark:bg-primary/10 text-primary-700 dark:text-primary-400 focus:ring-1 focus:ring-primary/50"
                        />
                    </div>
                    <span className="text-primary/30 mt-5 font-bold">×</span>
                    <div className="flex flex-col gap-1">
                        <span className="text-[7px] font-black text-primary uppercase ml-1 opacity-70">Length</span>
                        <Input
                            type="number"
                            value={usage.height_cut}
                            onChange={(e) => handleDimChange('height_cut', e.target.value)}
                            className="h-9 w-20 text-center text-xs font-black rounded-lg border-primary/20 bg-primary/5 dark:bg-primary/10 text-primary-700 dark:text-primary-400 focus:ring-1 focus:ring-primary/50"
                        />
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 text-right">
                <div className="flex flex-col items-end">
                    <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">{usage.actual_qty || '0.0000'}</span>
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Calculated SQM</span>
                </div>
            </td>
        </tr>
    );
};

export default JobCardDialog;
