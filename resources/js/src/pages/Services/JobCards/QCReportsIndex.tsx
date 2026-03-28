import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  IconChecks,
  IconEye,
  IconStarFilled,
  IconLoader2,
  IconX,
  IconSearch,
  IconAlertTriangle,
  IconTrendingUp,
  IconMessageDots,
  IconCalendar,
  IconBuildingStore,
  IconUserCheck,
  IconDotsVertical,
  IconFileExport,
  IconCircleCheck,
  IconRefresh,
  IconTrash,
  IconExternalLink,
  IconRepeat,
  IconHistory,
  IconArchive,
  IconArchiveOff,
  IconArrowsRightLeft,
  IconTrendingDown,
} from '@tabler/icons-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { toast } from 'sonner';
import TableSkeleton from '@/components/ui/TableSkeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import FilterBar from '@/components/ui/FilterBar';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import HighlightText from '@/components/ui/HighlightText';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { useJobCardQCReports, useArchiveQCReport, useUnarchiveQCReport, useBulkArchiveQCReport, useBulkUnarchiveQCReport } from '@/hooks/useJobCardData';
import { useHRBranches, useHREmployees } from '@/hooks/useHRData';
import { Checkbox } from '@/components/ui/checkbox';
import ConfirmationModal from '@/components/ConfirmationModal';
import { NoMessageIllustration } from '@/components/illustrations/NoMessage';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface QCReport {
  id: number;
  job_card_id: number;
  job_card?: {
    job_no: string;
    customer?: { name: string };
    lead_technician?: { full_name: string };
    branch?: { name: string };
  };
  qc_person?: { full_name: string; name?: string; employee_id?: string | number };
  rework_technician?: { full_name: string; name?: string; employee_id?: string | number };
  decision: 'PASS' | 'FAIL';
  rating: number;
  damages: any[];
  item_evaluations: any;
  is_archived: boolean;
  qc_items?: Array<{
    id: number;
    job_card_item?: { part?: { name: string } };
    rating: number;
    status: 'PASS' | 'FAIL';
    replacement_type?: { name: string };
    rework_technician?: { full_name: string; name?: string; employee_id?: string | number };
    notes: string;
  }>;
  notes: string;
  created_at: string;
}

