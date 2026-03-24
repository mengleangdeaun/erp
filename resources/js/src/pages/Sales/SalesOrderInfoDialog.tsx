import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { 
    IconFileDescription, IconPhoto, IconUser, IconCar, IconInfoCircle
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { useSalesOrder } from '@/hooks/usePOSData';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SalesOrderInfoDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orderId: number | null;
}

const SalesOrderInfoDialog: React.FC<SalesOrderInfoDialogProps> = ({ open, onOpenChange, orderId }) => {
    const { data: order, isLoading } = useSalesOrder(orderId);

    const renderLoading = () => (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-2xl" />
                <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white dark:bg-zinc-950">
                {isLoading ? renderLoading() : (
                    <div className="flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <DialogHeader className="p-6 pb-4 shrink-0 bg-zinc-50/50 dark:bg-zinc-900/50 border-b dark:border-zinc-800">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">
                                    <IconInfoCircle size={28} />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-black tracking-tight">
                                        Order Information #{order?.order_no || '...'}
                                    </DialogTitle>
                                    <p className="text-xs font-bold text-zinc-400 mt-0.5 uppercase tracking-widest">
                                        {order?.order_date ? format(new Date(order.order_date), 'dd MMM yyyy') : '...'} &bull; Status: {order?.status}
                                    </p>
                                </div>
                            </div>
                        </DialogHeader>

                        <ScrollArea className="flex-1 p-6">
                            <div className="space-y-8">
                                {/* Notes Section */}
                                <section className="space-y-3">
                                    <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                                        <IconFileDescription size={14} className="text-primary" /> Internal Notes
                                    </h3>
                                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border dark:border-zinc-800 min-h-[100px]">
                                        {order?.notes ? (
                                            <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed italic">
                                                "{order.notes}"
                                            </p>
                                        ) : (
                                            <p className="text-sm text-zinc-400 italic flex items-center justify-center h-full min-h-[80px]">
                                                No internal notes recorded for this order.
                                            </p>
                                        )}
                                    </div>
                                </section>

                                {/* Invoice Image Section */}
                                <section className="space-y-3">
                                    <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                                        <IconPhoto size={14} className="text-primary" /> Invoice Image Attachment
                                    </h3>
                                    {order?.invoice_image_path ? (
                                        <div className="relative group rounded-2xl overflow-hidden border dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 aspect-video shadow-inner">
                                            <img 
                                                src={order.invoice_image_path} 
                                                alt="Invoice" 
                                                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                                <a 
                                                    href={order.invoice_image_path} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="opacity-0 group-hover:opacity-100 bg-white text-black px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl transition-all hover:scale-110 active:scale-95"
                                                >
                                                    View Full Size
                                                </a>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-dashed dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-400 gap-3">
                                            <IconPhoto size={32} stroke={1.5} className="opacity-20" />
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">No invoice image uploaded</p>
                                        </div>
                                    )}
                                </section>
                            </div>
                        </ScrollArea>

                        {/* Footer */}
                        <div className="p-4 bg-zinc-50/50 dark:bg-zinc-900/50 border-t dark:border-zinc-800 flex justify-end">
                            <Badge variant="secondary" className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter">
                                Order Reference: {order?.id}
                            </Badge>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default SalesOrderInfoDialog;
