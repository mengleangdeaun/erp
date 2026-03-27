import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconTools, IconCheck, IconPackage, IconLoader2, IconChevronRight } from '@tabler/icons-react';
import { useJobCard, useUpdateJobCardItem, useTechnicians } from '@/hooks/useJobCardData';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import StockDeductDialog from '@/pages/Services/JobCards/StockDeductDialog';

interface ProgressUpdateDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    jobId: number | null;
    onSave?: () => void;
}

const SideColumn = ({ title, items, employees, onUpdate, accentColor = "primary" }: { title: string, items: any[], employees: any[], onUpdate: (id: number, updates: any) => void, accentColor?: "amber" | "primary" | "emerald" }) => {
    const colorClasses = {
        amber: {
            bullet: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]",
            badge: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400",
            empty: "text-amber-200 dark:text-amber-900/20"
        },
        primary: {
            bullet: "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]",
            badge: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300",
            empty: "text-slate-200 dark:text-slate-800"
        },
        emerald: {
            bullet: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]",
            badge: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400",
            empty: "text-emerald-200 dark:text-emerald-900/20"
        }
    }[accentColor];

    const handleCompleteAll = () => {
        items.forEach(item => {
            if (item.status !== 'Completed') {
                onUpdate(item.id, { status: 'Completed', completion_percentage: 100 });
            }
        });
    };

    return (
        <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between border-b dark:border-gray-800 pb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full ${colorClasses.bullet}`} />
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-primary">
                        {title}
                    </h4>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleCompleteAll}
                        className="h-6 text-[7px] font-black uppercase tracking-tighter text-primary/60 hover:text-primary hover:bg-primary/5 px-2"
                    >
                        Complete All
                    </Button>
                    <Badge variant="outline" className="text-[9px] font-bold border-primary/20 text-primary px-3 py-1 rounded-full bg-primary/5">
                        {items.length} Units
                    </Badge>
                </div>
            </div>
            <div className="grid gap-4">
                {items.map((item) => (
                    <JobItemRow key={item.id} item={item} employees={employees} onUpdate={onUpdate} accentColor={accentColor} />
                ))}
            </div>
        </div>
    );
};

const JobItemRow = ({ item, employees, onUpdate, accentColor = "primary" }: { item: any, employees: any[], onUpdate: (id: number, updates: any) => void, accentColor?: "amber" | "primary" | "emerald" }) => {
    const handleProgressChange = (val: number) => {
        const newStatus = val === 100 ? 'Completed' : val > 0 ? (item.status === 'Reworking' ? 'Reworking' : 'In Progress') : (item.technician_id ? 'Assigned' : 'Pending');
        onUpdate(item.id, { completion_percentage: val, status: newStatus });
    };

    const colorClasses = {
        amber: 'hover:border-amber-500/30',
        primary: 'hover:border-primary/30',
        emerald: 'hover:border-emerald-500/30'
    }[accentColor];

    return (
        <div className={`group relative bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 ${colorClasses}`}>
            <div className="flex items-start justify-between mb-5">
                <div className="flex gap-3 min-w-0 flex-1">
                    <div className={`p-2.5 rounded-xl shrink-0 transition-colors duration-300 ${
                        item.status === 'Completed' 
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800' 
                        : 'bg-slate-50 text-slate-400 dark:bg-slate-800/50 dark:text-slate-500 border border-slate-100 dark:border-slate-800'
                    }`}>
                        {item.status === 'Completed' ? <IconCheck size={16} /> : <IconTools size={16} />}
                    </div>
                    <div className="flex flex-col min-w-0 pt-0.5">
                        <span className="font-bold text-[12px] text-slate-900 dark:text-white leading-tight truncate tracking-tight">{item.part?.name}</span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">
                                {item.service?.name}
                            </span>
                        </div>
                    </div>
                </div>
                <Badge className={`text-[8px] font-black px-2 h-4 tracking-tighter rounded-md border-none ${
                    item.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-600' : 
                    item.status === 'In Progress' ? 'bg-blue-500/10 text-blue-600' : 
                    item.status === 'On Hold' ? 'bg-orange-500/10 text-orange-600' : 
                    item.status === 'Reworking' ? 'bg-rose-500/10 text-rose-600' : 
                    item.status === 'Assigned' ? 'bg-indigo-500/10 text-indigo-600' : 
                    'bg-slate-100 text-slate-500'
                }`}>
                    {item.status.toUpperCase()}
                </Badge>
            </div>

            <div className="space-y-5 pt-1">
                <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Progression</span>
                        <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-full">{item.completion_percentage}%</span>
                    </div>
                    <div className="relative pt-1 pb-2">
                        <Slider
                            value={[item.completion_percentage || 0]}
                            max={100}
                            step={5}
                            onValueChange={(val) => handleProgressChange(val[0])}
                            className="w-full"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 items-end">
                    <div className="space-y-1.5">
                        <Label className="text-[8px] font-bold uppercase tracking-widest text-slate-400 ml-1">Technician</Label>
                        <Select
                            value={item.technician_id?.toString() || "null"}
                            onValueChange={(val) => {
                                const newTech = val === "null" ? null : parseInt(val);
                                const newStatus = newTech && item.status === 'Pending' ? 'Assigned' : (!newTech && item.status === 'Assigned' ? 'Pending' : item.status);
                                onUpdate(item.id, { technician_id: newTech, status: newStatus });
                            }}
                        >
                            <SelectTrigger className="h-9 text-[9px] font-bold uppercase tracking-widest bg-slate-50/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 rounded-xl">
                                <SelectValue placeholder="UNASSIGNED" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl shadow-2xl border-slate-100 dark:border-slate-800">
                                <SelectItem value="null" className="text-[9px] font-bold text-slate-400">UNASSIGN</SelectItem>
                                {employees.map((e: any) => (
                                    <SelectItem key={e.id} value={e.id.toString()} className="text-[9px] font-bold uppercase tracking-widest">{e.full_name || e.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[8px] font-bold uppercase tracking-widest text-slate-400 ml-1">Status</Label>
                        <Select
                            value={item.status}
                            onValueChange={(val) => onUpdate(item.id, { status: val })}
                        >
                            <SelectTrigger className={`h-9 text-[9px] font-bold uppercase tracking-widest rounded-xl transition-all duration-300 border-none ${
                                item.status === 'Completed' 
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                                : item.status === 'In Progress'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                : item.status === 'On Hold'
                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                                : item.status === 'Reworking'
                                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                                : item.status === 'Assigned'
                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl shadow-2xl border-slate-100 dark:border-slate-800">
                                <SelectItem value="Pending" className="text-[9px] font-bold uppercase tracking-widest">Pending</SelectItem>
                                <SelectItem value="Assigned" className="text-[9px] font-bold uppercase tracking-widest text-indigo-500">Assigned</SelectItem>
                                <SelectItem value="In Progress" className="text-[9px] font-bold uppercase tracking-widest text-blue-500">In Progress</SelectItem>
                                <SelectItem value="On Hold" className="text-[9px] font-bold uppercase tracking-widest text-orange-500">On Hold</SelectItem>
                                <SelectItem value="Reworking" className="text-[9px] font-bold uppercase tracking-widest text-rose-500">Reworking</SelectItem>
                                <SelectItem value="Completed" className="text-[9px] font-bold uppercase tracking-widest text-emerald-500">Completed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProgressUpdateDialog: React.FC<ProgressUpdateDialogProps> = ({ isOpen, setIsOpen, jobId, onSave }) => {
    const { data: job, isLoading, refetch } = useJobCard(jobId);
    const { data: employees = [] } = useTechnicians();
    const updateItemMutation = useUpdateJobCardItem();
    
    const [localItems, setLocalItems] = useState<any[]>([]);
    const [isDirty, setIsDirty] = useState(false);
    const [stockDeductOpen, setStockDeductOpen] = useState(false);

    useEffect(() => {
        if (job) {
            setLocalItems(job.items || []);
            setIsDirty(false);
        }
    }, [job]);

    const handleUpdateItemLocal = (itemId: number, updates: any) => {
        setLocalItems(prev => prev.map(i => i.id === itemId ? { ...i, ...updates } : i));
        setIsDirty(true);
    };

    const saveChanges = async () => {
        try {
            const changedItems = localItems.filter(li => {
                const original = job.items.find((i: any) => i.id === li.id);
                return JSON.stringify({
                    technician_id: original.technician_id,
                    status: original.status,
                    completion_percentage: original.completion_percentage
                }) !== JSON.stringify({
                    technician_id: li.technician_id,
                    status: li.status,
                    completion_percentage: li.completion_percentage
                });
            });

            await Promise.all(changedItems.map(li => updateItemMutation.mutateAsync({
                itemId: li.id,
                updates: {
                    technician_id: li.technician_id,
                    status: li.status,
                    completion_percentage: li.completion_percentage
                }
            })));

            setIsDirty(false);
            toast.success('Progress updated successfully');
            refetch();
            onSave?.();
        } catch (error) {
            toast.error('Failed to update progress');
        }
    };

    if (isLoading && !job) return null;

    const itemsBySide = {
        Left: localItems.filter((i: any) => i.part?.side === 'Left') || [],
        Main: localItems.filter((i: any) => !i.part?.side || i.part?.side === 'Main' || i.part?.side === 'Center') || [],
        Right: localItems.filter((i: any) => i.part?.side === 'Right') || []
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-[95vw] w-[1400px] p-0 overflow-hidden border-none bg-white dark:bg-gray-950 shadow-2xl rounded-3xl animate-in fade-in zoom-in-95 duration-300">
                    <DialogHeader className="p-6 border-b dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-inner">
                                <IconTools size={24} className="animate-pulse" />
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <DialogTitle className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
                                        Workshop Terminal
                                    </DialogTitle>
                                    <Badge variant="outline" className="text-[10px] font-black uppercase border-primary/30 text-primary tracking-widest px-3 h-5 bg-primary/5">
                                        JOB ID: {job?.job_no}
                                    </Badge>
                                </div>
                                <DialogDescription className="text-xs text-slate-400 tracking-wider flex items-center gap-2 uppercase font-bold">
                                    {job?.vehicle?.plate_number} 
                                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                                    {job?.customer?.name}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <ScrollArea className="max-h-[70vh]">
                        <div className="p-6 space-y-10">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <SideColumn 
                                    title="Left Side" 
                                    items={itemsBySide.Left} 
                                    employees={employees} 
                                    onUpdate={handleUpdateItemLocal} 
                                    accentColor="amber"
                                />
                                <SideColumn 
                                    title="Main / Center" 
                                    items={itemsBySide.Main} 
                                    employees={employees} 
                                    onUpdate={handleUpdateItemLocal} 
                                    accentColor="primary"
                                />
                                <SideColumn 
                                    title="Right Side" 
                                    items={itemsBySide.Right} 
                                    employees={employees} 
                                    onUpdate={handleUpdateItemLocal} 
                                    accentColor="emerald"
                                />
                            </div>
                        </div>
                    </ScrollArea>

                    <DialogFooter className="p-6 bg-gray-50/50 dark:bg-gray-900/50 border-t dark:border-gray-800 shrink-0">
                        <Button 
                            onClick={saveChanges}
                            disabled={!isDirty || updateItemMutation.isPending}
                            className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg shadow-xl shadow-primary/20 flex items-center justify-between px-8 group transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:pointer-events-none"
                        >
                            <div className="flex flex-col items-start gap-0.5">
                                <span className="text-sm tracking-tight uppercase">Commit Workshop Progress</span>
                                <span className="text-[8px] font-bold text-white/60 tracking-widest leading-none uppercase">
                                    {isDirty ? 'Update current job manifest' : 'Manifest is synchronized'}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-[1px] h-6 bg-white/20" />
                                {updateItemMutation.isPending ? (
                                    <IconLoader2 size={20} className="animate-spin" />
                                ) : (
                                    <IconCheck size={20} className="transition-transform duration-500" stroke={3} />
                                )}
                            </div>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <StockDeductDialog 
                isOpen={stockDeductOpen} 
                setIsOpen={setStockDeductOpen} 
                jobId={jobId} 
                onSave={refetch}
            />
        </>
    );
};

export default ProgressUpdateDialog;
