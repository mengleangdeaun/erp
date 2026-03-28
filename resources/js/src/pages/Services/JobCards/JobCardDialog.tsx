import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  IconTools,
  IconUser,
  IconClock,
  IconCheck,
  IconInfoCircle,
  IconLoader2,
  IconCar,
  IconDots,
  IconX,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import {
  useJobCard,
  useUpdateJobCard,
  useUpdateJobCardItem,
  useCompleteJobCard,
  useTechnicians,
} from '@/hooks/useJobCardData';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { Skeleton } from '@/components/ui/skeleton';
import TableSkeleton from '@/components/ui/TableSkeleton';
import ConfirmationModal from '@/components/ConfirmationModal';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import SearchableMultiSelect from '@/components/ui/SearchableMultiSelect';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { getStatusConfig, STATUS_CONFIG, JOB_CARD_STATUS_KEYS, ITEM_STATUS_KEYS } from '@/constants/statusConfig';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// SideColumn component using Card
const SideColumn = ({
  title,
  items = [],
  employees,
  techOptions,
  onUpdate,
  onCompleteAll,
}: {
  title: string;
  items: any[];
  employees: any[];
  techOptions: any[];
  onUpdate: (id: number, updates: any) => void;
  onCompleteAll: () => void;
}) => (
  <Card className="h-full">
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-semibold flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>{title}</span>
          <Badge variant="secondary" className="rounded-full h-5 min-w-[20px] px-1.5 text-xs">
            {items.length}
          </Badge>
        </div>
        {items.length > 0 && items.some(i => i.status?.toLowerCase() !== 'completed') && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onCompleteAll}
            className="h-7 px-2 text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary hover:bg-primary/5 gap-1.5"
          >
            <IconCheck size={12} />
            Complete all
          </Button>
        )}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {items.map((item) => (
        <JobItemRow
          key={item.id}
          item={item}
          employees={employees}
          techOptions={techOptions}
          onUpdate={onUpdate}
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

// JobItemRow component using Card
const JobItemRow = ({
  item,
  employees,
  techOptions,
  onUpdate,
}: {
  item: any;
  employees: any[];
  techOptions: any[];
  onUpdate: (id: number, updates: any) => void;
}) => {
  const handleProgressChange = (val: number[]) => {
    const newPercentage = val[0];
    const newStatus =
      newPercentage === 100 ? 'Completed' : newPercentage > 0 ? 'In Progress' : 'Pending';
    onUpdate(item.id, { completion_percentage: newPercentage, status: newStatus });
  };

  return (
    <Card className="overflow-hidden rounded-lg">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'p-1.5 rounded-md border',
              item.status?.toLowerCase() === 'completed'
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                : 'bg-muted text-muted-foreground border-border'
            )}
          >
            {item.status?.toLowerCase() === 'completed' ? <IconCheck size={14} /> : <IconDots size={14} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{item.part?.name}</div>
            <div className="text-xs text-muted-foreground truncate">{item.service?.name}</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <Label className="text-muted-foreground">Progress</Label>
            <span className="font-medium">{item.completion_percentage}%</span>
          </div>
          <Slider
            value={[item.completion_percentage || 0]}
            max={100}
            step={5}
            onValueChange={handleProgressChange}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Assigned workforce</Label>
          <SearchableMultiSelect
            options={techOptions}
            value={item.technician_ids || []}
            onChange={(vals) => onUpdate(item.id, { technician_ids: vals })}
            placeholder="Select technicians"
            searchPlaceholder="Search staff..."
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Activity state</Label>
          <Select value={item.status} onValueChange={(val) => onUpdate(item.id, { status: val })}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ITEM_STATUS_KEYS.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

interface JobCardDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  jobId: number | null;
  onSave: () => void;
}

const JobCardDialog = ({ isOpen, setIsOpen, jobId, onSave }: JobCardDialogProps) => {
  const { data: job, isLoading } = useJobCard(jobId);
  const { data: employees = [], isLoading: isLoadingEmployees } = useTechnicians();

  const updateItemMutation = useUpdateJobCardItem();
  const updateJobMutation = useUpdateJobCard();
  const completeJobMutation = useCompleteJobCard();

  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [localItems, setLocalItems] = useState<any[]>([]);
  const [leadTechnicianId, setLeadTechnicianId] = useState<number | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const statusCfg = getStatusConfig(job?.status);

  const techOptions = useMemo(
    () =>
      (employees || []).map((e: any) => ({
        value: Number(e.id),
        label: e.full_name || e.name || 'Technician',
      })),
    [employees]
  );

  useEffect(() => {
    if (job) {
      setLocalItems(
        (job.items || []).map((i: any) => ({
          ...i,
          technician_ids: i.technicians?.map((t: any) => Number(t.id)) || [],
        }))
      );
      setLeadTechnicianId(job.technician_lead_id);
      setIsDirty(false);
    }
  }, [job]);

  const handleUpdateItemLocal = (itemId: number, updates: any) => {
    setLocalItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, ...updates } : i)));
    setIsDirty(true);
  };

  const saveChanges = async () => {
    try {
      const itemPromises = localItems
        .filter((li) => {
          const original = job.items.find((i: any) => i.id === li.id);
          const originalTechIds = original.technicians?.map((t: any) => Number(t.id)) || [];
          const techChanged =
            JSON.stringify(originalTechIds.sort()) !== JSON.stringify([...li.technician_ids].sort());
          return techChanged || original.status?.toLowerCase() !== li.status?.toLowerCase() || original.completion_percentage !== li.completion_percentage;
        })
        .map((li) =>
          updateItemMutation.mutateAsync({
            itemId: li.id,
            updates: {
              technician_ids: li.technician_ids,
              status: li.status,
              completion_percentage: li.completion_percentage,
            },
          })
        );

      await Promise.all(itemPromises);
      setIsDirty(false);
      toast.success('Workforce dynamics synchronized');
    } catch (error) {
      toast.error('Failed to sync changes');
    }
  };

  const confirmComplete = () => {
    if (jobId) {
      completeJobMutation.mutate(jobId, {
        onSuccess: () => {
          setIsCompleteModalOpen(false);
          onSave();
          setIsOpen(false);
        },
      });
    }
  };
