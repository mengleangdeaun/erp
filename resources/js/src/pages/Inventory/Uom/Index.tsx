import { useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { ScrollArea } from '../../../components/ui/scroll-area';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { IconScale } from '@tabler/icons-react';
import { useInventoryUoms, useCreateUom, useUpdateUom, useDeleteUom } from '@/hooks/useInventoryData';

const UomIndex = () => {
    const { data: uoms = [], isLoading: loading, refetch: refetchUoms } = useInventoryUoms();
    const createUomMutation = useCreateUom();
    const updateUomMutation = useUpdateUom();
    const deleteUomMutation = useDeleteUom();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingUom, setEditingUom] = useState<any>(null);

    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);

    const isSaving = createUomMutation.isPending || updateUomMutation.isPending;
    const isDeleting = deleteUomMutation.isPending;

    const initialFormState = {
        code: '',
        name: '',
        is_active: '1',
    };

    const [formData, setFormData] = useState(initialFormState);

    const handleCreate = () => {
        setEditingUom(null);
        setFormData(initialFormState);
        setModalOpen(true);
    };

    const handleEdit = (uom: any) => {
        setEditingUom(uom);
        setFormData({
            code: uom.code,
            name: uom.name,
            is_active: uom.is_active ? '1' : '0',
        });
        setModalOpen(true);
    };

    const confirmDelete = (id: number) => {
        setItemToDelete(id);
        setDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!itemToDelete) return;
        try {
            await deleteUomMutation.mutateAsync(itemToDelete);
            setDeleteModalOpen(false);
            setItemToDelete(null);
        } catch (error) {
            console.error(error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSelectChange = (value: string, name: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { ...formData, is_active: formData.is_active === '1' };

        try {
            if (editingUom) {
                await updateUomMutation.mutateAsync({ id: editingUom.id, payload });
            } else {
                await createUomMutation.mutateAsync(payload);
            }
            setModalOpen(false);
        } catch (error) {
            console.error(error);
        }
    };

    const filteredAndSorted = useMemo(() => {
        let result = [...uoms];
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(d => d.name?.toLowerCase().includes(q) || d.code?.toLowerCase().includes(q));
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
    }, [uoms, search, sortBy, sortDirection]);

    const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
    const paginated = filteredAndSorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div>
            <FilterBar icon={<IconScale className="w-6 h-6 text-primary" />} title="Units of Measure" description="Tracking methodologies for quantities" search={search} setSearch={setSearch} itemsPerPage={itemsPerPage} setItemsPerPage={setItemsPerPage} onAdd={handleCreate} addLabel="Add UOM" onRefresh={refetchUoms} hasActiveFilters={sortBy !== 'name' || sortDirection !== 'asc'} onClearFilters={() => { setSortBy('name'); setSortDirection('asc'); }} />

{loading ? (
  <TableSkeleton columns={3} rows={5} />
) : uoms.length === 0 ? (
  <EmptyState
    title="No UOMs Found"
    description="Start by adding M2 or Rolls."
    actionLabel="Add UOM"
    onAction={handleCreate}
  />
) : filteredAndSorted.length === 0 ? (
  <EmptyState
    isSearch
    searchTerm={search}
    onClearFilter={() => {
      setSearch('');
      setSortBy('name'); // default sort
      setSortDirection('asc');
    }}
  />
) : (


                <div className="table-responsive bg-white dark:bg-black rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
                    <table className="table-hover table-striped w-full table">
                        <thead>
                            <tr>
                                <SortableHeader label="Symbol/Code" value="code" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Name" value="name" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Status" value="is_active" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <th className="text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map((row: any) => (
                                <tr key={row.id}>
                                    <td className="font-mono font-bold text-primary whitespace-nowrap">{row.code}</td>
                                    <td className="whitespace-nowrap font-medium">{row.name}</td>
                                    <td>
                                        <Badge variant={row.is_active ? 'success' : 'destructive'}>
                                            {row.is_active ? 'Active' : 'Inactive'}
                                        </Badge></td>
                                    <td><ActionButtons skipDeleteConfirm={true} onEdit={() => handleEdit(row)} onDelete={() => confirmDelete(row.id)} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="border-t border-gray-100 dark:border-gray-800"><Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredAndSorted.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} /></div>
                </div>
            )}
            
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[450px] w-[95vw] flex flex-col p-0 border-0 shadow-2xl rounded-2xl overflow-hidden">
                    <div className="shrink-0 bg-gradient-to-r from-primary/10 to-transparent px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
                        <div className="bg-primary/20 p-3 rounded-2xl shadow-sm"><IconScale className="text-primary w-7 h-7" /></div>
                        <div><DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">{editingUom ? 'Edit Unit of Measure' : 'Create UOM'}</DialogTitle><p className="text-sm text-gray-500 mt-1">{editingUom ? 'Update the symbol and parameter.' : 'Add a new unit parameter.'}</p></div>
                    </div>
                    <ScrollArea className="flex-1 min-h-0">
                        <form id="uom-form" onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-1"><label className="text-sm font-medium text-gray-700 dark:text-gray-300">UOM Code (Symbol) <span className="text-red-500">*</span></label><Input id="code" name="code" type="text" value={formData.code} onChange={handleChange} placeholder="e.g. M2" required className="uppercase font-mono" /></div>
                                <div className="space-y-1"><label className="text-sm font-medium text-gray-700 dark:text-gray-300">Name <span className="text-red-500">*</span></label><Input id="name" name="name" type="text" value={formData.name} onChange={handleChange} placeholder="e.g. Square Meters" required /></div>
                                <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status <span className="text-red-500">*</span></label><Select onValueChange={(value) => handleSelectChange(value, 'is_active')} value={formData.is_active}><SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger><SelectContent><SelectItem value="1">Active</SelectItem><SelectItem value="0">Inactive</SelectItem></SelectContent></Select></div>
                            </div>
                        </form>
                    </ScrollArea>
                    <div className="shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-background">
                        <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button type="submit" form="uom-form" disabled={isSaving} className="bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20">{isSaving ? 'Saving...' : 'Save Unit'}</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <DeleteModal isOpen={deleteModalOpen} setIsOpen={setDeleteModalOpen} onConfirm={executeDelete} isLoading={isDeleting} title="Delete Unit of Measure" message="Are you sure you want to delete this specific tracking measurement type?" />
        </div>
    );
};

export default UomIndex;
