import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    IconAlertTriangle, 
    IconUserCircle, 
    IconEye, 
    IconHistory, 
    IconStarFilled, 
    IconLoader2, 
    IconX, 
    IconTools, 
    IconUserExclamation,
    IconSearch,
    IconCalendar,
    IconFileExport,
    IconDotsVertical,
    IconMessageDots,
    IconRepeat,
    IconCircleCheck,
    IconBuildingStore,
    IconRefresh
} from '@tabler/icons-react';
import { toast } from 'sonner';
import TableSkeleton from '@/components/ui/TableSkeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import FilterBar from '@/components/ui/FilterBar';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import HighlightText from '@/components/ui/HighlightText';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { useJobCardDamages, useReplacementTypes } from '@/hooks/useJobCardData';
import { useHREmployees } from '@/hooks/useHRData';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Card, CardContent } from '@/components/ui/card';
import { ActionButton } from '@/components/ui/ActionButtons';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface DamageRecord {
    id: number;
    job_card_id: number;
    job_card?: {
        job_no: string;
        customer?: { name: string };
        branch?: { name: string };
    };
    job_card_item?: {
        part?: { name: string };
    };
    qc_report?: {
        qc_person?: { full_name: string; name?: string; employee_id?: string | number };
    };
    reason?: { name: string; id: number };
    mistake_staff_names: string[];
    rework_staff_names: string[];
    rating: number;
    notes: string;
    status: string;
    created_at: string;
}

