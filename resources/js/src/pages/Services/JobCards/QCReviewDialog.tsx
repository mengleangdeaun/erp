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
    IconMessageDots,
    IconRepeat,
    IconTools
} from '@tabler/icons-react';
import { useTechnicians, useJobCard, useReplacementTypes } from '@/hooks/useJobCardData';
import { toast } from 'sonner';

interface QCReviewDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    jobId: number | null;
    jobNo: string | null;
    onSave?: () => void;
}

const QCItemCard = ({ 
    item, 
    ev, 
    updateItemEvaluation, 
    replacementTypes, 
    technicians, 
    setDecision 
}: { 
    item: any, 
    ev: any, 
    updateItemEvaluation: (id: number, updates: any) => void, 
    replacementTypes: any[], 
    technicians: any[],
    setDecision: (d: 'PASS' | 'FAIL') => void
}) => (
    <div className={`p-4 rounded-2xl border transition-all duration-300 ${ev.status === 'PASS' ? 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800' : 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/50'}`}>
        <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1 mr-4">
                <div className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{item.part?.name}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest truncate">{item.service?.name}</div>
            </div>
            <div className="flex bg-white dark:bg-slate-950 rounded-lg p-1 border border-slate-100 dark:border-slate-800 shadow-inner shrink-0">
                <button 
                    onClick={() => updateItemEvaluation(item.id, { status: 'PASS' })}
                    className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${ev.status === 'PASS' ? 'bg-emerald-50 text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-emerald-500'}`}
                >
                    Pass
                </button>
                <button 
                    onClick={() => {
                        updateItemEvaluation(item.id, { status: 'FAIL' });
                        setDecision('FAIL');
                    }}
                    className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${ev.status === 'FAIL' ? 'bg-rose-50 text-rose-600 shadow-sm' : 'text-slate-400 hover:text-rose-500'}`}
                >
                    Fail
                </button>
            </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/50">
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                        key={star} 
                        onClick={() => updateItemEvaluation(item.id, { rating: star })}
                        className={`transition-all duration-300 hover:scale-110 ${ev.rating >= star ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700'}`}
                    >
                        {ev.rating >= star ? <IconStarFilled size={14} /> : <IconStar size={14} />}
                    </button>
                ))}
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rate part</span>
        </div>

        {ev.status === 'FAIL' && (
            <div className="mt-4 pt-4 border-t border-rose-100 dark:border-rose-900/50 space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-rose-400 flex items-center gap-1.5">
                        <IconRepeat size={10} /> Replacement Reason
                    </Label>
                    <Select 
                        value={ev.replacement_type_id?.toString()} 
                        onValueChange={(val) => updateItemEvaluation(item.id, { replacement_type_id: parseInt(val) })}
                    >
                        <SelectTrigger className="h-8 text-[10px] bg-white/50 dark:bg-slate-900/50 border-rose-100 dark:border-rose-900/50 rounded-lg font-bold">
                            <SelectValue placeholder="Reason for failure" />
                        </SelectTrigger>
                        <SelectContent>
                            {replacementTypes.map((type: any) => (
                                <SelectItem key={type.id} value={type.id.toString()} className="text-[10px] font-bold uppercase tracking-widest">
                                    {type.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-rose-400 flex items-center gap-1.5">
                        <IconUser size={10} /> Rework Tech
                    </Label>
                    <Select 
                        value={ev.rework_technician_id?.toString()} 
                        onValueChange={(val) => updateItemEvaluation(item.id, { rework_technician_id: parseInt(val) })}
                    >
                        <SelectTrigger className="h-8 text-[10px] bg-white/50 dark:bg-slate-900/50 border-rose-100 dark:border-rose-900/50 rounded-lg font-bold">
                            <SelectValue placeholder="Assign Tech" />
                        </SelectTrigger>
                        <SelectContent>
                            {technicians.map((t: any) => (
                                <SelectItem key={t.id} value={t.id.toString()} className="text-[10px] font-bold">
                                    {t.full_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-rose-400 flex items-center gap-1.5">
                        <IconMessageDots size={10} /> Part-specific Note
                    </Label>
                    <input 
                        className="w-full h-8 px-3 rounded-lg bg-white/50 dark:bg-slate-900/50 border border-rose-100 dark:border-rose-900/50 text-[10px] font-bold focus:outline-none focus:ring-1 focus:ring-rose-200"
                        placeholder="Describe the defect..."
                        value={ev.notes || ''}
                        onChange={(e) => updateItemEvaluation(item.id, { notes: e.target.value })}
                    />
                </div>
            </div>
        )}
    </div>
);

const QCReviewDialog: React.FC<QCReviewDialogProps> = ({ isOpen, setIsOpen, jobId, jobNo, onSave }) => {
    const { data: technicians = [] } = useTechnicians();
    const { data: job } = useJobCard(jobId);
    const { data: replacementTypesData = [] } = useReplacementTypes();
    const replacementTypes = Array.isArray(replacementTypesData) ? replacementTypesData : (replacementTypesData?.data || []);

    const [rating, setRating] = useState(5);
    const [decision, setDecision] = useState<'PASS' | 'FAIL'>('PASS');
    const [notes, setNotes] = useState('');
    const [reworkTechnicianId, setReworkTechnicianId] = useState<string>('');
    const [damages, setDamages] = useState<any[]>([]);
    const [itemEvaluations, setItemEvaluations] = useState<Record<number, { 
        rating: number, 
        status: 'PASS' | 'FAIL',
        replacement_type_id?: number,
        rework_technician_id?: number,
        notes?: string
    }>>({});
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

    const itemsBySide = {
        Left: job?.items?.filter((i: any) => i.part?.side === 'Left') || [],
        Main: job?.items?.filter((i: any) => !i.part?.side || i.part?.side === 'Main' || i.part?.side === 'Center') || [],
        Right: job?.items?.filter((i: any) => i.part?.side === 'Right') || []
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-[95vw] w-full h-[95vh] flex flex-col p-0 overflow-hidden border dark:border-gray-800 shadow-2xl rounded-xl bg-white dark:bg-gray-950">
                <DialogHeader className={`px-8 py-6 border-b transition-colors duration-500 shrink-0 ${decision === 'PASS' ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-100' : 'bg-rose-50/30 dark:bg-rose-950/10 border-rose-100'}`}>
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-5">
                            <div className={`p-4 rounded-2xl ${decision === 'PASS' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'} transition-colors`}>
                                <IconChecks className="w-8 h-8" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded ${decision === 'PASS' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                                        QUALITY CONTROL • {jobNo}
                                    </span>
                                    <Badge variant={decision === 'PASS' ? 'success' : 'destructive'} className="h-5 text-[9px] font-bold uppercase tracking-widest rounded-lg">
                                        {decision === 'PASS' ? 'PASS' : 'REWORK'}
                                    </Badge>
                                </div>
                                <DialogTitle className="text-2xl font-black tracking-tight mt-1">Assessment Review</DialogTitle>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 px-6 py-4 bg-white/50 dark:bg-gray-900/40 rounded-2xl border border-white dark:border-gray-800/50 backdrop-blur-sm shadow-sm">
                            <div className="flex flex-col items-end border-r dark:border-gray-800 pr-6">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Customer Identity</span>
                                <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider leading-none">{job?.customer?.name}</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Asset Model</span>
                                <span className="text-xs font-black text-primary uppercase tracking-widest leading-none">{job?.vehicle?.brand?.name} {job?.vehicle?.model?.name}</span>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1">
                    <div className="p-8 space-y-12">
                        {/* Items Section */}
                        {job?.items?.length > 0 && (
                            <section className="space-y-6">
                                <div className="flex items-center justify-between border-b dark:border-gray-800 pb-3">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        1. Component Quality Mapping
                                        <Badge variant="secondary" className="rounded-full h-5 min-w-[20px] p-0 flex items-center justify-center text-[10px] font-bold">
                                            {job.items.length}
                                        </Badge>
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                    {/* Left Side */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between border-b dark:border-gray-800 pb-2 px-1">
                                            <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400">SIDE (LEFT)</h4>
                                        </div>
                                        <div className="space-y-3">
                                            {itemsBySide.Left.map((item: any) => (
                                                <QCItemCard 
                                                    key={item.id}
                                                    item={item}
                                                    ev={itemEvaluations[item.id] || { rating: 5, status: 'PASS' }}
                                                    updateItemEvaluation={updateItemEvaluation}
                                                    replacementTypes={replacementTypes}
                                                    technicians={technicians}
                                                    setDecision={setDecision}
                                                />
                                            ))}
                                            {itemsBySide.Left.length === 0 && (
                                                <div className="py-8 text-center border-2 border-dashed border-slate-50 dark:border-slate-900 rounded-xl">
                                                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest tracking-tighter">No Left Components</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Main/Center Side */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between border-b dark:border-gray-800 pb-2 px-1">
                                            <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400">MAIN / CENTER</h4>
                                        </div>
                                        <div className="space-y-3">
                                            {itemsBySide.Main.map((item: any) => (
                                                <QCItemCard 
                                                    key={item.id}
                                                    item={item}
                                                    ev={itemEvaluations[item.id] || { rating: 5, status: 'PASS' }}
                                                    updateItemEvaluation={updateItemEvaluation}
                                                    replacementTypes={replacementTypes}
                                                    technicians={technicians}
                                                    setDecision={setDecision}
                                                />
                                            ))}
                                            {itemsBySide.Main.length === 0 && (
                                                <div className="py-8 text-center border-2 border-dashed border-slate-50 dark:border-slate-900 rounded-xl">
                                                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest tracking-tighter">No Center Components</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Side */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between border-b dark:border-gray-800 pb-2 px-1">
                                            <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400">SIDE (RIGHT)</h4>
                                        </div>
                                        <div className="space-y-3">
                                            {itemsBySide.Right.map((item: any) => (
                                                <QCItemCard 
                                                    key={item.id}
                                                    item={item}
                                                    ev={itemEvaluations[item.id] || { rating: 5, status: 'PASS' }}
                                                    updateItemEvaluation={updateItemEvaluation}
                                                    replacementTypes={replacementTypes}
                                                    technicians={technicians}
                                                    setDecision={setDecision}
                                                />
                                            ))}
                                            {itemsBySide.Right.length === 0 && (
                                                <div className="py-8 text-center border-2 border-dashed border-slate-50 dark:border-slate-900 rounded-xl">
                                                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest tracking-tighter">No Right Components</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-6">
                            {/* Column 1: Rating & Decision */}
                            <div className="space-y-10">
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
                            </div>

                            {/* Column 2: Rework assignment and Damages */}
                            <div className="space-y-10">
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
                            </div>
                        </div>

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
