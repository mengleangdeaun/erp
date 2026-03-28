import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle } from '../../../components/ui/dialog';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import DeleteModal from '../../../components/DeleteModal';
import ActionButtons from '../../../components/ui/ActionButtons';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { IconBuildingWarehouse } from '@tabler/icons-react';
import HighlightText from '../../../components/ui/HighlightText';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';

const LocationIndex = () => {
    const dispatch = useDispatch();
    const [locations, setLocations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [branches, setBranches] = useState<any[]>([]);

    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [branchFilter, setBranchFilter] = useState<string>('all');

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const initialFormState = { name: '', description: '', address: '', is_active: '1', is_primary: '0', branch_id: '' };
    const [formData, setFormData] = useState(initialFormState);

    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    useEffect(() => {
        dispatch(setPageTitle('Locations'));
    }, [dispatch]);

    const fetchLocations = () => {
        setLoading(true);
        fetch('/api/inventory/locations', {
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' },
            credentials: 'include',
        })
            .then(res => res.status === 401 ? window.location.href = 'auth/login' : res.json())
            .then(data => { setLocations(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(err => { console.error(err); setLocations([]); setLoading(false); });
    };

    const fetchBranches = () => {
        fetch('/api/hr/branches?compact=true', {
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' },
            credentials: 'include',
        })
            .then(res => res.json())
            .then(data => setBranches(Array.isArray(data) ? data : []))
            .catch(err => console.error(err));
    };

    useEffect(() => { fetchLocations(); fetchBranches(); }, []);

    const handleCreate = () => { setEditingLocation(null); setFormData(initialFormState); setModalOpen(true); };

    const handleEdit = (loc: any) => {
        setEditingLocation(loc);
        setFormData({ 
            name: loc.name, 
            description: loc.description || '', 
            address: loc.address || '', 
            is_active: loc.is_active ? '1' : '0',
            is_primary: loc.is_primary ? '1' : '0',
            branch_id: loc.branch_id?.toString() || ''
        });
        setModalOpen(true);
    };

    const confirmDelete = (id: number) => { setItemToDelete(id); setDeleteModalOpen(true); };

    const executeDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/inventory/locations/${itemToDelete}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' }, credentials: 'include' });
            if (response.ok) { toast.success('Location deleted successfully'); fetchLocations(); } else { toast.error('Failed to delete Location'); }
        } catch (error) { console.error(error); toast.error('An error occurred'); } finally { setIsDeleting(false); setDeleteModalOpen(false); setItemToDelete(null); }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSelectChange = (value: string, name: string) => setFormData(prev => ({ ...prev, [name]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const url = editingLocation ? `/api/inventory/locations/${editingLocation.id}` : '/api/inventory/locations';
        const method = editingLocation ? 'PUT' : 'POST';
        try {
            await fetch('/sanctum/csrf-cookie');
            const response = await fetch(url, {
                method, headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' }, credentials: 'include',
                body: JSON.stringify({ 
                    ...formData, 
                    is_active: formData.is_active === '1',
                    is_primary: formData.is_primary === '1'
                }),
            });
            if (response.ok) { toast.success(`Location ${editingLocation ? 'updated' : 'created'}`); setModalOpen(false); fetchLocations(); } else {
                const data = await response.json(); toast.error(data.message || 'Failed to save location');
            }
        } catch (error) { console.error(error); toast.error('An error occurred'); } finally { setIsSaving(false); }
    };


    const filteredAndSorted = useMemo(() => {
        let result = [...locations];
        if (search) { const q = search.toLowerCase(); result = result.filter(d => d.name?.toLowerCase().includes(q)); }
        if (branchFilter !== 'all') {
            result = result.filter(d => d.branch_id?.toString() === branchFilter);
        }
        result.sort((a, b) => {
            let valA = a[sortBy] || ''; let valB = b[sortBy] || '';
            if (typeof valA === 'string') valA = valA.toLowerCase(); if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return sortDirection === 'asc' ? -1 : 1; if (valA > valB) return sortDirection === 'asc' ? 1 : -1; return 0;
        });
        return result;
    }, [locations, search, sortBy, sortDirection, branchFilter]);

    const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
    const paginated = filteredAndSorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div>
            <FilterBar icon={<IconBuildingWarehouse className="w-6 h-6 text-primary" />} 
            title="Locations" 
            description="Manage physical stock locations and warehouses" 
            search={search} 
            setSearch={setSearch} 
            itemsPerPage={itemsPerPage} 
            setItemsPerPage={setItemsPerPage} 
            onAdd={handleCreate} 
            addLabel="Add Location" 
            onRefresh={fetchLocations} 
            hasActiveFilters={sortBy !== 'name' || sortDirection !== 'asc' || search !== '' || branchFilter !== 'all'} 
            onClearFilters={() => { setSortBy('name'); setSortDirection('asc'); setSearch(''); setBranchFilter('all'); }} 
        >
            <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Branch</span>
                <Select value={branchFilter} onValueChange={setBranchFilter}>
                    <SelectTrigger className="h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                        <SelectValue placeholder="All Branches" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-black">
                        <SelectItem value="all">All Branches</SelectItem>
                        {branches.map(b => (
                            <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </FilterBar>
{loading ? (
  <TableSkeleton columns={3} rows={5} />
) : locations.length === 0 ? (
  <EmptyState
    title="No Locations Found"
    description="Track multi-warehouse inventory by adding a location."
    actionLabel="Add Location"
    onAction={handleCreate}
  />
) : filteredAndSorted.length === 0 ? (
  <EmptyState
    isSearch
    searchTerm={search}
    onClearFilter={() => {
      setSearch('');
      setSortBy('name');
      setSortDirection('asc');
      setBranchFilter('all');
    }}
  />
) : (
                <div className="table-responsive bg-white dark:bg-black rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
                    <table className="table-hover table-striped w-full table">
                        <thead>
                            <tr>
                                <SortableHeader label="Location Name" value="name" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Branch" value="branch_id" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Address" value="address" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Status" value="is_active" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <th className="text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map((row: any) => (
                                <tr key={row.id}>
                                    <td className="whitespace-nowrap font-medium">
                                    <div className="flex items-center gap-2">
                                        <HighlightText text={row.name} highlight={search} />
                                        {row.is_primary === 1 && (
                                        <Badge
                                            variant="success"
                                            size="xs"
                                        >
                                            Primary
                                        </Badge>
                                        )}
                                    </div>
                                    </td>
                                    <td>
                                        <Badge variant="secondary" size="sm">
                                            {branches.find(b => b.id === row.branch_id)?.name || '-'}
                                        </Badge>
                                    </td>
                                    <td className="text-gray-500 max-w-xs truncate">
                                        <HighlightText text={row.address || '-'} highlight={search} />
                                    </td>
                                    <td><Badge 
                                        size="sm"
                                        variant={row.is_active ? 'success' : 'destructive'}>{row.is_active ? 'Active' : 'Inactive'}</Badge></td>
                                    <td>
                                        <div className="flex items-center justify-end gap-2">
                                            <ActionButtons skipDeleteConfirm={true} onEdit={() => handleEdit(row)} onDelete={() => confirmDelete(row.id)} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="border-t border-gray-100 dark:border-gray-800"><Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredAndSorted.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} /></div>
                </div>
            )}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[600px] w-[95vw] max-h-[90vh] h-auto flex flex-col p-0 border-0 shadow-2xl rounded-2xl overflow-hidden">
                    <div className="shrink-0 bg-gradient-to-r from-primary/10 to-transparent px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
                        <div className="bg-primary/20 p-3 rounded-2xl shadow-sm"><IconBuildingWarehouse className="text-primary w-7 h-7" /></div>
                        <div><DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">{editingLocation ? 'Edit Warehouse Location' : 'Create Location'}</DialogTitle></div>
                    </div>
                    <PerfectScrollbar options={{ suppressScrollX: true }} className="flex-1 min-h-0">
                        <form id="loc-form" onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
                                <div className="space-y-1.5 md:col-span-1">
                                    <label className="text-sm font-medium">Location Name <span className="text-red-500">*</span></label>
                                    <Input name="name" value={formData.name} onChange={handleChange} required placeholder="Warehouse A, Store B..." />
                                </div>
                                <div className="space-y-1.5 md:col-span-1">
                                    <label className="text-sm font-medium">Status <span className="text-red-500">*</span></label>
                                    <Select onValueChange={(value) => handleSelectChange(value, 'is_active')} value={formData.is_active}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Active</SelectItem>
                                            <SelectItem value="0">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5 md:col-span-1">
                                    <label className="text-sm font-medium">Associated Branch <span className="text-red-500">*</span></label>
                                    <Select 
                                        onValueChange={(value) => handleSelectChange(value, 'branch_id')} 
                                        value={formData.branch_id}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a branch" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {branches.map(b => (
                                                <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5 md:col-span-1">
                                    <label className="text-sm font-medium">Distribution Priority</label>
                                    <Select onValueChange={(value) => handleSelectChange(value, 'is_primary')} value={formData.is_primary}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Primary (Default)</SelectItem>
                                            <SelectItem value="0">Secondary</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            
                            <hr className="border-gray-50 dark:border-gray-900" />
                            
                            <div className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Physical Address</label>
                                    <Textarea name="address" value={formData.address} onChange={handleChange} placeholder="Enter full address..." className="min-h-[80px]" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-400">Additional Description</label>
                                    <Textarea name="description" value={formData.description} onChange={handleChange} placeholder="Notes about this warehouse..." className="min-h-[60px]" />
                                </div>
                            </div>

                            <p className="text-[11px] text-primary/70 bg-primary/5 p-3 rounded-xl border border-primary/10 flex items-center gap-2">
                                <span className="shrink-0 font-bold bg-primary text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px]">!</span>
                                <span>Sales will automatically pull stock from the Primary location first. If empty, the system will fallback to Secondary locations in the same branch.</span>
                            </p>
                        </form>
                    </PerfectScrollbar>
                    <div className="shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-background">
                        <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button type="submit" form="loc-form" disabled={isSaving} className="bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20">{isSaving ? 'Saving...' : 'Save Storage'}</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <DeleteModal isOpen={deleteModalOpen} setIsOpen={setDeleteModalOpen} onConfirm={executeDelete} isLoading={isDeleting} title="Delete Location" message="Permanently destroy this storage entity?" />
        </div>
    );
};
export default LocationIndex;