const QCReportsIndex = () => {
  const queryClient = useQueryClient();

  // Filters State
  const [search, setSearch] = useState('');
  const [branchId, setBranchId] = useState<string | null>(null);
  const [qcPersonId, setQCPersonId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [showArchived, setShowArchived] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [noteToView, setNoteToView] = useState<string | null>(null);
  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);

  // External Data
  const { data: branches = [] } = useHRBranches();
  const { data: employeesData } = useHREmployees({ all: true });
  const employees = Array.isArray(employeesData) ? employeesData : (employeesData?.data || []);

  const filteredReviewers = useMemo(() => {
    if (!branchId || branchId === 'all') return employees;
    return employees.filter((e: any) => String(e.branch_id) === String(branchId));
  }, [employees, branchId]);

  // Reports query
  const { data: qcData, isLoading: loading, refetch } = useJobCardQCReports({
    page: currentPage,
    per_page: perPage,
    search,
    branch_id: branchId,
    qc_person_id: qcPersonId,
    start_date: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : null,
    end_date: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : null,
    archived: showArchived,
  });

  const reports = qcData?.data || [];
  const stats = qcData?.stats || { total_failures: 0, avg_rating: 0, rework_tasks: 0, total_audits: 0 };
  const totalItems = qcData?.total || 0;
  const totalPages = qcData?.last_page || 1;

  const archiveQC = useArchiveQCReport();
  const unarchiveQC = useUnarchiveQCReport();
  const bulkArchiveQC = useBulkArchiveQCReport();
  const bulkUnarchiveQC = useBulkUnarchiveQCReport();

  const [selectedReport, setSelectedReport] = useState<QCReport | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [search, branchId, qcPersonId, dateRange, showArchived]);

  const formatDateLabel = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy · hh:mm a');
  };

  const getDecisionBadge = (decision: string) => {
    const isPass = decision === 'PASS';
    return (
      <Badge 
        variant={isPass ? 'success' : 'destructive'} 
        dot 
        className="h-6 px-2.5 font-black text-[10px]"
      >
        {decision}
      </Badge>
    );
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <IconStarFilled
            key={star}
            size={12}
            className={star <= rating ? 'text-amber-400' : 'text-slate-200 dark:text-zinc-800'}
          />
        ))}
      </div>
    );
  };

  const clearFilters = () => {
    setSearch('');
    setBranchId(null);
    setQCPersonId(null);
    setDateRange(undefined);
    setShowArchived(false);
  };


  

  const hasActiveFilters = !!branchId || !!qcPersonId || !!dateRange || showArchived;

  const passRate = stats.total_audits > 0 
    ? Math.round(((stats.total_audits - stats.total_failures) / stats.total_audits) * 100) 
    : 0;

  const getPassRateConfig = (rate: number) => {
    if (rate >= 80) return { icon: IconTrendingUp, color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-950' };
    if (rate >= 50) return { icon: IconArrowsRightLeft, color: 'text-amber-500 bg-amber-100 dark:bg-amber-950' };
    return { icon: IconTrendingDown, color: 'text-rose-500 bg-rose-100 dark:bg-rose-950' };
  };

  const passRateConfig = getPassRateConfig(passRate);

  const STAT_CONFIG = [
    {
      label: 'Pass Rate',
      value: `${passRate}%`,
      sub: 'Quality score',
      icon: passRateConfig.icon,
      barValue: passRate,
      iconBg: 'bg-emerald-100 dark:bg-emerald-950',
      iconText: passRateConfig.color,
      barColor: 'bg-emerald-500',
    },
    {
      label: 'Avg Rating',
      value: stats.avg_rating,
      sub: 'QC rating',
      icon: IconStarFilled,
      barValue: (stats.avg_rating / 5) * 100,
      iconBg: 'bg-amber-100 dark:bg-amber-950',
      iconText: 'text-amber-700 dark:text-amber-300',
      barColor: 'bg-amber-500',
    },
    {
      label: 'Failed Checks',
      value: stats.total_failures,
      sub: 'Rework required',
      icon: IconAlertTriangle,
      barValue: stats.total_audits ? (stats.total_failures / stats.total_audits) * 100 : 0,
      iconBg: 'bg-rose-100 dark:bg-rose-950',
      iconText: 'text-rose-700 dark:text-rose-300',
      barColor: 'bg-rose-500',
    },
    {
      label: 'Total Audits',
      value: stats.total_audits,
      sub: 'Performed checks',
      icon: IconCircleCheck,
      barValue: 0, // No progression
      iconBg: 'bg-blue-100 dark:bg-blue-950',
      iconText: 'text-blue-700 dark:text-blue-300',
      barColor: 'bg-blue-500',
    },
  ];

  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (branchId) params.append('branch_id', branchId.toString());
    if (qcPersonId) params.append('qc_person_id', qcPersonId.toString());
    if (dateRange?.from) params.append('start_date', format(dateRange.from, 'yyyy-MM-dd'));
    if (dateRange?.to) params.append('end_date', format(dateRange.to, 'yyyy-MM-dd'));
    if (showArchived) params.append('archived', 'true');

    window.open(`/api/services/job-cards/qc/export?${params.toString()}`, '_blank');
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === reports.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(reports.map((r: any) => r.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkAction = () => {
    setIsBulkConfirmOpen(true);
  };

  const executeBulkAction = () => {
    if (showArchived) {
      bulkUnarchiveQC.mutate(selectedIds, {
        onSuccess: () => {
          setSelectedIds([]);
          setIsBulkConfirmOpen(false);
        }
      });
    } else {
      bulkArchiveQC.mutate(selectedIds, {
        onSuccess: () => {
          setSelectedIds([]);
          setIsBulkConfirmOpen(false);
        }
      });
    }
  };



  return (
    <div className="space-y-6 pb-20">
      <FilterBar
        icon={<IconChecks className="size-6 text-primary" />}
        title="QC Audit Reports"
        description="Monitor workshop performance and quality assurance standards"
        search={search}
        setSearch={setSearch}
        onRefresh={async () => { await refetch(); }}
        itemsPerPage={perPage}
        setItemsPerPage={setPerPage}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        onExport={handleExportCsv}
        extraActions={
          <Button 
            size="sm" 
            variant={showArchived ? "default" : "outline"}
            className={cn(
              "h-9 sm:h-10 px-4 font-black text-[10px] uppercase tracking-[0.15em] gap-2 transition-all",
              showArchived ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white dark:bg-slate-900"
            )}
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? <IconArchiveOff size={16} /> : <IconArchive size={16} />}
            {showArchived ? "View Active" : "View Archive"}
          </Button>
        }
      >
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Branch</span>
          <SearchableSelect
            options={[
              { label: 'All Branches', value: 'all' },
              ...branches.map((b: any) => ({ label: b.name, value: String(b.id) })),
            ]}
            value={branchId || 'all'}
            onChange={(val) => setBranchId(val === 'all' ? null : String(val))}
            placeholder="All Branches"
          />
        </div>

        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">QC Reviewer</span>
          <SearchableSelect
            options={[
              { label: 'All Reviewers', value: 'all' },
              ...filteredReviewers.map((e: any) => ({ label: e.full_name, value: String(e.id) })),
            ]}
            value={qcPersonId || 'all'}
            onChange={(val) => setQCPersonId(val === 'all' ? null : String(val))}
            placeholder="All Reviewers"
          />
        </div>

        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Date Range</span>
          <DateRangePicker value={dateRange} onChange={setDateRange} className="w-full h-10" />
        </div>
      </FilterBar>

      

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {STAT_CONFIG.map((stat, i) => (
          <Card key={i} className="border shadow-none">
            <CardContent className="p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground mb-1">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-medium tracking-tight leading-none">
                    {stat.value}
                  </p>
                </div>
                <div className={cn('w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0', stat.iconBg, stat.iconText)}>
                  <stat.icon size={18} />
                </div>
              </div>

              {stat.barValue > 0 && (
                <div>
                  <div className="h-[3px] rounded-full bg-border overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', stat.barColor)}
                      style={{ width: `${Math.min(stat.barValue, 100)}%` }}
                    />
                  </div>
                </div>
              )}
              <p className="text-[12px] text-muted-foreground/70 mt-1.5">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Table Area */}
      <Card className="border-none shadow-sm shadow-black/5 dark:bg-zinc-900/50 overflow-hidden relative group">
        {/* Bulk Action Header Overlay */}
{selectedIds.length > 0 && (
  <div className="absolute top-0 left-0 right-0 z-20 animate-in fade-in slide-in-from-top-2 duration-300">
    <div className="dark:bg-dark bg-white px-6 py-3 flex items-center gap-4 shadow-lg">
      
      {/* Left actions */}
      <div className="flex items-center gap-3 border-r border-gray-200 dark:border-gray-800 pr-4">
        <Button 
          variant="ghost" 
          size="sm" 
          className="font-bold text-xs"
          onClick={() => setSelectedIds([])}
        >
          Cancel Selection
        </Button>

        <Button 
          size="sm" 
          className={cn(
            "h-9 px-6 font-black text-[10px] uppercase tracking-widest transition-all flex items-center",
            showArchived
              ? "bg-emerald-600 hover:bg-emerald-500 text-white"
              : "bg-amber-600 hover:bg-amber-500 text-white"
          )}
          onClick={handleBulkAction}
          disabled={bulkArchiveQC.isPending || bulkUnarchiveQC.isPending}
        >
          {showArchived ? (
            <IconRefresh size={14} className="mr-2" />
          ) : (
            <IconArchive size={14} className="mr-2" />
          )}
          {showArchived ? "Restore Submissions" : "Archive Submissions"}
        </Button>
      </div>

      {/* Right info with inline badge */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Reports Selected
        </span>

        <span className="inline-flex items-center justify-center p-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tabular-nums">
          {selectedIds.length}
        </span>
      </div>

    </div>
  </div>
)}
        {loading ? (
          <TableSkeleton columns={7} rows={8} />
        ) : reports.length === 0 ? (
          <EmptyState
            isSearch={!!search || !!branchId || !!qcPersonId || !!dateRange}
            searchTerm={search}
            title="No Records Found"
            description="Adjust your filters or auditing criteria to find specific QC reports."
            onClearFilter={clearFilters}
          />
        ) : (
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="w-[40px] pl-6 py-4">
                   <Checkbox 
                     checked={reports.length > 0 && selectedIds.length === reports.length}
                     onCheckedChange={toggleSelectAll}
                   />
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 w-[50px]">#</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest pl-4 py-4">Job Reference</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">QC Reviewer</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Branch</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 text-center">Decision</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 text-center">Rating</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Audit Date</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 pr-8 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report: QCReport, index: number) => (
                <TableRow 
                  key={report.id} 
                  className={cn(
                    "group hover:bg-muted/20 border-b border-muted/20 last:border-0 cursor-pointer transition-colors",
                    selectedIds.includes(report.id) && "bg-primary/5 hover:bg-primary/10"
                  )}
                  onClick={() => { setSelectedReport(report); setIsDetailsOpen(true); }}
                >
                  <TableCell className="pl-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <Checkbox 
                      checked={selectedIds.includes(report.id)}
                      onCheckedChange={() => toggleSelect(report.id)}
                    />
                  </TableCell>
                  <TableCell className="py-4 font-bold text-xs text-muted-foreground/50 w-[50px]">
                    {(currentPage - 1) * perPage + index + 1}
                  </TableCell>
                  <TableCell className="pl-4 py-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-primary text-sm">
                          #{report.job_card?.job_no}
                        </span>
                        <IconExternalLink size={10} className="opacity-0 group-hover:opacity-40 transition-opacity" />
                      </div>
                      <span className="text-[11px] font-bold text-muted-foreground/80 truncate max-w-[140px]">
                        {report.job_card?.customer?.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-[10px] border border-primary/20">
                        {report.qc_person?.full_name?.[0] || 'QC'}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold tracking-tight">
                          {report.qc_person?.full_name || 'Anonymous Auditor'}
                        </span>
                        <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-wider leading-none">
                          {report.qc_person?.employee_id ? `ID: ${report.qc_person.employee_id}` : 'Supervisor'}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-muted-foreground/80">
                      <IconBuildingStore size={14} className="opacity-50" />
                      <span className="truncate max-w-[120px]">
                        {report.job_card?.branch?.name || '---'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-center">
                    {getDecisionBadge(report.decision)}
                  </TableCell>
                  <TableCell className="py-4 text-center">
                    <div className="flex justify-center">
                      {renderStars(report.rating)}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">{format(new Date(report.created_at), 'dd MMM yyyy')}</span>
                      <span className="text-[10px] text-muted-foreground font-medium">{format(new Date(report.created_at), 'hh:mm a')}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 pr-8 text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-muted">
                          <IconDotsVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 p-1">
                        <DropdownMenuLabel className="text-[10px] font-black uppercase py-2 px-3 opacity-40">Report Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => { setSelectedReport(report); setIsDetailsOpen(true); }} className="gap-2.5 rounded-md cursor-pointer">
                          <IconEye size={16} /> <span className="font-bold text-xs">View Full Details</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setNoteToView(report.notes || "")} className="gap-2.5 rounded-md cursor-pointer">
                          <IconMessageDots size={16} /> <span className="font-bold text-xs">Internal Notes</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {report.is_archived ? (
                          <DropdownMenuItem 
                            onClick={() => unarchiveQC.mutate(report.id)} 
                            className="gap-2.5 rounded-md cursor-pointer text-emerald-600 focus:text-emerald-600 focus:bg-emerald-600/10"
                            disabled={unarchiveQC.isPending}
                          >
                            <IconRefresh size={16} className={cn((unarchiveQC.isPending && unarchiveQC.variables === report.id) && "animate-spin")} /> 
                            <span className="font-black text-xs">Restore from Archive</span>
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem 
                            onClick={() => archiveQC.mutate(report.id)} 
                            className="gap-2.5 rounded-md cursor-pointer text-amber-600 focus:text-amber-600 focus:bg-amber-600/10"
                            disabled={archiveQC.isPending}
                          >
                            <IconArchive size={16} className={cn((archiveQC.isPending && archiveQC.variables === report.id) && "animate-spin")} /> 
                            <span className="font-black text-xs">Move to Archive</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Pagination Container */}
      {!loading && totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={perPage}
            onPageChange={setCurrentPage}
          />
      )}


<Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
  <DialogContent className="max-w-5xl max-h-[90vh] h-auto p-0 flex flex-col overflow-hidden [&>button]:hidden">
    {/* Custom close button */}
    <button
      onClick={() => setIsDetailsOpen(false)}
      className="absolute right-4 top-4 z-50 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      <IconX className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </button>

    {/* Header with dynamic background */}
    <div
      className={cn(
        'shrink-0 p-6 border-b',
        selectedReport?.decision === 'PASS'
          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
          : 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium">
            <Badge variant="outline" className="border-current bg-transparent">
              Compliance Audit
            </Badge>
            <span className="h-4 w-px bg-border" />
            <span>REPORT #{selectedReport?.job_card?.job_no}</span>
          </div>
          <DialogTitle className="text-2xl font-semibold tracking-tight">
            {selectedReport?.job_card?.customer?.name || 'Walk-in Client'}
          </DialogTitle>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <IconBuildingStore size={14} />
              <span>{selectedReport?.job_card?.branch?.name || '---'}</span>
            </div>
            <div className="flex items-center gap-1">
              <IconCalendar size={14} />
              <span>{selectedReport && format(new Date(selectedReport.created_at), 'PPP')}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-medium text-muted-foreground uppercase">Final Status</div>
            <div className="flex items-center gap-2 mt-1">
              {selectedReport?.decision === 'PASS' ? (
                <IconCircleCheck size={20} className="text-emerald-500" />
              ) : (
                <IconAlertTriangle size={20} className="text-rose-500" />
              )}
              <span
                className={cn(
                  'text-2xl font-bold uppercase tracking-tight',
                  selectedReport?.decision === 'PASS' ? 'text-emerald-500' : 'text-rose-500'
                )}
              >
                {selectedReport?.decision}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <PerfectScrollbar options={{ suppressScrollX: true }} className="flex-1">
      <div className="p-6 py-3 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="text-xs font-medium text-muted-foreground uppercase">Inspection Team</div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  QC
                </div>
                <div>
                  <div className="font-semibold">{selectedReport?.qc_person?.full_name}</div>
                  <div className="text-xs text-muted-foreground">
                    SUPERVISOR • ID: {selectedReport?.qc_person?.employee_id}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="text-xs font-medium text-muted-foreground uppercase">Technical Rating</div>
              <div className="flex items-center gap-3">
                <div>
                  <div className="text-3xl font-bold text-amber-500">{selectedReport?.rating}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Score</div>
                </div>
                <div className="flex flex-col gap-1">
                  {renderStars(selectedReport?.rating)}
                  <span className="text-[10px] text-muted-foreground uppercase">Star certification</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="text-xs font-medium text-muted-foreground uppercase">Customer Relation</div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <IconUserCheck size={20} />
                </div>
                <div>
                  <div className="font-semibold truncate max-w-[200px]">
                    {selectedReport?.job_card?.customer?.name || 'Walk-in Client'}
                  </div>
                  <div className="text-xs text-muted-foreground">OWNER / REPRESENTATIVE</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Technical Performance Map */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold">
                A
              </div>
              <h3 className="text-base font-semibold">Technical Performance Map</h3>
            </div>
            <Badge variant="outline" className="text-xs">
              {selectedReport?.qc_items?.length || 0} Points Audited
            </Badge>
          </div>

          <div className="space-y-3">
            {(selectedReport?.qc_items || []).map((qcItem) => (
              <Card
                key={qcItem.id}
                className={cn(
                  'overflow-hidden transition-shadow',
                  qcItem.status === 'FAIL' && 'border-destructive/30 bg-destructive/5'
                )}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">
                          {qcItem.job_card_item?.part?.name || 'System Component'}
                        </span>
                        {qcItem.status === 'FAIL' ? (
                          <Badge variant="destructive" className="text-[10px] uppercase">
                            <IconRepeat size={10} className="mr-1" /> Rework Issued
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] uppercase text-emerald-600 border-emerald-500">
                            <IconCircleCheck size={10} className="mr-1" /> Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <div className="flex items-center gap-1">
                          {renderStars(qcItem.rating)}
                          <span className="text-xs text-muted-foreground ml-1">QC SCORE</span>
                        </div>
                        <span className="text-xs text-muted-foreground/50">ID: {qcItem.id}</span>
                      </div>
                    </div>
                    {qcItem.status === 'FAIL' && (
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-destructive text-xs font-medium">
                          <IconRepeat size={12} />
                          <span>{qcItem.replacement_type?.name || 'Standard Remediation'}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Assigned to: {qcItem.rework_technician?.full_name || 'TBD'}
                        </div>
                      </div>
                    )}
                  </div>
                  {qcItem.notes && (
                    <div className="mt-2 rounded-md bg-muted/30 p-3 text-sm">
                      <div className="flex gap-2">
                        <IconMessageDots size={14} className="text-muted-foreground mt-0.5" />
                        <div>
                          <div className="text-xs font-medium text-muted-foreground uppercase">Audit Observations</div>
                          <p className="text-sm">{qcItem.notes}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {(!selectedReport?.qc_items || selectedReport.qc_items.length === 0) && (
              <div className="py-12 text-center border border-dashed rounded-lg">
                <p className="text-sm text-muted-foreground">No audit items recorded.</p>
              </div>
            )}
          </div>
        </div>

        {/* Master Evaluator Summary */}
        <div className="border-t pt-6">
          <Card className="bg-muted/30 overflow-hidden">
            <CardContent className="p-4 space-y-4 text-center">
              <div className="flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <IconChecks size={24} />
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Technical Compliance Summary</h4>
                <p className="text-base">
                  "{selectedReport?.notes || `Job Card #${selectedReport?.job_card?.job_no} has been thoroughly inspected. All structural and operational components have been evaluated against our performance standards.`}"
                </p>
              </div>
              <div>
                <div className="h-px w-44 mx-auto my-4 bg-border" />
                <div className="space-y-1">
                  <div className="font-serif mb-3 text-xl tracking-wide">{selectedReport?.qc_person?.full_name}</div>
                  <div className="text-xs text-end text-muted-foreground italic">
                    System Timestamp: {selectedReport && format(new Date(selectedReport.created_at), 'HH:mm:ss · yyyy-MM-dd')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PerfectScrollbar>

    {/* Footer */}
    <div className="shrink-0 p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium">Validation ID:</span>
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">#{selectedReport?.job_card?.job_no}</code>
        <span className="h-3 w-px bg-border" />  
        <span className="font-medium">Status:</span>
        <span className={cn('uppercase font-semibold', selectedReport?.decision === 'PASS' ? 'text-emerald-600' : 'text-rose-600')}>
          Compliance {selectedReport?.decision === 'PASS' ? 'Verified' : 'Flagged'}
        </span>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          <IconMessageDots size={16} className="mr-2" /> Print Report
        </Button>
        <Button
          size="sm"
          className={selectedReport?.decision === 'PASS' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}
        >
          <IconFileExport size={16} className="mr-2" /> Export Official Certificate
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>

      {/* Internal Note Dialog */}
      <Dialog open={noteToView !== null} onOpenChange={(open) => !open && setNoteToView(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-lg border-none shadow-2xl [&>button]:hidden">
          <div className="bg-white dark:bg-slate-900 p-10 text-slate-900 dark:text-white relative flex flex-col items-center text-center">
             <div className="size-16 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/20 flex items-center justify-center mb-6 relative z-10 shadow-sm">
                <IconMessageDots size={32} className={cn("transition-colors", noteToView ? "text-primary" : "text-slate-400 dark:text-white/20")} />
             </div>
             <span className="text-2xl font-black uppercase mb-2 relative z-10">Internal Notes</span>             
             <button
               onClick={() => setNoteToView(null)}
               className="absolute right-6 top-6 size-10 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center transition-all z-20 group active:scale-90 text-slate-500 dark:text-white/70"
             >
               <IconX size={20} />
             </button>
             
             {noteToView ? (
               <div className="w-full rounded-lg p-8 border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 shadow-inner relative z-10">
                  <p className="text-base  leading-relaxed text-slate-700 dark:text-white/90 font-medium">
                     "{noteToView}"
                  </p>
               </div>
             ) : (
               <div className="flex flex-col items-center justify-center w-full relative z-10">
                 <NoMessageIllustration />
                 <p className="text-sm font-bold text-muted-foreground/60 max-w-[240px]">
                   No technical observations or supervisor remarks were recorded for this audit session.
                 </p>
               </div>
             )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Action Confirmation */}
      <ConfirmationModal
        isOpen={isBulkConfirmOpen}
        setIsOpen={setIsBulkConfirmOpen}
        title={showArchived ? "Restore Selected Reports" : "Archive Selected Reports"}
        description={
          <div className="space-y-3">
            <p>You are about to {showArchived ? 'restore' : 'archive'} <span className="font-black text-primary">{selectedIds.length}</span> audit records.</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              These records will be {showArchived ? 'moved back to the active checking list.' : 'hidden from active view but preserved for forensic history.'}
            </p>
          </div>
        }
        onConfirm={executeBulkAction}
        loading={bulkArchiveQC.isPending || bulkUnarchiveQC.isPending}
        confirmText={showArchived ? "Restore Reports" : "Archive Reports"}
        confirmVariant={showArchived ? 'success' : 'warning'}
      />
    </div>
  );
};

export default QCReportsIndex;
