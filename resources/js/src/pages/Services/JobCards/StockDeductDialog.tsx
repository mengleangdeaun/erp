import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconPackage, IconScale, IconCheck, IconLoader2, IconAlertCircle, IconInfoCircle, IconTools, IconCar, IconClock } from '@tabler/icons-react';
import { useJobCard, useUpdateMaterialUsage, useCompleteJobCard, useAvailableSerials } from '@/hooks/useJobCardData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import ConfirmationModal from '@/components/ConfirmationModal';
import { format } from 'date-fns';

interface StockDeductDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    jobId: number | null;
    onSave?: () => void;
}

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
        <tr className="hover:bg-gray-50/20 dark:hover:bg-gray-900/20 transition-colors border-b dark:border-gray-800 last:border-0 grow">
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
                    <SelectTrigger className="h-9 w-44 text-[10px] font-bold uppercase tracking-tight bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-lg">
                        <SelectValue placeholder="No Serial" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="null" className="text-[10px] font-bold">MANUAL STOCK</SelectItem>
                        {serials.map((s: any) => (
                            <SelectItem key={s.id} value={s.id.toString()} className="text-[10px] font-bold uppercase tracking-tight">
                                {s.serial_number} ({s.current_quantity} {usage.product?.unit || 'm'})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1">
                        <span className="text-[7px] font-bold text-gray-400 uppercase ml-1">Width</span>
                        <Input
                            type="number"
                            value={usage.width_on_car}
                            onChange={(e) => handleDimChange('width_on_car', e.target.value)}
                            className="h-9 w-20 text-center text-xs font-bold rounded-lg border-gray-100 bg-white dark:bg-gray-950"
                        />
                    </div>
                    <span className="text-gray-300 mt-5 font-light">×</span>
                    <div className="flex flex-col gap-1">
                        <span className="text-[7px] font-bold text-gray-400 uppercase ml-1">Length</span>
                        <Input
                            type="number"
                            value={usage.height_on_car}
                            onChange={(e) => handleDimChange('height_on_car', e.target.value)}
                            className="h-9 w-20 text-center text-xs font-bold rounded-lg border-gray-100 bg-white dark:bg-gray-950"
                        />
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1">
                        <span className="text-[7px] font-black text-primary uppercase ml-1 opacity-70">Width (Cut)</span>
                        <Input
                            type="number"
                            value={usage.width_cut}
                            onChange={(e) => handleDimChange('width_cut', e.target.value)}
                            className="h-9 w-20 text-center text-xs font-black rounded-lg border-primary/20 bg-primary/5 text-primary"
                        />
                    </div>
                    <span className="text-primary/30 mt-5 font-bold">×</span>
                    <div className="flex flex-col gap-1">
                        <span className="text-[7px] font-black text-primary uppercase ml-1 opacity-70">Length (Cut)</span>
                        <Input
                            type="number"
                            value={usage.height_cut}
                            onChange={(e) => handleDimChange('height_cut', e.target.value)}
                            className="h-9 w-20 text-center text-xs font-black rounded-lg border-primary/20 bg-primary/5 text-primary"
                        />
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 text-right">
                <div className="flex flex-col items-end">
                    <span className="font-black text-gray-900 dark:text-gray-100 text-sm">{usage.actual_qty || '0.0000'}</span>
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Calculated SQM</span>
                </div>
            </td>
        </tr>
    );
};

const StockDeductDialog: React.FC<StockDeductDialogProps> = ({ isOpen, setIsOpen, jobId, onSave }) => {
    const { data: job, isLoading } = useJobCard(jobId);
    const updateMaterialMutation = useUpdateMaterialUsage();
    const completeJobMutation = useCompleteJobCard();

    const [localUsage, setLocalUsage] = useState<any[]>([]);
    const [isDirty, setIsDirty] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    useEffect(() => {
        if (job) {
            setLocalUsage(job.material_usage || []);
            setIsDirty(false);
        }
    }, [job]);

    const handleUpdateUsageLocal = (usageId: number, updates: any) => {
        setLocalUsage(prev => prev.map(u => u.id === usageId ? { ...u, ...updates } : u));
        setIsDirty(true);
    };

    const saveChanges = async () => {
        try {
            const changedUsage = localUsage.filter(lu => {
                const original = job.material_usage.find((u: any) => u.id === lu.id);
                return JSON.stringify({
                    serial_id: original.serial_id,
                    width_on_car: original.width_on_car,
                    height_on_car: original.height_on_car,
                    width_cut: original.width_cut,
                    height_cut: original.height_cut,
                    actual_qty: original.actual_qty
                }) !== JSON.stringify({
                    serial_id: lu.serial_id,
                    width_on_car: lu.width_on_car,
                    height_on_car: lu.height_on_car,
                    width_cut: lu.width_cut,
                    height_cut: lu.height_cut,
                    actual_qty: lu.actual_qty
                });
            });

            await Promise.all(changedUsage.map(lu => updateMaterialMutation.mutateAsync({
                usageId: lu.id,
                serial_id: lu.serial_id,
                width_on_car: lu.width_on_car,
                height_on_car: lu.height_on_car,
                width_cut: lu.width_cut,
                height_cut: lu.height_cut,
                actual_qty: lu.actual_qty
            })));

            setIsDirty(false);
            toast.success('Inventory usage synchronized');
        } catch (error) {
            toast.error('Failed to sync material usage');
        }
    };

    const finalizeJob = () => {
        if (!jobId) return;
        completeJobMutation.mutate(jobId, {
            onSuccess: () => {
                setIsConfirmOpen(false);
                setIsOpen(false);
                onSave?.();
            }
        });
    };

    const totalSqm = localUsage.reduce((acc, u) => acc + (parseFloat(u.actual_qty) || 0), 0);

    if (isLoading && !job) return null;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-[95vw] w-full h-[95vh] flex flex-col p-0 overflow-hidden border dark:border-gray-800 shadow-2xl rounded-2xl bg-white dark:bg-gray-950">
                <DialogHeader className="px-8 py-6 bg-white dark:bg-gray-950 border-b dark:border-gray-800 shrink-0 relative overflow-hidden">
                    <div className="flex items-center justify-between relative z-10 w-full gap-8">
                        <div className="flex items-center gap-5 flex-1 min-w-0">
                            <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-inner">
                                <IconPackage className="w-8 h-8" />
                            </div>
                            <div className="space-y-1 flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] flex items-center gap-1.5 bg-emerald-500/5 px-2 py-0.5 rounded">
                                        STAGE 2 • MATERIAL FINALIZATION
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
                                    <Badge className="bg-emerald-500 text-white px-3 h-5 text-[9px] font-bold uppercase tracking-widest rounded-lg">
                                        {job?.status}
                                    </Badge>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <IconClock size={12} className="opacity-50" />
                                        Reviewing dimensions for final stock deduction
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 px-6 py-4 bg-gray-50/80 dark:bg-gray-900/40 rounded-2xl border border-gray-100/50 dark:border-gray-800/50 backdrop-blur-sm shadow-sm">
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
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Consumption Aggregated</span>
                                <span className="text-sm font-black text-emerald-600 uppercase tracking-widest leading-none">{totalSqm.toFixed(4)} SQM</span>
                                <span className="text-[9px] font-bold text-gray-400 uppercase leading-none mt-1">Total Deduced Area</span>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1">
                    <div className="p-8">
                         <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50/50 dark:bg-gray-900/50 border-b dark:border-gray-800">
                                    <tr>
                                        <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Consumable Product</th>
                                        <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Batch / Serial Identity</th>
                                        <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Dimensions On Car</th>
                                        <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Final Cut Dimensions</th>
                                        <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">Net Consumption</th>
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
                                        <td colSpan={4} className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Final Aggregated Consumption</td>
                                        <td className="px-6 py-5 text-xl font-black text-emerald-600 text-right">
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
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No materials linked to this job card</p>
                                    </div>
                                </div>
                            )}
                         </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="px-8 py-6 bg-white dark:bg-gray-950 border-t dark:border-gray-800 shrink-0">
                    <div className="flex w-full items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                                <IconAlertCircle size={20} />
                            </div>
                             <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider max-w-[400px]">
                                Finalizing this stage will permanently deduct stock from the selected batches and lock the operational audit. Ensure all measurements are verified.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <Button variant="outline" onClick={() => setIsOpen(false)} className="px-8 h-12 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">
                                Cancel
                            </Button>
                            
                            {isDirty && (
                                <Button 
                                    onClick={saveChanges}
                                    isLoading={updateMaterialMutation.isPending}
                                    className="px-8 h-12 rounded-xl text-xs font-bold uppercase tracking-widest bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 border-0"
                                >
                                    Commit Measurements
                                </Button>
                            )}

                            <Button 
                                className="px-10 h-12 rounded-xl text-xs font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/30 gap-2 border-0"
                                onClick={() => {
                                    if (isDirty) {
                                        toast.error('Commit measurements before finalization');
                                        return;
                                    }
                                    setIsConfirmOpen(true);
                                }}
                                disabled={completeJobMutation.isPending}
                            >
                                {completeJobMutation.isPending ? <IconLoader2 className="animate-spin w-4 h-4" /> : <IconCheck className="w-5 h-5" />}
                                Finalize & Deduct Stock
                            </Button>
                        </div>
                    </div>
                </DialogFooter>

                <ConfirmationModal 
                    isOpen={isConfirmOpen}
                    setIsOpen={setIsConfirmOpen}
                    title="Confirm Inventory Action"
                    description={
                        <div className="space-y-4 pt-2">
                            <p className="text-sm text-gray-500 font-bold uppercase tracking-tight">
                                You are about to deduct <span className="text-emerald-600 font-black">{totalSqm.toFixed(4)} SQM</span> from inventory.
                            </p>
                            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 rounded-xl">
                                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium leading-relaxed uppercase">
                                    This action will permanently update stock levels and close the material consumption audit for Job Card {job?.job_no}.
                                </p>
                            </div>
                        </div>
                    }
                    onConfirm={finalizeJob}
                    confirmText="DEDUCT & FINISH"
                    confirmVariant="success"
                    loading={completeJobMutation.isPending}
                />
            </DialogContent>
        </Dialog>
    );
};

export default StockDeductDialog;
