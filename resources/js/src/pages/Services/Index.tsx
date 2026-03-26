import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { IconPlus, IconEdit, IconTrash, IconPackages, IconSearch, IconLoader2, IconInfoCircle, IconCurrencyDollar } from '@tabler/icons-react';
import { toast } from 'sonner';
import ServiceDialog from './ServiceDialog';
import { useTranslation } from 'react-i18next';
import FilterBar from '@/components/ui/FilterBar';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import ActionButtons from '@/components/ui/ActionButtons';
import { Badge } from '@/components/ui/badge';
import TableSkeleton from '@/components/ui/TableSkeleton';
import DeleteModal from '@/components/DeleteModal';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const ServiceIndex: React.FC = () => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const [services, setServices] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedService, setSelectedService] = useState<any>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    
    // Delete Modal state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // Search and Pagination state
    const [search, setSearch] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        dispatch(setPageTitle(t('service_catalog', 'Service Catalog')));
    }, [dispatch, t]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [servicesRes, categoriesRes] = await Promise.all([
                fetch('/api/services/list'),
                fetch('/api/inventory/categories')
            ]);
            const servicesData = await servicesRes.json();
            const categoriesData = await categoriesRes.json();
            setServices(servicesData || []);
            setCategories(categoriesData || []);
        } catch (error) {
            toast.error('Failed to load service catalog');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleEdit = (service: any) => {
        setSelectedService(service);
        setDialogOpen(true);
    };

    const handleDeleteClick = (service: any) => {
        setServiceToDelete(service);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!serviceToDelete) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/services/list/${serviceToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
            });

            if (response.ok) {
                toast.success('Service deleted successfully');
                setDeleteDialogOpen(false);
                setServiceToDelete(null);
                fetchData();
            } else {
                const data = await response.json();
                toast.error(data.message || 'Failed to delete service');
            }
        } catch (error) {
            toast.error('Failed to delete service');
        } finally {
            setIsDeleting(false);
        }
    };

    // Derived data
    const filteredServices = useMemo(() => {
        let result = services;

        if (selectedCategoryId && selectedCategoryId !== 'all') {
            result = result.filter(s => s.category_id === Number(selectedCategoryId));
        }

        if (search) {
            result = result.filter(s => 
                (s.name || '').toLowerCase().includes(search.toLowerCase()) || 
                (s.code || '').toLowerCase().includes(search.toLowerCase()) ||
                (s.description || '').toLowerCase().includes(search.toLowerCase())
            );
        }

        return result;
    }, [services, search, selectedCategoryId]);

    const totalPages = Math.ceil(filteredServices.length / itemsPerPage);
    const paginatedServices = filteredServices.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="space-y-6">
            <FilterBar 
                icon={<IconPackages className="w-6 h-6 text-primary" />}
                title={t('service_catalog', 'Service Catalog')}
                description="Define your installation services, prices, and material associations."
                search={search}
                setSearch={setSearch}
                onAdd={() => { setSelectedService(null); setDialogOpen(true); }}
                addLabel="New Service"
                onRefresh={fetchData}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onClearFilters={() => {
                    setSearch('');
                    setSelectedCategoryId(null);
                }}
                hasActiveFilters={!!selectedCategoryId && selectedCategoryId !== 'all'}
            >
                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Filter by Category</span>
                    <Select
                        value={selectedCategoryId || 'all'}
                        onValueChange={setSelectedCategoryId}
                    >
                        <SelectTrigger className="h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm text-xs font-semibold">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map(cat => (
                                <SelectItem key={cat.id} value={String(cat.id)}>
                                    {cat.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </FilterBar>

            {loading ? (
                <TableSkeleton columns={6} rows={10} />
            ) : filteredServices.length === 0 ? (
                <EmptyState 
                    isSearch={!!search}
                    searchTerm={search}
                    title="Empty Catalog"
                    description={search ? "No services match your criteria." : "Start building your installation menu."}
                    onAction={() => { setSelectedService(null); setDialogOpen(true); }}
                    actionLabel="Create Service"
                />
            ) : (
                <div className="bg-white dark:bg-black rounded-lg border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm font-sans">
                    <div className="overflow-x-auto">
                        <table className="table-hover w-full table">
                            <thead>
                                <tr>
                                    <th>{t('service_detail', 'Service Detail')}</th>
                                    <th>{t('category', 'Category')}</th>
                                    <th className="text-right">{t('base_price', 'Base Price')}</th>
                                    <th className="text-center">{t('mapping', 'Mapping')}</th>
                                    <th className="text-center">{t('status', 'Status')}</th>
                                    <th className="text-right">{t('actions', 'Actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedServices.map((service) => (
                                    <tr key={service.id} className="group">
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-200 font-bold text-xs">
                                                    {service.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="text-xs font-semibold text-gray-900 dark:text-gray-100">{service.name}</div>
                                                    <div className="text-[10px] text-gray-400 font-mono tracking-tight">{service.code}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            {service.category ? (
                                                <Badge variant="outline" className="font-medium text-[10px] bg-gray-50 dark:bg-gray-800">
                                                    {service.category.name}
                                                </Badge>
                                            ) : (
                                                <span className="text-[10px] text-gray-300 italic">Uncategorized</span>
                                            )}
                                        </td>
                                        <td className="text-right">
                                            <div className="text-xs font-bold text-gray-900 dark:text-gray-100">
                                                ${parseFloat(service.base_price || 0).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <div className="flex flex-col items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[9px] text-gray-500 uppercase font-bold tracking-tighter leading-none">
                                                    {service.materials?.length || 0} Materials
                                                </span>
                                                <span className="text-[9px] text-gray-500 uppercase font-bold tracking-tighter leading-none">
                                                    {service.parts?.length || 0} Parts
                                                </span>
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <Badge 
                                                size='sm'
                                                dot={true}
                                                variant={service.is_active ? 'success' : 'destructive'}>
                                                {service.is_active ? 'Active' : 'Hidden'}
                                            </Badge>
                                        </td>
                                        <td className="text-right">
                                            <ActionButtons 
                                                onEdit={() => handleEdit(service)}
                                                onDelete={() => handleDeleteClick(service)}
                                                skipDeleteConfirm
                                            />
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
                                totalItems={filteredServices.length}
                                itemsPerPage={itemsPerPage}
                                onPageChange={setCurrentPage}
                            />
                    
                    )}
                </div>
            )}

            <ServiceDialog 
                isOpen={dialogOpen} 
                setIsOpen={setDialogOpen} 
                service={selectedService} 
                onSave={fetchData} 
            />

            <DeleteModal 
                isOpen={deleteDialogOpen}
                setIsOpen={setDeleteDialogOpen}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
                title="Delete Service"
                message={`Are you sure you want to delete the service "${serviceToDelete?.name}"? This will also remove its associated mappings.`}
            />
        </div>
    );
};

export default ServiceIndex;
