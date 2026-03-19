import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { IconPlus, IconEdit, IconTrash, IconCar, IconSearch, IconLoader2, IconInfoCircle } from '@tabler/icons-react';
import { toast } from 'sonner';
import VehicleModelDialog from './VehicleModelDialog';
import { useTranslation } from 'react-i18next';
import FilterBar from '@/components/ui/FilterBar';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import ActionButtons from '@/components/ui/ActionButtons';
import { Badge } from '@/components/ui/badge';

const VehicleModelIndex: React.FC = () => {
    const { t } = useTranslation();
    const [models, setModels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedModel, setSelectedModel] = useState<any>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    
    // Search and Pagination state
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);

    const fetchModels = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/services/vehicle-models');
            const data = await response.json();
            setModels(data);
        } catch (error) {
            toast.error('Failed to load vehicle models');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchModels();
    }, []);

    const handleEdit = (model: any) => {
        setSelectedModel(model);
        setDialogOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this model?')) return;

        try {
            const response = await fetch(`/api/services/vehicle-models/${id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
            });

            if (response.ok) {
                toast.success('Model deleted successfully');
                fetchModels();
            } else {
                const data = await response.json();
                toast.error(data.message || 'Failed to delete model');
            }
        } catch (error) {
            toast.error('Failed to delete model');
        }
    };

    // Derived data
    const filteredModels = useMemo(() => {
        if (!search) return models;
        return models.filter(m => 
            m.name.toLowerCase().includes(search.toLowerCase()) ||
            (m.brand?.name || '').toLowerCase().includes(search.toLowerCase())
        );
    }, [models, search]);

    const totalPages = Math.ceil(filteredModels.length / itemsPerPage);
    const paginatedModels = filteredModels.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="space-y-6">
            <FilterBar 
                icon={<IconCar className="w-6 h-6 text-primary" />}
                title={t('vehicle_models', 'Vehicle Models')}
                description="Manage specific car models belonging to brands."
                search={search}
                setSearch={setSearch}
                onAdd={() => { setSelectedModel(null); setDialogOpen(true); }}
                addLabel="Add Model"
                onRefresh={fetchModels}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
            />

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, index) => (
                        <div key={index} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 animate-pulse h-32"></div>
                    ))}
                </div>
            ) : filteredModels.length === 0 ? (
                <EmptyState 
                    isSearch={!!search}
                    searchTerm={search}
                    title="No Models Found"
                    description={search ? "Adjust your search." : "Start by adding specific car models for your brands."}
                    onAction={() => { setSelectedModel(null); setDialogOpen(true); }}
                    actionLabel="Add First Model"
                />
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {paginatedModels.map((model) => (
                            <div 
                                key={model.id} 
                                className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
                            >
                                <div className="p-5">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-200">
                                                <IconCar size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                                    {model.name}
                                                </h3>
                                                <Badge variant="outline" className="text-[10px] h-4 font-bold border-primary/20 text-primary">
                                                    {model.brand?.name || 'Unknown Brand'}
                                                </Badge>
                                            </div>
                                        </div>
                                        <ActionButtons 
                                            onEdit={() => handleEdit(model)}
                                            onDelete={() => handleDelete(model.id)}
                                            skipDeleteConfirm
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                        />
                                    </div>
                                    
                                    <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <IconInfoCircle size={12} />
                                            ID: {model.id}
                                        </span>
                                        <Badge variant={model.is_active ? 'success' : 'secondary'} className="text-[9px] h-4">
                                            {model.is_active ? 'ACTIVE' : 'INACTIVE'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="mt-8">
                            <Pagination 
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={filteredModels.length}
                                itemsPerPage={itemsPerPage}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </>
            )}

            <VehicleModelDialog 
                isOpen={dialogOpen} 
                setIsOpen={setDialogOpen} 
                model={selectedModel} 
                onSave={fetchModels} 
            />
        </div>
    );
};

export default VehicleModelIndex;
