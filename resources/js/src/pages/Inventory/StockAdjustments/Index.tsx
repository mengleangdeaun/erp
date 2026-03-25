import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/button';
import { toast } from 'sonner';
import { PlusCircle, ClipboardList, Info, Trash2, CheckCircle2, Clock, X } from 'lucide-react';
import { IconAdjustments, IconHistory, IconPlus } from '@tabler/icons-react';
import { format } from 'date-fns';
import { useFormatDate } from '@/hooks/useFormatDate';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';

// Custom components
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import ActionButtons from '../../../components/ui/ActionButtons';
import DeleteModal from '../../../components/DeleteModal';
import ConfirmationModal from '../../../components/ConfirmationModal';
import RejectModal from '../../../components/RejectModal';
import DetailDialog from './DetailDialog';
import HighlightText from '../../../components/ui/HighlightText';

interface StockAdjustment {
    id: number;
    adjustment_no: string;
    date: string;
    status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
    notes: string | null;
    user: { name: string };
    approved_by?: { name: string };
    items: any[];
}

const STATUS_CONFIG: Record<string, { label: string; class: string; icon: any }> = {
    DRAFT: { 
        label: 'Draft', 
        class: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
        icon: Clock
    },
    PENDING: { 
        label: 'Pending Approval', 
        class: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
        icon: Clock
    },
    APPROVED: { 
        label: 'Approved', 
        class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
        icon: CheckCircle2
    },
    REJECTED: { 
        label: 'Rejected', 
        class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
        icon: X
    },
};

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

import { useStockAdjustments, useDeleteStockAdjustment, useApproveStockAdjustment, useRejectStockAdjustment } from '@/hooks/useInventoryData';

