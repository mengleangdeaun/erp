import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  IconChecks,
  IconStar,
  IconStarFilled,
  IconLoader2,
  IconUser,
  IconMessageDots,
  IconRepeat,
  IconTools,
  IconX,
  IconCar,
  IconClock,
  IconInfoCircle,
} from '@tabler/icons-react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { useTechnicians, useJobCard, useReplacementTypes, useCreateQCReport } from '@/hooks/useJobCardData';
import { toast } from 'sonner';
import SearchableMultiSelect from '@/components/ui/SearchableMultiSelect';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { cn } from '@/lib/utils';
import { getStatusConfig } from '@/constants/statusConfig';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

// --- QC Item Card (styled like JobItemRow) ---
const QCItemCard = ({
  item,
  ev,
  updateItemEvaluation,
  replacementTypes,
  technicians,
  setDecision,
}: {
  item: any;
  ev: any;
  updateItemEvaluation: (id: number, updates: any) => void;
  replacementTypes: any[];
  technicians: any[];
  setDecision: (d: 'PASS' | 'FAIL') => void;
}) => (
  <Card className="overflow-hidden">
    <CardContent className="p-4 space-y-3">
      {/* Header with part name and pass/fail toggle */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div
            className={cn(
              'p-1.5 rounded-md border shrink-0',
              ev.status?.toUpperCase() === 'PASS'
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
            )}
          >
            <IconChecks size={14} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-sm truncate">{item.part?.name}</div>
            <div className="text-xs text-muted-foreground truncate">{item.service?.name}</div>
          </div>
        </div>
        <div className="flex gap-1 bg-muted/30 rounded-md p-0.5 shrink-0">
          <button
            onClick={() => updateItemEvaluation(item.id, { status: 'PASS' })}
            className={cn(
              'px-2 py-0.5 text-xs font-medium rounded transition-colors',
              ev.status?.toUpperCase() === 'PASS'
                ? 'bg-emerald-500 text-white'
                : 'text-muted-foreground hover:text-emerald-500'
            )}
          >
            Pass
          </button>
          <button
            onClick={() => {
              updateItemEvaluation(item.id, { status: 'FAIL', rating: 1 });
              setDecision('FAIL');
            }}
            className={cn(
              'px-2 py-0.5 text-xs font-medium rounded transition-colors',
              ev.status?.toUpperCase() === 'FAIL'
                ? 'bg-rose-500 text-white'
                : 'text-muted-foreground hover:text-rose-500'
            )}
          >
            Fail
          </button>
        </div>
      </div>

      {/* Rating stars */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => updateItemEvaluation(item.id, { rating: star })}
              className="focus:outline-none"
            >
              {ev.rating >= star ? (
                <IconStarFilled size={14} className="text-amber-400" />
              ) : (
                <IconStar size={14} className="text-muted-foreground/30" />
              )}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground uppercase">Rate part</span>
      </div>

      {/* Failure details */}
      {ev.status?.toUpperCase() === 'FAIL' && (
        <div className="space-y-3 pt-2 border-t border-border">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <IconRepeat size={12} /> Replacement reason
            </Label>
            <Select
              value={ev.replacement_reason_id?.toString()}
              onValueChange={(val) =>
                updateItemEvaluation(item.id, { replacement_reason_id: parseInt(val) })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {replacementTypes.map((type: any) => (
                  <SelectItem key={type.id} value={type.id.toString()} className="text-xs">
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <IconUser size={12} /> Rework technicians
            </Label>
            <SearchableMultiSelect
              options={technicians.map((t: any) => ({ value: t.id, label: t.full_name }))}
              value={ev.rework_technician_ids || []}
              onChange={(vals) =>
                updateItemEvaluation(item.id, { rework_technician_ids: vals })
              }
              placeholder="Select technicians"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <IconMessageDots size={12} /> Part note
            </Label>
            <input
              className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Describe defect..."
              value={ev.notes || ''}
              onChange={(e) => updateItemEvaluation(item.id, { notes: e.target.value })}
            />
          </div>
        </div>
      )}
    </CardContent>
  </Card>
);

// --- Side Column (identical to JobCardDialog's SideColumn) ---
const SideColumn = ({
  title,
  items,
  evaluations,
  updateEv,
  replacementTypes,
  technicians,
  setOverallDecision,
}: any) => (
  <Card className="h-full">
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-semibold flex items-center justify-between">
        <span>{title}</span>
        <Badge variant="secondary" className="rounded-full h-5 min-w-[20px] px-1.5 text-xs">
          {items.length}
        </Badge>
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {items.map((item: any) => (
        <QCItemCard
          key={item.id}
          item={item}
          ev={evaluations[item.id] || { rating: 5, status: 'PASS' }}
          updateItemEvaluation={updateEv}
          replacementTypes={replacementTypes}
          technicians={technicians}
          setDecision={setOverallDecision}
        />
      ))}
      {items.length === 0 && (
        <div className="py-8 text-center border border-dashed rounded-lg">
          <span className="text-xs text-muted-foreground">No components</span>
        </div>
      )}
    </CardContent>
  </Card>
);

// --- Main Dialog Component ---
const QCReviewDialog: React.FC<QCReviewDialogProps> = ({
  isOpen,
  setIsOpen,
  jobId,
  jobNo,
  onSave,
}) => {
  const { data: job, isLoading } = useJobCard(jobId);
  const { data: technicians = [] } = useTechnicians();
  const { data: replacementTypesData = [] } = useReplacementTypes({ all: true, is_active: true });
  const replacementTypes = Array.isArray(replacementTypesData)
    ? replacementTypesData
    : replacementTypesData?.data || [];
    
  const techOptions = useMemo(
    () =>
      (technicians || []).map((e: any) => ({
        value: Number(e.id),
        label: e.full_name || e.name || 'Technician',
      })),
    [technicians]
  );

  const createQCReport = useCreateQCReport();
  const [qcPersonId, setQcPersonId] = useState<number | null>(null);
  const [rating, setRating] = useState(5);
  const [decision, setDecision] = useState<'PASS' | 'FAIL'>('PASS');
  const [notes, setNotes] = useState('');
  const [damages, setDamages] = useState<any[]>([]);
  const [itemEvaluations, setItemEvaluations] = useState<
    Record<
      number,
      {
        rating: number;
        status: 'PASS' | 'FAIL';
        replacement_reason_id?: number | string;
        rework_technician_ids?: (string | number)[];
        notes?: string;
      }
    >
  >({});

  useEffect(() => {
    if (isOpen) {
      setRating(5);
      setDecision('PASS');
      setNotes('');
      setDamages([]);
      setItemEvaluations({});
    }
  }, [isOpen]);

  const updateItemEvaluation = (itemId: number, updates: any) => {
    setItemEvaluations((prev) => ({
      ...prev,
      [itemId]: { ...(prev[itemId] || { rating: 5, status: 'PASS' }), ...updates },
    }));
  };

  const handleSave = async () => {
    if (!jobId) return;

    if (!qcPersonId) {
      toast.error('Please select a QC Reviewer');
      return;
    }

    createQCReport.mutate({
      job_card_id: jobId,
      qc_person_id: qcPersonId,
      rating,
      decision,
      item_evaluations: Object.keys(itemEvaluations).length > 0 ? itemEvaluations : null,
      notes,
    }, {
      onSuccess: () => {
        setIsOpen(false);
        if (onSave) onSave();
      }
    });
  };

  if (isLoading && !job) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] h-auto p-0 flex flex-col overflow-hidden [&>button]:hidden">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 z-50"
          >
            <IconX className="h-4 w-4" />
          </button>
          <DialogHeader className="p-6 border-b">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-48" />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-6 bg-muted/30 p-3 rounded-lg">
                <Skeleton className="h-12 w-44 rounded-md" />
                <Skeleton className="h-12 w-44 rounded-md" />
                <Skeleton className="h-12 w-44 rounded-md" />
              </div>
            </div>
          </DialogHeader>
          <ScrollArea className="flex-1 p-6">
            <div className="grid grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64 w-full rounded-lg" />
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  const itemsBySide = {
    Left: (job?.items || []).filter((i: any) => i.part?.side === 'Left'),
    Main: (job?.items || []).filter(
      (i: any) => !i.part?.side || i.part?.side === 'Main' || i.part?.side === 'Center'
    ),
    Right: (job?.items || []).filter((i: any) => i.part?.side === 'Right'),
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-7xl max-h-[90vh] h-auto p-0 flex flex-col overflow-hidden [&>button]:hidden">
        {/* Custom close button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none z-50"
        >
          <IconX className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <DialogHeader className="p-6 border-b">
          <div className="flex flex-col gap-4">
            {/* Top row: icon, title, job info, and overall assessment badge */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <IconChecks className="h-5 w-5" />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-muted-foreground uppercase">
                      Quality Assessment • {job?.job_no}
                    </span>
                  </div>
                  <DialogTitle className="text-xl font-semibold truncate">
                    {job?.customer?.name}
                  </DialogTitle>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <IconClock size={12} />
                    <span>
                      Inbound:{' '}
                      {job?.created_at
                        ? format(new Date(job.created_at), 'dd MMM yyyy, HH:mm')
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  decision === 'PASS'
                    ? 'text-emerald-500 border-emerald-500'
                    : 'text-rose-500 border-rose-500'
                )}
              >
                CURRENT ASSESSMENT: {decision}
              </Badge>
            </div>

            {/* Bottom row: team lead, asset identity, operations, and overall pass/fail toggle */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border/50">
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase">
                    Team lead
                  </span>
                  <span className="text-sm font-medium">
                    {job?.lead_technician?.full_name || 'Unassigned'}
                  </span>
                </div>
                <div className="flex flex-col border-l pl-6">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase">
                    Asset identity
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {job?.vehicle?.plate_number}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {job?.vehicle?.brand?.name} · {job?.vehicle?.model?.name}
                    </span>
                    <IconCar size={16} className="text-muted-foreground" />
                  </div>
                </div>
                <div className="flex flex-col border-l pl-6">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase">
                    QC Reviewer
                  </span>
                  <div className="w-48 mt-1">
                    <SearchableSelect
                      options={techOptions}
                      value={qcPersonId}
                      onChange={(val) => setQcPersonId(Number(val))}
                      placeholder="Select Auditor"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDecision('PASS')}
                  className={cn(
                    'text-xs',
                    decision === 'PASS' && 'bg-emerald-500 text-white border-emerald-500'
                  )}
                >
                  OVERALL PASS
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDecision('FAIL');
                    setRating(1);
                  }}
                  className={cn(
                    'text-xs',
                    decision === 'FAIL' && 'bg-rose-500 text-white border-rose-500'
                  )}
                >
                  OVERALL FAIL
                </Button>
              </div>
            </div>
          </div>
        </DialogHeader>

        <PerfectScrollbar options={{ suppressScrollX: true }} className="flex-1 p-6">
          <div className="space-y-6">
            {/* Installation map section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <IconTools className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Installation map</h3>
                <Badge variant="secondary" className="rounded-full">
                  {job?.items?.length || 0}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SideColumn
                  title="Side (Left)"
                  items={itemsBySide.Left}
                  evaluations={itemEvaluations}
                  updateEv={updateItemEvaluation}
                  replacementTypes={replacementTypes}
                  technicians={technicians}
                  setOverallDecision={setDecision}
                />
                <SideColumn
                  title="Main / Center"
                  items={itemsBySide.Main}
                  evaluations={itemEvaluations}
                  updateEv={updateItemEvaluation}
                  replacementTypes={replacementTypes}
                  technicians={technicians}
                  setOverallDecision={setDecision}
                />
                <SideColumn
                  title="Side (Right)"
                  items={itemsBySide.Right}
                  evaluations={itemEvaluations}
                  updateEv={updateItemEvaluation}
                  replacementTypes={replacementTypes}
                  technicians={technicians}
                  setOverallDecision={setDecision}
                />
              </div>
            </div>

            {/* Reviewer disposition and notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase">Reviewer disposition</Label>
                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="focus:outline-none"
                    >
                      {star <= rating ? (
                        <IconStarFilled size={20} className="text-amber-400" />
                      ) : (
                        <IconStar size={20} className="text-muted-foreground/30" />
                      )}
                    </button>
                  ))}
                  <span className="ml-2 text-sm font-medium">{rating}.0 / 5.0</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase flex items-center gap-1">
                  <IconMessageDots size={12} /> Technical audit notes
                </Label>
                <Textarea
                  className="min-h-[80px] text-sm"
                  placeholder="Provide detailed technical findings or rework instructions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>
        </PerfectScrollbar>

        <DialogFooter className="p-6 border-t">
          <div className="flex w-full items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <IconInfoCircle size={14} />
              <span>Audits recorded here will impact technician performance logs.</span>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setIsOpen(false)}>
                Dismiss
              </Button>
              <Button
                onClick={handleSave}
                disabled={createQCReport.isPending}
                variant={decision === 'PASS' ? 'default' : 'destructive'}
              >
                {createQCReport.isPending && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Assessment
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QCReviewDialog;