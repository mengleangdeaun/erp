import { useState, useEffect, useCallback } from 'react';
import { IconCar, IconPlus, IconSearch, IconFilter, IconTrash, IconEdit, IconUser, IconCalendar, IconGauge, IconPalette } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import FilterBar from '@/components/ui/FilterBar';
import TableSkeleton from '@/components/ui/TableSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import ActionButtons from '@/components/ui/ActionButtons';
import { useTranslation } from 'react-i18next';
import { useFormatDate } from '@/hooks/useFormatDate';
import VehicleDialog from './VehicleDialog';
import DeleteModal from '@/components/DeleteModal';

const CustomerVehicleIndex = () => {
    const { t } = useTranslation();
    const { formatDateTime } = useFormatDate();
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [brands, setBrands] = useState<any[]>([]);

    // Filters & Pagination
    const [search, setSearch] = useState('');
    const [brandFilter, setBrandFilter] = useState('all');
    const [perPage, setPerPage] = useState(10);
    
    // Dialog state
    const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    
    // Delete state
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                search: search,
                ...(brandFilter !== 'all' && { brand_id: brandFilter }),
            });

            const [vehRes, brandRes] = await Promise.all([
                fetch(`/api/crm/customer-vehicles?${queryParams}`),
                fetch('/api/services/vehicle-brands'),
            ]);

            const vehData = await vehRes.json();
            const brandData = await brandRes.json();

            setVehicles(vehData);
            setBrands(brandData);
        } catch (error) {
            toast.error('Failed to load vehicles');
        } finally {
            setLoading(false);
        }
    }, [search, brandFilter]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleEdit = (vehicle: any) => {
        setSelectedVehicle(vehicle);
        setDialogOpen(true);
    };

    const handleDeleteClick = (id: number) => {
        setDeleteId(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            const response = await fetch(`/api/crm/customer-vehicles/${deleteId}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
            });
            if (response.ok) {
                toast.success('Vehicle deleted successfully');
                fetchData();
            } else {
                const data = await response.json();
                toast.error(data.message || 'Failed to delete vehicle');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setIsDeleteModalOpen(false);
            setDeleteId(null);
        }
    };

    return (
        <div className="space-y-6 pb-12">
            <FilterBar
                icon={<IconCar className="w-6 h-6 text-primary" />}
                title="Customer Vehicles"
                description="Manage and track all customer-owned vehicles in your system."
                search={search}
                setSearch={setSearch}
                onAdd={() => { setSelectedVehicle(null); setDialogOpen(true); }}
                addLabel="Register Vehicle"
                onRefresh={fetchData}
                itemsPerPage={perPage}
                setItemsPerPage={setPerPage}
                hasActiveFilters={brandFilter !== 'all'}
                onClearFilters={() => {
                    setBrandFilter('all');
                    setSearch('');
                }}
            >
                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Brand Matrix</span>
                    <Select value={brandFilter} onValueChange={setBrandFilter}>
                        <SelectTrigger className="h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm transition-all focus:ring-primary">
                            <SelectValue placeholder="All Brands" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="font-medium">All Brands</SelectItem>
                            {brands.map(b => (
                                <SelectItem key={b.id} value={String(b.id)} className="font-medium">{b.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </FilterBar>

            {loading ? (
                <TableSkeleton columns={7} rows={5} />
            ) : vehicles.length === 0 ? (
                <EmptyState
                    isSearch={!!search || brandFilter !== 'all'}
                    searchTerm={search}
                    title={search || brandFilter !== 'all' ? "No Matches Found" : "No Vehicles Registered"}
                    description={search || brandFilter !== 'all' 
                        ? "We couldn't find any vehicles matching your current filters. Try adjusting your search or clearing filters." 
                        : "Your customer vehicle registry is currently empty. Start by adding your first vehicle."
                    }
                    onAction={() => { setSelectedVehicle(null); setDialogOpen(true); }}
                    actionLabel="Register Vehicle"
                    onClearFilter={() => {
                        setSearch('');
                        setBrandFilter('all');
                    }}
                />
            ) : (
                <div className="panel bg-white dark:bg-gray-900 border-none shadow-sm overflow-hidden p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-white-dark/5 text-gray-500 uppercase text-[10px] font-bold tracking-wider border-b dark:border-gray-800">
                                <tr>
                                    <th className="px-6 py-4 text-left">Plate & Info</th>
                                    <th className="px-6 py-4 text-left">Brand & Model</th>
                                    <th className="px-6 py-4 text-left">Owner</th>
                                    <th className="px-6 py-4 text-center">Color & Year</th>
                                    <th className="px-6 py-4 text-center">Mileage</th>
                                    <th className="px-6 py-4 text-left">Created</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {vehicles.map((v) => (
                                    <tr key={v.id} className="hover:bg-gray-50/50 dark:hover:bg-white-dark/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-black text-gray-900 dark:text-gray-100 text-sm tracking-tight">{v.plate_number}</span>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">VIN: {v.vin_last_4 || '----'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-primary/5 text-primary flex items-center justify-center font-bold relative overflow-hidden group-hover:bg-primary group-hover:text-white transition-all">
                                                    <IconCar size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-gray-100">{v.brand?.name}</p>
                                                    <p className="text-xs text-gray-500 font-medium">{v.model?.name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <IconUser size={14} className="text-primary" />
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-gray-100 text-xs">{v.customer?.name}</p>
                                                    <p className="text-[10px] text-gray-500 font-mono tracking-tighter">{v.customer?.customer_code}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="flex items-center gap-1">
                                                    <IconPalette size={12} className="text-gray-400" />
                                                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{v.color || 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <IconCalendar size={12} className="text-gray-400" />
                                                    <span className="text-[10px] font-bold text-gray-400 tracking-widest">{v.year || '----'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
                                                <IconGauge size={12} stroke={3} />
                                                <span className="text-[11px] font-black tracking-tight">{v.current_mileage?.toLocaleString() || 0} KM</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">
                                                {formatDateTime(v.created_at)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <ActionButtons
                                                onEdit={() => handleEdit(v)}
                                                onDelete={() => handleDeleteClick(v.id)}
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

            <VehicleDialog
                isOpen={dialogOpen}
                setIsOpen={setDialogOpen}
                vehicle={selectedVehicle}
                onSave={fetchData}
            />

            <DeleteModal
                isOpen={isDeleteModalOpen}
                setIsOpen={setIsDeleteModalOpen}
                onConfirm={confirmDelete}
                title="Delete Customer Vehicle"
                message="Are you sure you want to delete this vehicle? This action cannot be undone if there are no linked records."
            />
        </div>
    );
};

export default CustomerVehicleIndex;
