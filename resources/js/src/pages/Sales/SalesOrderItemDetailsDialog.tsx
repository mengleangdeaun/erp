import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { 
    IconReceipt2, IconUser, IconCar, IconPackage, 
    IconTools, IconTable
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { useSalesOrder } from '@/hooks/usePOSData';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SalesOrderItemDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orderId: number | null;
}

const SalesOrderItemDetailsDialog: React.FC<SalesOrderItemDetailsDialogProps> = ({ open, onOpenChange, orderId }) => {
    const { data: order, isLoading } = useSalesOrder(orderId);

    const getStatusColor = (status: string): any => {
        switch (status?.toUpperCase()) {
            case 'PENDING': return 'warning';
            case 'COMPLETED': return 'success';
            case 'CANCELLED': return 'destructive';
            case 'PAID': return 'success';
            case 'PARTIAL': return 'warning';
            case 'UNPAID': return 'secondary';
            default: return 'secondary';
        }
    };

    const renderLoading = () => (
        <div className="p-6 space-y-8">
            <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-2xl" />
                <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex justify-between items-center py-4 border-b dark:border-zinc-800">
                        <div className="flex items-center gap-3">
                            <Skeleton className="w-8 h-8 rounded-lg" />
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
            <DialogContent className="sm:max-w-[850px] p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white dark:bg-zinc-950">
                {isLoading ? renderLoading() : (
                    <div className="flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <DialogHeader className="p-6 pb-4 shrink-0">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-xl">
                                        <IconTable size={28} />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                                            Order Items #{order?.order_no || '...'}
                                            <Badge variant={getStatusColor(order?.status)} className="h-5 text-[10px] font-black uppercase">
                                                {order?.status}
                                            </Badge>
                                        </DialogTitle>
                                        <p className="text-xs font-bold text-zinc-400 mt-1">
                                            Placed on {order?.order_date ? format(new Date(order.order_date), 'dd MMM yyyy') : '...'} &bull; {order?.creator?.name || '...'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </DialogHeader>

                        {/* Customer & Info Mini-Card */}
                        <div className="px-6 pb-4 shrink-0">
                            <div className="grid grid-cols-2 gap-4 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border dark:border-zinc-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center text-zinc-400 shadow-sm border dark:border-zinc-700">
                                        <IconUser size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[8px] font-black uppercase text-zinc-400 tracking-widest leading-none mb-1">Customer</p>
                                        <p className="font-bold text-xs text-zinc-900 dark:text-white truncate">{order?.customer?.name || 'Walk-in'}</p>
                                    </div>
                                </div>
                                {order?.vehicle && (
                                    <div className="flex items-center gap-3 border-l dark:border-zinc-800 pl-4">
                                        <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center text-zinc-400 shadow-sm border dark:border-zinc-700">
                                            <IconCar size={16} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[8px] font-black uppercase text-zinc-400 tracking-widest leading-none mb-1">Vehicle</p>
                                            <p className="font-bold text-xs text-zinc-900 dark:text-white truncate">
                                                {order.vehicle.plate_number}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Items Table - Robust scrolling height constraint */}
                        <ScrollArea className="flex-1 px-6 min-h-0" style={{ maxHeight: 'calc(90vh - 280px)' }}>
                            <table className="w-full text-left border-separate border-spacing-0">
                                <thead className="sticky top-0 z-20 bg-white dark:bg-zinc-950">
                                    <tr className="text-[9px] font-black uppercase text-zinc-400 tracking-[0.2em] shadow-[0_1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)]">
                                        <th className="py-3 px-2 border-b dark:border-zinc-800">Description</th>
                                        <th className="py-3 px-2 text-center w-20 border-b dark:border-zinc-800">Qty</th>
                                        <th className="py-3 px-2 text-right w-28 border-b dark:border-zinc-800">Price</th>
                                        <th className="py-3 px-2 text-right w-28 border-b dark:border-zinc-800">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-zinc-800">
                                    {order?.items?.map((item: any, idx: number) => {
                                        const itemName = item.itemable?.name || item.item_name || 'Item';
                                        const isService = item.itemable_type?.includes('Service');
                                        const qty = Number(item.quantity || item.qty || 0);

                                        return (
                                            <tr key={idx} className="group transition-colors">
                                                <td className="py-4 px-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                                            isService ? 'bg-primary/5 text-primary' : 'bg-emerald-500/5 text-emerald-600'
                                                        }`}>
                                                            {isService ? <IconTools size={14} /> : <IconPackage size={14} />}
                                                        </div>
                                                        <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{itemName}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-2 text-center font-bold text-sm text-zinc-600 dark:text-zinc-400">{qty}</td>
                                                <td className="py-4 px-2 text-right font-bold text-sm text-zinc-600 dark:text-zinc-400">
                                                    ${parseFloat(item.unit_price || 0).toFixed(2)}
                                                </td>
                                                <td className="py-4 px-2 text-right font-black text-sm text-zinc-900 dark:text-white">
                                                    ${(qty * Number(item.unit_price || 0) - Number(item.discount_amount || item.discount || 0)).toFixed(2)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </ScrollArea>

                        {/* Footer - Fixed Summary */}
                        <div className="shrink-0 px-6 py-4 bg-zinc-50/80 dark:bg-zinc-900/50 border-t dark:border-zinc-800 backdrop-blur-sm">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="hidden md:flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                    <IconReceipt2 size={14} />
                                    <span>Detailed breakdown</span>
                                </div>
                                <div className="w-full md:w-auto grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
                                    <div className="flex flex-col text-right">
                                        <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Subtotal</span>
                                        <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">${parseFloat(order?.subtotal || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex flex-col text-right">
                                        <span className="text-[9px] font-black uppercase text-rose-500 tracking-wider">Discount</span>
                                        <span className="font-bold text-sm text-rose-600">-${parseFloat(order?.discount_total || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex flex-col text-right">
                                        <span className="text-[9px] font-black uppercase text-emerald-500 tracking-wider">Tax</span>
                                        <span className="font-bold text-sm text-emerald-600">+${parseFloat(order?.tax_total || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex flex-col text-right bg-zinc-900 dark:bg-white px-4 py-2 rounded-xl shadow-lg border border-zinc-800 dark:border-zinc-200 ml-2">
                                        <span className="text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-widest leading-none mb-1">Total</span>
                                        <span className="font-black text-lg leading-none text-white dark:text-black tabular-nums">
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
