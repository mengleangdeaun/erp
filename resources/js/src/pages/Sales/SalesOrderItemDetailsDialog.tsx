import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
    IconReceipt2, IconUser, IconCar, IconPackage, 
    IconTools, IconTable
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { useSalesOrder } from '@/hooks/usePOSData';
import { Skeleton } from '@/components/ui/skeleton';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { cn } from '@/lib/utils';

interface SalesOrderItemDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orderId: number | null;
}

const SalesOrderItemDetailsDialog: React.FC<SalesOrderItemDetailsDialogProps> = ({ open, onOpenChange, orderId }) => {
    const { data: order, isLoading } = useSalesOrder(orderId);

    const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
        switch (status?.toUpperCase()) {
            case 'PENDING': return 'secondary';
            case 'COMPLETED': return 'default';
            case 'CANCELLED': return 'destructive';
            case 'PAID': return 'default';
            case 'PARTIAL': return 'secondary';
            case 'UNPAID': return 'outline';
            default: return 'secondary';
        }
    };

    const renderLoading = () => (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex justify-between items-center py-4 border-b">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-md" />
                            <Skeleton className="h-4 w-40" />
                        </div>
                        <Skeleton className="h-4 w-20" />
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[850px] max-h-[90vh] h-auto p-0 overflow-hidden rounded-lg">
                {isLoading ? renderLoading() : (
                    <div className="flex flex-col">
                        {/* Header */}
                        <DialogHeader className="p-6 pb-4 shrink-0 border-b">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <IconTable className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-xl font-semibold tracking-tight flex items-center gap-3">
                                            Order Items #{order?.order_no || '...'}
                                            <Badge variant={getStatusVariant(order?.status)} className="text-[10px] font-medium uppercase">
                                                {order?.status}
                                            </Badge>
                                        </DialogTitle>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Placed on {order?.order_date ? format(new Date(order.order_date), 'dd MMM yyyy') : '...'} &bull; {order?.creator?.name || '...'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </DialogHeader>

                        {/* Customer & Info Mini-Card */}
                        <div className="px-6 py-4 shrink-0">
                            <Card>
                                <CardContent className="p-3">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                                <IconUser className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-medium uppercase text-muted-foreground tracking-wider">Customer</p>
                                                <p className="font-medium text-sm truncate">{order?.customer?.name || 'Walk-in'}</p>
                                            </div>
                                        </div>
                                        {order?.vehicle && (
                                            <div className="flex items-center gap-3 border-l pl-4">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                                    <IconCar className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-medium uppercase text-muted-foreground tracking-wider">Vehicle</p>
                                                    <p className="font-medium text-sm truncate">
                                                        {order.vehicle.plate_number}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Items Table */}
                        <PerfectScrollbar options={{ suppressScrollX: true }} className="flex-1 px-6 pb-6 min-h-0">
                            <Table>
                                <TableHeader className="sticky top-0 bg-background">
                                    <TableRow className="hover:bg-transparent border-b">
                                        <TableHead className="text-xs font-semibold uppercase">Description</TableHead>
                                        <TableHead className="text-xs font-semibold uppercase text-center w-20">Qty</TableHead>
                                        <TableHead className="text-xs font-semibold uppercase text-right w-28">Price</TableHead>
                                        <TableHead className="text-xs font-semibold uppercase text-right w-28">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {order?.items?.map((item: any, idx: number) => {
                                        const itemName = item.itemable?.name || item.item_name || 'Item';
                                        const isService = item.itemable_type?.includes('Service');
                                        const qty = Number(item.quantity || item.qty || 0);

                                        return (
                                            <TableRow key={idx} className="border-b">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "flex h-8 w-8 items-center justify-center rounded-md",
                                                            isService ? "bg-primary/10 text-primary" : "bg-emerald-500/10 text-emerald-600"
                                                        )}>
                                                            {isService ? <IconTools className="h-4 w-4" /> : <IconPackage className="h-4 w-4" />}
                                                        </div>
                                                        <span className="font-medium text-sm">{itemName}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center font-medium text-sm">{qty}</TableCell>
                                                <TableCell className="text-right font-medium text-sm">
                                                    ${parseFloat(item.unit_price || 0).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold text-sm">
                                                    ${(qty * Number(item.unit_price || 0) - Number(item.discount_amount || item.discount || 0)).toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                            {(!order?.items || order.items.length === 0) && (
                                <div className="py-12 text-center border border-dashed rounded-lg">
                                    <p className="text-sm text-muted-foreground">No items found.</p>
                                </div>
                            )}
                        </PerfectScrollbar>

                        {/* Footer Summary */}
                        <div className="shrink-0 p-6 border-t bg-muted/30">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
                                    <IconReceipt2 className="h-4 w-4" />
                                    <span>Detailed breakdown</span>
                                </div>
                                <div className="w-full md:w-auto grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
                                    <div className="flex flex-col text-right">
                                        <span className="text-[10px] font-medium uppercase text-muted-foreground">Subtotal</span>
                                        <span className="font-semibold text-sm">${parseFloat(order?.subtotal || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex flex-col text-right">
                                        <span className="text-[10px] font-medium uppercase text-rose-500">Discount</span>
                                        <span className="font-semibold text-sm text-rose-600">-${parseFloat(order?.discount_total || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex flex-col text-right">
                                        <span className="text-[10px] font-medium uppercase text-emerald-500">Tax</span>
                                        <span className="font-semibold text-sm text-emerald-600">+${parseFloat(order?.tax_total || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex flex-col text-right bg-primary text-primary-foreground px-4 py-2 rounded-lg">
                                        <span className="text-[10px] font-medium uppercase opacity-80">Total</span>
                                        <span className="font-bold text-lg leading-none">
                                            ${parseFloat(order?.grand_total || 0).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default SalesOrderItemDetailsDialog;