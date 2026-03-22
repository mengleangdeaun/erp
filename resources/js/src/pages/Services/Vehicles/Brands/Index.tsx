import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { IconPlus, IconEdit, IconTrash, IconCar, IconSearch, IconLoader2, IconInfoCircle } from '@tabler/icons-react';
import { toast } from 'sonner';
import VehicleBrandDialog from './VehicleBrandDialog';
import { useTranslation } from 'react-i18next';
import FilterBar from '@/components/ui/FilterBar';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import ActionButtons from '@/components/ui/ActionButtons';
import { Badge } from '@/components/ui/badge';
import TableSkeleton from '@/components/ui/TableSkeleton';
import DeleteModal from '@/components/DeleteModal';


const VehicleBrandIndex: React.FC = () => {
    const { t } = useTranslation();
    const [brands, setBrands] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBrand, setSelectedBrand] = useState<any>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    
    // Delete Modal state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [brandToDelete, setBrandToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // Search and Pagination state
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const fetchBrands = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/services/vehicle-brands');
            const data = await response.json();
            setBrands(data || []);
        } catch (error) {
            toast.error('Failed to load vehicle brands');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBrands();
    }, []);

    const handleEdit = (brand: any) => {
        setSelectedBrand(brand);
        setDialogOpen(true);
    };

    const handleDeleteClick = (brand: any) => {
        setBrandToDelete(brand);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!brandToDelete) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/services/vehicle-brands/${brandToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
            });

            if (response.ok) {
                toast.success('Brand deleted successfully');
                setDeleteDialogOpen(false);
                setBrandToDelete(null);
                fetchBrands();
            } else {
                const data = await response.json();
                toast.error(data.message || 'Failed to delete brand');
            }
        } catch (error) {
            toast.error('Failed to delete brand');
        } finally {
            setIsDeleting(false);
        }
    };

    // Derived data
    const filteredBrands = useMemo(() => {
        if (!search) return brands;
        return brands.filter(b => 
            (b.name || '').toLowerCase().includes(search.toLowerCase())
        );
    }, [brands, search]);

    const totalPages = Math.ceil(filteredBrands.length / itemsPerPage);
    const paginatedBrands = filteredBrands.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="space-y-6">
            <FilterBar 
                icon={<IconCar className="w-6 h-6 text-primary" />}
                title={t('vehicle_brands', 'Vehicle Brands')}
                description="Manage the master list of car manufacturers."
                search={search}
                setSearch={setSearch}
                onAdd={() => { setSelectedBrand(null); setDialogOpen(true); }}
                addLabel="Add Brand"
                onRefresh={fetchBrands}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onClearFilters={() => setSearch('')}
            />

            {loading ? (
                <TableSkeleton columns={5} rows={10} />
            ) : filteredBrands.length === 0 ? (
                <EmptyState 
                    isSearch={!!search}
                    searchTerm={search}
                    title="No Brands Found"
                    description={search ? "Adjust your search." : "Start by adding car brands like Toyota, BMW, or Tesla."}
                    onAction={() => { setSelectedBrand(null); setDialogOpen(true); }}
                    actionLabel="Add First Brand"
                />
            ) : (
                <div className="bg-white dark:bg-black rounded-lg border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="table-hover w-full table">
                            <thead>
                                <tr>
                                    <th className="w-12 text-center">#</th>
                                    <th>{t('brand_name', 'Brand Name')}</th>
                                    <th>{t('models_linked', 'Models Linked')}</th>
                                    <th className="text-center">{t('status', 'Status')}</th>
                                    <th className="text-right">{t('actions', 'Actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedBrands.map((brand, index) => (
                                    <tr key={brand.id} className="group">
                                        <td className="text-center text-gray-400 text-xs font-medium">
                                            {(currentPage - 1) * itemsPerPage + index + 1}
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-200 overflow-hidden">
                                                    {brand.image ? (
                                                        <img src={brand.image} className="w-full h-full object-contain p-1" alt={brand.name} />
                                                    ) : (
                                                        <span className="font-bold text-xs">{brand.name.charAt(0)}</span>
                                                    )}
                                                </div>
                                                <span className="font-semibold text-gray-900 dark:text-gray-100">{brand.name}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                                                {brand.models?.length || 0} Models
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <Badge 
                                            size='sm'
                                            dot={true}
                                            variant={brand.is_active ? 'success' : 'destructive'}>
                                                {brand.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td className="text-right">
                                            <ActionButtons 
                                                onEdit={() => handleEdit(brand)}
                                                onDelete={() => handleDeleteClick(brand)}
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
                            totalItems={filteredBrands.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                </div>
            )}

            <VehicleBrandDialog 
                isOpen={dialogOpen} 
                setIsOpen={setDialogOpen} 
                brand={selectedBrand} 
                onSave={fetchBrands} 
            />

            <DeleteModal 
                isOpen={deleteDialogOpen}
                setIsOpen={setDeleteDialogOpen}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
                title="Delete Brand"
                message={`Are you sure you want to delete the brand "${brandToDelete?.name}"? This will also affect any linked models.`}
            />
        </div>
    );
};

export default VehicleBrandIndex;
