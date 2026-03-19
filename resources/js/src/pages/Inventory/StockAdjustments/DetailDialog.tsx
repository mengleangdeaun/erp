import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { toast } from 'sonner';
import { CheckCircle2, Clock, Calendar, User, FileText, Package, XCircle, MapPin, TrendingUp, TrendingDown } from 'lucide-react';
import { useFormatDate } from '@/hooks/useFormatDate';
import { IconAdjustments } from '@tabler/icons-react';
import TableSkeleton from '../../../components/ui/TableSkeleton';

interface AdjustmentItem {
    id: number;
    product: { name: string; code: string };
    location: { name: string };
    current_qty: number;
    adjustment_qty: number;
    new_qty: number;
    reason: string | null;
}

interface Adjustment {
    id: number;
    adjustment_no: string;
    date: string;
    status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
    notes: string | null;
    user: { name: string };
    approved_by?: { name: string };
    approved_at?: string;
    rejected_by?: { name: string };
    rejected_at?: string;
    rejected_reason?: string;
    items: AdjustmentItem[];
}

interface DetailDialogProps {
    isOpen: boolean;
    onClose: () => void;
    adjustmentId: number | null;
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

const REASON_LABELS: Record<string, string> = {
    'ADJUSTMENT_DAMAGE': 'Damage',
    'ADJUSTMENT_FOUND': 'Found',
    'ADJUSTMENT_STOCK_TAKE_CORRECTION': 'Stock Take Correction',
    'ADJUSTMENT_OTHER': 'Other',
    'STOCK_IN_MANUAL': 'Manual Stock In',
    'STOCK_OUT_MANUAL': 'Manual Stock Out',
};

const formatReason = (reason: string | null) => {
    if (!reason) return null;
    return REASON_LABELS[reason] || reason.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

export default function DetailDialog({ isOpen, onClose, adjustmentId }: DetailDialogProps) {
    const { formatDate } = useFormatDate();
    const [adjustment, setAdjustment] = useState<Adjustment | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && adjustmentId) {
            fetchAdjustment();
        }
    }, [isOpen, adjustmentId]);

    const fetchAdjustment = async () => {
        setLoading(true);
        try {
            const res = await apiFetch(`/api/inventory/stock-adjustments/${adjustmentId}`);
            if (res.ok) {
                setAdjustment(await res.json());
            } else {
                toast.error('Failed to load adjustment details');
            }
        } catch {
            toast.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (!adjustmentId) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl rounded-2xl [&>button]:hidden">
                {loading ? (
                    <div className="p-12">
                        <TableSkeleton columns={3} rows={6} />
                    </div>
                ) : adjustment ? (
                    <div className="flex flex-col">
                        {/* Header Section */}
                        <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-black p-6 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="bg-primary/10 p-3 rounded-xl border border-primary/20 shadow-sm shrink-0">
                                        <IconAdjustments className="w-7 h-7 text-primary" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{adjustment.adjustment_no}</h2>
                                            {adjustment.status === 'APPROVED' && (
                                                <span className="bg-green-100 text-green-700 text-[10px] px-2.5 py-0.5 rounded-full uppercase font-bold flex items-center gap-1 border border-green-200 shadow-sm">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                                                </span>
                                            )}
                                            {adjustment.status === 'PENDING' && (
                                                <span className="bg-yellow-100 text-yellow-700 text-[10px] px-2.5 py-0.5 rounded-full uppercase font-bold flex items-center gap-1 border border-yellow-200 shadow-sm">
                                                    <Clock className="w-3 h-3" /> Pending
                                                </span>
                                            )}
                                            {adjustment.status === 'REJECTED' && (
                                                <span className="bg-red-100 text-red-700 text-[10px] px-2.5 py-0.5 rounded-full uppercase font-bold flex items-center gap-1 border border-red-200 shadow-sm">
                                                    <XCircle className="w-3 h-3" /> Rejected
                                                </span>
                                            )}
                                            {adjustment.status === 'DRAFT' && (
                                                <span className="bg-gray-100 text-gray-700 text-[10px] px-2.5 py-0.5 rounded-full uppercase font-bold flex items-center gap-1 border border-gray-200 shadow-sm">
                                                    <Clock className="w-3 h-3" /> Draft
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 font-medium">Created on {formatDate(adjustment.date)}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                     <Button variant="outline" size="sm" onClick={onClose} className="rounded-lg h-9">
                                        Close
                                    </Button>
                                    {(adjustment.status === 'DRAFT' || adjustment.status === 'PENDING') && (
                                        <Button 
                                            size="sm"
                                            className="rounded-lg h-9"
                                            onClick={() => window.location.href = `/inventory/stock-adjustments/${adjustment.id}/edit`}
                                        >
                                            Edit Adjustment
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-white dark:bg-black">
                            {/* Meta Column */}
                            <div className="md:col-span-1 space-y-4">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                                        <Calendar className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Adjustment Date</p>
                                            <p className="text-sm font-semibold">{formatDate(adjustment.date)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                                        <User className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Requested By</p>
                                            <p className="text-sm font-semibold">{adjustment.user.name}</p>
                                        </div>
                                    </div>
                                    {adjustment.status === 'APPROVED' && adjustment.approved_by && (
                                        <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-green-600">Approved By</p>
                                                <p className="text-sm font-bold text-green-700">{adjustment.approved_by.name}</p>
                                                <p className="text-[10px] text-gray-400">{adjustment.approved_at && formatDate(adjustment.approved_at)}</p>
                                            </div>
                                        </div>
                                    )}
                                    {adjustment.status === 'REJECTED' && adjustment.rejected_by && (
                                        <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
                                            <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-red-600">Rejected By</p>
                                                <p className="text-sm font-bold text-red-700">{adjustment.rejected_by.name}</p>
                                                <p className="text-[10px] text-gray-400">{adjustment.rejected_at && formatDate(adjustment.rejected_at)}</p>
                                                <div className="mt-2 text-xs text-red-700 italic bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 p-2 rounded">
                                                    "{adjustment.rejected_reason}"
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                                        <div className="flex items-start gap-3 p-3">
                                            <FileText className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Notes / Remarks</p>
                                                <p className="text-sm italic text-gray-600 dark:text-gray-400 leading-relaxed">
                                                    {adjustment.notes || 'No remarks provided.'}
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
                                            <Package className="w-4 h-4" /> Adjusted Items
                                        </h3>
                                        <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full uppercase tracking-tighter">
                                            {adjustment.items.length} Product(s)
                                        </span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm border-collapse">
                                            <thead>
                                                <tr className="bg-gray-50/30 dark:bg-gray-900/10 text-[10px] uppercase font-bold text-gray-400 tracking-widest">
                                                    <th className="px-4 py-3 text-left">Product / SKU</th>
                                                    <th className="px-4 py-3 text-left">Location</th>
                                                    <th className="px-4 py-3 text-right">Adjustment</th>
                                                    <th className="px-4 py-3 text-right">Final Qty</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                                {adjustment.items.map((item) => (
                                                    <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/5 transition-colors">
                                                        <td className="px-4 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-gray-900 dark:text-white leading-tight">{item.product.name}</span>
                                                                <span className="text-[10px] font-mono text-gray-400 mt-0.5 tracking-tighter uppercase">{item.product.code}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                                                <MapPin className="w-3 h-3 text-gray-300" />
                                                                <span className="font-medium">{item.location.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 text-right">
                                                            <div className="flex flex-col items-end gap-1">
                                                                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold shadow-sm border ${
                                                                    item.adjustment_qty > 0 
                                                                        ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:border-green-800' 
                                                                        : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:border-red-800'
                                                                }`}>
                                                                    {item.adjustment_qty > 0 ? (
                                                                        <TrendingUp className="w-3 h-3" />
                                                                    ) : (
                                                                        <TrendingDown className="w-3 h-3" />
                                                                    )}
                                                                    <span>
                                                                        {item.adjustment_qty > 0 ? '+' : ''}{parseFloat(item.adjustment_qty.toString())}
                                                                    </span>
                                                                </div>
                                                                {item.reason && (
                                                                    <span className="text-[9px] text-gray-400 font-medium italic max-w-[150px] truncate px-1">
                                                                        {formatReason(item.reason)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 text-right">
                                                            <div className="flex flex-col items-end">
                                                                <span className="font-black text-primary text-base tabular-nums">
                                                                    {parseFloat(item.new_qty.toString())}
                                                                </span>
                                                                <span className="text-[9px] text-gray-400 font-medium uppercase tracking-tighter">On Hand</span>
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
