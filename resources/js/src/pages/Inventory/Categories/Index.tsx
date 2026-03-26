import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle } from '../../../components/ui/dialog';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { Button } from '../../../components/ui/button';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import DeleteModal from '../../../components/DeleteModal';
import ActionButtons from '../../../components/ui/ActionButtons';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Badge } from '../../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { IconCategory } from '@tabler/icons-react';
import { useInventoryCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useInventoryData';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';

const CategoryIndex = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { data: categories = [], isLoading: loading, refetch: refetchCategories } = useInventoryCategories();
    const createCategoryMutation = useCreateCategory();
    const updateCategoryMutation = useUpdateCategory();
    const deleteCategoryMutation = useDeleteCategory();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);

    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);

    const isSaving = createCategoryMutation.isPending || updateCategoryMutation.isPending;
    const isDeleting = deleteCategoryMutation.isPending;

    const initialFormState = { code: '', name: '', description: '', parent_id: 'none', is_active: '1' };
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        dispatch(setPageTitle(t('product_categories', 'Product Categories')));
    }, [dispatch, t]);

    const handleCreate = () => { setEditingCategory(null); setFormData(initialFormState); setModalOpen(true); };

    const handleEdit = (cat: any) => {
        setEditingCategory(cat);
        setFormData({ code: cat.code, name: cat.name, description: cat.description || '', parent_id: cat.parent_id ? String(cat.parent_id) : 'none', is_active: cat.is_active ? '1' : '0' });
        setModalOpen(true);
    };

    const confirmDelete = (id: number) => { setItemToDelete(id); setDeleteModalOpen(true); };

    const executeDelete = async () => {
        if (!itemToDelete) return;
        try {
            await deleteCategoryMutation.mutateAsync(itemToDelete);
            setDeleteModalOpen(false);
            setItemToDelete(null);
        } catch (error) {
            console.error(error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSelectChange = (value: string, name: string) => setFormData(prev => ({ ...prev, [name]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { ...formData, is_active: formData.is_active === '1', parent_id: formData.parent_id === 'none' ? null : parseInt(formData.parent_id) };
        
        try {
            if (editingCategory) {
                await updateCategoryMutation.mutateAsync({ id: editingCategory.id, payload });
            } else {
                await createCategoryMutation.mutateAsync(payload);
            }
            setModalOpen(false);
        } catch (error) {
            console.error(error);
        }
    };

    const filteredAndSorted = useMemo(() => {
        let result = [...categories];
        if (search) { const q = search.toLowerCase(); result = result.filter(d => d.name?.toLowerCase().includes(q) || d.code?.toLowerCase().includes(q)); }
        result.sort((a, b) => {
            let valA = a[sortBy] || ''; let valB = b[sortBy] || '';
            if (typeof valA === 'string') valA = valA.toLowerCase(); if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return sortDirection === 'asc' ? -1 : 1; if (valA > valB) return sortDirection === 'asc' ? 1 : -1; return 0;
        });
        return result;
    }, [categories, search, sortBy, sortDirection]);

    const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
    const paginated = filteredAndSorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div>
            <FilterBar icon={<IconCategory 
            className="w-6 h-6 text-primary" />} 
            title="Product Categories" 
            description="Manage hierarchical trees and standard segments" 
            search={search} 
            setSearch={setSearch} 
            itemsPerPage={itemsPerPage} 
            setItemsPerPage={setItemsPerPage} 
            onAdd={handleCreate} 
            addLabel="Add Category" 
            onRefresh={refetchCategories} 
            hasActiveFilters={sortBy !== 'name' || sortDirection !== 'asc'} 
            onClearFilters={() => { setSortBy('name'); setSortDirection('asc'); }} />

            {loading ? (
  <TableSkeleton columns={4} rows={5} />
) : categories.length === 0 ? (
  <EmptyState
    title="No Categories Found"
    description="Start managing product arrays by building a taxonomy."
    actionLabel="Add Category"
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
                                <SortableHeader label="Ref Code" value="code" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Category Name" value="name" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <th className="text-left font-semibold px-4 py-3">Parent / Tree</th>
                                <SortableHeader label="Status" value="is_active" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <th className="text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map((row: any) => (
                                <tr key={row.id}>
                                    <td className="font-mono text-gray-500">{row.code}</td>
                                    <td className="whitespace-nowrap font-medium text-primary">{row.name}</td>
                                    <td className="text-xs text-slate-500">{row.parent ? row.parent.name : '-- Root Level --'}</td>
                                    <td>
                                        <Badge
                                            size="sm"
                                            variant={row.is_active ? 'success' : 'destructive'}>
                                            {row.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </td>
                                    <td><ActionButtons skipDeleteConfirm={true} onEdit={() => handleEdit(row)} onDelete={() => confirmDelete(row.id)} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="border-t border-gray-100 dark:border-gray-800"><Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredAndSorted.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} /></div>
                </div>
            )}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[700px] w-[95vw] max-h-[90vh] h-auto flex flex-col p-0 border-0 shadow-2xl rounded-2xl overflow-hidden">
                    <div className="shrink-0 bg-gradient-to-r from-primary/10 to-transparent px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
                        <div className="bg-primary/20 p-3 rounded-2xl shadow-sm"><IconCategory className="text-primary w-7 h-7" /></div>
                        <div><DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">{editingCategory ? 'Edit Category Node' : 'Create Category'}</DialogTitle></div>
                    </div>
                    <PerfectScrollbar options={{ suppressScrollX: true }} className="flex-1 min-h-0">
                        <form id="cat-form" onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1"><label className="text-sm font-medium">Identifier Code <span className="text-red-500">*</span></label><Input name="code" value={formData.code} onChange={handleChange} required className="uppercase font-mono" /></div>
                                <div className="space-y-1"><label className="text-sm font-medium">Category Name <span className="text-red-500">*</span></label><Input name="name" value={formData.name} onChange={handleChange} required /></div>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1.5"><label className="text-sm font-medium">Parent Hierarchy Level</label>
                                    <Select onValueChange={(value) => handleSelectChange(value, 'parent_id')} value={formData.parent_id}>
                                        <SelectTrigger><SelectValue placeholder="No Parent Node (Root Area)" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">-- Root Node --</SelectItem>
                                            {categories.filter((c: any) => c.id !== editingCategory?.id).map((c: any) => (
                                                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1"><label className="text-sm font-medium">Description</label><Textarea name="description" value={formData.description} onChange={handleChange} /></div>
                                <div className="space-y-1.5"><label className="text-sm font-medium">Status <span className="text-red-500">*</span></label><Select onValueChange={(value) => handleSelectChange(value, 'is_active')} value={formData.is_active}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="1">Active</SelectItem><SelectItem value="0">Inactive</SelectItem></SelectContent></Select></div>
                            </div>
                        </form>
                    </PerfectScrollbar>
                    <div className="shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-background">
                        <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button type="submit" form="cat-form" disabled={isSaving} className="bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20">{isSaving ? 'Saving...' : 'Construct Block'}</Button>
                    </div>
                </DialogContent>
            </Dialog>
            <DeleteModal isOpen={deleteModalOpen} setIsOpen={setDeleteModalOpen} onConfirm={executeDelete} isLoading={isDeleting} title="Delete Taxonomy Array" message="Removing this entity resets all mapping constraints referencing it." />
        </div>
    );
};
export default CategoryIndex;
