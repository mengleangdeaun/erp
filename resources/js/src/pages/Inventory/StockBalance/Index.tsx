import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { IconScale, IconChevronDown, IconChevronRight, IconPackage, IconBuildingSkyscraper, IconMapPin, IconRuler2, IconHash } from '@tabler/icons-react';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import { useStockBalance, useBranches, useInventoryLocations } from '@/hooks/useInventoryData';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import HighlightText from '../../../components/ui/HighlightText';

const StockBalanceIndex = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const [branchId, setBranchId] = useState('');
    const [locationId, setLocationId] = useState('');
    const [search, setSearch] = useState('');
    const [itemsPerPage, setItemsPerPage] = useState(15);
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

    useEffect(() => {
        dispatch(setPageTitle(t('stock_balance')));
    }, [dispatch, t]);

    const { data, isLoading, refetch } = useStockBalance({ 
        branch_id: branchId, 
        location_id: locationId 
    });

    const { data: branches = [] } = useBranches();
    const { data: locations = [] } = useInventoryLocations();

    const branchOptions = useMemo(() => [
        { value: '', label: t('all_branches') },
        ...branches.map((b: any) => ({ value: String(b.id), label: b.name }))
    ], [branches, t]);

    const locationOptions = useMemo(() => {
        let filtered = locations;
        if (branchId) {
            filtered = locations.filter((l: any) => String(l.branch_id) === branchId);
        }
        return [
            { value: '', label: t('all_locations') },
            ...filtered.map((l: any) => ({ value: String(l.id), label: l.name }))
        ];
    }, [locations, branchId, t]);

    // Reset location when branch changes
    useEffect(() => {
        setLocationId('');
    }, [branchId]);

    const displayData = Array.isArray(data) ? data : [];

    const toggleRow = (id: number) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    const filteredData = useMemo(() => {
        if (!search) return displayData;
        const q = search.toLowerCase();
        return displayData.filter(p => 
            p.name.toLowerCase().includes(q) || 
            p.code.toLowerCase().includes(q) || 
            p.sku?.toLowerCase().includes(q)
        );
    }, [displayData, search]);

    return (
        <div className="space-y-6">
            <FilterBar 
                icon={<IconScale className="w-6 h-6 text-primary" />} 
                title={t('stock_balance_report')} 
                description={t('aggregated_inventory_desc')}
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onRefresh={() => { refetch(); }}
            >
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="w-full sm:w-60">
                        <SearchableSelect 
                            options={branchOptions}
                            value={branchId}
                            onChange={(val) => setBranchId(val as string)}
                            placeholder={t('filter_by_branch')}
                        />
                    </div>
                    <div className="w-full sm:w-60">
                        <SearchableSelect 
                            options={locationOptions}
                            value={locationId}
                            onChange={(val) => setLocationId(val as string)}
                            placeholder={t('filter_by_location')}
                            disabled={!branchId}
                        />
                    </div>
                </div>
            </FilterBar>

            {isLoading ? (
                <TableSkeleton columns={5} rows={10} />
            ) : filteredData.length === 0 ? (
                <EmptyState 
                    title={t('no_stock_data_found')}
                    description={search || branchId || locationId ? t('adjust_filters_msg') : t('inventory_empty_msg')}
                    isSearch={!!search || !!branchId || !!locationId}
                    onClearFilter={() => {
                        setSearch('');
                        setBranchId('');
                        setLocationId('');
                    }}
                />
            ) : (
                <div className="bg-white dark:bg-black rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 text-left">
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 w-10"></th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">{t('product')}</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">{t('bulk_stock')}</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">{t('serial_rolls')}</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">{t('total_available')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filteredData.map((product) => (
                                    <use key={product.id} className="contents">
                                        <tr 
                                            className={cn(
                                                "hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer group",
                                                expandedRows.has(product.id) && "bg-primary/5 dark:bg-primary/5"
                                            )}
                                            onClick={() => toggleRow(product.id)}
                                        >
                                            <td className="px-6 py-4">
                                                {expandedRows.has(product.id) ? 
                                                    <IconChevronDown size={20} className="text-primary" /> : 
                                                    <IconChevronRight size={20} className="text-gray-400 group-hover:text-primary transition-colors" />
                                                }
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-primary/10 p-2 rounded-lg">
                                                        <IconPackage className="text-primary w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <HighlightText 
                                                            text={product.name} 
                                                            highlight={search} 
                                                            className="font-bold text-gray-900 dark:text-white" 
                                                        />
                                                        <div className="text-xs text-gray-500 font-mono tracking-tighter">
                                                            <HighlightText text={product.code} highlight={search} />
                                                            {product.sku && (
                                                                <> • <HighlightText text={product.sku} highlight={search} /></>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-medium">{product.total_bulk_qty.toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-medium text-amber-600 dark:text-amber-400">{product.total_serial_qty}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-lg font-black text-primary">
                                                {product.total_stock.toLocaleString()}
                                            </td>
                                        </tr>
                                        {expandedRows.has(product.id) && (
                                            <tr className="bg-gray-50/30 dark:bg-gray-900/30 border-t-0">
                                                <td colSpan={5} className="px-12 py-6">
                                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                                        <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                                                            <div className="h-px w-8 bg-gray-200 dark:bg-gray-800"></div>
                                                            {t('network_distribution')}
                                                            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800"></div>
                                                        </h4>
                                                        
                                                        { (product.branches || []).length === 0 ? (
                                                            <div className="text-sm italic text-gray-400 py-2">{t('no_distribution_records')}</div>
                                                        ) : (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                                {(product.branches || []).map((branch: any) => (
                                                                    <div key={branch.id} className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden relative group/branch">
                                                                        
                                                                        <div className="flex items-center gap-2 mb-4 relative">
                                                                            <IconBuildingSkyscraper size={18} className="text-primary" />
                                                                            <span className="font-bold text-gray-900 dark:text-white uppercase text-xs tracking-tight">{branch.name}</span>
                                                                        </div>

                                                                        <div className="space-y-3">
                                                                            {branch.locations.map((loc: any) => (
                                                                                <div key={loc.id} className="flex items-center justify-between text-sm py-1.5 border-b border-dashed border-gray-100 dark:border-gray-800 last:border-0">
                                                                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                                                        <IconMapPin size={14} className="opacity-40" />
                                                                                        <span>{loc.name}</span>
                                                                                    </div>
                                                                                    <div className="flex gap-3">
                                                                                        <span className="font-bold">{parseFloat(loc.bulk_qty).toLocaleString()}</span>
                                                                                        {loc.serial_qty > 0 && (
                                                                                            <Popover>
                                                                                                <PopoverTrigger asChild>
                                                                                                    <button className="text-[10px] font-black bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 rounded uppercase self-center hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors shadow-sm active:scale-95">
                                                                                                        {loc.serial_qty} {t('rolls')}
                                                                                                    </button>
                                                                                                </PopoverTrigger>
                                                                                                <PopoverContent className="w-80 p-0 overflow-hidden shadow-2xl border-amber-100 dark:border-amber-900/50" side="right" align="start">
                                                                                                    <div className="bg-amber-50/50 dark:bg-amber-950/20 px-4 py-3 border-b border-amber-100 dark:border-amber-900/50">
                                                                                                        <div className="flex items-center gap-2">
                                                                                                            <div className="bg-amber-100 dark:bg-amber-900/40 p-1.5 rounded-lg">
                                                                                                                <IconPackage size={16} className="text-amber-600" />
                                                                                                            </div>
                                                                                                            <div>
                                                                                                                <div className="text-xs font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">{t('available_rolls')}</div>
                                                                                                                <div className="text-[10px] text-amber-600/60 font-medium">{loc.name}</div>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                    <ScrollArea className="max-h-[350px]">
                                                                                                        <div className="p-3 space-y-3">
                                                                                                            {(product.serials || [])
                                                                                                                .filter((s: any) => String(s.location_id) === String(loc.id))
                                                                                                                .map((serial: any) => {
                                                                                                                    const initial = parseFloat(serial.initial_quantity);
                                                                                                                    const current = parseFloat(serial.current_quantity);
                                                                                                                    const percent = Math.min(100, Math.max(0, (current / initial) * 100));
                                                                                                                    
                                                                                                                    return (
                                                                                                                        <div key={serial.id} className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-100 dark:border-gray-800 shadow-sm space-y-2.5">
                                                                                                                            <div className="flex justify-between items-start">
                                                                                                                                <div className="flex items-center gap-1.5">
                                                                                                                                    <IconHash size={12} className="text-gray-400" />
                                                                                                                                    <span className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300">{serial.serial_number}</span>
                                                                                                                                </div>
                                                                                                                                <div className="text-[10px] font-black text-primary bg-primary/10 px-1.5 rounded-full">
                                                                                                                                    {percent.toFixed(0)}%
                                                                                                                                </div>
                                                                                                                            </div>

                                                                                                                            <div className="flex items-center justify-between text-[11px]">
                                                                                                                                <div className="flex items-center gap-1 text-gray-500">
                                                                                                                                    <IconRuler2 size={12} className="opacity-50" />
                                                                                                                                    <span>{serial.length}m x {serial.width}m</span>
                                                                                                                                </div>
                                                                                                                                <div className="font-bold text-gray-900 dark:text-white">
                                                                                                                                    {current.toFixed(2)} <span className="text-[9px] font-normal text-gray-400">/ {initial.toFixed(2)} SQM</span>
                                                                                                                                </div>
                                                                                                                            </div>

                                                                                                                            <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                                                                                                                                <div 
                                                                                                                                    className={cn(
                                                                                                                                        "h-full transition-all duration-1000",
                                                                                                                                        percent > 50 ? "bg-primary" : percent > 20 ? "bg-amber-500" : "bg-danger"
                                                                                                                                    )}
                                                                                                                                    style={{ width: `${percent}%` }}
                                                                                                                                />
                                                                                                                            </div>
                                                                                                                        </div>
                                                                                                                    );
                                                                                                                })}
                                                                                                        </div>
                                                                                                    </ScrollArea>
                                                                                                </PopoverContent>
                                                                                            </Popover>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>

                                                                        <div className="mt-4 pt-3 border-t border-gray-50 dark:border-gray-800/50 flex justify-between items-end relative">
                                                                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{t('branch_total')}</span>
                                                                            <div className="text-right">
                                                                                <div className="text-xs font-bold text-primary">{(branch.bulk_qty + branch.serial_qty).toLocaleString()} {t('units')}</div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </use>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockBalanceIndex;