const StockAdjustmentsPage = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { formatDate } = useFormatDate();

    // Filter, sort, pagination state
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // TanStack Query Hooks
    const { data, isLoading: loading, refetch: fetchData } = useStockAdjustments({
        search,
        limit: itemsPerPage,
        page: currentPage,
    });
    const adjustments = data?.data || [];
    const totalItems = data?.total || 0;
    const totalPages = data?.last_page || 1;

    const deleteMutation = useDeleteStockAdjustment();
    const approveMutation = useApproveStockAdjustment();
    const rejectMutation = useRejectStockAdjustment();

    // Delete modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);

    // Approve modal state
    const [approveModalOpen, setApproveModalOpen] = useState(false);
    const [itemToApprove, setItemToApprove] = useState<number | null>(null);

    // Reject modal state
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [itemToReject, setItemToReject] = useState<number | null>(null);

    // Detail dialog state
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedDetailId, setSelectedDetailId] = useState<number | null>(null);

    useEffect(() => {
        dispatch(setPageTitle(t('stock_adjustments')));
    }, [dispatch, t]);

    const confirmDelete = (id: number) => {
        setItemToDelete(id);
        setDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!itemToDelete) return;
        deleteMutation.mutate(itemToDelete, {
            onSuccess: () => {
                setDeleteModalOpen(false);
                setItemToDelete(null);
            }
        });
    };

    const handleApprove = (id: number) => {
        setItemToApprove(id);
        setApproveModalOpen(true);
    };

    const executeApprove = async () => {
        if (!itemToApprove) return;
        approveMutation.mutate(itemToApprove, {
            onSuccess: () => {
                setApproveModalOpen(false);
                setItemToApprove(null);
            }
        });
    };

    const handleReject = (id: number) => {
        setItemToReject(id);
        setRejectModalOpen(true);
    };

    const executeReject = async (reason: string) => {
        if (!itemToReject) return;
        rejectMutation.mutate({ id: itemToReject, reason }, {
            onSuccess: () => {
                setRejectModalOpen(false);
                setItemToReject(null);
            }
        });
    };

    const filteredAndSorted = useMemo(() => {
        let result = [...adjustments];
        result.sort((a, b) => {
            let valA: any = a[sortBy as keyof StockAdjustment] || '';
            let valB: any = b[sortBy as keyof StockAdjustment] || '';

            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        return result;
    }, [adjustments, sortBy, sortDirection]);

    return (
        <div>
            <FilterBar
                icon={<IconAdjustments className="w-6 h-6 text-primary" />}
                title={t('stock_adjustments')}
                description={t('manage_corrections_desc')}
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onAdd={() => window.location.href = '/inventory/stock-adjustments/create'}
                addLabel={t('new_adjustment')}
                onRefresh={() => { fetchData(); }}
            />

            {loading ? (
                <TableSkeleton columns={6} rows={5} />
            ) : adjustments.length === 0 ? (
                <EmptyState
                    title={t('no_adjustments_found')}
                    description={t('manual_corrections_appear_here')}
                    actionLabel={t('new_adjustment')}
                    onAction={() => window.location.href = '/inventory/stock-adjustments/create'}
                />
            ) : (
                <div className="table-responsive bg-white dark:bg-black rounded-lg shadow-sm border">
                    <table className="table-hover table-striped w-full table">
                        <thead>
                            <tr>
                                <SortableHeader
                                    label={t('adj_number')}
                                    value="adjustment_no"
                                    currentSortBy={sortBy}
                                    currentDirection={sortDirection}
                                    onSort={setSortBy}
                                />
                                <SortableHeader
                                    label={t('date')}
                                    value="date"
                                    currentSortBy={sortBy}
                                    currentDirection={sortDirection}
                                    onSort={setSortBy}
                                />
                                <th className="px-4 py-3 text-left">{t('items')}</th>
                                <th>{t('reason_note')}</th>
                                <SortableHeader
                                    label={t('status')}
                                    value="status"
                                    currentSortBy={sortBy}
                                    currentDirection={sortDirection}
                                    onSort={setSortBy}
                                />
                                <th className="text-right">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSorted.map(adj => {
                                const StatusIcon = STATUS_CONFIG[adj.status]?.icon || Info;
                                return (
                                    <tr key={adj.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="font-mono font-semibold text-primary">
                                            <HighlightText text={adj.adjustment_no} highlight={search} />
                                        </td>
                                        <td className="text-gray-600 dark:text-gray-300">
                                            {formatDate(adj.date)}
                                        </td>
                                        <td>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {adj.items.length} {adj.items.length !== 1 ? t('products') : t('product')}
                                                </span>
                                                <span className="text-[10px] text-gray-400 truncate max-w-[200px]">
                                                    {adj.items.slice(0, 2).map((i: any, idx: number) => (
                                                        <span key={idx}>
                                                            <HighlightText text={i.product?.name} highlight={search} />
                                                            {idx < Math.min(adj.items.length, 2) - 1 ? ', ' : ''}
                                                        </span>
                                                    ))}
                                                    {adj.items.length > 2 ? '...' : ''}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="text-gray-500 max-w-xs truncate italic">
                                            <HighlightText text={adj.notes || '-'} highlight={search} />
                                        </td>
                                        <td>
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[adj.status]?.class}`}>
                                                <StatusIcon className="w-3 h-3" />
                                                {t(adj.status.toLowerCase())}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            <ActionButtons
                                                onEdit={adj.status === 'DRAFT' || adj.status === 'PENDING' ? () => window.location.href = `/inventory/stock-adjustments/${adj.id}/edit` : undefined}
                                                onDelete={adj.status === 'DRAFT' || adj.status === 'PENDING' ? () => confirmDelete(adj.id) : undefined}
                                                onView={() => {
                                                    setSelectedDetailId(adj.id);
                                                    setDetailOpen(true);
                                                }}
                                                onApprove={adj.status === 'PENDING' ? () => handleApprove(adj.id) : undefined}
                                                onReject={adj.status === 'PENDING' ? () => handleReject(adj.id) : undefined}
                                                skipDeleteConfirm
                                                skipRejectConfirm
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    <div className="border-t border-gray-100 dark:border-gray-800">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={totalItems}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </div>
            )}

            <DeleteModal
                isOpen={deleteModalOpen}
                setIsOpen={setDeleteModalOpen}
                onConfirm={executeDelete}
                isLoading={deleteMutation.isPending}
                title={t('delete_adjustment')}
                message={t('delete_adj_confirm')}
            />

            <ConfirmationModal
                isOpen={approveModalOpen}
                setIsOpen={setApproveModalOpen}
                onConfirm={executeApprove}
                loading={approveMutation.isPending}
                title={t('approve_stock_adjustment')}
                description={t('approve_adj_confirm')}
                confirmText={t('approve_adjustment')}
                confirmVariant="success"
            />

            <RejectModal
                isOpen={rejectModalOpen}
                setIsOpen={setRejectModalOpen}
                onConfirm={executeReject}
                loading={rejectMutation.isPending}
                title={t('reject_stock_adjustment')}
                description={t('reject_adj_description')}
            />

            <DetailDialog
                isOpen={detailOpen}
                onClose={() => {
                    setDetailOpen(false);
                    setSelectedDetailId(null);
                }}
                adjustmentId={selectedDetailId}
            />
        </div>
    );
}

export default StockAdjustmentsPage;
