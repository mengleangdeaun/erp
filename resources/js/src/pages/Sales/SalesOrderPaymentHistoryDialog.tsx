import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    IconReceipt, IconUser, IconHistory, IconFileText,
    IconZoomIn, IconX, IconDownload, IconEdit
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { useSalesOrder, useDeleteSalesOrderDeposit } from '@/hooks/usePOSData';
import { Skeleton } from '@/components/ui/skeleton';
import EditPaymentDialog from './EditPaymentDialog';
import DeleteModal from '@/components/DeleteModal';

interface SalesOrderPaymentHistoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orderId: number | null;
}

const SalesOrderPaymentHistoryDialog: React.FC<SalesOrderPaymentHistoryDialogProps> = ({ open, onOpenChange, orderId }) => {
    const { data: order, isLoading } = useSalesOrder(orderId);
    const deleteDepositMutation = useDeleteSalesOrderDeposit();
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [editingDeposit, setEditingDeposit] = useState<any>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [depositIdToDelete, setDepositIdToDelete] = useState<number | null>(null);

    const handleDelete = (id: number) => {
        setDepositIdToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (depositIdToDelete) {
            deleteDepositMutation.mutate(depositIdToDelete, {
                onSuccess: () => {
                    setIsDeleteModalOpen(false);
                    setDepositIdToDelete(null);
                }
            });
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
            <div className="space-y-3">
                {[1, 2].map(i => (
                    <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
            </div>
        </div>
    );

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white dark:bg-zinc-950">
                    {isLoading ? renderLoading() : (
                        <div className="flex flex-col max-h-[90vh]">
                            {/* Header */}
                            <DialogHeader className="p-6 pb-4 shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black text-xl">
                                        <IconHistory size={28} />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3 text-zinc-900 dark:text-white">
                                            Payment History
                                        </DialogTitle>
                                        <p className="text-xs font-bold text-zinc-400 mt-1 uppercase tracking-widest">
                                            Order #{order?.order_no || '...'}
                                        </p>
                                    </div>
                                </div>
                            </DialogHeader>

                            {/* Customer Info Mini-Card */}
                            <div className="px-6 pb-4 shrink-0">
                                <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border dark:border-zinc-800">
                                    <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center text-zinc-400 shadow-sm border dark:border-zinc-700">
                                        <IconUser size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[8px] font-black uppercase text-zinc-400 tracking-widest leading-none mb-1">Customer</p>
                                        <p className="font-bold text-xs text-zinc-900 dark:text-white truncate">{order?.customer?.name || 'Walk-in'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Payments List - Native Scroll */}
                            <div className="flex-1 overflow-y-auto px-6 py-2 min-h-0 custom-scrollbar" style={{ maxHeight: 'calc(90vh - 250px)' }}>
                                <div className="space-y-3 pb-8">
                                    {order?.deposits?.length > 0 ? (
                                        order.deposits.map((dep: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between p-4 rounded-xl border dark:border-zinc-800 bg-white dark:bg-black/20 group hover:shadow-md transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/10">
                                                        <IconReceipt size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-base tracking-tight text-zinc-900 dark:text-white">
                                                            ${parseFloat(dep.amount).toFixed(2)}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-zinc-400 flex flex-wrap items-center gap-x-2 mt-0.5">
                                                            <span className="flex items-center gap-1"><IconFileText size={12} /> {dep.payment_account?.name}</span>
                                                            <span className="opacity-30">&bull;</span>
                                                            {dep.deposit_date && <span>{format(new Date(dep.deposit_date), 'dd MMM yyyy')}</span>}
                                                            <span className="opacity-30">&bull;</span>
                                                            <span>By {dep.creator?.name || '...'}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {dep.receipt_path && (
                                                        <Badge
                                                            variant="outline"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setPreviewImage(dep.receipt_path);
                                                            }}
                                                            className="h-8 gap-1.5 text-[9px] font-black uppercase tracking-tighter cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors border-emerald-500/20 text-emerald-600"
                                                        >
                                                            <IconZoomIn size={12} /> Receipt
                                                        </Badge>
                                                    )}

                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setEditingDeposit(dep)}
                                                            className="h-8 w-8 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                                                        >
                                                            <IconEdit size={16} />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDelete(dep.id)}
                                                            className="h-8 w-8 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                                        >
                                                            <IconX size={16} />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-20 flex flex-col items-center justify-center text-zinc-300">
                                            <IconHistory size={48} stroke={1} />
                                            <p className="text-sm font-bold mt-4">No payment history found</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Sticky Financial Summary Footer */}
                            <div className="shrink-0 p-6 bg-zinc-900 dark:bg-zinc-50 border-t dark:border-zinc-200 shadow-2xl">
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="text-center md:text-left">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">Total Due</p>
                                        <p className="text-xl font-black tabular-nums text-white dark:text-black">
                                            ${parseFloat(order?.grand_total || 0).toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="text-center md:text-left border-l border-white/10 dark:border-zinc-200 pl-6">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">Total Paid</p>
                                        <p className="text-xl font-black tabular-nums text-emerald-400 dark:text-emerald-500">
                                            ${parseFloat(order?.paid_amount || 0).toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="text-center md:text-left border-l border-white/10 dark:border-zinc-200 pl-6">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">Balance</p>
                                        <p className="text-xl font-black tabular-nums text-rose-400 dark:text-rose-500">
                                            ${parseFloat(order?.balance_amount || 0).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Receipt Preview Overlay */}
            <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none shadow-none focus:outline-none [&>button]:hidden">
                    <div className="relative group">
                        <img
                            src={previewImage || ''}
                            alt="Receipt Preview"
                            className="w-full h-auto max-h-[85vh] object-contain rounded-xl shadow-2xl"
                        />
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <IconX size={20} stroke={3} />
                        </button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                            <a
                                href={previewImage || ''}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/90 dark:bg-zinc-900/90 text-zinc-900 dark:text-white font-black text-[10px] uppercase tracking-widest shadow-xl backdrop-blur-md hover:scale-105 transition-all"
                            >
                                <IconDownload size={14} /> Download Original
                            </a>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Payment Dialog */}
            <EditPaymentDialog
                open={!!editingDeposit}
                onOpenChange={(open) => !open && setEditingDeposit(null)}
                deposit={editingDeposit}
                order={order}
                onSuccess={() => onOpenChange(false)}
            />

            <DeleteModal
                isOpen={isDeleteModalOpen}
                setIsOpen={setIsDeleteModalOpen}
                onConfirm={confirmDelete}
                isLoading={deleteDepositMutation.isPending}
                title="Delete Payment Record"
                message="Are you sure you want to delete this payment record? This will increase the order balance and revert the payment status if necessary."
            />
        </>
    );
};

export default SalesOrderPaymentHistoryDialog;
