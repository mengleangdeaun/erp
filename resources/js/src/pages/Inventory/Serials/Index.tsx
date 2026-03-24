import { useState, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import FilterBar from '@/components/ui/FilterBar';
import TableSkeleton from '@/components/ui/TableSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import SortableHeader from '@/components/ui/SortableHeader';
import { 
    IconRuler2, 
    IconPlus, 
    IconBuildingStore, 
    IconPackage, 
    IconHash, 
    IconChevronRight,
    IconMapPin
} from '@tabler/icons-react';
import { useSerials } from '@/hooks/useSerialData';
import { useBranches, useInventoryProducts, useInventoryLocations } from '@/hooks/useInventoryData';
import AddSerialDialog from './AddSerialDialog';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';

const SerialIndex = () => {
    const dispatch = useDispatch();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [selectedBranchId, setSelectedBranchId] = useState<string | number | null>(null);
    const [selectedLocationId, setSelectedLocationId] = useState<string | number | null>(null);
    const [selectedProductId, setSelectedProductId] = useState<string | number | null>(null);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortBy, setSortBy] = useState('created_at');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const { data: branches = [] } = useBranches();
    const { data: products = [] } = useInventoryProducts();
    const { data: locations = [] } = useInventoryLocations();
    
    const { data: serialsData, isLoading: loadingSerials } = useSerials({
        branch_id: selectedBranchId,
        location_id: selectedLocationId,
        product_id: selectedProductId,
        page: currentPage,
        per_page: itemsPerPage,
        search: search,
        sort_by: sortBy,
        sort_direction: sortDirection
    });

    const loading = useDelayedLoading(loadingSerials, 500);

    useEffect(() => {
        dispatch(setPageTitle('Roll Inventory Management'));
    }, [dispatch]);

    const branchOptions = useMemo(() => 
        branches.map((b: any) => ({ value: b.id, label: b.name, description: b.code })),
    [branches]);

    const productOptions = useMemo(() => 
        products.map((p: any) => ({ value: p.id, label: p.name, description: p.code })),
    [products]);

    const filteredLocations = useMemo(() => 
        locations.filter((loc: any) => !selectedBranchId || loc.branch_id === parseInt(selectedBranchId as string)),
    [locations, selectedBranchId]);

    const locationOptions = useMemo(() => 
        filteredLocations.map((loc: any) => ({ value: loc.id, label: loc.name, description: loc.is_primary ? 'Primary' : '' })),
    [filteredLocations]);

    const handleRefresh = () => {
        // Handled by react-query invalidation
    };

    const handleSort = (column: string) => {
        if (sortBy === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortDirection('asc');
        }
    };

    return (
        <div className="space-y-6">
            <FilterBar
                icon={<IconRuler2 className="w-6 h-6 text-primary" />}
                title="Roll Inventory Management"
                description="Monitor and manage serialized film rolls across all branches"
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onRefresh={handleRefresh}
                onAdd={() => setIsAddOpen(true)}
                addLabel="Register New Roll"
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar Filters */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="shadow-sm border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-gray-500">
                                <IconBuildingStore size={16} />
                                Branch Filter
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-gray-400">Branch</Label>
                                <SearchableSelect
                                    options={[{ value: 'all', label: 'All Branches' }, ...branchOptions]}
                                    value={selectedBranchId || 'all'}
                                    onChange={(val) => {
                                        setSelectedBranchId(val === 'all' ? null : val);
                                        setSelectedLocationId(null); // Reset location when branch changes
                                    }}
                                    placeholder="All Branches"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-gray-400">Location</Label>
                                <SearchableSelect
                                    options={[{ value: 'all', label: 'All Locations' }, ...locationOptions]}
                                    value={selectedLocationId || 'all'}
                                    onChange={(val) => setSelectedLocationId(val === 'all' ? null : val)}
                                    placeholder="All Locations"
                                    disabled={!selectedBranchId && selectedBranchId !== null} 
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-gray-500">
                                <IconPackage size={16} />
                                Product Filter
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <SearchableSelect
                                options={[{ value: 'all', label: 'All Products' }, ...productOptions]}
                                value={selectedProductId || 'all'}
                                onChange={(val) => setSelectedProductId(val === 'all' ? null : val)}
                                placeholder="All Products"
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Table */}
                <div className="lg:col-span-3">
                    {loading ? (
                        <TableSkeleton columns={6} rows={8} />
                    ) : (
                        <div className="bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 dark:bg-gray-900/50">
                                        <SortableHeader label="Roll Serial" value="serial_number" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} className="px-6 py-4" />
                                        <SortableHeader label="Product" value="product_id" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} className="px-6 py-4" />
                                        <SortableHeader label="Remaining" value="current_quantity" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} className="px-6 py-4 text-center" />
                                        <SortableHeader label="Branch & Location" value="branch_id" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} className="px-6 py-4" />
                                        <SortableHeader label="Status" value="status" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} className="px-6 py-4 text-center" />
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                                    {serialsData?.data?.length > 0 ? (
                                        serialsData.data.map((serial: any) => (
                                            <tr key={serial.id} className="transition-colors group">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                            <IconHash size={16} />
                                                        </div>
                                                        <span className="font-black tracking-tight text-gray-900 dark:text-gray-100">{serial.serial_number}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-800 dark:text-gray-200">{serial.product?.name}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{serial.product?.code}</span>
                                                            <span className="text-[10px] font-bold text-primary/70 bg-primary/5 px-1.5 py-0.5 rounded uppercase tracking-tight flex items-center gap-1">
                                                                <IconRuler2 size={10} />
                                                                {parseFloat(serial.width).toFixed(2)}m x {parseFloat(serial.length).toFixed(1)}m
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className={`font-black tracking-tighter ${parseFloat(serial.current_quantity) < 5 ? 'text-rose-500' : 'text-emerald-600'}`}>
                                                            {parseFloat(serial.current_quantity).toFixed(2)} sqm
                                                        </span>
                                                        <span className="text-[10px] font-bold text-gray-400 italic">
                                                            ~ {(parseFloat(serial.current_quantity) / parseFloat(serial.width)).toFixed(2)}m left
                                                        </span>
                                                        <div className="w-16 h-1 bg-gray-100 dark:bg-gray-900 rounded-full mt-1.5 overflow-hidden">
                                                            <div 
                                                                className={`h-full ${parseFloat(serial.current_quantity) < 5 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                                                                style={{ width: `${Math.min(100, (parseFloat(serial.current_quantity) / parseFloat(serial.initial_quantity)) * 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <IconBuildingStore size={12} className="text-gray-400" />
                                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{serial.branch?.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <IconMapPin size={12} className="text-primary" />
                                                            <span className="text-[10px] font-black uppercase text-primary/70">{serial.location?.name || 'Main Hall'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <Badge 
                                                        variant={serial.status === 'Available' ? 'success' : serial.status === 'Empty' ? 'secondary' : 'destructive'} 
                                                        className="h-5 px-3 text-[9px] font-black uppercase tracking-widest rounded-full"
                                                    >
                                                        {serial.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-primary/5 hover:text-primary transition-all">
                                                        <IconChevronRight size={18} />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6}>
                                                <EmptyState isSearch={!!search} searchTerm={search} title="No film rolls found" />
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            {serialsData?.total > itemsPerPage && (
                                <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-900/50 border-t dark:border-gray-800">
                                    <Pagination 
                                        currentPage={currentPage}
                                        totalPages={Math.ceil(serialsData.total / itemsPerPage)}
                                        totalItems={serialsData.total}
                                        itemsPerPage={itemsPerPage}
                                        onPageChange={setCurrentPage}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <AddSerialDialog isOpen={isAddOpen} setIsOpen={setIsAddOpen} />
        </div>
    );
};

export default SerialIndex;
