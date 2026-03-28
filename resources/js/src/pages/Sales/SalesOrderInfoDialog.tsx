import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
    IconFileDescription, IconPhoto, IconUser, IconCar, IconInfoCircle, IconX
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { useSalesOrder } from '@/hooks/usePOSData';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

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
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] p-0 flex flex-col overflow-hidden [&>button]:hidden">
                {/* Custom close button */}
                <button
                    onClick={() => onOpenChange(false)}
                    className="absolute right-4 top-4 z-50 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                    <IconX className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </button>

                {isLoading ? renderLoading() : (
                    <>
                        {/* Header */}
                        <DialogHeader className="p-6 pb-4 shrink-0 border-b">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <IconInfoCircle className="h-6 w-6" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-semibold tracking-tight">
                                        Order Information #{order?.order_no || '...'}
                                    </DialogTitle>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {order?.order_date ? format(new Date(order.order_date), 'dd MMM yyyy') : '...'} &bull; Status: {order?.status}
                                    </p>
                                </div>
                            </div>
                        </DialogHeader>

                        <ScrollArea className="flex-1 p-6">
                            <div className="space-y-6">
                                {/* Notes Section */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        <IconFileDescription className="h-4 w-4" />
                                        <span>Internal Notes</span>
                                    </div>
                                    <Card>
                                        <CardContent className="p-4 min-h-[100px]">
                                            {order?.notes ? (
                                                <p className="text-sm text-muted-foreground italic leading-relaxed">
                                                    "{order.notes}"
                                                </p>
                                            ) : (
                                                <p className="text-sm text-muted-foreground italic flex items-center justify-center h-full min-h-[80px]">
                                                    No internal notes recorded for this order.
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Invoice Image Section */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        <IconPhoto className="h-4 w-4" />
                                        <span>Invoice Image Attachment</span>
                                    </div>
                                    {order?.invoice_image_path ? (
                                        <Card className="overflow-hidden">
                                            <CardContent className="p-0 relative group">
                                                <img 
                                                    src={order.invoice_image_path} 
                                                    alt="Invoice" 
                                                    className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-105"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                                    <a 
                                                        href={order.invoice_image_path} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="opacity-0 group-hover:opacity-100 bg-white text-black px-4 py-2 rounded-full font-medium text-[10px] uppercase tracking-wider shadow-xl transition-all hover:scale-105 active:scale-95"
                                                    >
                                                        View Full Size
                                                    </a>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <Card className="border-dashed">
                                            <CardContent className="flex flex-col items-center justify-center p-12 text-muted-foreground gap-3">
                                                <IconPhoto className="h-8 w-8 opacity-50" />
                                                <p className="text-xs font-medium uppercase tracking-wider opacity-60">
                                                    No invoice image uploaded
                                                </p>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </div>
                        </ScrollArea>

                        {/* Footer */}
                        <div className="shrink-0 p-4 border-t bg-muted/30 flex justify-end">
                            <Badge variant="secondary" className="text-[10px] font-medium uppercase tracking-tight">
                                Order Reference: {order?.id}
                            </Badge>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default SalesOrderInfoDialog;