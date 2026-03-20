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
import { IconBuildingStore, IconTools, IconPackage, IconCheck, IconX, IconDatabase } from '@tabler/icons-react';
import { Checkbox } from '../../../components/ui/checkbox';
import { Badge } from '../../../components/ui/badge';

const BranchServiceIndex = () => {
    const [branches, setBranches] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState<string | number | null>(null);
    const [assignedServiceIds, setAssignedServiceIds] = useState<Set<number>>(new Set());
    
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [branchRes, servRes] = await Promise.all([
                fetch('/api/hr/branches', { headers: { 'Accept': 'application/json' }, credentials: 'include' }),
                fetch('/api/services/list', { headers: { 'Accept': 'application/json' }, credentials: 'include' })
            ]);

            if (branchRes.status === 401) { window.location.href = 'auth/login'; return; }

            const [b, s] = await Promise.all([branchRes.json(), servRes.json()]);
            setBranches(Array.isArray(b) ? b : []);
            setServices(Array.isArray(s) ? s : (s.data || []));
            
            if (Array.isArray(b) && b.length > 0 && !selectedBranchId) {
                setSelectedBranchId(b[0].id);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const fetchBranchAssignments = async (branchId: string | number) => {
        setLoading(true); // Show skeleton when switching branches
        try {
            const res = await fetch(`/api/hr/branches/${branchId}/services`, {
                headers: { 'Accept': 'application/json' },
                credentials: 'include'
            });
            const data = await res.json();
            const assignedIds = new Set(data.filter((s: any) => s.is_assigned).map((s: any) => s.id));
            setAssignedServiceIds(assignedIds);
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch branch assignments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedBranchId) {
            fetchBranchAssignments(selectedBranchId);
        } else {
            setAssignedServiceIds(new Set());
        }
    }, [selectedBranchId]);

    const branchOptions = useMemo(() => 
        branches.map(b => ({ value: b.id, label: b.name, description: b.code })),
    [branches]);

    const filteredAndSortedServices = useMemo(() => {
        let result = [...services];
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(s => 
                s.name.toLowerCase().includes(q) || 
                s.code?.toLowerCase().includes(q)
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
    }, [services, search, sortBy, sortDirection]);

    const handleSave = async () => {
        if (!selectedBranchId) return;
        setIsSaving(true);
        try {
            const response = await fetch(`/api/hr/branches/${selectedBranchId}/services/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
                },
                credentials: 'include',
                body: JSON.stringify({ services: Array.from(assignedServiceIds) }),
            });

            if (response.ok) {
                toast.success('Branch services updated successfully');
            } else {
                toast.error('Failed to update branch services');
            }
        } catch (error) {
            console.error(error);
            toast.error('An error occurred');
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleService = (serviceId: number) => {
        const newSet = new Set(assignedServiceIds);
        if (newSet.has(serviceId)) {
            newSet.delete(serviceId);
        } else {
            newSet.add(serviceId);
        }
        setAssignedServiceIds(newSet);
    };

    const handleSelectAll = (checked: boolean) => {
        const newSet = new Set(assignedServiceIds);
        filteredAndSortedServices.forEach(service => {
            if (checked) {
                newSet.add(service.id);
            } else {
                newSet.delete(service.id);
            }
        });
        setAssignedServiceIds(newSet);
    };

    const isAllSelected = useMemo(() => {
        if (filteredAndSortedServices.length === 0) return false;
        return filteredAndSortedServices.every(s => assignedServiceIds.has(s.id));
    }, [filteredAndSortedServices, assignedServiceIds]);

    const paginatedServices = filteredAndSortedServices.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );
    const totalPages = Math.ceil(filteredAndSortedServices.length / itemsPerPage);

    return (
        <div className="space-y-6">
            <FilterBar
                icon={<IconTools className="w-6 h-6 text-primary" />}
                title="Branch Service Management"
                description="Control which services are offered at each branch"
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onRefresh={fetchData}
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <Card className="lg:col-span-1 shadow-sm border-gray-100 dark:border-gray-800 h-fit">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                           <IconBuildingStore size={20} className="text-primary" />
                           Select Branch
                        </CardTitle>
                        <CardDescription>Choose a branch to manage its service catalog</CardDescription>
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
                                    <span className="text-gray-500">Assigned Services</span>
                                    <Badge variant="secondary">{assignedServiceIds.size}</Badge>
                                </div>
                                <Button 
                                    className="w-full" 
                                    onClick={handleSave} 
                                    disabled={isSaving || loading}
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
                                                    disabled={!selectedBranchId || filteredAndSortedServices.length === 0}
                                                />
                                            </div>
                                        </th>
                                        <SortableHeader label="Service Name" value="name" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                        <SortableHeader label="Code" value="code" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                        <th className="text-center w-32 list-none">Available</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedServices.length > 0 ? (
                                        paginatedServices.map((service) => (
                                            <tr key={service.id} className="group transition-colors duration-150 cursor-pointer" onClick={() => handleToggleService(service.id)}>
                                                <td className="text-center">
                                                    <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-900 flex items-center justify-center mx-auto text-gray-400 group-hover:text-primary transition-colors">
                                                        <IconTools size={16} />
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-gray-900 dark:text-gray-100">{service.name}</span>
                                                        <span className="text-xs text-gray-500">{service.category?.name || 'No Category'}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="text-sm font-mono text-gray-600 dark:text-gray-400">{service.code}</span>
                                                </td>
                                                <td className="text-center" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex justify-center">
                                                        <Checkbox
                                                            checked={assignedServiceIds.has(service.id)}
                                                            onCheckedChange={() => handleToggleService(service.id)}
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
                                                    title="No Services Found"
                                                    onClearFilter={() => setSearch('')}
                                                />
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            
                            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    totalItems={filteredAndSortedServices.length}
                                    itemsPerPage={itemsPerPage}
                                    onPageChange={setCurrentPage}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BranchServiceIndex;
