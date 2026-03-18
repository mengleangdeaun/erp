import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle } from '../../../components/ui/dialog';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Button } from '../../../components/ui/button';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import DeleteModal from '../../../components/DeleteModal';
import ActionButtons from '../../../components/ui/ActionButtons';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import SearchableMultiSelect from '../../../components/ui/SearchableMultiSelect';
import { IconBoxSeam } from '@tabler/icons-react';
import { Badge } from '../../../components/ui/badge';

const ProductIndex = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [uoms, setUoms] = useState<any[]>([]);
    const [tags, setTags] = useState<any[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const initialFormState = {
        code: '', sku: '', barcode: '', name: '', brand: '',
        category_id: 'none', base_uom_id: 'none', purchase_uom_id: 'none',
        uom_multiplier: 1, length: '', width: '',
        cost: 0, price: 0, reorder_level: 0, is_active: '1', tags: [] as string[]
    };
    
    const [formData, setFormData] = useState(initialFormState);

    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [prodRes, catRes, uomRes, tagRes] = await Promise.all([
                fetch('/api/inventory/products', { headers: { 'Accept': 'application/json' }, credentials: 'include' }),
                fetch('/api/inventory/categories', { headers: { 'Accept': 'application/json' }, credentials: 'include' }),
                fetch('/api/inventory/uoms', { headers: { 'Accept': 'application/json' }, credentials: 'include' }),
                fetch('/api/inventory/tags', { headers: { 'Accept': 'application/json' }, credentials: 'include' })
            ]);

            if (prodRes.status === 401) { window.location.href = 'auth/login'; return; }

            const [p, c, u, t] = await Promise.all([prodRes.json(), catRes.json(), uomRes.json(), tagRes.json()]);

            setProducts(Array.isArray(p) ? p : []);
            setCategories(Array.isArray(c) ? c : []);
            setUoms(Array.isArray(u) ? u : []);
            setTags(Array.isArray(t) ? t : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleCreate = () => { setEditingProduct(null); setFormData(initialFormState); setModalOpen(true); };

    const handleEdit = (p: any) => {
        setEditingProduct(p);
        setFormData({
            code: p.code, sku: p.sku || '', barcode: p.barcode || '', name: p.name, brand: p.brand || '',
            category_id: p.category_id ? String(p.category_id) : 'none',
            base_uom_id: p.base_uom_id ? String(p.base_uom_id) : 'none',
            purchase_uom_id: p.purchase_uom_id ? String(p.purchase_uom_id) : 'none',
            uom_multiplier: p.uom_multiplier || 1, length: p.length || '', width: p.width || '',
            cost: p.cost || 0, price: p.price || 0, reorder_level: p.reorder_level || 0,
            is_active: p.is_active ? '1' : '0',
            tags: p.tags ? p.tags.map((t: any) => String(t.id)) : []
        });
        setModalOpen(true);
    };

    const confirmDelete = (id: number) => { setItemToDelete(id); setDeleteModalOpen(true); };

    const executeDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/inventory/products/${itemToDelete}`, { method: 'DELETE', headers: { 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' }, credentials: 'include' });
            if (response.ok) { toast.success('Product deleted successfully'); fetchData(); } else { toast.error('Failed to delete Product'); }
        } catch (error) { console.error(error); toast.error('An error occurred'); } finally { setIsDeleting(false); setDeleteModalOpen(false); setItemToDelete(null); }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSelectChange = (value: string | string[], name: string) => setFormData(prev => ({ ...prev, [name]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const url = editingProduct ? `/api/inventory/products/${editingProduct.id}` : '/api/inventory/products';
        const method = editingProduct ? 'PUT' : 'POST';
        try {
            await fetch('/sanctum/csrf-cookie');
            let payload = { 
                ...formData, 
                is_active: formData.is_active === '1',
                category_id: formData.category_id === 'none' ? null : parseInt(formData.category_id),
                base_uom_id: formData.base_uom_id === 'none' ? null : parseInt(formData.base_uom_id),
                purchase_uom_id: formData.purchase_uom_id === 'none' ? null : parseInt(formData.purchase_uom_id),
            };
            
            const response = await fetch(url, {
                method, headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' }, credentials: 'include',
                body: JSON.stringify(payload),
            });
            if (response.ok) { toast.success(`Product ${editingProduct ? 'updated' : 'created'}`); setModalOpen(false); fetchData(); } else {
                const data = await response.json(); toast.error(data.message || 'Failed to save product specification');
            }
        } catch (error) { console.error(error); toast.error('An error occurred'); } finally { setIsSaving(false); }
    };

    const filteredAndSorted = useMemo(() => {
        let result = [...products];
        if (search) { const q = search.toLowerCase(); result = result.filter(d => d.name?.toLowerCase().includes(q) || d.code?.toLowerCase().includes(q) || d.sku?.toLowerCase().includes(q)); }
        result.sort((a, b) => {
            let valA = a[sortBy] || ''; let valB = b[sortBy] || '';
            if (typeof valA === 'string') valA = valA.toLowerCase(); if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return sortDirection === 'asc' ? -1 : 1; if (valA > valB) return sortDirection === 'asc' ? 1 : -1; return 0;
        });
        return result;
    }, [products, search, sortBy, sortDirection]);

    const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
    const paginated = filteredAndSorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div>
            <FilterBar icon={<IconBoxSeam className="w-6 h-6 text-primary" />} title="Products Catalog" description="Master material and product registry" search={search} setSearch={setSearch} itemsPerPage={itemsPerPage} setItemsPerPage={setItemsPerPage} onAdd={handleCreate} addLabel="Add Product" onRefresh={fetchData} hasActiveFilters={sortBy !== 'name' || sortDirection !== 'asc'} onClearFilters={() => { setSortBy('name'); setSortDirection('asc'); }} />
{loading ? (
  <TableSkeleton columns={7} rows={5} />
) : products.length === 0 ? (
  <EmptyState
    title="No Products Found"
    description="Start managing ERP parameters by establishing products."
    actionLabel="Create Product"
    onAction={handleCreate}
  />
) : filteredAndSorted.length === 0 ? (
  <EmptyState
    isSearch
    searchTerm={search}
    onClearFilter={() => {
      setSearch('');
      setSortBy('name');          // or your default sort field
      setSortDirection('asc');
    }}
  />
) : (
                <div className="table-responsive bg-white dark:bg-black rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
                    <table className="table-hover table-striped w-full table">
                        <thead>
                            <tr>
                                <SortableHeader label="Internal Code" value="code" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Product Name" value="name" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <th className="text-left font-semibold px-4 py-3">Category</th>
                                <th className="text-left font-semibold px-4 py-3">Price</th>
                                <th className="text-left font-semibold px-4 py-3">Physical Unit</th>
                                <SortableHeader label="Status" value="is_active" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <th className="text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map((row: any) => (
                                <tr key={row.id}>
                                    <td className="font-mono text-xs">{row.code}</td>
                                    <td className="whitespace-nowrap font-medium text-primary">{row.name}</td>
                                    <td className="text-sm">{row.category ? row.category.name : '-'}</td>
                                    <td className="text-sm font-semibold text-emerald-600">${parseFloat(row.price).toFixed(2)}</td>
                                    <td className="text-xs">{row.base_uom ? row.base_uom.code : '-'}</td>
                                    <td>
                                        <Badge variant={row.is_active ? 'success' : 'destructive'}>
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
                <DialogContent className="sm:max-w-[1050px] w-[95vw] h-[90vh] flex flex-col p-0 border-0 shadow-2xl rounded-2xl overflow-hidden">
                    <div className="shrink-0 bg-gradient-to-r from-primary/10 to-transparent px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
                        <div className="bg-primary/20 p-3 rounded-2xl shadow-sm"><IconBoxSeam className="text-primary w-7 h-7" /></div>
                        <div><DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">{editingProduct ? 'Edit Product Parameters' : 'Register New Product'}</DialogTitle></div>
                    </div>
                    <ScrollArea className="flex-1 min-h-0">
                        <form id="prod-form" onSubmit={handleSubmit} className="p-6 space-y-8">
                            
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b pb-2">Core Identifiers</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div className="space-y-1"><label className="text-sm font-medium">Internal Code <span className="text-red-500">*</span></label><Input name="code" value={formData.code} onChange={handleChange} required className="uppercase font-mono" /></div>
                                    <div className="space-y-1"><label className="text-sm font-medium">SKU</label><Input name="sku" value={formData.sku} onChange={handleChange} /></div>
                                    <div className="space-y-1"><label className="text-sm font-medium">Barcode (GTIN/EAN)</label><Input name="barcode" value={formData.barcode} onChange={handleChange} /></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1"><label className="text-sm font-medium">Product Name <span className="text-red-500">*</span></label><Input name="name" value={formData.name} onChange={handleChange} required /></div>
                                    <div className="space-y-1"><label className="text-sm font-medium">Manufacturer / Brand</label><Input name="brand" value={formData.brand} onChange={handleChange} /></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1"><label className="text-sm font-medium">Category</label>
                                        <Select onValueChange={(value) => handleSelectChange(value, 'category_id')} value={formData.category_id}>
                                            <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                                            <SelectContent><SelectItem value="none">-- Uncategorized --</SelectItem>
                                                {categories.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1"><label className="text-sm font-medium">Tags Attribute</label>
                                        <SearchableMultiSelect options={tags.map((t: any) => ({ value: String(t.id), label: t.name }))} value={formData.tags} onChange={(val) => handleSelectChange(val, 'tags')} placeholder="Select Tag Badges" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b pb-2">Dimensional & UOM Mapping</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div className="space-y-1"><label className="text-sm font-medium text-primary">Base Tracked UOM</label>
                                        <Select onValueChange={(value) => handleSelectChange(value, 'base_uom_id')} value={formData.base_uom_id}>
                                            <SelectTrigger><SelectValue placeholder="e.g. M2" /></SelectTrigger>
                                            <SelectContent><SelectItem value="none">-- Select Unit --</SelectItem>{uoms.map((u: any) => <SelectItem key={u.id} value={String(u.id)}>{u.code} - {u.name}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1"><label className="text-sm font-medium text-emerald-600">Purchase Order UOM</label>
                                        <Select onValueChange={(value) => handleSelectChange(value, 'purchase_uom_id')} value={formData.purchase_uom_id}>
                                            <SelectTrigger><SelectValue placeholder="e.g. ROLL" /></SelectTrigger>
                                            <SelectContent><SelectItem value="none">-- Identical to Base --</SelectItem>{uoms.map((u: any) => <SelectItem key={u.id} value={String(u.id)}>{u.code} - {u.name}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1"><label className="text-sm font-medium">UOM Multiplier</label><Input name="uom_multiplier" type="number" step="0.0001" value={formData.uom_multiplier} onChange={handleChange} /></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1"><label className="text-sm font-medium">Length Mapping (Dimensional)</label><Input name="length" type="number" step="0.01" value={formData.length} onChange={handleChange} placeholder="e.g. 15.00" /></div>
                                    <div className="space-y-1"><label className="text-sm font-medium">Width Mapping (Dimensional)</label><Input name="width" type="number" step="0.01" value={formData.width} onChange={handleChange} placeholder="e.g. 1.52" /></div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b pb-2">Financial Setup & Operations</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div className="space-y-1"><label className="text-sm font-medium">Purchase Cost</label><div className="relative"><span className="absolute left-3 top-3 text-sm text-gray-500">$</span><Input name="cost" type="number" step="0.01" value={formData.cost} onChange={handleChange} className="pl-6" /></div></div>
                                    <div className="space-y-1"><label className="text-sm font-medium">Selling Price</label><div className="relative"><span className="absolute left-3 top-3 text-sm text-emerald-500">$</span><Input name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} className="pl-6 font-semibold" /></div></div>
                                    <div className="space-y-1"><label className="text-sm font-medium text-red-500">Alert Reorder Level</label><Input name="reorder_level" type="number" value={formData.reorder_level} onChange={handleChange} /></div>
                                </div>
                                <div className="space-y-1.5"><label className="text-sm font-medium">Lifecycle Status <span className="text-red-500">*</span></label><Select onValueChange={(value) => handleSelectChange(value, 'is_active')} value={formData.is_active}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="1">Active Component</SelectItem><SelectItem value="0">Discontinued / Inactive</SelectItem></SelectContent></Select></div>
                            </div>
                        </form>
                    </ScrollArea>
                    <div className="shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-background">
                        <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Abort Configuration</Button>
                        <Button type="submit" form="prod-form" disabled={isSaving} className="bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20">{isSaving ? 'Processing...' : 'Confirm Matrix Parameters'}</Button>
                    </div>
                </DialogContent>
            </Dialog>
            <DeleteModal isOpen={deleteModalOpen} setIsOpen={setDeleteModalOpen} onConfirm={executeDelete} isLoading={isDeleting} title="Wipe Core Entity" message="Removing a Product will destroy all hierarchical stock arrays. Proceed cautiously." />
        </div>
    );
};
export default ProductIndex;
