import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { IconReplace, IconLoader2, IconAlertCircle } from '@tabler/icons-react';
import { useReplacementTypes, useCreateReplacementJob } from '@/hooks/useJobCardData';
import { toast } from 'sonner';

interface ReplacementJobDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    originalJob: any | null;
    onSave?: () => void;
}

const ReplacementJobDialog: React.FC<ReplacementJobDialogProps> = ({ isOpen, setIsOpen, originalJob, onSave }) => {
    const { data: replacementData } = useReplacementTypes({ all: true, is_active: true });
    const replacementTypes = Array.isArray(replacementData) ? replacementData : (replacementData?.data || []);
    const navigate = useNavigate();
    
    const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
    const [itemReplacementTypes, setItemReplacementTypes] = useState<Record<number, string>>({});
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (isOpen) {
            setSelectedItemIds([]);
            setItemReplacementTypes({});
            setNotes('');
        }
    }, [isOpen]);

    const handleToggleItem = (itemId: number) => {
        setSelectedItemIds(prev => {
            const isSelected = prev.includes(itemId);
            if (isSelected) {
                const newTypes = { ...itemReplacementTypes };
                delete newTypes[itemId];
                setItemReplacementTypes(newTypes);
                return prev.filter(id => id !== itemId);
            } else {
                return [...prev, itemId];
            }
        });
    };

    const handleSetItemType = (itemId: number, typeId: string) => {
        setItemReplacementTypes(prev => ({ ...prev, [itemId]: typeId }));
    };

    const handleSubmit = () => {
        if (selectedItemIds.length === 0) {
            toast.error('Please select at least one part for replacement');
            return;
        }

        // Ensure all selected items have a reason
        const missingReasons = selectedItemIds.filter(id => !itemReplacementTypes[id]);
        if (missingReasons.length > 0) {
            toast.error('Please select a replacement reason for all selected parts');
            return;
        }

        const items = selectedItemIds.map(id => {
            const originalItem = originalJob.items.find((i: any) => i.id === id);
            
            // Find the product used for this item in the original job
            // Search in materialUsage where job_card_item_id matches
            const usage = originalJob.materialUsage?.find((u: any) => u.job_card_item_id === id);
            
            return {
                service_id: originalItem.service_id,
                job_part_id: originalItem.part_id,
                product_id: usage?.product_id || null, // Auto-resolve product!
                original_item_id: id,
                replacement_type_id: parseInt(itemReplacementTypes[id]),
                qty: 1
            };
        });

        const params = new URLSearchParams();
        params.set('mode', 'replacement');
        params.set('parent_job_id', originalJob.id.toString());
        params.set('branch_id', originalJob.branch_id.toString()); // Pass branch ID
        params.set('notes', notes);
        params.set('items', JSON.stringify(items));
        params.set('customer_id', originalJob.customer_id.toString());
        if (originalJob.vehicle_id) params.set('vehicle_id', originalJob.vehicle_id.toString());

        navigate(`/sales/create?${params.toString()}`);
        setIsOpen(false);
        onSave?.();
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[600px] border-none shadow-2xl rounded-3xl overflow-hidden p-0">
                <DialogHeader className="p-6 bg-rose-50 dark:bg-rose-950/20 border-b border-rose-100 dark:border-rose-900/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-600">
                            <IconReplace className="w-6 h-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black">Initiate Replacement</DialogTitle>
                            <DialogDescription className="text-rose-600/70 font-bold uppercase text-[10px] tracking-widest">
                                Linked Warranty Job for {originalJob?.vehicle?.plate_number}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">1. Select Parts & Reasons</Label>
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
                                <ScrollArea className="h-[280px] pr-4">
                                    <div className="space-y-4">
                                        {originalJob?.items?.map((item: any) => {
                                            const isSelected = selectedItemIds.includes(item.id);
                                            const usage = originalJob.materialUsage?.find((u: any) => u.job_card_item_id === item.id);
                                            const product = usage?.product;

                                            return (
                                                <div 
                                                    key={item.id}
                                                    className={`p-4 rounded-xl border transition-all ${
                                                        isSelected 
                                                        ? 'bg-white dark:bg-slate-900 border-rose-500 shadow-md ring-1 ring-rose-500/10' 
                                                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 opacity-60'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <Checkbox 
                                                                checked={isSelected}
                                                                onCheckedChange={() => handleToggleItem(item.id)}
                                                                className="rounded-md h-5 w-5 border-slate-300 data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500"
                                                            />
                                                            <div>
                                                                <p className="font-black text-sm">{item.part?.name}</p>
                                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{item.service?.name}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            {product && (
                                                                <Badge variant="outline" className="text-[8px] font-black border-primary/20 text-primary">
                                                                    {product?.name}
                                                                </Badge>
                                                            )}
                                                            {item.part?.side && (
                                                                <Badge variant="secondary" className="text-[8px] font-black uppercase px-2">
                                                                    {item.part.side}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {isSelected && (
                                                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                                                            <Label className="text-[9px] font-black uppercase text-rose-500 mb-1.5 block tracking-widest">Replacement Reason</Label>
                                                            <Select 
                                                                value={itemReplacementTypes[item.id] || ''} 
                                                                onValueChange={(val) => handleSetItemType(item.id, val)}
                                                            >
                                                                <SelectTrigger className="h-9 rounded-lg border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 font-bold text-xs ring-offset-rose-500 focus:ring-rose-500/20">
                                                                    <SelectValue placeholder="Why is this being replaced?" />
                                                                </SelectTrigger>
                                                                <SelectContent className="rounded-xl">
                                                                    {replacementTypes.map((type: any) => (
                                                                        <SelectItem key={type.id} value={type.id.toString()} className="font-bold text-xs">
                                                                            {type.name}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">3. Internal Notes</Label>
                            <Textarea 
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Details about the defect or customer feedback..."
                                className="min-h-[100px] rounded-2xl border-slate-200 dark:border-slate-800 resize-none shadow-inner"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-rose-500 uppercase tracking-tighter">
                            <IconAlertCircle size={14} />
                            Creates audit link to original installation
                        </div>
                        <div className="flex gap-3">
                            <Button variant="ghost" onClick={() => setIsOpen(false)} className="px-6 rounded-xl font-black uppercase text-[10px] tracking-widest h-11">
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleSubmit}
                                className="px-8 rounded-xl font-black uppercase text-[10px] tracking-widest bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-200 dark:shadow-rose-900/20 h-11 gap-2"
                            >
                                <IconReplace className="w-4 h-4" />
                                Confirm Replacement
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ReplacementJobDialog;
