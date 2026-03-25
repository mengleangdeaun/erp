import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import { 
    IconHistory, 
    IconArrowUpRight, 
    IconArrowDownLeft, 
    IconArrowsExchange, 
    IconAdjustments,
    IconSearch,
    IconFilter,
    IconPackage,
    IconFingerprint
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { useFormatDate } from '@/hooks/useFormatDate';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import DateRangePicker from '../../../components/ui/date-range-picker';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { DateRange } from 'react-day-picker';
import HighlightText from '../../../components/ui/HighlightText';

interface StockMovement {
    id: number;
    product_id: number;
    location_id: number;
    user_id: number | null;
    movement_type: string;
    quantity: string;
    previous_quantity: string;
    current_quantity: string;
    reference_type: string | null;
    reference_id: number | null;
    reason: string | null;
    created_at: string;
    product?: {
        id: number;
        name: string;
        code: string;
        category?: { name: string };
        baseUom?: { name: string; short_name: string };
    };
    serial?: {
        id: number;
        serial_number: string;
        current_quantity: string;
    };
    location?: {
        id: number;
        name: string;
    };
    user?: {
        id: number;
        name: string;
    };
}

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    JOB_CARD_CONSUMPTION: { label: 'job_card', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: IconArrowUpRight },
};

const REASON_LABELS: Record<string, string> = {
    'ADJUSTMENT_DAMAGE': 'damage',
    'ADJUSTMENT_FOUND': 'found',
    'ADJUSTMENT_STOCK_TAKE_CORRECTION': 'stock_take',
    'ADJUSTMENT_OTHER': 'adjustment',
    'STOCK_IN_MANUAL': 'manual_in',
    'STOCK_OUT_MANUAL': 'manual_out',
};

const formatReason = (reason: string | null, t: any) => {
    if (!reason) return null;
    return REASON_LABELS[reason] ? t(REASON_LABELS[reason]) : reason.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toString()).join(' ');
};

import { useStockMovements, useInventoryLocations } from '@/hooks/useInventoryData';

