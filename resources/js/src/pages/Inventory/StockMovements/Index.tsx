import { useEffect, useState, useMemo } from 'react';
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
    IconPackage
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
    PURCHASE_RECEIVE: { label: 'Purchase Receive', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: IconArrowDownLeft },
    PURCHASE_RETURN: { label: 'Purchase Return', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: IconArrowUpRight },
    SALE: { label: 'Sale', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: IconArrowUpRight },
    SALE_EDIT_DEDUCT: { label: 'Sale Edit (-)', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: IconArrowUpRight },
    SALE_EDIT_RESTOCK: { label: 'Sale Edit (+)', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: IconArrowDownLeft },
    SALE_CANCELLATION: { label: 'Sale Cancelled', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: IconArrowDownLeft },
    ADJUSTMENT_DAMAGE: { label: 'Damage', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: IconAdjustments },
    ADJUSTMENT_FOUND: { label: 'Found', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: IconAdjustments },
    ADJUSTMENT_STOCK_TAKE: { label: 'Stock Take', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: IconAdjustments },
    ADJUSTMENT_OTHER: { label: 'Adjustment', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', icon: IconAdjustments },
    TRANSFER_OUT: { label: 'Transfer Out', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: IconArrowsExchange },
    TRANSFER_IN: { label: 'Transfer In', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', icon: IconArrowsExchange },
    STOCK_IN_MANUAL: { label: 'Manual In', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400', icon: IconArrowDownLeft },
    STOCK_OUT_MANUAL: { label: 'Manual Out', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400', icon: IconArrowUpRight },
};

const REASON_LABELS: Record<string, string> = {
    'ADJUSTMENT_DAMAGE': 'Damage',
    'ADJUSTMENT_FOUND': 'Found',
    'ADJUSTMENT_STOCK_TAKE_CORRECTION': 'Stock Take Correction',
    'ADJUSTMENT_OTHER': 'Other',
    'STOCK_IN_MANUAL': 'Manual Stock In',
    'STOCK_OUT_MANUAL': 'Manual Stock Out',
};

const formatReason = (reason: string | null) => {
    if (!reason) return null;
    return REASON_LABELS[reason] || reason.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

const StockMovementsIndex = () => {
    const dispatch = useDispatch();
    const { formatDateTime } = useFormatDate();
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [loading, setLoading] = useState(true);

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
    const [locations, setLocations] = useState<any[]>([]);

    useEffect(() => {
        dispatch(setPageTitle('Stock Movements'));
        fetchLocations();
    }, []);

    useEffect(() => {
        fetchMovements();
    }, [search, sortBy, sortDirection, currentPage, itemsPerPage, dateRange, locationId, movementType]);

    const fetchLocations = async () => {
        try {
            const res = await fetch('/api/inventory/locations');
            const data = await res.json();
            setLocations(data);
        } catch (error) {
            console.error('Failed to fetch locations:', error);
        }
    };

    const fetchMovements = async () => {
        try {
            setLoading(true);
            
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (locationId && locationId !== 'all') params.append('location_id', String(locationId));
            if (movementType && movementType !== 'all') params.append('movement_type', movementType);
            if (dateRange?.from) params.append('start_date', format(dateRange.from, 'yyyy-MM-dd'));
            if (dateRange?.to) params.append('end_date', format(dateRange.to, 'yyyy-MM-dd'));
            
            const res = await fetch(`/api/inventory/stock-movements?${params.toString()}`);
            const data = await res.json();
            setMovements(data);
        } catch (error) {
            console.error('Failed to fetch movements:', error);
        } finally {
            setLoading(false);
        }
    };

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
                placeholder="Search products or reasons..."
                title="Stock Movement History"
                description="View and manage stock movements."
                onRefresh={fetchMovements}
                icon={<IconHistory className="w-6 h-6 text-primary" />}
                hasActiveFilters={!!((locationId && locationId !== 'all') || (movementType && movementType !== 'all') || dateRange)}
                onClearFilters={() => {
                    setLocationId('all');
                    setMovementType('all');
                    setDateRange(undefined);
                }}
            >
                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Date Range</span>
                    <DateRangePicker
                        value={dateRange}
                        onChange={setDateRange}
                        placeholder="All Dates"
                    />
                </div>
                
                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Location</span>
                    <SearchableSelect
                        options={[
                            { value: 'all', label: 'All Locations' },
                            ...locations.map(l => ({ value: l.id, label: l.name }))
                        ]}
                        value={locationId || 'all'}
                        onChange={setLocationId}
                        placeholder="All Locations"
                    />
                </div>

                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Movement Type</span>
                    <Select value={movementType || 'all'} onValueChange={setMovementType}>
                        <SelectTrigger className="h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="font-medium">All Types</SelectItem>
                            {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                                <SelectItem key={key} value={key} className="font-medium">{config.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </FilterBar>

            {loading ? (
                <TableSkeleton columns={7} rows={10} />
            ) : movements.length === 0 ? (
                <EmptyState
                    title="No movements recorded"
                    description="Stock movements will appear here once products are received, sold, or adjusted."
                    isSearch={!!search}
                />
            ) : (
                <div className="panel p-0 border-0 shadow-sm overflow-hidden rounded-2xl">
                    <div className="table-responsive">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                                    <SortableHeader label="Date & Time" value="created_at" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                    <SortableHeader label="Product" value="product" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                    <SortableHeader label="Location" value="location" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                    <SortableHeader label="Type" value="movement_type" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                    <th className="px-4 py-4 text-right">In/Out</th>
                                    <th className="px-4 py-4 text-right">Balance</th>
                                    <th className="px-4 py-4 text-left">Reason / Reference</th>
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
                                                    <div>
                                                        <p className="font-semibold text-gray-900 dark:text-white leading-none">
                                                            {m.product?.name}
                                                            {m.product?.baseUom && (
                                                                <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded lowercase font-medium">
                                                                    {m.product.baseUom.short_name || m.product.baseUom.name}
                                                                </span>
                                                            )}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1 font-mono">{m.product?.code}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-gray-600 dark:text-gray-300 font-medium">
                                                {m.location?.name}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${config.color}`}>
                                                    <Icon className="w-3.5 h-3.5" />
                                                    {config.label}
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
                                                    <span className="text-[10px] text-gray-400 font-mono">from {parseFloat(m.previous_quantity)}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                                {formatReason(m.reason) || '—'}
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
