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

const VehicleBrandIndex: React.FC = () => {
    const { t } = useTranslation();
    const [brands, setBrands] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBrand, setSelectedBrand] = useState<any>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    
    // Search and Pagination state
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);

    const fetchBrands = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/services/vehicle-brands');
            const data = await response.json();
            setBrands(data);
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

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this brand?')) return;

        try {
            const response = await fetch(`/api/services/vehicle-brands/${id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
            });

            if (response.ok) {
                toast.success('Brand deleted successfully');
                fetchBrands();
            } else {
                const data = await response.json();
                toast.error(data.message || 'Failed to delete brand');
            }
        } catch (error) {
            toast.error('Failed to delete brand');
        }
    };

    // Derived data
    const filteredBrands = useMemo(() => {
        if (!search) return brands;
        return brands.filter(b => 
            b.name.toLowerCase().includes(search.toLowerCase())
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
            />

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, index) => (
                        <div key={index} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 animate-pulse h-32"></div>
                    ))}
                </div>
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
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {paginatedBrands.map((brand) => (
                            <div 
                                key={brand.id} 
                                className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
                            >
                                <div className="p-5">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-200 font-bold">
                                                {brand.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                                    {brand.name}
                                                </h3>
                                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
                                                    {brand.models?.length || 0} Models Linked
                                                </p>
                                            </div>
                                        </div>
                                        <ActionButtons 
                                            onEdit={() => handleEdit(brand)}
                                            onDelete={() => handleDelete(brand.id)}
                                            skipDeleteConfirm
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                        />
                                    </div>
                                    
                                    <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <IconInfoCircle size={12} />
                                            ID: {brand.id}
                                        </span>
                                        <Badge variant={brand.is_active ? 'success' : 'secondary'} className="text-[9px] h-4">
                                            {brand.is_active ? 'ACTIVE' : 'INACTIVE'}
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
                                totalItems={filteredBrands.length}
                                itemsPerPage={itemsPerPage}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </>
            )}

            <VehicleBrandDialog 
                isOpen={dialogOpen} 
                setIsOpen={setDialogOpen} 
                brand={selectedBrand} 
                onSave={fetchBrands} 
            />
        </div>
    );
};

export default VehicleBrandIndex;
