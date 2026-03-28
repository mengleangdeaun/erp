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
                icon={<IconAlertTriangle className="size-6 text-primary" />}
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
  <DialogContent className="max-w-xl max-h-[85vh] h-auto p-0 flex flex-col overflow-hidden [&>button]:hidden">
    {/* Custom close button */}
    <button
      onClick={() => setIsDetailsOpen(false)}
      className="absolute right-4 top-4 z-50 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      <IconX className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </button>

    {/* Header with destructive background */}
    <div className="shrink-0 p-6 bg-destructive/10 text-destructive border-b">
      <div className="flex flex-col gap-4">
        <div className="space-y-1">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Technician Accountability
          </span>
          <DialogTitle className="text-2xl font-semibold tracking-tight uppercase">
            Incident Profile
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Detailed forensic breakdown of technical failure event.
          </DialogDescription>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Badge variant="outline" className="border-destructive/30 bg-destructive/5">
            Case #{selectedDamage?.job_card?.job_no}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <IconCalendar size={12} />
            <span>{selectedDamage && format(new Date(selectedDamage.created_at), 'PPP')}</span>
          </div>
        </div>
      </div>
    </div>

    <PerfectScrollbar options={{ suppressScrollX: true }} className="flex-1">
      <div className="p-6 py-3 space-y-6">
        {/* Staff cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <IconUserExclamation size={20} />
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground uppercase">Mistake Liability</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedDamage?.mistake_staff_names?.map((name: string, i: number) => (
                    <span key={i} className="text-sm font-semibold uppercase">{name}</span>
                  ))}
                  {(!selectedDamage?.mistake_staff_names || selectedDamage.mistake_staff_names.length === 0) && (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <IconTools size={20} />
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground uppercase">Assigned Remediation</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedDamage?.rework_staff_names?.map((name: string, i: number) => (
                    <span key={i} className="text-sm font-semibold uppercase">{name}</span>
                  ))}
                  {(!selectedDamage?.rework_staff_names || selectedDamage.rework_staff_names.length === 0) && (
                    <span className="text-sm text-muted-foreground">No staff assigned</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Incident Intelligence */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold">
              E
            </div>
            <h3 className="text-base font-semibold uppercase">Damage Log</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <IconBuildingStore size={12} /> Workshop Component
              </Label>
              <p className="font-semibold">{selectedDamage?.job_card_item?.part?.name || 'Unknown System'}</p>
              <div className="h-px w-12 bg-border" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <IconUserCircle size={12} /> Audit Authority (QC)
              </Label>
              <p className="font-semibold">{selectedDamage?.qc_report?.qc_person?.full_name || 'System Auto'}</p>
              <div className="h-px w-12 bg-border" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <IconAlertTriangle size={12} /> Failure Classification
              </Label>
              <Badge variant="destructive" className="text-[10px] uppercase">
                {selectedDamage?.reason?.name || 'Material Conflict'}
              </Badge>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <IconStarFilled size={12} /> Component QC Rating
              </Label>
              <div className="flex items-center gap-2">
                {renderStars(selectedDamage?.rating || 1)}
                <span className="text-xs text-muted-foreground">({selectedDamage?.rating}/5)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Context */}
        <div className="border-t pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground uppercase">
              Technical Context & Observations
            </Label>
            <IconMessageDots size={16} className="text-muted-foreground" />
          </div>
          <Card className="bg-muted/30">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  Master Audit Log
                </span>
                <p className="text-sm italic leading-relaxed">
                  "{selectedDamage?.notes || "No additional forensic observations were recorded for this specific technical failure incident."}"
                </p>
              </div>
              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  <div className="text-[10px] font-medium text-muted-foreground uppercase">Incident Timestamp</div>
                  <div className="text-xs font-mono">
                    {selectedDamage && format(new Date(selectedDamage.created_at), 'HH:mm:ss · yyyy-MM-dd')}
                  </div>
                </div>
                <IconHistory size={20} className="text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PerfectScrollbar>

    {/* Footer */}
    <div className="shrink-0 p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium">Incident Hash:</span>
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">#{selectedDamage?.id}</code>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          <IconRefresh size={16} className="mr-2" /> Flag for Review
        </Button>
        <Button size="sm">
          <IconFileExport size={16} className="mr-2" /> Export Profile
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
        </div>
    );
};

export default DamageReportsIndex;
