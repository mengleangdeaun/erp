import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  IconPackage,
  IconScale,
  IconCheck,
  IconLoader2,
  IconAlertCircle,
  IconInfoCircle,
  IconTools,
  IconX,
  IconCar,
  IconClock,
} from '@tabler/icons-react';
import { useJobCard, useUpdateMaterialUsage, useCompleteJobCard, useAvailableSerials } from '@/hooks/useJobCardData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import ConfirmationModal from '@/components/ConfirmationModal';
import { format } from 'date-fns';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn } from '@/lib/utils';
import { getStatusConfig } from '@/constants/statusConfig';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface StockDeductDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  jobId: number | null;
  onSave?: () => void;
}

const MaterialUsageRow = ({
  usage,
  onUpdate,
  branchId,
}: {
  usage: any;
  onUpdate: (updates: any) => void;
  branchId?: number;
}) => {
  const { data: serials = [] } = useAvailableSerials(usage.product_id, branchId);

  const handleDimChange = (field: string, val: string) => {
    const numVal = parseFloat(val) || 0;
    const updates: any = { [field]: numVal };

    if (field === 'width_cut' || field === 'height_cut') {
      const w = field === 'width_cut' ? numVal : (parseFloat(usage.width_cut) || 0);
      const h = field === 'height_cut' ? numVal : (parseFloat(usage.height_cut) || 0);
      updates.actual_qty = (w * h).toFixed(4);
    }
    onUpdate(updates);
  };

  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell className="py-3">
        <div className="flex flex-col">
          <span className="font-medium text-sm">{usage.product?.name}</span>
          <span className="text-xs text-muted-foreground">{usage.product?.code}</span>
        </div>
      </TableCell>
      <TableCell className="py-3">
        <Select
          value={usage.serial_id?.toString() || 'null'}
          onValueChange={(val) => onUpdate({ serial_id: val === 'null' ? null : parseInt(val) })}
        >
          <SelectTrigger className="h-8 w-48 text-xs">
            <SelectValue placeholder="No Serial" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="null" className="text-xs">MANUAL STOCK</SelectItem>
            {serials.map((s: any) => (
              <SelectItem key={s.id} value={s.id.toString()} className="text-xs">
                {s.serial_number}{' '}
                <span className="text-primary font-medium ml-1">
                  ({s.current_quantity}
                  {usage.product?.unit || 'm'})
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="py-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">W:</span>
            <Input
              type="number"
              value={usage.width_on_car}
              onChange={(e) => handleDimChange('width_on_car', e.target.value)}
              className="h-8 w-16 text-xs text-center"
              placeholder="0"
            />
          </div>
          <span className="text-muted-foreground">×</span>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">L:</span>
            <Input
              type="number"
              value={usage.height_on_car}
              onChange={(e) => handleDimChange('height_on_car', e.target.value)}
              className="h-8 w-16 text-xs text-center"
              placeholder="0"
            />
          </div>
        </div>
      </TableCell>
      <TableCell className="py-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">W:</span>
            <Input
              type="number"
              value={usage.width_cut}
              onChange={(e) => handleDimChange('width_cut', e.target.value)}
              className="h-8 w-16 text-xs text-center"
              placeholder="0"
            />
          </div>
          <span className="text-muted-foreground">×</span>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">L:</span>
            <Input
              type="number"
              value={usage.height_cut}
              onChange={(e) => handleDimChange('height_cut', e.target.value)}
              className="h-8 w-16 text-xs text-center"
              placeholder="0"
            />
          </div>
        </div>
      </TableCell>
      <TableCell className="py-3 text-right">
        <div className="flex flex-col items-end">
          <span className="font-semibold text-sm">{usage.actual_qty || '0.0000'}</span>
          <span className="text-xs text-muted-foreground">SQM</span>
        </div>
      </TableCell>
    </TableRow>
  );
};

const StockDeductDialog: React.FC<StockDeductDialogProps> = ({ isOpen, setIsOpen, jobId, onSave }) => {
  const { data: job, isLoading } = useJobCard(jobId);
  const updateMaterialMutation = useUpdateMaterialUsage();
  const completeJobMutation = useCompleteJobCard();

  const [localUsage, setLocalUsage] = useState<any[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    if (job) {
      setLocalUsage(job.material_usage || []);
      setIsDirty(false);
    }
  }, [job]);

  const handleUpdateUsageLocal = (usageId: number, updates: any) => {
    setLocalUsage((prev) => prev.map((u) => (u.id === usageId ? { ...u, ...updates } : u)));
    setIsDirty(true);
  };

  const saveChanges = async () => {
    try {
      const changedUsage = localUsage.filter((lu) => {
        const original = job.material_usage.find((u: any) => u.id === lu.id);
        return (
          JSON.stringify({
            serial_id: original.serial_id,
            width_on_car: original.width_on_car,
            height_on_car: original.height_on_car,
            width_cut: original.width_cut,
            height_cut: original.height_cut,
            actual_qty: original.actual_qty,
          }) !==
          JSON.stringify({
            serial_id: lu.serial_id,
            width_on_car: lu.width_on_car,
            height_on_car: lu.height_on_car,
            width_cut: lu.width_cut,
            height_cut: lu.height_cut,
            actual_qty: lu.actual_qty,
          })
        );
      });

      await Promise.all(
        changedUsage.map((lu) =>
          updateMaterialMutation.mutateAsync({
            usageId: lu.id,
            serial_id: lu.serial_id,
            width_on_car: lu.width_on_car,
            height_on_car: lu.height_on_car,
            width_cut: lu.width_cut,
            height_cut: lu.height_cut,
            actual_qty: lu.actual_qty,
          })
        )
      );

      setIsDirty(false);
      toast.success('Inventory usage synchronized');
    } catch (error) {
      toast.error('Failed to sync material usage');
    }
  };

  const finalizeJob = () => {
    if (!jobId) return;
    completeJobMutation.mutate(jobId, {
      onSuccess: () => {
        setIsConfirmOpen(false);
        setIsOpen(false);
        onSave?.();
      },
    });
  };

  const totalSqm = localUsage.reduce((acc, u) => acc + (parseFloat(u.actual_qty) || 0), 0);

  if (isLoading && !job) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 flex flex-col overflow-hidden [&>button]:hidden">
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
    {/* Top row: icon, title, status, and close button */}
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
          <IconPackage className="h-5 w-5" />
        </div>
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground uppercase">
              Stage 2 • Material Finalization
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
        </div>
      </div>
      {/* Status badge placed on the right */}
      <StatusBadge status={job?.status} className="h-7 px-3 text-xs" />
    </div>

    {/* Bottom row: asset details and aggregated total */}
    <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border/50">
      <div className="flex items-center gap-3 text-sm">
        <IconCar size={16} className="text-muted-foreground" />
        <span className="font-medium">{job?.vehicle?.plate_number}</span>
        <span className="text-muted-foreground">
          {job?.vehicle?.brand?.name} · {job?.vehicle?.model?.name}
        </span>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-medium text-muted-foreground uppercase">Total to deduct</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-semibold text-emerald-600">{totalSqm.toFixed(4)}</span>
            <span className="text-xs text-muted-foreground uppercase">SQM</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <IconClock size={12} />
          <span>Reviewing dimensions</span>
        </div>
      </div>
    </div>
  </div>
</DialogHeader>

        <ScrollArea className="flex-1 p-6">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b">
                    <TableHead className="text-xs font-semibold uppercase">Consumable</TableHead>
                    <TableHead className="text-xs font-semibold uppercase">Serial</TableHead>
                    <TableHead className="text-xs font-semibold uppercase">On Car</TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-primary">Cut Map</TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-right">Metric</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {localUsage.map((usage: any) => (
                    <MaterialUsageRow
                      key={usage.id}
                      usage={usage}
                      branchId={job?.branch_id}
                      onUpdate={(updates) => handleUpdateUsageLocal(usage.id, updates)}
                    />
                  ))}
                  {localUsage.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <IconPackage size={24} className="text-muted-foreground/50" />
                          <p className="text-sm text-muted-foreground">No materials linked to this job card</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow className="border-t bg-muted/30">
                    <TableCell colSpan={4} className="text-right text-sm font-medium">
                      Final Aggregated Consumption Map
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-xl font-semibold text-emerald-600">{totalSqm.toFixed(4)}</span>
                      <span className="text-xs text-muted-foreground ml-1 uppercase">SQM</span>
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        </ScrollArea>

        <DialogFooter className="p-6 border-t">
          <div className="flex w-full items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <IconAlertCircle size={14} className="text-amber-500" />
              <span>Finalizing permanently deducts stock and locks audit.</span>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setIsOpen(false)}>
                Discard
              </Button>
              {isDirty && (
                <Button
                  onClick={saveChanges}
                  disabled={updateMaterialMutation.isPending}
                  variant="default"
                >
                  {updateMaterialMutation.isPending && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save
                </Button>
              )}
              <Button
                onClick={() => {
                  if (isDirty) {
                    toast.error('Sync measurements before finalizing');
                    return;
                  }
                  setIsConfirmOpen(true);
                }}
                disabled={completeJobMutation.isPending}
                variant="default"
              >
                {completeJobMutation.isPending && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                Finalize
              </Button>
            </div>
          </div>
        </DialogFooter>

        <ConfirmationModal
          isOpen={isConfirmOpen}
          setIsOpen={setIsConfirmOpen}
          title="Confirm Inventory Action"
          description={
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">
                You are about to deduct <span className="font-semibold text-emerald-600">{totalSqm.toFixed(4)} SQM</span> from inventory.
              </p>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 rounded-lg">
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  This action will permanently update stock levels and close the material consumption audit for Job Card {job?.job_no}.
                </p>
              </div>
            </div>
          }
          onConfirm={finalizeJob}
          confirmText="DEDUCT & FINISH"
          confirmVariant="success"
          loading={completeJobMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
};

export default StockDeductDialog;