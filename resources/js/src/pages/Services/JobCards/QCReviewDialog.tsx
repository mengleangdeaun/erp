import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
    IconChecks, 
    IconStar, 
    IconStarFilled, 
    IconAlertTriangle, 
    IconTrash, 
    IconPlus, 
    IconLoader2,
    IconUser,
    IconMessageDots
} from '@tabler/icons-react';
import { useTechnicians, useJobCard } from '@/hooks/useJobCardData';
import { toast } from 'sonner';

interface QCReviewDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    jobId: number | null;
    jobNo: string | null;
    onSave?: () => void;
}

const QCReviewDialog: React.FC<QCReviewDialogProps> = ({ isOpen, setIsOpen, jobId, jobNo, onSave }) => {
    const { data: technicians = [] } = useTechnicians();
    const { data: job } = useJobCard(jobId);
    
    const [rating, setRating] = useState(5);
    const [decision, setDecision] = useState<'PASS' | 'FAIL'>('PASS');
    const [notes, setNotes] = useState('');
    const [reworkTechnicianId, setReworkTechnicianId] = useState<string>('');
    const [damages, setDamages] = useState<any[]>([]);
    const [itemEvaluations, setItemEvaluations] = useState<Record<number, { rating: number, status: 'PASS' | 'FAIL' }>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setRating(5);
            setDecision('PASS');
            setNotes('');
            setReworkTechnicianId('');
            setDamages([]);
            setItemEvaluations({});
        }
    }, [isOpen]);

    const updateItemEvaluation = (itemId: number, updates: any) => {
        setItemEvaluations(prev => ({
            ...prev,
            [itemId]: { ...(prev[itemId] || { rating: 5, status: 'PASS' }), ...updates }
        }));
    };

    const addDamage = () => {
        setDamages([...damages, { part: '', description: '', caused_by: '' }]);
    };

    const removeDamage = (index: number) => {
        setDamages(prev => prev.filter((_, i) => i !== index));
    };

    const updateDamage = (index: number, field: string, value: string) => {
        const newDamages = [...damages];
        newDamages[index][field] = value;
        setDamages(newDamages);
    };

    const handleSave = async () => {
        if (decision === 'FAIL' && !reworkTechnicianId) {
            toast.error('Please assign a technician for rework');
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch('/api/services/job-cards/qc', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
                body: JSON.stringify({
                    job_card_id: jobId,
                    qc_person_id: 1, // TODO: Get current user employee ID
                    rating,
                    decision,
                    damages,
                    item_evaluations: Object.keys(itemEvaluations).length > 0 ? itemEvaluations : null,
                    rework_technician_id: decision === 'FAIL' ? parseInt(reworkTechnicianId) : null,
                    notes
                }),
            });

            if (!response.ok) throw new Error('Failed to save QC report');
            
            toast.success(decision === 'PASS' ? 'Job PASSED Quality Control' : 'Job sent for REWORK');
            setIsOpen(false);
            onSave?.();
        } catch (error) {
            toast.error('Error saving QC report');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-2xl p-0 border-none shadow-2xl rounded-3xl overflow-hidden bg-white dark:bg-slate-950">
                <DialogHeader className={`p-8 ${decision === 'PASS' ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'bg-rose-50 dark:bg-rose-950/20'} transition-colors duration-500`}>
                    <div className="flex items-center gap-5">
                        <div className={`p-4 rounded-2xl ${decision === 'PASS' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'} transition-colors`}>
                            <IconChecks className="w-8 h-8" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black tracking-tight">Quality Control Review</DialogTitle>
                            <DialogDescription className="font-bold text-[11px] uppercase tracking-[0.2em] opacity-70">
                                Job #{jobNo} • Valuation & Rating
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="max-h-[70vh]">
                    <div className="p-8 space-y-8">
                        {/* Items Section */}
                        {job?.items?.length > 0 && (
                            <div className="space-y-4">
                                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">1. Individual Part Evaluation</Label>
                                <div className="space-y-3">
                                    {job.items.map((item: any) => {
                                        const ev = itemEvaluations[item.id] || { rating: 5, status: 'PASS' };
                                        return (
                                            <div key={item.id} className={`p-4 rounded-2xl flex items-center justify-between border transition-all duration-300 ${ev.status === 'PASS' ? 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800' : 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/50'}`}>
                                                <div>
                                                    <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{item.part?.name}</div>
                                                    <div className="text-[10px] text-slate-500 uppercase tracking-widest">{item.service?.name}</div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="flex items-center gap-1">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <button 
                                                                key={star} 
                                                                onClick={() => updateItemEvaluation(item.id, { rating: star })}
                                                                className={`transition-all duration-300 hover:scale-110 ${ev.rating >= star ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700'}`}
                                                            >
                                                                {ev.rating >= star ? <IconStarFilled size={18} /> : <IconStar size={18} />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="flex bg-white dark:bg-slate-950 rounded-lg p-1 border border-slate-100 dark:border-slate-800 shadow-inner">
                                                        <button 
                                                            onClick={() => updateItemEvaluation(item.id, { status: 'PASS' })}
                                                            className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${ev.status === 'PASS' ? 'bg-emerald-50 text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-emerald-500'}`}
                                                        >
                                                            Pass
                                                        </button>
                                                        <button 
                                                            onClick={() => updateItemEvaluation(item.id, { status: 'FAIL' })}
                                                            className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${ev.status === 'FAIL' ? 'bg-rose-50 text-rose-600 shadow-sm' : 'text-slate-400 hover:text-rose-500'}`}
                                                        >
                                                            Fail
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Rating Section */}
                        <div className="space-y-4">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">2. Overall Workmanship Rating</Label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button 
                                        key={star} 
                                        onClick={() => setRating(star)}
                                        className={`transition-all duration-300 transform hover:scale-110 ${rating >= star ? 'text-amber-400' : 'text-slate-200'}`}
                                    >
                                        {rating >= star ? <IconStarFilled size={32} /> : <IconStar size={32} />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Decision Section */}
                        <div className="space-y-4">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">3. Final Decision</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => setDecision('PASS')}
                                    className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all font-black uppercase tracking-widest text-[11px] ${
                                        decision === 'PASS' 
                                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200' 
                                        : 'bg-white border-slate-100 text-slate-400'
                                    }`}
                                >
                                    <IconChecks size={18} />
                                    Pass Order
                                </button>
                                <button 
                                    onClick={() => setDecision('FAIL')}
                                    className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all font-black uppercase tracking-widest text-[11px] ${
                                        decision === 'FAIL' 
                                        ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-200' 
                                        : 'bg-white border-slate-100 text-slate-400'
                                    }`}
                                >
                                    <IconAlertTriangle size={18} />
                                    Fail / Rework
                                </button>
                            </div>
                        </div>

                        {decision === 'FAIL' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="p-6 rounded-2xl bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/50 space-y-4">
                                    <Label className="text-xs font-black uppercase tracking-widest text-rose-600">Assign Rework Technician</Label>
                                    <Select value={reworkTechnicianId} onValueChange={setReworkTechnicianId}>
                                        <SelectTrigger className="h-12 rounded-xl bg-white dark:bg-slate-900 border-rose-200">
                                            <SelectValue placeholder="Select staff for corrections" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {technicians.map((t: any) => (
                                                <SelectItem key={t.id} value={t.id.toString()} className="font-bold uppercase text-[10px] tracking-widest">
                                                    {t.full_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Damage Logs (If Any)</Label>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={addDamage}
                                            className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest border-2 gap-2"
                                        >
                                            <IconPlus size={14} /> Add Issue
                                        </Button>
                                    </div>
                                    <div className="space-y-3">
                                        {damages.map((dmg, idx) => (
                                            <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-3">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1.5">
                                                        <input 
                                                            placeholder="Component Name"
                                                            className="w-full bg-transparent border-b border-slate-200 dark:border-slate-800 py-1 text-xs font-bold focus:outline-none focus:border-primary"
                                                            value={dmg.part}
                                                            onChange={(e) => updateDamage(idx, 'part', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Select 
                                                            value={dmg.caused_by} 
                                                            onValueChange={(val) => updateDamage(idx, 'caused_by', val)}
                                                        >
                                                            <SelectTrigger className="h-8 py-0 bg-transparent border-none text-[10px] font-black">
                                                                <SelectValue placeholder="Caused By?" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {technicians.map((t: any) => (
                                                                    <SelectItem key={t.id} value={t.id.toString()}>{t.full_name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <div className="relative">
                                                    <input 
                                                        placeholder="Describe the issue..."
                                                        className="w-full bg-transparent text-[10px] text-slate-500 focus:outline-none"
                                                        value={dmg.description}
                                                        onChange={(e) => updateDamage(idx, 'description', e.target.value)}
                                                    />
                                                    <button 
                                                        onClick={() => removeDamage(idx)}
                                                        className="absolute right-0 top-0 text-slate-300 hover:text-rose-500"
                                                    >
                                                        <IconTrash size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <IconMessageDots size={14} /> 4. Additional Internal Notes
                            </Label>
                            <Textarea 
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Summary of quality assessment..."
                                className="min-h-[100px] rounded-2xl bg-slate-50/50 border-slate-100 dark:border-slate-800 resize-none shadow-inner"
                            />
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-tighter">
                            <IconUser size={14} className="text-primary" />
                            Reviewer signature required upon confirm
                        </div>
                        <div className="flex gap-3">
                            <Button variant="ghost" onClick={() => setIsOpen(false)} className="px-6 rounded-xl font-black uppercase text-[10px] tracking-widest h-11">
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleSave}
                                disabled={isSaving}
                                className={`px-10 rounded-xl font-black uppercase text-[10px] tracking-widest h-11 gap-2 shadow-lg transition-all ${
                                    decision === 'PASS' 
                                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' 
                                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                                }`}
                            >
                                {isSaving ? <IconLoader2 className="animate-spin" size={16} /> : <IconChecks size={16} />}
                                Confirm Review
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default QCReviewDialog;
