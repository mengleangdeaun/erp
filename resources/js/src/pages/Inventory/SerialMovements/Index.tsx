import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import { 
    IconHistory, 
    IconArrowUpRight, 
    IconArrowDownLeft, 
    IconAdjustments,
    IconPackage,
    IconBarcode
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
import { useSerialMovements, useInventoryLocations } from '@/hooks/useInventoryData';
import HighlightText from '../../../components/ui/HighlightText';

interface SerialMovement {
    id: number;
    serial_id: number;
    product_id: number;
    location_id: number;
    user_id: number | null;
    movement_type: string;
    quantity: string;
    width: string | null;
    height: string | null;
    previous_quantity: string;
    current_quantity: string;
    reference_type: string | null;
    reference_id: number | null;
    reason: string | null;
    created_at: string;
    serial?: {
        id: number;
        serial_number: string;
    };
    product?: {
        id: number;
        name: string;
        code: string;
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
    JOB_CARD_CONSUMPTION: { label: 'Job Card', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: IconArrowUpRight },
    ADJUSTMENT: { label: 'Adjustment', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: IconAdjustments },
    MANUAL: { label: 'Manual', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', icon: IconHistory },
};

const SerialMovementsIndex = () => {
    const dispatch = useDispatch();
    const { formatDateTime } = useFormatDate();
    const [searchParams] = useSearchParams();

    // Filter & Sort States
    const [search, setSearch] = useState(searchParams.get('search') || '');
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
    const { data: movements = [], isLoading: loading, refetch } = useSerialMovements({
        search,
        location_id: locationId !== 'all' ? locationId : undefined,
        movement_type: movementType !== 'all' ? movementType : undefined,
        start_date: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
        end_date: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
    });

    useEffect(() => {
        dispatch(setPageTitle('Serial Movements'));
    }, [dispatch]);

    const filteredAndSortedMovements = useMemo(() => {
        let result = [...movements];

        result.sort((a, b) => {
            let valA: any = a[sortBy as keyof SerialMovement] || '';
            let valB: any = b[sortBy as keyof SerialMovement] || '';

            if (sortBy === 'product') {
                valA = a.product?.name || '';
                valB = b.product?.name || '';
            } else if (sortBy === 'serial') {
                valA = a.serial?.serial_number || '';
                valB = b.serial?.serial_number || '';
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
                placeholder="Search serials, products or reasons..."
                title="Serial Movement History"
                description="View and manage roll serial history."
                onRefresh={() => { refetch(); }}
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
                    <DateRangePicker value={dateRange} onChange={setDateRange} placeholder="All Dates" />
                </div>
                
                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Location</span>
                    <SearchableSelect
                        options={[
                            { value: 'all', label: 'All Locations' },
                            ...locations.map((l: any) => ({ value: l.id, label: l.name }))
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
                            <SelectItem value="all">All Types</SelectItem>
                            {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                                <SelectItem key={key} value={key}>{config.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </FilterBar>

            {loading ? (
                <TableSkeleton columns={7} rows={10} />
            ) : filteredAndSortedMovements.length === 0 ? (
                <EmptyState
                    title="No serial movements recorded"
                    description="Serial movements will appear here when roll serials are consumed or adjusted."
                    isSearch={!!search}
                />
            ) : (
                <div className="panel p-0 border shadow-sm overflow-hidden rounded-lg mt-6">
                    <div className="table-responsive">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                    <th className="px-4 py-4 text-left">Date</th>
                                    <th className="px-4 py-4 text-left">Serial Number</th>
                                    <th className="px-4 py-4 text-left">Product</th>
                                    <th className="px-4 py-4 text-left text-center">Dimensions</th>
                                    <th className="px-4 py-4 text-right">Qty (SQM)</th>
                                    <th className="px-4 py-4 text-right">Remaining</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {paginatedMovements.map(m => {
                                    const config = TYPE_CONFIG[m.movement_type] || { label: m.movement_type, color: 'bg-gray-100 text-gray-700', icon: IconHistory };
                                    const Icon = config.icon;
                                    const isPositive = parseFloat(m.quantity) > 0;

                                    return (
                                        <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-4 py-4 whitespace-nowrap text-gray-400 font-mono text-[10px]">
                                                {formatDateTime(m.created_at)}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded">
                                                        <IconBarcode className="w-3.5 h-3.5 text-blue-500" />
                                                    </div>
                                                    <HighlightText 
                                                        text={m.serial?.serial_number} 
                                                        highlight={search} 
                                                        className="font-bold text-gray-900 dark:text-gray-100" 
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div>
                                                    <HighlightText 
                                                        text={m.product?.name} 
                                                        highlight={search} 
                                                        className="font-semibold text-gray-700 dark:text-gray-300 leading-none" 
                                                    />
                                                    <HighlightText 
                                                        text={m.product?.code} 
                                                        highlight={search} 
                                                        className="text-[10px] text-gray-400 font-mono mt-1 block" 
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                {m.width && m.height ? (
                                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-black text-slate-500">
                                                        {parseFloat(m.width)} x {parseFloat(m.height)}
                                                    </span>
                                                ) : <span className="text-gray-300">—</span>}
                                            </td>
                                            <td className="px-4 py-4 text-right font-bold whitespace-nowrap">
                                                <span className={isPositive ? 'text-green-600' : 'text-red-500'}>
                                                    {isPositive ? '+' : ''}{parseFloat(m.quantity)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right whitespace-nowrap">
                                                <div className="flex flex-col items-end">
                                                    <span className="font-bold text-gray-900 dark:text-white underline decoration-gray-200">{parseFloat(m.current_quantity)}</span>
                                                    <span className="text-[10px] text-gray-400 font-mono">from {parseFloat(m.previous_quantity)}</span>
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

export default SerialMovementsIndex;
