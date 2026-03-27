import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { IconReceipt, IconCar, IconDotsVertical, IconTrash, IconX, IconCoins, IconInfoCircle, IconFilter, IconHistory, IconEdit } from '@tabler/icons-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import FilterBar from '@/components/ui/FilterBar';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useSalesOrders, useCancelSalesOrder } from '@/hooks/usePOSData';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import TableSkeleton from '@/components/ui/TableSkeleton';
import DateRangePicker from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import ActionButtons from '@/components/ui/ActionButtons';
import ConfirmationModal from '@/components/ConfirmationModal';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import RecordPaymentDialog from './RecordPaymentDialog';
import SalesOrderItemDetailsDialog from './SalesOrderItemDetailsDialog';
import SalesOrderPaymentHistoryDialog from './SalesOrderPaymentHistoryDialog';
import SalesOrderInfoDialog from './SalesOrderInfoDialog';

const SalesOrderIndex: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle(t('sales_orders', 'Sales Orders')));
    }, [dispatch, t]);
    
    // Search and Pagination state
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(15);
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [paymentStatus, setPaymentStatus] = useState<string>('ALL');
    const [taxStatus, setTaxStatus] = useState<string>('ALL');

    // Dialog states
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [showItems, setShowItems] = useState(false);
    const [showPayments, setShowPayments] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [orderToCancel, setOrderToCancel] = useState<any>(null);
    const [activeOrder, setActiveOrder] = useState<any>(null);

    // TanStack Query
    const { data: salesData, isLoading, refetch } = useSalesOrders({
        search,
        page: currentPage,
        per_page: itemsPerPage,
        from_date: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
        to_date: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
        payment_status: paymentStatus,
        tax_status: taxStatus
    });

    const cancelMutation = useCancelSalesOrder();
    const isDelayedLoading = useDelayedLoading(isLoading);

    const orders = salesData?.data || [];
    const totalItems = salesData?.total || 0;
    const totalPages = salesData?.last_page || 1;

    const handleCancel = (order: any) => {
        setOrderToCancel(order);
        setShowCancelConfirm(true);
    };

    const confirmCancel = async () => {
        if (orderToCancel) {
            cancelMutation.mutate(orderToCancel.id);
            setShowCancelConfirm(false);
            setOrderToCancel(null);
        }
    };

    const getPaymentStatusColor = (status: string): any => {
        switch (status?.toUpperCase()) {
            case 'PAID': return 'success';
            case 'PARTIAL': return 'warning';
            case 'UNPAID': return 'secondary';
            default: return 'secondary';
        }
    };

    return (
        <div className="space-y-6">
            <FilterBar 
                icon={<IconReceipt className="w-6 h-6 text-primary" />}
                title={t('sales_orders', 'Sales Orders')}
                description="Manage customer transactions and service orders."
                search={search}
                setSearch={(val) => {
                    setSearch(val);
                    setCurrentPage(1);
                }}
                onAdd={() => navigate('/sales/create')}
                addLabel="New Sale / POS"
                onRefresh={refetch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={(val) => {
                    setItemsPerPage(val);
                    setCurrentPage(1);
                }}
                hasActiveFilters={!!dateRange || paymentStatus !== 'ALL' || taxStatus !== 'ALL'}
                onClearFilters={() => {
                    setDateRange(undefined);
                    setPaymentStatus('ALL');
                    setTaxStatus('ALL');
                    setCurrentPage(1);
                }}
            >
                    <div className="space-y-1.5 flex flex-col w-full">
                        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Date Range</span>
                        <DateRangePicker 
                            value={dateRange}
                            onChange={(range) => {
                                setDateRange(range);
                                setCurrentPage(1);
                            }}
                            placeholder="Filter by date..."
                            className="w-full"
                        />
                    </div>
                    
                    <div className="space-y-1.5 flex flex-col w-full">
                        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Payment</span>
                        <Select value={paymentStatus} onValueChange={(val) => {
                            setPaymentStatus(val);
                            setCurrentPage(1);
                        }}>
                            <SelectTrigger className="h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm transition-all focus:ring-primary">
                                <SelectValue placeholder="Payment" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL" className="font-bold">All Payments</SelectItem>
                                <SelectItem value="PAID" className="font-bold text-emerald-600">Paid</SelectItem>
                                <SelectItem value="PARTIAL" className="font-bold text-amber-600">Partial</SelectItem>
                                <SelectItem value="UNPAID" className="font-bold text-rose-600">Unpaid</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5 flex flex-col w-full">
                        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Tax Status</span>
                        <Select value={taxStatus} onValueChange={(val) => {
                            setTaxStatus(val);
                            setCurrentPage(1);
                        }}>
                            <SelectTrigger className="h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm transition-all focus:ring-primary">
                                <SelectValue placeholder="Tax Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL" className="font-bold">Tax All</SelectItem>
                                <SelectItem value="VAT" className="font-bold text-primary">VAT (Tax)</SelectItem>
                                <SelectItem value="NO_VAT" className="font-bold text-zinc-500">No VAT</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
            </FilterBar>

            {isDelayedLoading ? (
                <TableSkeleton columns={7} rows={itemsPerPage} />
            ) : orders.length === 0 ? (
                <EmptyState 
                    isSearch={!!search || !!dateRange || paymentStatus !== 'ALL' || taxStatus !== 'ALL'}
                    searchTerm={search}
                    title="No Sales Found"
                    description="Adjust your filters or initiate your first sale to start tracking transactions."
                    onAction={() => navigate('/sales/create')}
                    actionLabel="Create New Sale"
                />
            ) : (
                <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-100 dark:border-zinc-900 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-900">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Order & Date</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Customer & Vehicle</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Grand Total</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Balance</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">VAT</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                                {orders.map((order: any) => (
                                    <tr key={order.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition-all group">
                                        <td className="px-6 py-4 text-nowrap">
                                            <div className="flex flex-col">
                                                <span className="font-black text-zinc-900 dark:text-zinc-100 tracking-tight">{order.order_no}</span>
                                                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">
                                                    {order.order_date ? format(new Date(order.order_date), 'dd MMM yyyy') : 'No Date'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-nowrap min-w-[200px]">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0 border border-primary/5">
                                                    {order.customer?.name?.charAt(0) || '?'}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm truncate">{order.customer?.name || 'Walk-in Customer'}</span>
                                                    {order.vehicle ? (
                                                        <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-bold truncate uppercase tracking-tighter">
                                                            <IconCar size={10} />
                                                            {order.vehicle?.plate_number} &bull; {order.vehicle?.brand?.name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-zinc-300 font-bold uppercase tracking-widest">No Vehicle</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="font-black text-zinc-900 dark:text-zinc-100 text-sm tracking-tight">${parseFloat(order.grand_total || 0).toFixed(2)}</span>
                                                <span className="text-[9px] text-zinc-400 font-bold uppercase">Sub: ${parseFloat(order.subtotal || 0).toFixed(2)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className={`font-black text-sm tracking-tight ${order.balance_amount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                    ${parseFloat(order.balance_amount || 0).toFixed(2)}
                                                </span>
                                                <span className="text-[9px] text-zinc-400 font-bold uppercase">Paid: ${parseFloat(order.paid_amount || 0).toFixed(2)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge variant={order.tax_total > 0 ? 'success' : 'secondary'} className="text-[8px] h-5 px-2 font-black uppercase rounded-md tracking-tighter">
                                                {order.tax_total > 0 ? 'VAT' : 'No VAT'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge variant={getPaymentStatusColor(order.payment_status)} className="text-[9px] h-6 px-3 font-black uppercase tracking-widest rounded-full">
                                                {order.payment_status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-8 w-8 rounded-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50"
                                                        >
                                                            <IconInfoCircle size={18} />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-48 p-1 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-xl rounded-lg z-[100]" align="end" sideOffset={5}>
                                                        <div className="flex flex-col">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedOrderId(order.id);
                                                                    setShowItems(true);
                                                                }}
                                                                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-md transition-colors text-left"
                                                            >
                                                                <IconReceipt size={14} className="text-primary" />
                                                                Order Items
                                                            </button>
                                                            <button
                                                                onClick={() => navigate(`/sales/edit/${order.id}`)}
                                                                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-md transition-colors text-left"
                                                            >
                                                                <IconEdit size={14} className="text-blue-500" />
                                                                Edit Sale
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedOrderId(order.id);
                                                                    setShowPayments(true);
                                                                }}
                                                                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-md transition-colors text-left"
                                                            >
                                                                <IconHistory size={14} className="text-emerald-500" />
                                                                Payment History
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedOrderId(order.id);
                                                                    setShowInfo(true);
                                                                }}
                                                                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-md transition-colors text-left"
                                                            >
                                                                <IconInfoCircle size={14} className="text-amber-500" />
                                                                Order Details
                                                            </button>
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>

                                                <ActionButtons 
                                                    variant="inline"
                                                    size="sm"
                                                    loading={cancelMutation.isPending && orderToCancel?.id === order.id}
                                                    onPayment={order.payment_status !== 'PAID' ? () => {
                                                        setActiveOrder(order);
                                                        setShowPayment(true);
                                                    } : undefined}
                                                    onReject={order.status !== 'Cancelled' && order.status !== 'Completed' ? () => handleCancel(order) : undefined}
                                                    rejectLabel="Cancel"
                                                    skipRejectConfirm={true}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                            <Pagination 
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={totalItems}
                                itemsPerPage={itemsPerPage}
                                onPageChange={setCurrentPage}
                             />
                    )}
                </div>
            )}

            <SalesOrderItemDetailsDialog 
                open={showItems}
                onOpenChange={setShowItems}
                orderId={selectedOrderId}
            />

            <SalesOrderPaymentHistoryDialog 
                open={showPayments}
                onOpenChange={setShowPayments}
                orderId={selectedOrderId}
            />

            <SalesOrderInfoDialog 
                open={showInfo}
                onOpenChange={setShowInfo}
                orderId={selectedOrderId}
            />

            <RecordPaymentDialog 
                open={showPayment}
                onOpenChange={setShowPayment}
                order={activeOrder}
            />

            <ConfirmationModal 
                isOpen={showCancelConfirm}
                setIsOpen={setShowCancelConfirm}
                title="Cancel Sales Order"
                description={`Are you sure you want to cancel order ${orderToCancel?.order_no}? This will also cancel any associated job cards.`}
                onConfirm={confirmCancel}
                confirmText="Yes, Cancel Order"
                cancelText="No, Keep It"
                confirmVariant="danger"
                loading={cancelMutation.isPending}
            />
        </div>
    );
};

export default SalesOrderIndex;