const StockMovementsIndex = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { formatDateTime } = useFormatDate();

    // Filter & Sort States
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Filter States
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [locationId, setLocationId] = useState<string | number>('all');
    const [movementType, setMovementType] = useState<string>('all');

    // TanStack Query Hooks
    const { data: locations = [] } = useInventoryLocations();
    const { data: movements = [], isLoading: loading, refetch: fetchMovements } = useStockMovements({
        search,
        location_id: locationId !== 'all' ? locationId : undefined,
        movement_type: movementType !== 'all' ? movementType : undefined,
        start_date: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
        end_date: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
    });

    useEffect(() => {
        dispatch(setPageTitle(t('stock_movements')));
    }, [dispatch, t]);

    const filteredAndSortedMovements = useMemo(() => {
        let result = [...movements];

        result.sort((a, b) => {
            let valA: any = a[sortBy as keyof StockMovement] || '';
            let valB: any = b[sortBy as keyof StockMovement] || '';

            if (sortBy === 'product') {
                valA = a.product?.name || '';
                valB = b.product?.name || '';
            } else if (sortBy === 'location') {
                valA = a.location?.name || '';
                valB = b.location?.name || '';
            }

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [movements, sortBy, sortDirection]);

    const totalPages = Math.ceil(filteredAndSortedMovements.length / itemsPerPage);
    const paginatedMovements = filteredAndSortedMovements.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div>
            <FilterBar
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                placeholder={t('search_products_reasons')}
                title={t('stock_movement_history')}
                description={t('view_manage_movements_desc')}
                onRefresh={() => { fetchMovements(); }}
                icon={<IconHistory className="w-6 h-6 text-primary" />}
                hasActiveFilters={!!((locationId && locationId !== 'all') || (movementType && movementType !== 'all') || dateRange)}
                onClearFilters={() => {
                    setLocationId('all');
                    setMovementType('all');
                    setDateRange(undefined);
                }}
            >
                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('date_range')}</span>
                    <DateRangePicker
                        value={dateRange}
                        onChange={setDateRange}
                        placeholder={t('all_dates')}
                    />
                </div>
                
                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('location')}</span>
                    <SearchableSelect
                        options={[
                            { value: 'all', label: t('all_locations') },
                            ...locations.map((l: any) => ({ value: l.id, label: l.name }))
                        ]}
                        value={locationId || 'all'}
                        onChange={setLocationId}
                        placeholder={t('all_locations')}
                    />
                </div>

                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('type')}</span>
                    <Select value={movementType || 'all'} onValueChange={setMovementType}>
                        <SelectTrigger className="h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                            <SelectValue placeholder={t('all_types')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="font-medium">{t('all_types')}</SelectItem>
                            {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                                <SelectItem key={key} value={key} className="font-medium">{t(config.label)}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </FilterBar>

            {loading ? (
                <TableSkeleton columns={7} rows={10} />
            ) : movements.length === 0 ? (
                <EmptyState
                    title={t('no_movements_recorded')}
                    description={t('stock_movements_appear_here_desc')}
                    isSearch={!!search}
                />
            ) : (
                <div className="panel p-0 border shadow-sm overflow-hidden rounded-lg">
                    <div className="table-responsive">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                                    <SortableHeader label={t('date_time')} value="created_at" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                    <SortableHeader label={t('product')} value="product" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                    <SortableHeader label={t('location')} value="location" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                    <SortableHeader label={t('type')} value="movement_type" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                    <th className="px-4 py-4 text-right">{t('in_out')}</th>
                                    <th className="px-4 py-4 text-right">{t('balance')}</th>
                                    <th className="px-4 py-4 text-left">{t('reason_note')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {paginatedMovements.map(m => {
                                    const config = TYPE_CONFIG[m.movement_type] || { label: m.movement_type, color: 'bg-gray-100 text-gray-700', icon: IconHistory };
                                    const Icon = config.icon;
                                    const isPositive = parseFloat(m.quantity) > 0;

                                    return (
                                        <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-4 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400 font-mono text-xs">
                                                {formatDateTime(m.created_at)}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                                                        <IconPackage className="w-4 h-4 text-primary" />
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <HighlightText 
                                                                text={m.product.name} 
                                                                highlight={search} 
                                                                className="font-semibold text-gray-900 dark:text-gray-100" 
                                                            />
                                                            <HighlightText 
                                                                text={m.product.code} 
                                                                highlight={search} 
                                                                className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider" 
                                                            />
                                                        </div>
                                                        {m.serial && (
                                                            <Link 
                                                                to={`/inventory/serial-movements?search=${m.serial.serial_number}`}
                                                                className="text-[10px] flex items-center gap-1 text-blue-500 hover:text-blue-600 font-medium group transition-colors"
                                                            >
                                                                <IconFingerprint size={12} className="group-hover:scale-110 transition-transform" />
                                                                <HighlightText text={`${t('serial_label')}: ${m.serial.serial_number}`} highlight={search} />
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-gray-600 dark:text-gray-300 font-medium">
                                                {m.location?.name}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${config.color}`}>
                                                    <Icon className="w-3.5 h-3.5" />
                                                    {t(config.label)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right font-bold whitespace-nowrap">
                                                <span className={isPositive ? 'text-green-600' : 'text-red-500'}>
                                                    {isPositive ? '+' : ''}{parseFloat(m.quantity)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right whitespace-nowrap">
                                                <div className="flex flex-col items-end">
                                                    <span className="font-bold text-gray-900 dark:text-white">{parseFloat(m.current_quantity)}</span>
                                                    <span className="text-[10px] text-gray-400 font-mono">{t('from')} {parseFloat(m.previous_quantity)}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                                <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate" title={m.reason || ''}>
                                                    <HighlightText text={formatReason(m.reason, t)} highlight={search} />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="border-t border-gray-100 dark:border-gray-800">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={filteredAndSortedMovements.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockMovementsIndex;
