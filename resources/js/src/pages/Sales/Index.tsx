import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { IconPlus, IconReceipt, IconSearch, IconFilter, IconCalendar, IconUser, IconCar, IconDotsVertical, IconTrash, IconX } from '@tabler/icons-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import FilterBar from '@/components/ui/FilterBar';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import ActionButtons from '@/components/ui/ActionButtons';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const SalesOrderIndex: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Search and Pagination state
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/sales/orders');
            const data = await response.json();
            setOrders(data);
        } catch (error) {
            toast.error('Failed to load sales orders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleCancel = async (id: number) => {
        if (!confirm('Are you sure you want to cancel this order? It will also cancel the associated Job Card.')) return;

        try {
            const response = await fetch(`/api/sales/orders/${id}/cancel`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
            });

            if (response.ok) {
                toast.success('Order cancelled successfully');
                fetchOrders();
            } else {
                const data = await response.json();
                toast.error(data.message || 'Failed to cancel order');
            }
        } catch (error) {
            toast.error('An error occurred');
        }
    };

    // Derived data
    const filteredOrders = useMemo(() => {
        if (!search) return orders;
        const q = search.toLowerCase();
        return orders.filter(o => 
            o.order_no.toLowerCase().includes(q) ||
            (o.customer?.name || '').toLowerCase().includes(q) ||
            (o.vehicle?.plate_number || '').toLowerCase().includes(q)
        );
    }, [orders, search]);

    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const getStatusColor = (status: string): any => {
        switch (status) {
            case 'Pending': return 'warning';
            case 'In Progress': return 'secondary';
            case 'Completed': return 'success';
            case 'Cancelled': return 'destructive';
            case 'Service Completed': return 'success';
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
                setSearch={setSearch}
                onAdd={() => navigate('/sales/create')}
                addLabel="New Sale / POS"
                onRefresh={fetchOrders}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
            />

            {loading ? (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 space-y-4">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="h-16 bg-gray-50 dark:bg-gray-800 rounded-xl animate-pulse"></div>
                    ))}
                </div>
            ) : filteredOrders.length === 0 ? (
                <EmptyState 
                    isSearch={!!search}
                    searchTerm={search}
                    title="No Sales Found"
                    description={search ? "Adjust your search parameters." : "Initiate your first sale to start tracking transactions."}
                    onAction={() => navigate('/sales/create')}
                    actionLabel="Create New Sale"
                />
            ) : (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">Order & Date</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">Customer & Vehicle</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 text-right">Grand Total</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 text-center">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {paginatedOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-900 dark:text-gray-100">{order.order_no}</span>
                                                <span className="text-[10px] text-gray-400 font-medium uppercase">{format(new Date(order.order_date), 'dd MMM yyyy')}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                                    {order.customer?.name?.charAt(0) || '?'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{order.customer?.name}</span>
                                                    <span className="text-[10px] text-gray-400 flex items-center gap-1 font-medium">
                                                        <IconCar size={10} />
                                                        {order.vehicle?.plate_number} ({order.vehicle?.brand?.name} {order.vehicle?.model?.name})
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-bold text-gray-900 dark:text-gray-100">${parseFloat(order.grand_total || 0).toFixed(2)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge variant={getStatusColor(order.status)} className="text-[9px] h-5 px-2 font-bold uppercase">
                                                {order.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-8 w-8 p-0 text-gray-400 hover:text-primary"
                                                    onClick={() => toast.info('View/Edit mode coming soon to new POS page')}
                                                >
                                                    <IconReceipt size={16} />
                                                </Button>
                                                {order.status !== 'Cancelled' && order.status !== 'Completed' && (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="h-8 w-8 p-0 text-gray-400 hover:text-danger"
                                                        onClick={() => handleCancel(order.id)}
                                                    >
                                                        <IconX size={16} />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                            <Pagination 
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={filteredOrders.length}
                                itemsPerPage={itemsPerPage}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </div>
            )}

        </div>
    );
};

export default SalesOrderIndex;
