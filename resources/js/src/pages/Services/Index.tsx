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

const ServiceIndex: React.FC = () => {
    const { t } = useTranslation();
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedService, setSelectedService] = useState<any>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    
    // Search and Pagination state
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const fetchServices = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/services/list');
            const data = await response.json();
            setServices(data);
        } catch (error) {
            toast.error('Failed to load service catalog');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const handleEdit = (service: any) => {
        setSelectedService(service);
        setDialogOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this service?')) return;

        try {
            const response = await fetch(`/api/services/list/${id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
            });

            if (response.ok) {
                toast.success('Service deleted successfully');
                fetchServices();
            } else {
                const data = await response.json();
                toast.error(data.message || 'Failed to delete service');
            }
        } catch (error) {
            toast.error('Failed to delete service');
        }
    };

    // Derived data
    const filteredServices = useMemo(() => {
        if (!search) return services;
        return services.filter(s => 
            s.name.toLowerCase().includes(search.toLowerCase()) || 
            s.code.toLowerCase().includes(search.toLowerCase()) ||
            (s.description || '').toLowerCase().includes(search.toLowerCase())
        );
    }, [services, search]);

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
                onRefresh={fetchServices}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
            />

            {loading ? (
                <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 animate-pulse h-24"></div>
                    ))}
                </div>
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
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-gray-400 tracking-wider">Service Detail</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-gray-400 tracking-wider">Category</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold uppercase text-gray-400 tracking-wider">Base Price</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold uppercase text-gray-400 tracking-wider">Mapping</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold uppercase text-gray-400 tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold uppercase text-gray-400 tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {paginatedServices.map((service) => (
                                    <tr key={service.id} className="hover:bg-gray-50/30 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-primary/5 text-primary flex items-center justify-center font-bold">
                                                    {service.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{service.name}</div>
                                                    <div className="text-xs text-gray-400">{service.code}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {service.category ? (
                                                <Badge variant="secondary" className="font-medium">
                                                    {service.category.name}
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">Uncategorized</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                                ${parseFloat(service.base_price).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">
                                                    {service.materials?.length || 0} Materials
                                                </span>
                                                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">
                                                    {service.parts?.length || 0} Parts
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <Badge variant={service.is_active ? 'success' : 'destructive'} className="text-[10px] uppercase font-bold px-2 py-0">
                                                {service.is_active ? 'Active' : 'Hidden'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <ActionButtons 
                                                onEdit={() => handleEdit(service)}
                                                onDelete={() => handleDelete(service.id)}
                                                skipDeleteConfirm
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {totalPages > 1 && (
                        <div className="p-6 border-t border-gray-100 dark:border-gray-800">
                            <Pagination 
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={filteredServices.length}
                                itemsPerPage={itemsPerPage}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </div>
            )}

            <ServiceDialog 
                isOpen={dialogOpen} 
                setIsOpen={setDialogOpen} 
                service={selectedService} 
                onSave={fetchServices} 
            />
        </div>
    );
};

export default ServiceIndex;