if (isLoading && !job) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-7xl h-[90vh] p-0 flex flex-col overflow-hidden [&>button]:hidden">
        {/* Custom close button (skeleton version) */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none z-50"
        >
          <IconX className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <DialogHeader className="p-6 border-b">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <Skeleton className="w-12 h-12 rounded-lg" />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-6 w-64" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-7 w-32 rounded-md" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-6 bg-muted/30 p-3 rounded-lg">
              <div className="flex flex-col">
                <Skeleton className="h-3 w-24 mb-1" />
                <Skeleton className="h-9 w-44" />
              </div>
              <div className="flex flex-col border-l pl-6">
                <Skeleton className="h-3 w-24 mb-1" />
                <div className="flex items-center gap-2">
                  <div>
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-3 w-40 mt-1" />
                  </div>
                  <Skeleton className="h-5 w-5" />
                </div>
              </div>
              <div className="flex flex-col border-l pl-6">
                <Skeleton className="h-3 w-24 mb-1" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-3 w-16 mt-1" />
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-8 rounded-full" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="h-full">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-5 w-8 rounded-full" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[1, 2, 3].map((j) => (
                        <Card key={j} className="overflow-hidden">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start gap-3">
                              <Skeleton className="h-8 w-8 rounded-md" />
                              <div className="flex-1 space-y-1">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-24" />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <Skeleton className="h-3 w-12" />
                                <Skeleton className="h-3 w-8" />
                              </div>
                              <Skeleton className="h-2 w-full" />
                            </div>
                            <div className="space-y-2">
                              <Skeleton className="h-3 w-24" />
                              <Skeleton className="h-9 w-full" />
                            </div>
                            <div className="space-y-2">
                              <Skeleton className="h-3 w-20" />
                              <Skeleton className="h-9 w-full" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 border-t">
          <div className="flex w-full items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-3 w-64" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-28" />
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

  const itemsBySide = {
    Left: localItems.filter((i: any) => i.part?.side === 'Left') || [],
    Main: localItems.filter((i: any) => !i.part?.side || i.part?.side === 'Main' || i.part?.side === 'Center') || [],
    Right: localItems.filter((i: any) => i.part?.side === 'Right') || [],
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
<DialogContent className="max-w-7xl max-h-[90vh] h-auto p-0 flex flex-col overflow-hidden [&>button]:hidden">
        {/* Custom close button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-50"
        >
          <IconX className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <DialogHeader className="p-6 border-b">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <IconTools className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    JOB CARD • {job?.job_no}
                  </span>
                  {isDirty && (
                    <Badge variant="outline" className="text-amber-500 border-amber-500 text-[10px]">
                      UNSAVED
                    </Badge>
                  )}
                </div>
                <DialogTitle className="text-xl font-semibold truncate">
                  {job?.customer?.name}
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">


    <Select
  value={job?.status}
  onValueChange={(val) => {
    updateJobMutation.mutate({ id: job.id, updates: { status: val } });
  }}
>
  <SelectTrigger
    className={cn(
      'h-7 w-36 text-xs border px-2 shadow-none gap-1.5 focus:ring-0',
      statusCfg.bg,
      statusCfg.text,
      statusCfg.border,
    )}
  >
    {updateJobMutation.isPending && (
      <IconLoader2 className="size-3 animate-spin shrink-0" />
    )}
    <SelectValue />
  </SelectTrigger>

  <SelectContent>
    {JOB_CARD_STATUS_KEYS.map((key) => {
      const cfg = getStatusConfig(key);
      return (
        <SelectItem key={key} value={key} className="text-xs focus:bg-transparent">
          <span className="flex items-center gap-2">
            <span className={cn('size-1.5 shrink-0 rounded-full', cfg.dot)} />
            {cfg.label}
          </span>
        </SelectItem>
      );
    })}
  </SelectContent>
</Select>
                  <div className="flex items-center gap-1">
                    <IconClock size={12} />
                    <span>Inbound: {job?.created_at ? format(new Date(job.created_at), 'dd MMM yyyy, HH:mm') : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 bg-muted/30 p-3 rounded-lg">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-medium text-muted-foreground uppercase">Team lead</span>
                <div className="w-44">
                  {isLoadingEmployees ? (
                    <Skeleton className="h-9 w-full" />
                  ) : (
                    <SearchableSelect
                      options={techOptions}
                      value={leadTechnicianId}
                      onChange={(val) => {
                        const tid = Number(val);
                        setLeadTechnicianId(tid);
                        updateJobMutation.mutate({
                          id: job.id,
                          updates: { technician_lead_id: tid }
                        });
                      }}
                      placeholder="Assign lead"
                      className="h-9 text-sm"
                    />
                  )}
                </div>
              </div>
              <div className="flex flex-col border-l pl-6">
                <span className="text-[10px] font-medium text-muted-foreground uppercase">Asset identity</span>
                <div className="flex items-center gap-2">
                  <div>
                    <div className="font-semibold">
                      {job?.vehicle?.plate_number || (job?.vehicle?.vin_last_4 ? `VIN: ${job.vehicle.vin_last_4}` : 'N/A')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {job?.vehicle?.brand?.name} · {job?.vehicle?.model?.name}
                    </div>
                  </div>
                  <IconCar size={18} className="text-muted-foreground" />
                </div>
              </div>
              <div className="flex flex-col border-l pl-6">
                <span className="text-[10px] font-medium text-muted-foreground uppercase">Operations</span>
                <span className="font-semibold">{job?.branch?.name || job?.branch?.branch_name || 'Main HQ'}</span>
                <span className="text-xs text-muted-foreground">Sector unit</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Rest of the dialog content same as before */}
        <PerfectScrollbar options={{ suppressScrollX: true }} className="flex-1 min-h-0 p-6 pt-0 pb-3">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <IconTools className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Installation map</h3>
                <Badge variant="secondary" className="rounded-full">
                  {localItems.length}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SideColumn
                  title="Side (Left)"
                  items={itemsBySide.Left}
                  employees={employees}
                  techOptions={techOptions}
                  onUpdate={handleUpdateItemLocal}
                  onCompleteAll={() => {
                    itemsBySide.Left.forEach(i => handleUpdateItemLocal(i.id, { completion_percentage: 100, status: 'Completed' }));
                  }}
                />
                <SideColumn
                  title="Main / Center"
                  items={itemsBySide.Main}
                  employees={employees}
                  techOptions={techOptions}
                  onUpdate={handleUpdateItemLocal}
                  onCompleteAll={() => {
                    itemsBySide.Main.forEach(i => handleUpdateItemLocal(i.id, { completion_percentage: 100, status: 'Completed' }));
                  }}
                />
                <SideColumn
                  title="Side (Right)"
                  items={itemsBySide.Right}
                  employees={employees}
                  techOptions={techOptions}
                  onUpdate={handleUpdateItemLocal}
                  onCompleteAll={() => {
                    itemsBySide.Right.forEach(i => handleUpdateItemLocal(i.id, { completion_percentage: 100, status: 'Completed' }));
                  }}
                />
              </div>
            </div>
          </div>
        </PerfectScrollbar>

        <DialogFooter className="p-6 border-t">
          <div className="flex w-full items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <IconInfoCircle size={14} />
              <span>Modifications sync with operational audits and inventory levels.</span>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setIsOpen(false)}>
                Close
              </Button>
              {isDirty && (
                <Button
                  onClick={saveChanges}
                  disabled={updateItemMutation.isPending}
                  variant="default"
                >
                  {updateItemMutation.isPending && (
                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Sync progress
                </Button>
              )}
              <Button
                onClick={() => setIsCompleteModalOpen(true)}
                disabled={isDirty || completeJobMutation.isPending || job?.status?.toLowerCase() === 'completed'}
                variant="default"
              >
                {completeJobMutation.isPending && (
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {job?.status?.toLowerCase() === 'completed' ? 'Finalized' : 'Mark as ready'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>


      <ConfirmationModal
        isOpen={isCompleteModalOpen}
        setIsOpen={setIsCompleteModalOpen}
        title="Review & Finalize Job Card"
        description={
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Confirm that all assigned technician tasks are fulfilled. This will advance the job
              state and notify supervisors for final inspection.
            </p>
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              <h4 className="text-xs font-medium">Installation map</h4>
              <div className="border rounded-lg divide-y">
                {localItems.map((i) => (
                  <div key={i.id} className="flex items-center justify-between p-3 text-sm">
                    <div>
                      <div className="font-medium">{i.part?.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <IconUser size={12} />
                        {(() => {
                          if (!i.technician_ids || i.technician_ids.length === 0)
                            return 'Unassigned';
                          return i.technician_ids
                            .map((tid: string) => {
                              const tech = employees.find((e: any) => e.id.toString() === tid);
                              return tech ? (tech.full_name || tech.name) : 'Unknown';
                            })
                            .join(', ');
                        })()}
                      </div>
                    </div>
                    <StatusBadge
                      status={i.completion_percentage === 100 ? 'Completed' : 'Pending'}
                      variant="light"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        }
        onConfirm={confirmComplete}
        confirmText="CONFIRM & FINALIZE"
        confirmVariant="success"
        loading={completeJobMutation.isPending}
      />
    </Dialog>
  );
};

export default JobCardDialog;