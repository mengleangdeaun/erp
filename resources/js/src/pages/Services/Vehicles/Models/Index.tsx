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

const VehicleModelIndex: React.FC = () => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const [models, setModels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedModel, setSelectedModel] = useState<any>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [brands, setBrands] = useState<any[]>([]);
    
    // Delete Modal state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [modelToDelete, setModelToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // Search and Pagination state
    const [search, setSearch] = useState('');
    const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        dispatch(setPageTitle(t('vehicle_models', 'Vehicle Models')));
    }, [dispatch, t]);

    const fetchModels = async () => {
        setLoading(true);
        try {
            const [modelsRes, brandsRes] = await Promise.all([
                fetch('/api/services/vehicle-models'),
                fetch('/api/services/vehicle-brands')
            ]);
            const modelsData = await modelsRes.json();
            const brandsData = await brandsRes.json();
            setModels(modelsData || []);
            setBrands(brandsData || []);
        } catch (error) {
            toast.error('Failed to load data');
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

    const handleDeleteClick = (model: any) => {
        setModelToDelete(model);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!modelToDelete) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/services/vehicle-models/${modelToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
            });

            if (response.ok) {
                toast.success('Model deleted successfully');
                setDeleteDialogOpen(false);
                setModelToDelete(null);
                fetchModels();
            } else {
                const data = await response.json();
                toast.error(data.message || 'Failed to delete model');
            }
        } catch (error) {
            toast.error('Failed to delete model');
        } finally {
            setIsDeleting(false);
        }
    };

    // Derived data
    const filteredModels = useMemo(() => {
        let result = models;
        
        if (selectedBrandId && selectedBrandId !== 'all') {
            result = result.filter(m => m.brand_id === Number(selectedBrandId));
        }

        if (search) {
            result = result.filter(m => 
                (m.name || '').toLowerCase().includes(search.toLowerCase()) ||
                (m.brand?.name || '').toLowerCase().includes(search.toLowerCase())
            );
        }
        
        return result;
    }, [models, search, selectedBrandId]);

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
                onClearFilters={() => {
                    setSearch('');
                    setSelectedBrandId(null);
                }}
                hasActiveFilters={!!selectedBrandId && selectedBrandId !== 'all'}
            >
                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Filter by Brand</span>
                    <Select
                        value={selectedBrandId || 'all'}
                        onValueChange={setSelectedBrandId}
                    >
                        <SelectTrigger className="h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm text-xs font-semibold">
                            <SelectValue placeholder="All Brands" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Brands</SelectItem>
                            {brands.map(brand => (
                                <SelectItem key={brand.id} value={String(brand.id)}>
                                    {brand.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </FilterBar>

            {loading ? (
                <TableSkeleton columns={5} rows={10} />
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
                <div className="bg-white dark:bg-black rounded-lg border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="table-hover w-full table">
                            <thead>
                                <tr>
                                    <th className="w-12 text-center">#</th>
                                    <th>{t('model_name', 'Model Name')}</th>
                                    <th>{t('brand', 'Brand')}</th>
                                    <th className="text-center">{t('status', 'Status')}</th>
                                    <th className="text-right">{t('actions', 'Actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedModels.map((model, index) => (
                                    <tr key={model.id} className="group">
                                        <td className="text-center text-gray-400 text-xs font-medium">
                                            {(currentPage - 1) * itemsPerPage + index + 1}
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-200">
                                                    <IconCar size={16} />
                                                </div>
                                                <span className="font-semibold text-gray-900 dark:text-gray-100">{model.name}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <Badge variant="outline" className="text-[10px] font-bold text-primary">
                                                {model.brand?.name || 'Unknown Brand'}
                                            </Badge>
                                        </td>
                                        <td className="text-center">
                                            <Badge 
                                            size='sm'
                                            dot={true}
                                            variant={model.is_active ? 'success' : 'destructive'}>
                                                {model.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td className="text-right">
                                            <ActionButtons 
                                                onEdit={() => handleEdit(model)}
                                                onDelete={() => handleDeleteClick(model)}
                                                skipDeleteConfirm
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                        <Pagination 
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={filteredModels.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                </div>
            )}

            <VehicleModelDialog 
                isOpen={dialogOpen} 
                setIsOpen={setDialogOpen} 
                model={selectedModel} 
                onSave={fetchModels} 
            />

            <DeleteModal 
                isOpen={deleteDialogOpen}
                setIsOpen={setDeleteDialogOpen}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
                title="Delete Model"
                message={`Are you sure you want to delete the model "${modelToDelete?.name}"?`}
            />
        </div>
    );
};

export default VehicleModelIndex;