const DamageReportsIndex = () => {
    const queryClient = useQueryClient();
    
    // Pagination & Filters
    const [search, setSearch] = useState('');
    const [mistakeStaffId, setMistakeStaffId] = useState<string | null>(null);
    const [reasonId, setReasonId] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(15);

    // External Data
    const { data: employeesData } = useHREmployees({ all: true });
    const employees = Array.isArray(employeesData) ? employeesData : (employeesData?.data || []);
    const { data: replacementTypesData = [] } = useReplacementTypes({ all: true });
    const replacementTypes = Array.isArray(replacementTypesData) ? replacementTypesData : (replacementTypesData?.data || []);

    // Damages query
    const { data: damagesData, isLoading: loading, refetch } = useJobCardDamages({
        page: currentPage,
        per_page: perPage,
        search,
        mistake_staff_id: mistakeStaffId,
        reason_id: reasonId,
        start_date: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : null,
        end_date: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : null,
    });

    const damages = damagesData?.data || [];
    const totalItems = damagesData?.total || 0;
    const totalPages = damagesData?.last_page || 1;

    const [selectedDamage, setSelectedDamage] = useState<DamageRecord | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, mistakeStaffId, reasonId, dateRange]);

    const formatDate = (dateString: string) => {
        return format(new Date(dateString), 'MMM dd, yyyy · hh:mm a');
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <IconStarFilled 
                        key={star} 
                        size={14} 
                        className={star <= rating ? "text-amber-400" : "text-slate-200 dark:text-zinc-800"} 
                    />
                ))}
            </div>
        );
    };

    const clearFilters = () => {
        setSearch('');
        setMistakeStaffId(null);
        setReasonId(null);
        setDateRange(undefined);
    };

    const handleExportCsv = () => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (mistakeStaffId) params.append('mistake_staff_id', mistakeStaffId);
        if (reasonId) params.append('reason_id', reasonId);
        if (dateRange?.from) params.append('start_date', format(dateRange.from, 'yyyy-MM-dd'));
        if (dateRange?.to) params.append('end_date', format(dateRange.to, 'yyyy-MM-dd'));

        window.open(`/api/services/job-cards/damages/export?${params.toString()}`, '_blank');
    };

    const hasActiveFilters = !!mistakeStaffId || !!reasonId || !!dateRange;

    return (
        <div className="space-y-6 pb-20">
            <FilterBar
                icon={<IconAlertTriangle className="size-6 text-rose-500" />}
                title="Damage & Accountability"
                description="Technical failure analysis and technician performance audit"
                search={search}
                setSearch={setSearch}
                onRefresh={async () => { await refetch(); }}
                itemsPerPage={perPage}
                setItemsPerPage={setPerPage}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={clearFilters}
                onExport={handleExportCsv}
            >
                <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Mistake By</span>
                    <SearchableSelect
                        options={[
                            { label: 'All Staff', value: 'all' },
                            ...employees.map((e: any) => ({ label: e.full_name, value: String(e.id) })),
                        ]}
                        value={mistakeStaffId || 'all'}
                        onChange={(val) => setMistakeStaffId(val === 'all' ? null : String(val))}
                        placeholder="All Staff"
                    />
                </div>

                <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Reason</span>
                    <SearchableSelect
                        options={[
                            { label: 'All Reasons', value: 'all' },
                            ...replacementTypes.map((rt: any) => ({ label: rt.name, value: String(rt.id) })),
                        ]}
                        value={reasonId || 'all'}
                        onChange={(val) => setReasonId(val === 'all' ? null : String(val))}
                        placeholder="All Reasons"
                    />
                </div>

                <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Date Range</span>
                    <DateRangePicker value={dateRange} onChange={setDateRange} className="w-full h-10" />
                </div>
            </FilterBar>

            <Card className="border-none shadow-sm shadow-black/5 dark:bg-zinc-900/50 overflow-hidden">
                {loading ? (
                    <TableSkeleton columns={7} rows={8} />
                ) : damages.length === 0 ? (
                    <EmptyState
                        isSearch={!!search || hasActiveFilters}
                        searchTerm={search}
                        title={search || hasActiveFilters ? 'No incidents found' : 'No recorded damages'}
                        description="Clear filters to see all incident history."
                        onClearFilter={clearFilters}
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800">
                                    <TableHead className="w-[50px] px-8 py-5 text-[10px] font-black uppercase tracking-widest text-center">#</TableHead>
                                    <TableHead className="w-[180px] px-8 py-5 text-[10px] font-black uppercase tracking-widest">Case / Customer</TableHead>
                                    <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Component</TableHead>
                                    <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-rose-500">Mistake Liability</TableHead>
                                    <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-blue-500">Rework Team</TableHead>
                                    <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Incident Date</TableHead>
                                    <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {damages.map((record: DamageRecord, index: number) => (
                                    <TableRow 
                                        key={record.id} 
                                        className="group hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 cursor-pointer border-zinc-100 dark:border-zinc-800"
                                        onClick={() => { setSelectedDamage(record); setIsDetailsOpen(true); }}
                                    >
                                        <TableCell className="px-8 py-6 text-center font-bold text-xs text-muted-foreground/30">
                                            {(currentPage - 1) * perPage + index + 1}
                                        </TableCell>
                                        <TableCell className="px-8 py-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-black text-sm tracking-tighter uppercase">
                                                    <HighlightText text={`#${record.job_card?.job_no}`} highlight={search} />
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[140px]">
                                                    {record.job_card?.customer?.name}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-8 py-6">
                                            <div className="flex flex-col gap-1">
                                                <Badge variant="outline" className="w-fit h-5 px-1.5 font-black text-[9px] uppercase tracking-widest border-dashed">
                                                    {record.job_card_item?.part?.name || '---'}
                                                </Badge>
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/60 uppercase">
                                                    <IconAlertTriangle size={12} className="text-rose-500" />
                                                    {record.reason?.name || 'Failure'}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-8 py-6">
                                            <div className="flex flex-wrap gap-1.5 max-w-[180px]">
                                                {record.mistake_staff_names.map((name, i) => (
                                                    <div key={i} className="flex items-center gap-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-1 rounded-lg ring-1 ring-rose-500/20">
                                                        <IconUserExclamation size={10} />
                                                        <span className="text-[10px] font-black uppercase tracking-tight">{name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-8 py-6">
                                            <div className="flex flex-wrap gap-1.5 max-w-[180px]">
                                                {record.rework_staff_names.map((name, i) => (
                                                    <div key={i} className="flex items-center gap-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-lg ring-1 ring-blue-500/20">
                                                        <IconTools size={10} />
                                                        <span className="text-[10px] font-black uppercase tracking-tight">{name}</span>
                                                    </div>
                                                ))}
                                                {record.rework_staff_names.length === 0 && (
                                                    <Badge variant="outline" className="h-5 px-2 text-[9px] font-black text-slate-400 uppercase tracking-widest italic border-slate-200">
                                                        Pending Assignment
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-8 py-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-black tracking-tight">{format(new Date(record.created_at), 'MMM dd, yyyy')}</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">{format(new Date(record.created_at), 'hh:mm a')}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-8 py-6 text-right">
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <ActionButton
                                                    icon={IconEye}
                                                    label="Incident Profile"
                                                    onClick={() => { setSelectedDamage(record); setIsDetailsOpen(true); }}
                                                    style="text-primary hover:bg-primary/10"
                                                    size="lg"
                                                    variant="rounded"
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </Card>

            {!loading && totalPages > 1 && (
                <div className="mt-8">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        itemsPerPage={perPage}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            {/* Detailed Damage Report Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-xl flex flex-col p-0 border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white dark:bg-zinc-950 ring-1 ring-black/5">
                    <DialogHeader className="shrink-0 px-8 py-10 bg-rose-600 text-white border-0 relative overflow-hidden transition-colors">
                        {/* Vector Decals */}
                        <div className="absolute -right-16 -top-16 size-48 bg-white/10 rounded-full blur-3xl" />
                        <div className="absolute -left-10 -bottom-10 size-32 bg-black/10 rounded-full blur-2xl font-black text-[120px] select-none pointer-events-none flex items-center justify-center opacity-20">
                          X
                        </div>

                        <button
                            onClick={() => setIsDetailsOpen(false)}
                            className="absolute right-6 top-6 size-10 rounded-xl bg-black/10 hover:bg-black/20 text-white flex items-center justify-center transition-all z-20 group"
                        >
                            <IconX size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                        </button>
                        
                        <div className="flex flex-col gap-4 relative z-10">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-70">Technician Accountability</span>
                                <DialogTitle className="text-4xl font-black tracking-tighter uppercase leading-none drop-shadow-sm">Incident Profile</DialogTitle>
                                <DialogDescription className="text-white/70 font-bold text-[10px] uppercase tracking-widest mt-1">Detailed forensic breakdown of technical failure event.</DialogDescription>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-xl ring-1 ring-white/30 text-[11px] font-black uppercase tracking-tighter">
                                   Case #{selectedDamage?.job_card?.job_no}
                                </div>
                                <div className="h-px w-8 bg-white/20" />
                                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase opacity-60">
                                   <IconCalendar size={14} />
                                   {selectedDamage && format(new Date(selectedDamage.created_at), 'PPP')}
                                </div>
                            </div>
                        </div>
                    </DialogHeader>
                    
                    <PerfectScrollbar options={{ suppressScrollX: true }} className="flex-1 min-h-[400px] max-h-[70vh]">
                        <div className="p-10 bg-zinc-50/50 dark:bg-zinc-950 space-y-10">
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="border-none bg-white dark:bg-zinc-900 shadow-sm shadow-black/5 rounded-[2rem] p-6 group transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center border border-rose-500/20 shadow-inner group-hover:bg-rose-500 group-hover:text-white transition-all">
                                            <IconUserExclamation size={24} />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Mistake Liability</span>
                                            <div className="flex flex-wrap gap-1">
                                                {selectedDamage?.mistake_staff_names.map((name, i) => (
                                                    <span key={i} className="font-black text-sm uppercase tracking-tighter truncate leading-none">{name}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="border-none bg-white dark:bg-zinc-900 shadow-sm shadow-black/5 rounded-[2rem] p-6 group transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center border border-blue-500/20 shadow-inner group-hover:bg-blue-500 group-hover:text-white transition-all">
                                            <IconTools size={24} />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Assigned Remediation</span>
                                            <div className="flex flex-wrap gap-1">
                                                {selectedDamage?.rework_staff_names.map((name, i) => (
                                                    <span key={i} className="font-black text-sm uppercase tracking-tighter truncate leading-none">{name}</span>
                                                ))}
                                                {selectedDamage?.rework_staff_names.length === 0 && <span className="font-black text-xs text-slate-400 italic">No staff assigned</span>}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                   <div className="size-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-black italic text-xs shadow-lg">E</div>
                                   <h3 className="text-xl font-black tracking-tighter uppercase">Incident Intelligence</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                                            <IconBuildingStore size={12} /> Workshop Component
                                        </Label>
                                        <p className="text-base font-black uppercase tracking-tight text-zinc-800 dark:text-zinc-200">{selectedDamage?.job_card_item?.part?.name || 'Unknown System'}</p>
                                        <div className="h-0.5 w-12 bg-primary/20 rounded-full" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                                            <IconUserCircle size={12} /> Audit Authority (QC)
                                        </Label>
                                        <p className="text-base font-black uppercase tracking-tight text-zinc-800 dark:text-zinc-200">{selectedDamage?.qc_report?.qc_person?.full_name || 'System Auto'}</p>
                                        <div className="h-0.5 w-12 bg-emerald-500/20 rounded-full" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-rose-400 flex items-center gap-1.5">
                                            <IconAlertTriangle size={12} /> Failure Classification
                                        </Label>
                                        <Badge variant="destructive" className="h-6 px-3 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 ring-1 ring-rose-500/30">
                                            {selectedDamage?.reason?.name || 'Material Conflict'}
                                        </Badge>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                                            <IconStarFilled size={12} /> Component QC Rating
                                        </Label>
                                        <div className="flex items-center gap-2">
                                           {renderStars(selectedDamage?.rating || 1)}
                                           <span className="text-xs font-black text-amber-500/60 font-mono tracking-tighter italic">({selectedDamage?.rating}/5)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-6">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Technical Context & Observations</Label>
                                    <IconMessageDots size={18} className="text-zinc-300 dark:text-zinc-700" />
                                </div>
                                <div className="relative p-8 rounded-[2rem] bg-zinc-900 shadow-2xl overflow-hidden group">
                                    {/* Watermark */}
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
                                       <IconAlertTriangle size={120} />
                                    </div>
                                    <div className="relative z-10">
                                        <span className="block text-[8px] font-black text-primary uppercase tracking-[0.5em] mb-4">Master Audit Log</span>
                                        <p className="text-sm font-bold leading-relaxed italic text-white/90 font-serif">
                                            "{selectedDamage?.notes || "No additional forensic observations were recorded for this specific technical failure incident."}"
                                        </p>
                                        <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Incident Timestamp</span>
                                                <span className="text-[10px] font-mono text-white/60 uppercase">{selectedDamage && format(new Date(selectedDamage.created_at), 'HH:mm:ss · yyyy-MM-dd')}</span>
                                            </div>
                                            <IconHistory size={24} className="text-white/10" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </PerfectScrollbar>

                    <div className="shrink-0 p-8 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4 text-muted-foreground font-black text-[10px] uppercase tracking-tighter">
                          <span className="opacity-50">Incident Hash</span>
                          <span className="px-2 py-1 bg-white dark:bg-zinc-900 rounded-lg ring-1 ring-black/5 select-all hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">#{selectedDamage?.id}</span>
                        </div>
                        
                        <div className="flex items-center gap-3 w-full md:w-auto">
                           <Button variant="outline" className="flex-1 md:flex-none h-12 px-8 rounded-2xl gap-2 font-black uppercase text-xs tracking-widest border-2 hover:bg-zinc-100 transition-all active:scale-95 duration-200">
                              <IconRefresh size={18} /> Flag for Review
                           </Button>
                           <Button className="flex-1 md:flex-none h-12 px-10 rounded-2xl gap-2 font-black uppercase text-xs tracking-[0.15em] bg-zinc-900 hover:bg-zinc-800 text-white shadow-xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
                              <IconFileExport size={18} /> Export Profile
                           </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default DamageReportsIndex;
