import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '../../../components/ui/button';
import { toast } from 'sonner';
import { PlusCircle, ClipboardList, Info, Trash2, CheckCircle2, Clock, X, ArrowRight } from 'lucide-react';
import { IconArrowsExchange, IconHistory, IconPlus } from '@tabler/icons-react';
import { useFormatDate } from '@/hooks/useFormatDate';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';

// Custom components
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import DeleteModal from '../../../components/DeleteModal';
import ActionButtons from '../../../components/ui/ActionButtons';

import ConfirmationModal from '../../../components/ConfirmationModal';
import RejectModal from '../../../components/RejectModal';
import DetailDialog from './DetailDialog';

interface StockTransfer {
    id: number;
    transfer_no: string;
    date: string;
    from_location: { name: string };
    to_location: { name: string };
    status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
    notes: string | null;
    user: { name: string };
    items: any[];
}

const STATUS_CONFIG: Record<string, { label: string; class: string; icon: any }> = {
    DRAFT: { 
        label: 'Draft', 
        class: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
        icon: Clock
    },
    PENDING: { 
        label: 'Pending', 
        class: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
        icon: Clock
    },
    APPROVED: { 
        label: 'Approved', 
        class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
        icon: CheckCircle2
    },
    COMPLETED: { 
        label: 'Completed', 
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

import { useStockTransfers, useDeleteStockTransfer, useApproveStockTransfer, useRejectStockTransfer } from '@/hooks/useInventoryData';

export default function StockTransfersPage() {
    const dispatch = useDispatch();
    const { formatDate } = useFormatDate();

    // Filter, sort, pagination state
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // TanStack Query Hooks
    const { data, isLoading: loading, refetch: fetchData } = useStockTransfers({
        search,
        limit: itemsPerPage,
        page: currentPage,
    });
    const transfers = data?.data || [];
    const totalItems = data?.total || 0;
    const totalPages = data?.last_page || 1;

    const deleteMutation = useDeleteStockTransfer();
    const approveMutation = useApproveStockTransfer();
    const rejectMutation = useRejectStockTransfer();

    // Delete modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);

    // Detail, Approve, Reject state
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedTransferId, setSelectedTransferId] = useState<number | null>(null);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle('Stock Transfers'));
    }, [dispatch]);

    const confirmDelete = (id: number) => {
        setItemToDelete(id);
        setDeleteModalOpen(true);
    };

    const handleApprove = async () => {
        if (!selectedTransferId) return;
        approveMutation.mutate(selectedTransferId, {
            onSuccess: () => {
                setConfirmModalOpen(false);
            }
        });
    };

    const handleReject = async (reason: string) => {
        if (!selectedTransferId) return;
        rejectMutation.mutate({ id: selectedTransferId, reason }, {
            onSuccess: () => {
                setRejectModalOpen(false);
            }
        });
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

    const filteredAndSorted = useMemo(() => {
        let result = [...transfers];
        result.sort((a, b) => {
            let valA: any = a[sortBy as keyof StockTransfer] || '';
            let valB: any = b[sortBy as keyof StockTransfer] || '';

            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        return result;
    }, [transfers, sortBy, sortDirection]);

    return (
        <div>
            <FilterBar
                icon={<IconArrowsExchange className="w-6 h-6 text-primary" />}
                title="Stock Transfers"
                description="Movement of inventory between locations"
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onAdd={() => window.location.href = '/inventory/stock-transfers/create'}
                addLabel="New Transfer"
                onRefresh={() => { fetchData(); }}
            />

            {loading ? (
                <TableSkeleton columns={6} rows={5} />
            ) : transfers.length === 0 ? (
                <EmptyState
                    title="No Stock Transfers Found"
                    description="Inventory movements between locations will appear here."
                    actionLabel="New Transfer"
                    onAction={() => window.location.href = '/inventory/stock-transfers/create'}
                />
            ) : (
                <div className="table-responsive bg-white dark:bg-black rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
                    <table className="table-hover table-striped w-full table">
                        <thead>
                            <tr>
                                <SortableHeader
                                    label="TRF Number"
                                    value="transfer_no"
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
                                <th className="px-4 py-3 text-left">Movement</th>
                                <th className="px-4 py-3 text-left">Items</th>
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
                            {filteredAndSorted.map(trf => {
                                const StatusIcon = STATUS_CONFIG[trf.status]?.icon || Info;
                                return (
                                    <tr key={trf.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="font-mono font-semibold text-primary">{trf.transfer_no}</td>
                                        <td className="text-gray-600 dark:text-gray-300">
                                            {formatDate(trf.date)}
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className="font-bold text-gray-700 dark:text-gray-300">{trf.from_location?.name}</span>
                                                <ArrowRight className="w-3 h-3 text-gray-400" />
                                                <span className="font-bold text-primary">{trf.to_location?.name}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900 dark:text-white text-xs">
                                                    {trf.items.length} Item(s)
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-tight ${STATUS_CONFIG[trf.status]?.class}`}>
                                                <StatusIcon className="w-3 h-3" />
                                                {STATUS_CONFIG[trf.status]?.label}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <ActionButtons
                                                    onApprove={trf.status?.toUpperCase() === 'PENDING' ? () => {
                                                        setSelectedTransferId(trf.id);
                                                        setConfirmModalOpen(true);
                                                    } : undefined}
                                                    onReject={trf.status?.toUpperCase() === 'PENDING' ? () => {
                                                        setSelectedTransferId(trf.id);
                                                        setRejectModalOpen(true);
                                                    } : undefined}
                                                    onEdit={trf.status?.toUpperCase() === 'DRAFT' || trf.status?.toUpperCase() === 'PENDING' ? () => window.location.href = `/inventory/stock-transfers/${trf.id}/edit` : undefined}
                                                    onDelete={trf.status?.toUpperCase() === 'DRAFT' || trf.status?.toUpperCase() === 'PENDING' ? () => confirmDelete(trf.id) : undefined}
                                                    onView={() => {
                                                        setSelectedTransferId(trf.id);
                                                        setDetailOpen(true);
                                                    }}
                                                    skipDeleteConfirm
                                                    skipRejectConfirm
                                                />
                                            </div>
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
                title="Delete Transfer"
                message="Are you sure you want to delete this draft transfer? This action cannot be undone."
            />

            <DetailDialog
                isOpen={detailOpen}
                onClose={() => setDetailOpen(false)}
                transferId={selectedTransferId}
            />

            <ConfirmationModal
                isOpen={confirmModalOpen}
                setIsOpen={setConfirmModalOpen}
                onConfirm={handleApprove}
                loading={approveMutation.isPending}
                title="Approve Stock Transfer"
                description="Are you sure you want to approve this transfer? This will immediately move the items from the source to the destination location."
                confirmText="Yes, Approve Transfer"
            />

            <RejectModal
                isOpen={rejectModalOpen}
                setIsOpen={setRejectModalOpen}
                onConfirm={handleReject}
                loading={rejectMutation.isPending}
                title="Reject Stock Transfer"
                description="Please provide a reason for rejecting this stock transfer."
            />
        </div>
    );
}
