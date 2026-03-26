import { useState, useEffect } from 'react';
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
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { useCRMCustomerVehicles, useCRMVehicleBrands, useCRMDeleteVehicle } from '@/hooks/useCRMData';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useQueryClient } from '@tanstack/react-query';
import HighlightText from '@/components/ui/HighlightText';


const CustomerVehicleIndex = () => {
    const dispatch = useDispatch();
    const queryClient = useQueryClient();
    const { t } = useTranslation();
    const { formatDateTime } = useFormatDate();

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

    // Queries
    const { data: vehicles = [], isLoading: vehiclesLoading } = useCRMCustomerVehicles({
        search: search,
        brand_id: brandFilter !== 'all' ? brandFilter : undefined,
    });
    const { data: brands = [] } = useCRMVehicleBrands();

    // Mutations
    const deleteMutation = useCRMDeleteVehicle();

    // Loading State
    const loading = useDelayedLoading(vehiclesLoading);

    useEffect(() => {
        dispatch(setPageTitle(t('customer_vehicles')));
    }, [dispatch, t]);

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
            await deleteMutation.mutateAsync(deleteId);
            toast.success(t('success_delete_vehicle'));
        } catch (error: any) {
            toast.error(error?.response?.data?.message || t('failed_delete_vehicle'));
        } finally {
            setIsDeleteModalOpen(false);
            setDeleteId(null);
        }
    };

    return (
        <div className="space-y-6 pb-12">
            <FilterBar
                icon={<IconCar className="w-6 h-6 text-primary" />}
                title={t('customer_vehicles')}
                description={t('manage_vehicles_desc')}
                search={search}
                setSearch={setSearch}
                onAdd={() => { setSelectedVehicle(null); setDialogOpen(true); }}
                addLabel={t('register_vehicle')}
                onRefresh={() => queryClient.invalidateQueries({ queryKey: ['crm_customer_vehicles'] })}
                itemsPerPage={perPage}
                setItemsPerPage={setPerPage}
                hasActiveFilters={brandFilter !== 'all'}
                onClearFilters={() => {
                    setBrandFilter('all');
                    setSearch('');
                }}
            >
                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('brand_matrix')}</span>
                    <Select value={brandFilter} onValueChange={setBrandFilter}>
                        <SelectTrigger className="h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm transition-all focus:ring-primary">
                            <SelectValue placeholder={t('all_brands')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="font-medium">{t('all_brands')}</SelectItem>
                            {brands.map((b: any) => (
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
                    title={search || brandFilter !== 'all' ? t('no_matches_found') : t('no_vehicles_found')}
                    description={search || brandFilter !== 'all' 
                        ? t('no_matches_desc')
                        : t('no_vehicles_desc')
                    }
                    onAction={() => { setSelectedVehicle(null); setDialogOpen(true); }}
                    actionLabel={t('register_vehicle')}
                    onClearFilter={() => {
                        setSearch('');
                        setBrandFilter('all');
                    }}
                />
            ) : (
                <div className="panel bg-white dark:bg-gray-900 border shadow-sm overflow-hidden p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-white-dark/5 text-gray-500 uppercase text-[12px] font-bold tracking-wider border-b  border-gray-200 dark:border-gray-600">
                                <tr>
                                    <th className="px-6 py-4 text-left">{t('plate_info')}</th>
                                    <th className="px-6 py-4 text-left">{t('brand_model')}</th>
                                    <th className="px-6 py-4 text-left">{t('owner')}</th>
                                    <th className="px-6 py-4 text-center">{t('color_year')}</th>
                                    <th className="px-6 py-4 text-center">{t('mileage')}</th>
                                    <th className="px-6 py-4 text-left">{t('created_at')}</th>
                                    <th className="px-6 py-4 text-right">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {vehicles.map((v: any) => (
                                    <tr key={v.id} className="hover:bg-gray-50/50 dark:hover:bg-white-dark/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-black text-gray-900 dark:text-gray-100 text-sm tracking-tight">
                                                    <HighlightText text={v.plate_number} highlight={search} />
                                                </span>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                                    {t('vin_label')}: <HighlightText text={v.vin_last_4 || '----'} highlight={search} />
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-primary/5 text-primary flex items-center justify-center font-bold relative overflow-hidden group-hover:bg-primary group-hover:text-white transition-all">
                                                    <IconCar size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-gray-100">
                                                        <HighlightText text={v.brand?.name || ''} highlight={search} />
                                                    </p>
                                                    <p className="text-xs text-gray-500 font-medium">
                                                        <HighlightText text={v.model?.name || ''} highlight={search} />
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <IconUser size={14} className="text-primary" />
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-gray-100 text-xs">
                                                        <HighlightText text={v.customer?.name || ''} highlight={search} />
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 font-mono tracking-tighter">
                                                        <HighlightText text={v.customer?.customer_code || ''} highlight={search} />
                                                    </p>
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
                onSave={() => queryClient.invalidateQueries({ queryKey: ['crm_customer_vehicles'] })}
            />

            <DeleteModal
                isOpen={isDeleteModalOpen}
                setIsOpen={setIsDeleteModalOpen}
                onConfirm={confirmDelete}
                title={t('delete_vehicle')}
                message={t('delete_vehicle_confirm')}
            />
        </div>
    );
};

export default CustomerVehicleIndex;
