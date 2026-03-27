import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconPackage, IconScale, IconCheck, IconLoader2, IconAlertCircle, IconInfoCircle } from '@tabler/icons-react';
import { useJobCard, useUpdateMaterialUsage, useCompleteJobCard, useAvailableSerials } from '@/hooks/useJobCardData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import ConfirmationModal from '@/components/ConfirmationModal';

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
                    <SelectTrigger className="h-9 w-44 text-[10px] font-bold uppercase tracking-tight bg-gray-50/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-lg">
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
            <DialogContent className="max-w-[90vw] w-full h-[85vh] flex flex-col p-0 overflow-hidden border dark:border-gray-800 shadow-2xl rounded-2xl bg-white dark:bg-gray-950">
                <DialogHeader className="px-8 py-6 bg-slate-50/50 dark:bg-gray-900/50 border-b dark:border-gray-800 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                <IconPackage className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Stage 2: Material Consumption</span>
                                <DialogTitle className="text-xl font-black">{job?.vehicle?.plate_number} • Consumables Control</DialogTitle>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Badge variant="outline" className="h-10 px-4 rounded-xl flex items-center gap-2 border-2">
                                <IconScale className="w-4 h-4 text-primary" />
                                <span className="text-xs font-black uppercase tracking-widest">Total: {totalSqm.toFixed(4)} SQM</span>
                            </Badge>
                            {isDirty && (
                                <Button onClick={saveChanges} className="h-10 px-6 rounded-xl text-xs font-black uppercase tracking-widest bg-amber-500 hover:bg-amber-600 text-white animate-pulse">
                                    Commit Usage
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1">
                    <div className="p-0">
                         <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50/50 dark:bg-gray-900/50 sticky top-0 z-10 backdrop-blur-md border-b dark:border-gray-800">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Consumable Name</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Inventory Serial</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">On Car (W×H)</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Cut Size (W×H)</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Consumption</th>
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
                         </table>
                         {localUsage.length === 0 && (
                            <div className="p-20 text-center">
                                <IconInfoCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                <p className="text-gray-400 font-bold uppercase tracking-widest">No materials assigned to this job</p>
                            </div>
                         )}
                    </div>
                </ScrollArea>

                <DialogFooter className="px-8 py-4 bg-slate-50/50 dark:bg-gray-900/50 border-t dark:border-gray-800 shrink-0">
                    <div className="flex w-full items-center justify-between">
                         <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest max-w-md">
                            <IconAlertCircle size={14} className="text-emerald-500" />
                            Finalizing will lock usage data and initiate stock deduction audits.
                        </div>
                        <div className="flex gap-3">
                            <Button variant="ghost" onClick={() => setIsOpen(false)} className="px-6 h-10 rounded-xl text-xs font-bold uppercase tracking-widest">
                                Close
                            </Button>
                            <Button 
                                className="px-8 h-10 rounded-xl text-xs font-bold uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
                                onClick={() => {
                                    if (isDirty) {
                                        toast.error('Please commit your changes first');
                                        return;
                                    }
                                    setIsConfirmOpen(true);
                                }}
                                disabled={completeJobMutation.isPending}
                            >
                                {completeJobMutation.isPending ? <IconLoader2 className="animate-spin w-4 h-4 mr-2" /> : <IconCheck className="w-4 h-4 mr-2" />}
                                Finalize & Deliver
                            </Button>
                        </div>
                    </div>
                </DialogFooter>

                <ConfirmationModal 
                    isOpen={isConfirmOpen}
                    setIsOpen={setIsConfirmOpen}
                    title="Confirm Stock Deduction"
                    description={`You are about to finalize this job card and deduct ${totalSqm.toFixed(4)} SQM of material from inventory. This action cannot be reversed.`}
                    onConfirm={finalizeJob}
                    confirmText="Finalize Now"
                    confirmVariant="success"
                    loading={completeJobMutation.isPending}
                />
            </DialogContent>
        </Dialog>
    );
};

export default StockDeductDialog;
