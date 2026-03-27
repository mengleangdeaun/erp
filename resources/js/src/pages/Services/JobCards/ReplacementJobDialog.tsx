import React, { useEffect, useState } from 'react';
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
    const { data: replacementData } = useReplacementTypes({ all: true });
    const replacementTypes = Array.isArray(replacementData) ? replacementData : (replacementData?.data || []);
    const createReplacementMutation = useCreateReplacementJob();
    
    const [selectedTypeId, setSelectedTypeId] = useState<string>('');
    const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (isOpen) {
            setSelectedTypeId('');
            setSelectedItemIds([]);
            setNotes('');
        }
    }, [isOpen]);

    const handleToggleItem = (itemId: number) => {
        setSelectedItemIds(prev => 
            prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
        );
    };

    const handleSubmit = async () => {
        if (!selectedTypeId) {
            toast.error('Please select a replacement reason');
            return;
        }
        if (selectedItemIds.length === 0) {
            toast.error('Please select at least one part for replacement');
            return;
        }

        const items = selectedItemIds.map(id => {
            const originalItem = originalJob.items.find((i: any) => i.id === id);
            return {
                service_id: originalItem.service_id,
                part_id: originalItem.part_id
            };
        });

        try {
            await createReplacementMutation.mutateAsync({
                originalId: originalJob.id,
                data: {
                    replacement_type_id: parseInt(selectedTypeId),
                    notes,
                    items
                }
            });
            setIsOpen(false);
            onSave?.();
        } catch (error) {
            // Error managed by mutation
        }
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
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">1. Select Reason (Category)</Label>
                            <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
                                <SelectTrigger className="h-12 rounded-xl border-slate-200 dark:border-slate-800">
                                    <SelectValue placeholder="Why is this being replaced?" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {replacementTypes.map((type: any) => (
                                        <SelectItem key={type.id} value={type.id.toString()} className="font-bold">
                                            {type.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">2. Select Parts to Replace</Label>
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
                                <ScrollArea className="h-[200px] pr-4">
                                    <div className="space-y-2">
                                        {originalJob?.items?.map((item: any) => (
                                            <div 
                                                key={item.id}
                                                className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                                                    selectedItemIds.includes(item.id) 
                                                    ? 'bg-primary/5 border-primary shadow-sm' 
                                                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                                                }`}
                                                onClick={() => handleToggleItem(item.id)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Checkbox 
                                                        checked={selectedItemIds.includes(item.id)}
                                                        onCheckedChange={() => handleToggleItem(item.id)}
                                                        className="rounded-md"
                                                    />
                                                    <div>
                                                        <p className="font-bold text-xs">{item.part?.name}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{item.service?.name}</p>
                                                    </div>
                                                </div>
                                                {item.part?.side && (
                                                    <Badge variant="secondary" className="text-[8px] font-black uppercase px-2">
                                                        {item.part.side}
                                                    </Badge>
                                                )}
                                            </div>
                                        ))}
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
                                disabled={createReplacementMutation.isPending}
                                className="px-8 rounded-xl font-black uppercase text-[10px] tracking-widest bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-200 dark:shadow-rose-900/20 h-11 gap-2"
                            >
                                {createReplacementMutation.isPending ? <IconLoader2 className="animate-spin w-4 h-4" /> : <IconReplace className="w-4 h-4" />}
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
