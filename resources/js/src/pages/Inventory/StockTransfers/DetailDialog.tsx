import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { toast } from 'sonner';
import { CheckCircle2, Clock, Calendar, User, FileText, Package, XCircle, MapPin, ArrowRight } from 'lucide-react';
import { useFormatDate } from '@/hooks/useFormatDate';
import { IconArrowsExchange } from '@tabler/icons-react';
import TableSkeleton from '../../../components/ui/TableSkeleton';

interface TransferItem {
    id: number;
    product: { name: string; code: string };
    quantity: number;
}

interface Transfer {
    id: number;
    transfer_no: string;
    date: string;
    status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
    notes: string | null;
    user: { name: string };
    from_location: { name: string };
    to_location: { name: string };
    approved_by?: { name: string };
    approved_at?: string;
    rejected_by?: { name: string };
    rejected_at?: string;
    rejected_reason?: string;
    items: TransferItem[];
}

interface DetailDialogProps {
    isOpen: boolean;
    onClose: () => void;
    transferId: number | null;
}

const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
};

const apiFetch = (url: string, options: RequestInit = {}) =>
    fetch(url, {
        ...options,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
            ...(options.headers || {}),
        },
        credentials: 'include',
    });

export default function DetailDialog({ isOpen, onClose, transferId }: DetailDialogProps) {
    const { formatDate } = useFormatDate();
    const [transfer, setTransfer] = useState<Transfer | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && transferId) {
            fetchTransfer();
        }
    }, [isOpen, transferId]);

    const fetchTransfer = async () => {
        setLoading(true);
        try {
            const res = await apiFetch(`/api/inventory/stock-transfers/${transferId}`);
            if (res.ok) {
                setTransfer(await res.json());
            } else {
                toast.error('Failed to load transfer details');
            }
        } catch {
            toast.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (!transferId) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl rounded-2xl [&>button]:hidden">
                {loading ? (
                    <div className="p-12">
                        <TableSkeleton columns={3} rows={6} />
                    </div>
                ) : transfer ? (
                    <div className="flex flex-col">
                        {/* Header Section */}
                        <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-black p-6 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="bg-primary/10 p-3 rounded-xl border border-primary/20 shadow-sm shrink-0">
                                        <IconArrowsExchange className="w-7 h-7 text-primary" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{transfer.transfer_no}</h2>
                                            {(transfer.status === 'APPROVED' || transfer.status === 'COMPLETED') && (
                                                <span className="bg-green-100 text-green-700 text-[10px] px-2.5 py-0.5 rounded-full uppercase font-bold flex items-center gap-1 border border-green-200 shadow-sm">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                                                </span>
                                            )}
                                            {transfer.status === 'PENDING' && (
                                                <span className="bg-yellow-100 text-yellow-700 text-[10px] px-2.5 py-0.5 rounded-full uppercase font-bold flex items-center gap-1 border border-yellow-200 shadow-sm">
                                                    <Clock className="w-3 h-3" /> Pending
                                                </span>
                                            )}
                                            {transfer.status === 'REJECTED' && (
                                                <span className="bg-red-100 text-red-700 text-[10px] px-2.5 py-0.5 rounded-full uppercase font-bold flex items-center gap-1 border border-red-200 shadow-sm">
                                                    <XCircle className="w-3 h-3" /> Rejected
                                                </span>
                                            )}
                                            {transfer.status === 'DRAFT' && (
                                                <span className="bg-gray-100 text-gray-700 text-[10px] px-2.5 py-0.5 rounded-full uppercase font-bold flex items-center gap-1 border border-gray-200 shadow-sm">
                                                    <Clock className="w-3 h-3" /> Draft
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 font-medium tracking-tight">Movement initiated on {formatDate(transfer.date)}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                     <Button variant="outline" size="sm" onClick={onClose} className="rounded-lg h-9">
                                        Close
                                    </Button>
                                    {(transfer.status === 'DRAFT' || transfer.status === 'PENDING') && (
                                        <Button 
                                            size="sm"
                                            className="rounded-lg h-9"
                                            onClick={() => window.location.href = `/inventory/stock-transfers/${transfer.id}/edit`}
                                        >
                                            Edit Transfer
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-white dark:bg-black">
                            {/* Meta Column */}
                            <div className="md:col-span-1 space-y-4">
                                <div className="space-y-4">
                                    {/* Route Card */}
                                    <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/10 space-y-4">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1 flex flex-col items-center">
                                                <div className="w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white dark:border-gray-900 z-10 shadow-sm" />
                                                <div className="w-0.5 h-12 bg-gray-100 dark:bg-gray-800 my-1" />
                                                <div className="w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white dark:border-gray-900 z-10 shadow-sm" />
                                            </div>
                                            <div className="flex-1 space-y-6">
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-red-500">Source Location</p>
                                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{transfer.from_location.name}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-green-600">Destination</p>
                                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{transfer.to_location.name}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                                        <Calendar className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Transfer Date</p>
                                            <p className="text-sm font-semibold">{formatDate(transfer.date)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                                        <User className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Initiated By</p>
                                            <p className="text-sm font-semibold">{transfer.user.name}</p>
                                        </div>
                                    </div>
                                    {transfer.approved_by && (
                                        <div className="flex items-start gap-3 p-3 rounded-xl bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-green-600">Approved By</p>
                                                <p className="text-sm font-bold text-green-700">{transfer.approved_by.name}</p>
                                                <p className="text-[10px] text-gray-400">{transfer.approved_at && formatDate(transfer.approved_at)}</p>
                                            </div>
                                        </div>
                                    )}
                                    {transfer.status === 'REJECTED' && transfer.rejected_by && (
                                        <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
                                            <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-red-600">Rejected By</p>
                                                <p className="text-sm font-bold text-red-700">{transfer.rejected_by.name}</p>
                                                <p className="text-[10px] text-gray-400">{transfer.rejected_at && formatDate(transfer.rejected_at)}</p>
                                                <div className="mt-2 text-xs text-red-700 italic bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 p-2 rounded">
                                                    "{transfer.rejected_reason}"
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                                        <div className="flex items-start gap-3 p-3">
                                            <FileText className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Internal Notes</p>
                                                <p className="text-sm italic text-gray-600 dark:text-gray-400 leading-relaxed">
                                                    {transfer.notes || 'No notes provided.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Items Column */}
                            <div className="md:col-span-2">
                                <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                                    <div className="bg-gray-50/80 dark:bg-gray-900/80 px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                            <Package className="w-4 h-4" /> Transfer List
                                        </h3>
                                        <span className="text-[10px] font-black px-2.5 py-1 bg-primary/10 text-primary rounded-lg uppercase tracking-widest">
                                            {transfer.items.length} Product(s)
                                        </span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm border-collapse">
                                            <thead>
                                                <tr className="bg-gray-50/30 dark:bg-gray-900/10 text-[10px] uppercase font-black text-gray-400 tracking-widest">
                                                    <th className="px-6 py-4 text-left">Product / SKU</th>
                                                    <th className="px-6 py-4 text-right">Transfer Quantity</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                                {transfer.items.map((item) => (
                                                    <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/5 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-gray-900 dark:text-white leading-tight">{item.product.name}</span>
                                                                <span className="text-[10px] font-mono text-gray-400 mt-1 tracking-widest uppercase">{item.product.code}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-3 font-black text-primary text-lg tabular-nums">
                                                                <span>{parseFloat(item.quantity.toString())}</span>
                                                                <ArrowRight className="w-4 h-4 text-primary/30" />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
