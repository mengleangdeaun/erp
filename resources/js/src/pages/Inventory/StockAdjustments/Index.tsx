import { useState, useEffect, useCallback, useMemo } from 'react';
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

export default function StockAdjustmentsPage() {
    const dispatch = useDispatch();
    const { formatDate } = useFormatDate();
    const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter, sort, pagination state
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Delete modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Approve modal state
    const [approveModalOpen, setApproveModalOpen] = useState(false);
    const [itemToApprove, setItemToApprove] = useState<number | null>(null);
    const [isApproving, setIsApproving] = useState(false);

    // Reject modal state
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [itemToReject, setItemToReject] = useState<number | null>(null);
    const [isRejecting, setIsRejecting] = useState(false);

    // Detail dialog state
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedDetailId, setSelectedDetailId] = useState<number | null>(null);

    useEffect(() => {
        dispatch(setPageTitle('Stock Adjustments'));
    }, [dispatch]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                search: search,
                limit: String(itemsPerPage),
                page: String(currentPage),
            });
            const res = await apiFetch(`/api/inventory/stock-adjustments?${params.toString()}`);
            if (res.status === 401) {
                window.location.href = '/auth/login';
                return;
            }
            const data = await res.json();
            setAdjustments(data.data || []);
        } catch {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [search, currentPage, itemsPerPage]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const confirmDelete = (id: number) => {
        setItemToDelete(id);
        setDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        try {
            const res = await apiFetch(`/api/inventory/stock-adjustments/${itemToDelete}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Adjustment deleted');
                fetchData();
            } else {
                const err = await res.json();
                toast.error(err.message || 'Failed to delete');
            }
        } catch {
            toast.error('An error occurred');
        } finally {
            setIsDeleting(false);
            setDeleteModalOpen(false);
            setItemToDelete(null);
        }
    };

    const handleApprove = (id: number) => {
        setItemToApprove(id);
        setApproveModalOpen(true);
    };

    const executeApprove = async () => {
        if (!itemToApprove) return;
        setIsApproving(true);
        try {
            const res = await apiFetch(`/api/inventory/stock-adjustments/${itemToApprove}/approve`, { method: 'POST' });
            if (res.ok) {
                toast.success('Adjustment approved');
                fetchData();
            } else {
                const err = await res.json();
                toast.error(err.message || 'Failed to approve');
            }
        } catch {
            toast.error('An error occurred');
        } finally {
            setIsApproving(false);
            setApproveModalOpen(false);
            setItemToApprove(null);
        }
    };

    const handleReject = (id: number) => {
        setItemToReject(id);
        setRejectModalOpen(true);
    };

    const executeReject = async (reason: string) => {
        if (!itemToReject) return;
        setIsRejecting(true);
        try {
            const res = await apiFetch(`/api/inventory/stock-adjustments/${itemToReject}/reject`, {
                method: 'POST',
                body: JSON.stringify({ reason })
            });
            if (res.ok) {
                toast.success('Adjustment rejected');
                fetchData();
            } else {
                const err = await res.json();
                toast.error(err.message || 'Failed to reject');
            }
        } catch {
            toast.error('An error occurred');
        } finally {
            setIsRejecting(false);
            setRejectModalOpen(false);
            setItemToReject(null);
        }
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
                title="Stock Adjustments"
                description="Manage manual stock corrections and audit trails"
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onAdd={() => window.location.href = '/inventory/stock-adjustments/create'}
                addLabel="New Adjustment"
                onRefresh={fetchData}
            />

            {loading ? (
                <TableSkeleton columns={6} rows={5} />
            ) : adjustments.length === 0 ? (
                <EmptyState
                    title="No Stock Adjustments Found"
                    description="Manual stock corrections will appear here."
                    actionLabel="New Adjustment"
                    onAction={() => window.location.href = '/inventory/stock-adjustments/create'}
                />
            ) : (
                <div className="table-responsive bg-white dark:bg-black rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
                    <table className="table-hover table-striped w-full table">
                        <thead>
                            <tr>
                                <SortableHeader
                                    label="Adj Number"
                                    value="adjustment_no"
                                    currentSortBy={sortBy}
                                    currentDirection={sortDirection}
                                    onSort={setSortBy}
                                />
                                <SortableHeader
                                    label="Date"
                                    value="date"
                                    currentSortBy={sortBy}
                                    currentDirection={sortDirection}
                                    onSort={setSortBy}
                                />
                                <th className="px-4 py-3 text-left">Items</th>
                                <th>Reason / Note</th>
                                <SortableHeader
                                    label="Status"
                                    value="status"
                                    currentSortBy={sortBy}
                                    currentDirection={sortDirection}
                                    onSort={setSortBy}
                                />
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSorted.map(adj => {
                                const StatusIcon = STATUS_CONFIG[adj.status]?.icon || Info;
                                return (
                                    <tr key={adj.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="font-mono font-semibold text-primary">{adj.adjustment_no}</td>
                                        <td className="text-gray-600 dark:text-gray-300">
                                            {formatDate(adj.date)}
                                        </td>
                                        <td>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {adj.items.length} Product{adj.items.length !== 1 ? 's' : ''}
                                                </span>
                                                <span className="text-[10px] text-gray-400 truncate max-w-[200px]">
                                                    {adj.items.slice(0, 2).map((i: any) => i.product?.name).join(', ')}
                                                    {adj.items.length > 2 ? '...' : ''}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="text-gray-500 max-w-xs truncate italic">
                                            {adj.notes || '-'}
                                        </td>
                                        <td>
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[adj.status]?.class}`}>
                                                <StatusIcon className="w-3 h-3" />
                                                {STATUS_CONFIG[adj.status]?.label}
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
                            totalPages={1} // For now, handle pagination better later
                            totalItems={filteredAndSorted.length}
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
                isLoading={isDeleting}
                title="Delete Adjustment"
                message="Are you sure you want to delete this draft adjustment? This action cannot be undone."
            />

            <ConfirmationModal
                isOpen={approveModalOpen}
                setIsOpen={setApproveModalOpen}
                onConfirm={executeApprove}
                loading={isApproving}
                title="Approve Stock Adjustment"
                description="Are you sure you want to approve this adjustment? This will update the inventory stock levels permanently."
                confirmText="Approve Adjustment"
                confirmVariant="success"
            />

            <RejectModal
                isOpen={rejectModalOpen}
                setIsOpen={setRejectModalOpen}
                onConfirm={executeReject}
                loading={isRejecting}
                title="Reject Stock Adjustment"
                description="Please provide a clear reason for rejecting this adjustment. This will be visible to the user who created it."
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
