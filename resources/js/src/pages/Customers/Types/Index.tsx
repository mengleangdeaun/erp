import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { IconPlus, IconEdit, IconTrash, IconUsersGroup, IconSearch, IconLoader2, IconInfoCircle } from '@tabler/icons-react';
import { toast } from 'sonner';
import CustomerTypeDialog from './CustomerTypeDialog';
import { useTranslation } from 'react-i18next';
import FilterBar from '@/components/ui/FilterBar';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import ActionButtons from '@/components/ui/ActionButtons';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { useCRMCustomerTypes, useCRMCustomerTypeDelete } from '@/hooks/useCRMData';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useQueryClient } from '@tanstack/react-query';

const CustomerTypeIndex = () => {
    const dispatch = useDispatch();
    const queryClient = useQueryClient();
    const { t } = useTranslation();
    const [selectedType, setSelectedType] = useState<any>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    
    // Search and Pagination state
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Queries
    const { data: types = [], isLoading: typesLoading } = useCRMCustomerTypes();

    // Mutations
    const deleteMutation = useCRMCustomerTypeDelete();

    // Loading State
    const loading = useDelayedLoading(typesLoading);

    useEffect(() => {
        dispatch(setPageTitle(t('customer_types', 'Customer Types')));
    }, [dispatch, t]);

    const handleEdit = (type: any) => {
        setSelectedType(type);
        setDialogOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this customer type?')) return;
        try {
            await deleteMutation.mutateAsync(id);
            toast.success('Customer type deleted successfully');
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to delete customer type');
        }
    };

    // Derived data
    const filteredTypes = useMemo(() => {
        if (!search) return types;
        return types.filter((t: any) => 
            t.name.toLowerCase().includes(search.toLowerCase()) || 
            (t.description || '').toLowerCase().includes(search.toLowerCase())
        );
    }, [types, search]);

    const totalPages = Math.ceil(filteredTypes.length / itemsPerPage);
    const paginatedTypes = filteredTypes.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div>
            <div className="flex flex-col">
                <FilterBar 
                    icon={<IconUsersGroup className="w-6 h-6 text-primary" />}
                    title={t('customer_types', 'Customer Types')}
                    description="Manage your customer categories and default assignments."
                    search={search}
                    setSearch={setSearch}
                    onAdd={() => { setSelectedType(null); setDialogOpen(true); }}
                    addLabel="New Type"
                    onRefresh={() => queryClient.invalidateQueries({ queryKey: ['crm_customer_types'] })}
                    itemsPerPage={itemsPerPage}
                    setItemsPerPage={setItemsPerPage}
                />

{loading ? (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: itemsPerPage }).map((_, index) => (
            <div 
                key={index} 
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 animate-pulse"
            >
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        {/* Avatar placeholder */}
                        <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700"></div>
                        <div className="space-y-2">
                            {/* Title placeholder */}
                            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            {/* Customer count placeholder */}
                            <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                    </div>
                    {/* Action buttons placeholder */}
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>

                {/* Description lines */}
                <div className="mt-4 space-y-2">
                    <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        ))}
    </div>
                ) : filteredTypes.length === 0 ? (
                    <EmptyState 
                        isSearch={!!search}
                        searchTerm={search}
                        title="No Customer Types Found"
                        description={search ? "Adjust your search to find what you're looking for." : "Start by creating your first customer category."}
                        onAction={() => { setSelectedType(null); setDialogOpen(true); }}
                        actionLabel="Add New Type"
                    />
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {paginatedTypes.map((type: any) => (
// Inside the map function, replace the existing card with this updated version:

<div 
    key={type.id} 
    className="group relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden"
>
    {/* Header with actions */}
    <div className="p-5 pb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary flex items-center justify-center font-bold text-xl group-hover:scale-105 transition-transform duration-200 shadow-sm">
                {type.name.charAt(0)}
            </div>
            <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    {type.name}
                    {type.is_default && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 border border-green-100 dark:border-green-900/30 uppercase tracking-wider">
                            Default
                        </span>
                    )}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {type.customers_count || 0} customer{type.customers_count !== 1 ? 's' : ''}
                </p>
            </div>
        </div>
        <ActionButtons 
            onEdit={() => handleEdit(type as any)}
            onDelete={!type.is_default ? () => handleDelete(type.id) : undefined}
            skipDeleteConfirm
            className="opacity-70 group-hover:opacity-100 transition-opacity"
        />
    </div>

    {/* Description */}
    <div className="px-5 pb-4">
        {type.description ? (
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                {type.description}
            </p>
        ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                No description provided.
            </p>
        )}
    </div>

    {/* Footer with metadata */}
    <div className="px-5 py-3 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-gray-400">
            <IconInfoCircle size={12} />
            ID: {type.id}
        </div>
        <div className="flex items-center gap-1">
            <span className="text-gray-500">Updated</span>
            <span className="text-gray-700 dark:text-gray-300 font-medium">
                {/* You may need to adjust this field based on your actual data */}
                {type.updated_at ? new Date(type.updated_at).toLocaleDateString() : 'N/A'}
            </span>
        </div>
    </div>
</div>
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="mt-8 border-t border-gray-100 dark:border-gray-800 pt-6">
                                <Pagination 
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    totalItems={filteredTypes.length}
                                    itemsPerPage={itemsPerPage}
                                    onPageChange={setCurrentPage}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>

            <CustomerTypeDialog 
                isOpen={dialogOpen} 
                setIsOpen={setDialogOpen} 
                type={selectedType} 
                onSave={() => queryClient.invalidateQueries({ queryKey: ['crm_customer_types'] })} 
            />
        </div>
    );
};

export default CustomerTypeIndex;
