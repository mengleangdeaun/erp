import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import { IconBuildingStore, IconPackage, IconCheck, IconX, IconDatabase, IconInfoCircle } from '@tabler/icons-react';
import { Checkbox } from '../../../components/ui/checkbox';
import { Badge } from '../../../components/ui/badge';
import { useInventoryProducts, useBranches, useBranchProducts, useSyncBranchProducts } from '@/hooks/useInventoryData';
import { useQueryClient } from '@tanstack/react-query';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';

const BranchProductIndex = () => {
    const dispatch = useDispatch();
    const { data: branches = [], isLoading: loadingBranches } = useBranches();
    const { data: products = [], isLoading: loadingProducts } = useInventoryProducts();
    const [selectedBranchId, setSelectedBranchId] = useState<string | number | null>(null);
    const { data: assignedData, isLoading: loadingAssignments } = useBranchProducts(selectedBranchId);
    const syncMutation = useSyncBranchProducts();
    const queryClient = useQueryClient();

    const [assignedProductIds, setAssignedProductIds] = useState<Set<number>>(new Set());
    const [reorderLevels, setReorderLevels] = useState<Record<number, number>>({});
    
    // Loading state for the table and main actions
    const loadingTable = useDelayedLoading(loadingProducts || loadingBranches || (!!selectedBranchId && loadingAssignments), 500);
    const isSaving = syncMutation.isPending;
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        dispatch(setPageTitle('Branch Products'));
    }, [dispatch]);


    // Sync state when assignedData changes
    useEffect(() => {
        if (assignedData) {
            const assignedIds = new Set<number>(assignedData.filter((p: any) => p.is_assigned).map((p: any) => p.id));
            setAssignedProductIds(assignedIds);
            
            const levels: Record<number, number> = {};
            assignedData.forEach((p: any) => {
                levels[p.id] = p.reorder_level || 0;
            });
            setReorderLevels(levels);
        }
    }, [assignedData]);

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['hr-branches'] });
        queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
        if (selectedBranchId) {
            queryClient.invalidateQueries({ queryKey: ['branch-products', selectedBranchId] });
        }
    };

    const branchOptions = useMemo(() => 
        branches.filter((b: any) => b.status === 'active').map((b: any) => ({ value: b.id, label: b.name, description: b.code })),
    [branches]);

    const filteredAndSortedProducts = useMemo(() => {
        let result = [...products];
        if (search) {
            const q = search.toLowerCase();
            result = result.filter((p: any) => 
                p.name.toLowerCase().includes(q) || 
                p.sku?.toLowerCase().includes(q) || 
                p.code?.toLowerCase().includes(q)
            );
        }
        result.sort((a, b) => {
            let valA = a[sortBy] || '';
            let valB = b[sortBy] || '';
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        return result;
    }, [products, search, sortBy, sortDirection]);

    const handleSave = async () => {
        if (!selectedBranchId) return;
        try {
            const productsToSync = Array.from(assignedProductIds).map(id => ({
                id,
                reorder_level: reorderLevels[id] || 0
            }));
            
            await syncMutation.mutateAsync({ 
                branchId: selectedBranchId, 
                products: productsToSync
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleToggleProduct = (productId: number) => {
        const newSet = new Set(assignedProductIds);
        if (newSet.has(productId)) {
            newSet.delete(productId);
        } else {
            newSet.add(productId);
        }
        setAssignedProductIds(newSet);
    };

    const handleReorderLevelChange = (productId: number, value: string) => {
        const level = parseInt(value) || 0;
        setReorderLevels(prev => ({
            ...prev,
            [productId]: level
        }));
        
        // Auto-assign if reorder level is set? 
        // No, keep it explicit via checkbox for now but ensure it's in the set if user wants it
    };

    const handleSelectAll = (checked: boolean) => {
        const newSet = new Set(assignedProductIds);
        filteredAndSortedProducts.forEach(product => {
            if (checked) {
                newSet.add(product.id);
            } else {
                newSet.delete(product.id);
            }
        });
        setAssignedProductIds(newSet);
    };

    const isAllSelected = useMemo(() => {
        if (filteredAndSortedProducts.length === 0) return false;
        return filteredAndSortedProducts.every(p => assignedProductIds.has(p.id));
    }, [filteredAndSortedProducts, assignedProductIds]);

    const paginatedProducts = filteredAndSortedProducts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );
    const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);

    return (
        <div className="space-y-6">
            <FilterBar
                icon={<IconBuildingStore className="w-6 h-6 text-primary" />}
                title="Branch Product Management"
                description="Control which products are available for each branch"
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onRefresh={handleRefresh}
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <Card className="lg:col-span-1 shadow-sm border-gray-100 dark:border-gray-800">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                           <IconBuildingStore size={20} className="text-primary" />
                           Select Branch
                        </CardTitle>
                        <CardDescription>Choose a branch to manage its product catalog</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <SearchableSelect
                            options={branchOptions}
                            value={selectedBranchId}
                            onChange={(val) => setSelectedBranchId(val)}
                            placeholder="Select Branch..."
                            loading={loadingBranches}
                        />
                        
                        {selectedBranchId && (
                            <div className="pt-4 border-t dark:border-gray-800 flex flex-col gap-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Assigned Products</span>
                                    <Badge variant="secondary">{assignedProductIds.size}</Badge>
                                </div>
                                <Button 
                                    className="w-full" 
                                    onClick={handleSave} 
                                    disabled={isSaving || loadingAssignments}
                                >
                                    {isSaving ? 'Updating...' : 'Update Availability'}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="lg:col-span-3">
                    {loadingTable ? (
                        <TableSkeleton columns={4} rows={10} />
                    ) : (
                        <div className="bg-white dark:bg-black rounded-lg border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                            <table className="table-hover w-full table">
                                <thead>
                                    <tr>
                                        <th className="text-center w-12">
                                            <div className="flex justify-center">
                                                <Checkbox 
                                                    checked={isAllSelected}
                                                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                                    disabled={!selectedBranchId || filteredAndSortedProducts.length === 0}
                                                />
                                            </div>
                                        </th>
                                        <SortableHeader label="Product Name" value="name" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                        <SortableHeader label="SKU / Code" value="sku" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                        <th className="text-center w-32">Current Stock</th>
                                        <th className="text-center w-32">Reorder Level</th>
                                        <th className="text-center w-32">Available</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {!selectedBranchId ? (
                                        <tr>
                                            <td colSpan={6}>
                                                <div className="flex flex-col items-center justify-center py-12 text-gray-500 bg-gray-50/50 dark:bg-gray-900/50">
                                                    <IconBuildingStore size={48} className="mb-4 text-gray-300 animate-pulse" />
                                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">No Branch Selected</h3>
                                                    <p className="text-sm max-w-xs text-center mt-1">
                                                        Please select a branch from the left panel to manage its product catalog and view stock levels.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : paginatedProducts.length > 0 ? (
                                        paginatedProducts.map((product) => (
                                            <tr key={product.id} className="group transition-colors duration-150 cursor-pointer" onClick={() => handleToggleProduct(product.id)}>
                                                <td className="text-center">
                                                    <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-900 flex items-center justify-center mx-auto text-gray-400 group-hover:text-primary transition-colors">
                                                        <IconPackage size={16} />
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-gray-900 dark:text-gray-100">{product.name}</span>
                                                        <span className="text-xs text-gray-500">{product.category?.name || 'No Category'}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex flex-col gap-0.5">
                                                        <code className="text-[10px] bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-400 w-fit">
                                                            {product.sku || 'N/A'}
                                                        </code>
                                                        <span className="text-xs text-gray-400">{product.code}</span>
                                                    </div>
                                                </td>
                                                <td>
<div className="flex flex-col items-center gap-1">
  <div className={`flex items-center gap-1.5 font-black text-sm ${
    (assignedData?.find((ad: any) => ad.id === product.id)?.branch_stock_qty || 0) <= (reorderLevels[product.id] || 0) 
      ? 'text-danger' 
      : 'text-success'
  }`}>
    <span>{assignedData?.find((ad: any) => ad.id === product.id)?.branch_stock_qty || 0}</span>
    {assignedData?.find((ad: any) => ad.id === product.id)?.serial_stock_count > 0 && (
      <div className="group/detail relative ml-1">
        <IconInfoCircle size={14} className="text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-primary transition-colors cursor-help" />
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/detail:block z-50">
          <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-[10px] p-3 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 whitespace-nowrap min-w-[260px]">
            <div className="flex justify-between gap-4 mb-2 border-b border-gray-200 dark:border-gray-700 pb-2">
              <span className="text-gray-500 dark:text-gray-400 uppercase font-black tracking-widest text-[9px]">Inventory Breakdown</span>
              <Badge variant="outline" className="h-4 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-[8px] px-1">
                {assignedData?.find((ad: any) => ad.id === product.id)?.branch_stock_qty} Total Units
              </Badge>
            </div>

            {/* Summary Rows */}
            <div className="space-y-1.5 mb-3">
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 dark:text-gray-400 font-bold">Bulk Units</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">
                  {assignedData?.find((ad: any) => ad.id === product.id)?.bulk_stock_qty || 0}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 dark:text-gray-400 font-bold">Serialized Rolls</span>
                <span className="font-black text-primary">
                  {assignedData?.find((ad: any) => ad.id === product.id)?.serial_stock_count || 0}
                </span>
              </div>
            </div>

            {/* Individual Serials List */}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-gray-500 dark:text-gray-400 uppercase font-black tracking-widest text-[8px] block mb-2">Available Rolls Details</span>
<div className="space-y-3 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
  {assignedData?.find((ad: any) => ad.id === product.id)?.available_serials?.map((serial: any) => (
    <div key={serial.id} className="space-y-1 group/item">
      <div className="flex items-center justify-between gap-2 bg-gray-50 dark:bg-gray-800/70 p-1.5 rounded-lg border border-gray-200 dark:border-gray-700/70">
        <code className="text-amber-600 dark:text-amber-400 font-black tracking-tighter text-[9px]">
          {serial.serial_number}
        </code>
        <div className="flex items-center gap-2">
          <span className="font-black text-[9px] tabular-nums text-gray-700 dark:text-gray-300">
            {serial.current_quantity.toFixed(2)} <span className="text-gray-400 dark:text-gray-500 font-bold">/ {serial.initial_quantity.toFixed(1)}</span>
          </span>
          <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${serial.percentage < 20 ? 'bg-rose-500' : 'bg-primary'}`} 
              style={{ width: `${Math.min(100, serial.percentage)}%` }}
            />
          </div>
          <span className={`text-[8px] font-black w-7 text-right ${serial.percentage < 20 ? 'text-rose-500' : 'text-gray-400 dark:text-gray-500'}`}>
            {serial.percentage.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  ))}
</div>
            </div>

            {/* Cumulative SQM Footer */}
            <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <span className="text-[9px] text-gray-500 dark:text-gray-400 font-black tracking-widest uppercase">Total Available Area</span>
              <span className="text-amber-600 dark:text-amber-400 font-black text-[11px]">
                {assignedData?.find((ad: any) => ad.id === product.id)?.serial_total_sqm.toFixed(2)} SQM
              </span>
            </div>
          </div>
          <div className="w-2 h-2 bg-white dark:bg-gray-900 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 border-r border-b border-gray-200 dark:border-gray-700" />
        </div>
      </div>
    )}
  </div>
  {assignedData?.find((ad: any) => ad.id === product.id)?.serial_total_sqm > 0 && (
    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
      {assignedData?.find((ad: any) => ad.id === product.id)?.serial_total_sqm.toFixed(2)} sqm
    </span>
  )}
</div>
                                                </td>
                                                <td className="text-center" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex justify-center">
                                                        <input 
                                                            type="number" 
                                                            className="form-input w-20 text-center font-bold" 
                                                            value={reorderLevels[product.id] ?? 0}
                                                            onChange={(e) => handleReorderLevelChange(product.id, e.target.value)}
                                                            min="0"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="text-center" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex justify-center">
                                                        <Checkbox
                                                            checked={assignedProductIds.has(product.id)}
                                                            onCheckedChange={() => handleToggleProduct(product.id)}
                                                            disabled={!selectedBranchId}
                                                            size="lg"
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6}>
                                                <EmptyState 
                                                    isSearch={!!search} 
                                                    searchTerm={search} 
                                                    title="No Products Found"
                                                    onClearFilter={() => setSearch('')}
                                                />
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    totalItems={filteredAndSortedProducts.length}
                                    itemsPerPage={itemsPerPage}
                                    onPageChange={setCurrentPage}
                                />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BranchProductIndex;
