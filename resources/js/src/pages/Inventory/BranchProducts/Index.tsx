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
import { IconBuildingStore, IconPackage, IconCheck, IconX, IconDatabase } from '@tabler/icons-react';
import { Checkbox } from '../../../components/ui/checkbox';
import { Badge } from '../../../components/ui/badge';
import { useInventoryProducts, useBranches, useBranchProducts, useSyncBranchProducts } from '@/hooks/useInventoryData';
import { useQueryClient } from '@tanstack/react-query';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';

const BranchProductIndex = () => {
    const { data: branches = [], isLoading: loadingBranches } = useBranches();
    const { data: products = [], isLoading: loadingProducts } = useInventoryProducts();
    const [selectedBranchId, setSelectedBranchId] = useState<string | number | null>(null);
    const { data: assignedData = [], isLoading: loadingAssignments } = useBranchProducts(selectedBranchId);
    const syncMutation = useSyncBranchProducts();
    const queryClient = useQueryClient();

    const [assignedProductIds, setAssignedProductIds] = useState<Set<number>>(new Set());
    
    const rawLoading = loadingBranches || loadingProducts || loadingAssignments;
    const loading = useDelayedLoading(rawLoading, 500);
    const isSaving = syncMutation.isPending;
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Set initial branch
    useEffect(() => {
        if (branches.length > 0 && !selectedBranchId) {
            setSelectedBranchId(branches[0].id);
        }
    }, [branches, selectedBranchId]);

    // Sync assignedProductIds state when assignedData changes
    useEffect(() => {
        if (assignedData) {
            const assignedIds = new Set<number>(assignedData.filter((p: any) => p.is_assigned).map((p: any) => p.id));
            setAssignedProductIds(assignedIds);
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
        branches.map((b: any) => ({ value: b.id, label: b.name, description: b.code })),
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
            await syncMutation.mutateAsync({ 
                branchId: selectedBranchId, 
                products: Array.from(assignedProductIds) 
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
                            loading={loading}
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
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Updating...' : 'Update Availability'}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="lg:col-span-3">
                    {loading ? (
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
                                        <th className="text-center w-32">Available</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedProducts.length > 0 ? (
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
                                            <td colSpan={4}>
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
