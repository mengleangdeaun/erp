import { useState, useEffect } from 'react';
import { IconUser, IconPlus, IconSearch, IconFilter, IconDownload, IconDotsVertical, IconEdit, IconTrash, IconBrandTelegram, IconPhone, IconMail } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import CustomerDialog from './CustomerDialog';
import FilterBar from '@/components/ui/FilterBar';
import TableSkeleton from '@/components/ui/TableSkeleton';
import DeleteModal from '@/components/DeleteModal';
import ActionButtons from '@/components/ui/ActionButtons';
import { useTranslation } from 'react-i18next';
import { useFormatDate } from '@/hooks/useFormatDate';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { useCRMCustomers, useCRMCustomerTypes, useCRMDeleteCustomer } from '@/hooks/useCRMData';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useQueryClient } from '@tanstack/react-query';

const CustomerIndex = () => {
    const dispatch = useDispatch();
    const queryClient = useQueryClient();
    const { t } = useTranslation();
    const { formatDate, formatDateTime } = useFormatDate();

    // Pagination & Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    // Dialog state
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Queries
    const { data: customersData, isLoading: customersLoading } = useCRMCustomers({
        page: currentPage,
        per_page: perPage,
        search,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        customer_type_id: typeFilter !== 'all' ? typeFilter : undefined,
    });
    const { data: customerTypes = [] } = useCRMCustomerTypes();

    const customers = customersData?.data || [];
    const totalItems = customersData?.total || 0;
    const totalPages = customersData?.last_page || 1;

    // Mutations
    const deleteMutation = useCRMDeleteCustomer();

    // Loading State
    const loading = useDelayedLoading(customersLoading);

    useEffect(() => {
        dispatch(setPageTitle('Customers'));
    }, [dispatch]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, statusFilter, typeFilter]);

    const handleEdit = (customer: any) => {
        setSelectedCustomer(customer);
        setDialogOpen(true);
    };

    const handleDelete = (id: number) => {
        setCustomerToDelete(id);
        setDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!customerToDelete) return;
        setIsDeleting(true);
        try {
            await deleteMutation.mutateAsync(customerToDelete);
            toast.success('Customer deleted successfully');
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to delete customer');
        } finally {
            setIsDeleting(false);
            setDeleteModalOpen(false);
            setCustomerToDelete(null);
        }
    };

    return (
        <div className="space-y-6 pb-12">
            <FilterBar
                icon={<IconUser className="w-6 h-6 text-primary" />}
                title={t('customers', 'Customers')}
                description="Manage your database of regular and VIP customers."
                search={search}
                setSearch={setSearch}
                onAdd={() => { setSelectedCustomer(null); setDialogOpen(true); }}
                addLabel="New Customer"
                onRefresh={() => queryClient.invalidateQueries({ queryKey: ['crm_customers'] })}
                itemsPerPage={perPage}
                setItemsPerPage={setPerPage}
                hasActiveFilters={statusFilter !== 'all' || typeFilter !== 'all'}
                onClearFilters={() => {
                    setStatusFilter('all');
                    setTypeFilter('all');
                }}
            >
                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Status</span>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm transition-all focus:ring-primary">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="font-medium">All Status</SelectItem>
                            <SelectItem value="ACTIVE" className="font-medium">Active</SelectItem>
                            <SelectItem value="INACTIVE" className="font-medium">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Customer Type</span>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm transition-all focus:ring-primary">
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="font-medium">All Types</SelectItem>
                            {customerTypes.map((t: any) => (
                                <SelectItem key={t.id} value={String(t.id)} className="font-medium">{t.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </FilterBar>


            {loading ? (
                <TableSkeleton columns={6} rows={5} />
            ) : customers.length === 0 ? (
                <EmptyState
                    title="No Customers Found"
                    description={search ? "Try adjusting your search or filters." : "Start by adding your first customer."}
                    onAction={() => { setSelectedCustomer(null); setDialogOpen(true); }}
                    actionLabel="Add Customer"
                />
            ) : (
                <div className="panel bg-white dark:bg-gray-900 border-none shadow-sm overflow-hidden p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-white-dark/5 text-gray-500 uppercase text-[10px] font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 text-left">Customer Code</th>
                                    <th className="px-6 py-4 text-left">Customer</th>
                                    <th className="px-6 py-4 text-left">Contact</th>
                                    <th className="px-6 py-4 text-left">Type</th>
                                    <th className="px-6 py-4 text-left">Join Date</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {customers.map((c: any) => (
                                    <tr key={c.id} className=" transition-colors group">
                                        <td className="px-6 py-4 font-mono text-xs text-primary font-bold">
                                            {c.customer_code}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                                                    {(c.name || c.customer_code).charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-gray-100">{c.name || 'N/A'}</p>
                                                    <p className="text-xs text-gray-500">{c.customer_no}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 space-y-1">
                                            {c.phone && (
                                                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                                    <IconPhone size={14} className="text-gray-400" />
                                                    <span>{c.phone}</span>
                                                </div>
                                            )}
                                            {c.telegram_user_id && (
                                                <div className="flex items-center gap-1.5 text-primary">
                                                    <IconBrandTelegram size={14} />
                                                    <span className="text-[11px] font-medium">{c.telegram_user_id}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-[11px] font-bold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                                                {c.type?.name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-xs">
                                            {formatDateTime(c.joined_at)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge
                                                size="sm"
                                                variant={c.status === 'ACTIVE' ? 'success' : 'destructive'}>
                                                {c.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <ActionButtons
                                                onEdit={() => handleEdit(c)}
                                                onDelete={() => handleDelete(c.id)}
                                                skipDeleteConfirm
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!loading && totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={perPage}
                    onPageChange={setCurrentPage}
                />
            )}

            <CustomerDialog
                isOpen={dialogOpen}
                setIsOpen={setDialogOpen}
                customer={selectedCustomer}
                customerTypes={customerTypes}
                onSave={() => queryClient.invalidateQueries({ queryKey: ['crm_customers'] })}
            />

            <DeleteModal 
                isOpen={deleteModalOpen} 
                setIsOpen={setDeleteModalOpen} 
                onConfirm={executeDelete} 
                isLoading={isDeleting} 
                title="Delete Customer" 
                message="Are you sure you want to permanently delete this customer record? This action cannot be undone." 
            />
        </div>
    );
};

export default CustomerIndex;
