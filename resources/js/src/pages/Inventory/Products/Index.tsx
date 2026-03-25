import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
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
import { Badge } from '../../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Label } from '../../../components/ui/label';
import { CustomQuillEditor } from '../../../components/ui/custom-quill-editor';
import { IconBoxSeam, IconPhoto, IconLink, IconUpload, IconX, IconPhotoOff, IconLoader2 } from '@tabler/icons-react';
import { 
    useInventoryProducts, useInventoryCategories, useInventoryUoms, useInventoryTags,
    useCreateProduct, useUpdateProduct, useDeleteProduct
} from '@/hooks/useInventoryData';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';

const ProductIndex = () => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    // TanStack Query Hooks
    const { data: products = [], isLoading: loadingProducts, refetch: refetchProducts } = useInventoryProducts();
    const { data: categories = [], isLoading: loadingCategories } = useInventoryCategories();
    const { data: uoms = [], isLoading: loadingUoms } = useInventoryUoms();
    const { data: tags = [], isLoading: loadingTags } = useInventoryTags();

    const createProductMutation = useCreateProduct();
    const updateProductMutation = useUpdateProduct();
    const deleteProductMutation = useDeleteProduct();

    const loading = loadingProducts || loadingCategories || loadingUoms || loadingTags;
    
    const [modalOpen, setModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);

    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);

    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [isImageLoading, setIsImageLoading] = useState(false);

    const initialFormState = {
        code: '', sku: '', barcode: '', name: '', brand: '',
        category_id: 'none', base_uom_id: 'none', purchase_uom_id: 'none',
        uom_multiplier: 1, length: '', width: '',
        cost: 0, price: 0, reorder_level: 0, is_active: '1', tags: [] as string[],
        img: '', image_mode: 'upload' as 'upload' | 'url',
        description: ''
    };

    const fallbackSvg = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-photo-off"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M15 8h.01" /><path d="M7 3h11a3 3 0 0 1 3 3v11m-.856 3.099a2.991 2.991 0 0 1 -2.144 .901h-12a3 3 0 0 1 -3 -3v-12c0 -.845 .349 -1.608 .91 -2.153" /><path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l5 5" /><path d="M16.33 12.338c.574 -.054 1.155 .166 1.67 .662l3 3" /><path d="M3 3l18 18" /></svg>
`);
    
    const [formData, setFormData] = useState(initialFormState);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isInvalidUrl, setIsInvalidUrl] = useState(false);
    const [isInvalidUpload, setIsInvalidUpload] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const [previewModalOpen, setPreviewModalOpen] = useState(false);

    const isSaving = createProductMutation.isPending || updateProductMutation.isPending;
    const isDeleting = deleteProductMutation.isPending;

    useEffect(() => {
        dispatch(setPageTitle('Products'));
    }, [dispatch]);

    // Cleanup object URLs on unmount or when imagePreview changes
    useEffect(() => {
        return () => {
            if (imagePreview) URL.revokeObjectURL(imagePreview);
        };
    }, [imagePreview]);

    const handleCreate = useCallback(() => { 
        setEditingProduct(null); 
        setFormData(initialFormState); 
        setImageFile(null);
        setImagePreview(null);
        setIsInvalidUpload(false);
        setIsInvalidUrl(false);
        setActiveTab('general');
        setModalOpen(true); 
    }, []);

    const handleEdit = useCallback((p: any) => {
        setEditingProduct(p);
        setFormData({
            code: p.code, sku: p.sku || '', barcode: p.barcode || '', name: p.name, brand: p.brand || '',
            category_id: p.category_id ? String(p.category_id) : 'none',
            base_uom_id: p.base_uom_id ? String(p.base_uom_id) : 'none',
            purchase_uom_id: p.purchase_uom_id ? String(p.purchase_uom_id) : 'none',
            uom_multiplier: p.uom_multiplier || 1, length: p.length || '', width: p.width || '',
            cost: p.cost || 0, price: p.price || 0, reorder_level: p.reorder_level || 0,
            is_active: p.is_active ? '1' : '0',
            tags: p.tags ? p.tags.map((t: any) => String(t.id)) : [],
            img: p.img || '',
            image_mode: p.img?.startsWith('http') ? 'url' : 'upload',
            description: p.description || ''
        });
        setImageFile(null);
        setImagePreview(p.img || null);
        setIsInvalidUpload(false);
        setIsInvalidUrl(false);
        setActiveTab('general');
        setModalOpen(true);
    }, []);

    const confirmDelete = useCallback((id: number) => { setItemToDelete(id); setDeleteModalOpen(true); }, []);

    const executeDelete = useCallback(async () => {
        if (!itemToDelete) return;
        try {
            await deleteProductMutation.mutateAsync(itemToDelete);
            setDeleteModalOpen(false);
            setItemToDelete(null);
        } catch (error) {
            console.error(error);
        }
    }, [itemToDelete, deleteProductMutation]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }, []);

    const handleSelectChange = useCallback((value: string | string[], name: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (imagePreview) URL.revokeObjectURL(imagePreview);
            const previewUrl = URL.createObjectURL(file);
            setImageFile(file);
            setImagePreview(previewUrl);
            setIsInvalidUpload(false);
            setFormData(prev => ({ ...prev, img: '' }));
        }
    }, [imagePreview]);

    const handleRemoveImage = useCallback(() => {
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImageFile(null);
        setImagePreview(null);
        setIsInvalidUpload(false);
        setFormData(prev => ({ ...prev, img: '' }));
    }, [imagePreview]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        
        const data = new FormData();
        
        // Append all form fields
        data.append('code', formData.code);
        data.append('name', formData.name);
        data.append('sku', formData.sku);
        data.append('barcode', formData.barcode);
        data.append('brand', formData.brand);
        data.append('category_id', formData.category_id === 'none' ? '' : formData.category_id);
        data.append('base_uom_id', formData.base_uom_id === 'none' ? '' : formData.base_uom_id);
        data.append('purchase_uom_id', formData.purchase_uom_id === 'none' ? '' : formData.purchase_uom_id);
        data.append('uom_multiplier', String(formData.uom_multiplier));
        data.append('length', formData.length);
        data.append('width', formData.width);
        data.append('cost', String(formData.cost));
        data.append('price', String(formData.price));
        data.append('reorder_level', String(formData.reorder_level));
        data.append('is_active', formData.is_active === '1' ? '1' : '0');
        data.append('description', formData.description || '');
        
        // Append tags
        formData.tags.forEach((tagId, index) => {
            data.append(`tags[${index}]`, tagId);
        });

        // Handle Image
        if (imageFile) {
            data.append('img', imageFile);
        } else if (formData.img && formData.image_mode === 'url') {
            data.append('img', formData.img);
        } else if (!imagePreview && !formData.img) {
            data.append('img', ''); // Explicitly clear image if removed
        }

        try {
            if (editingProduct) {
                await updateProductMutation.mutateAsync({ id: editingProduct.id, formData: data });
            } else {
                await createProductMutation.mutateAsync(data);
            }
            setModalOpen(false);
        } catch (error) {
            console.error(error);
        }
    }, [editingProduct, formData, imageFile, imagePreview, createProductMutation, updateProductMutation]);

    const filteredAndSorted = useMemo(() => {
        let result = [...products];
        if (search) { const q = search.toLowerCase(); result = result.filter(d => d.name?.toLowerCase().includes(q) || d.code?.toLowerCase().includes(q) || d.sku?.toLowerCase().includes(q)); }
        
        if (categoryFilter !== 'all') {
            result = result.filter(d => String(d.category_id) === categoryFilter);
        }

        if (statusFilter !== 'all') {
            const isActive = statusFilter === '1';
            result = result.filter(d => !!d.is_active === isActive);
        }

        result.sort((a, b) => {
            let valA = a[sortBy] || ''; let valB = b[sortBy] || '';
            if (typeof valA === 'string') valA = valA.toLowerCase(); if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return sortDirection === 'asc' ? -1 : 1; if (valA > valB) return sortDirection === 'asc' ? 1 : -1; return 0;
        });
        return result;
    }, [products, search, sortBy, sortDirection, categoryFilter, statusFilter]);

    const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
    const paginated = filteredAndSorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div>
            <FilterBar 
                icon={<IconBoxSeam className="w-6 h-6 text-primary" />} 
                title={t('products_catalog')} 
                description={t('products_catalog_desc')} 
                search={search} 
                setSearch={setSearch} 
                itemsPerPage={itemsPerPage} 
                setItemsPerPage={setItemsPerPage} 
                onAdd={handleCreate} 
                addLabel={t('add_product')} 
                onRefresh={refetchProducts} 
                hasActiveFilters={sortBy !== 'name' || sortDirection !== 'asc' || categoryFilter !== 'all' || statusFilter !== 'all'} 
                onClearFilters={() => { 
                    setSortBy('name'); 
                    setSortDirection('asc'); 
                    setCategoryFilter('all');
                    setStatusFilter('all');
                }} 
            >
                <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('category')}</span>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                            <SelectValue placeholder={t('all_categories')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('all_categories')}</SelectItem>
                            {categories.map((c: any) => (
                                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('item_status')}</span>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                            <SelectValue placeholder={t('all_status')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('all_status')}</SelectItem>
                            <SelectItem value="1">{t('active_component')}</SelectItem>
                            <SelectItem value="0">{t('discontinued_inactive')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </FilterBar>

            {loading ? (
                <TableSkeleton columns={7} rows={5} />
            ) : products.length === 0 ? (
                <EmptyState
                    title={t('no_products_found')}
                    description={t('start_managing_erp')}
                    actionLabel={t('add_product')}
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
                    }}
                />
            ) : (
                <div className="table-responsive bg-white dark:bg-black rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
                    <table className="table-hover table-striped w-full table">
                        <thead>
                            <tr>
                                <SortableHeader label={t('internal_code')} value="code" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <th className="px-4 py-3 font-semibold text-left">{t('preview')}</th>
                                <SortableHeader label={t('product_name')} value="name" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <th className="text-left font-semibold px-4 py-3">{t('category')}</th>
                                <th className="text-left font-semibold px-4 py-3">{t('price')}</th>
                                <SortableHeader label={t('reorder_level')} value="reorder_level" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label={t('status')} value="is_active" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <th className="text-right">{t('action')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map((row: any) => (
                                <tr key={row.id}>
                                    <td className="text-xs font-mono">{row.code}</td>
                                    <td>
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                if (row.img) {
                                                    setIsImageLoading(true);
                                                    setImagePreviewUrl(row.img);
                                                    setPreviewModalOpen(true);
                                                }
                                            }}
                                            className={`flex items-center justify-center w-10 h-10 border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900 shadow-sm transition-all hover:ring-2 hover:ring-primary/20 hover:scale-105 active:scale-95 ${row.img ? 'cursor-zoom-in' : 'cursor-default'}`}
                                        >
                                            {row.img ? (
                                                <img src={row.img} alt={row.name} className="object-cover text-gray-300"   onError={(e) => {
    e.currentTarget.src = `data:image/svg+xml,${fallbackSvg}`;
  }} />
                                            ) : (
                                                <IconPhoto size={20} className="text-gray-300" />
                                            )}
                                        </button>
                                    </td>
                                    <td className="font-medium whitespace-nowrap text-primary">{row.name}</td>
                                    <td className="text-sm">{row.category ? row.category.name : '-'}</td>
                                    <td className="text-sm font-semibold text-emerald-600">${parseFloat(row.price).toFixed(2)}</td>
                                    <td className="text-center font-bold text-red-500">{row.reorder_level || 0}</td>
                                    <td>
                                        <Badge variant={row.is_active ? 'success' : 'destructive'}>
                                            {row.is_active ? t('active') : t('inactive')}
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
                <DialogContent className=" gap-0 sm:max-w-[1050px] w-[95vw] h-[90vh] flex flex-col p-0 border-0 shadow-2xl rounded-2xl overflow-hidden">
                    <div className="shrink-0 bg-gradient-to-r from-primary/10 to-transparent px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
                        <div className="bg-primary/20 p-3 rounded-2xl shadow-sm"><IconBoxSeam className="text-primary w-7 h-7" /></div>
                        <div><DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">{editingProduct ? t('edit_product_params') : t('register_new_product')}</DialogTitle></div>
                    </div>
                    <form id="prod-form" onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                            <div className="px-6 py-4 border-b bg-gray-50/50 dark:bg-gray-900/20">
                                <TabsList className="grid w-full max-w-md grid-cols-3">
                                    <TabsTrigger value="general">{t('general_info')}</TabsTrigger>
                                    <TabsTrigger value="inventory">{t('inventory_pricing')}</TabsTrigger>
                                    <TabsTrigger value="description">{t('description')}</TabsTrigger>
                                </TabsList>
                            </div>

                            <ScrollArea className="flex-1">
                                <div className="p-6">
                                    <TabsContent value="general" className="mt-0 space-y-8 animate-in fade-in-50 duration-300">
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                            <div className="lg:col-span-2 space-y-8">
                                                <div className="space-y-4">
                                                    <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b pb-2">{t('core_identifiers')}</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                        <div className="space-y-1"><label className="text-sm font-medium">{t('internal_code')} <span className="text-red-500">*</span></label><Input name="code" value={formData.code} onChange={handleChange} required className="uppercase font-mono" /></div>
                                                        <div className="space-y-1"><label className="text-sm font-medium">{t('product_name')} <span className="text-red-500">*</span></label><Input name="name" value={formData.name} onChange={handleChange} required /></div>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                        <div className="space-y-1"><label className="text-sm font-medium">{t('sku')}</label><Input name="sku" value={formData.sku} onChange={handleChange} /></div>
                                                        <div className="space-y-1"><label className="text-sm font-medium">{t('barcode')}</label><Input name="barcode" value={formData.barcode} onChange={handleChange} /></div>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                        <div className="space-y-1"><label className="text-sm font-medium">{t('manufacturer_brand')}</label><Input name="brand" value={formData.brand} onChange={handleChange} /></div>
                                                        <div className="space-y-1"><label className="text-sm font-medium">{t('category')}</label>
                                                            <Select onValueChange={(value) => handleSelectChange(value, 'category_id')} value={formData.category_id}>
                                                                <SelectTrigger><SelectValue placeholder={t('select_category')} /></SelectTrigger>
                                                                <SelectContent><SelectItem value="none">{t('uncategorized')}</SelectItem>
                                                                    {categories.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-sm font-medium">{t('tags_attribute')}</label>
                                                        <SearchableMultiSelect options={tags.map((t: any) => ({ value: String(t.id), label: t.name }))} value={formData.tags} onChange={(val) => handleSelectChange(val, 'tags')} placeholder={t('select_tag_badges')} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="lg:col-span-1 space-y-4">
                                                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b pb-2">{t('product_image')}</h3>
                                                <Tabs value={formData.image_mode} onValueChange={(val) => handleSelectChange(val, 'image_mode')} className="w-full">
                                                    <TabsList className="grid w-full grid-cols-2 shadow-sm">
                                                        <TabsTrigger value="upload" className="flex items-center gap-1.5 text-xs">
                                                            <IconUpload size={14}/> {t('upload')}
                                                        </TabsTrigger>
                                                        <TabsTrigger value="url" className="flex items-center gap-1.5 text-xs">
                                                            <IconLink size={14}/> {t('link')}
                                                        </TabsTrigger>
                                                    </TabsList>
                                                    <TabsContent value="upload" className="mt-4">
                                                        <div className="flex items-center justify-center w-full">
                                                            {imagePreview && formData.image_mode === 'upload' ? (
                                                                <div className="relative w-full aspect-square rounded-2xl overflow-hidden border-2 border-dashed border-primary/30 group bg-gray-50 dark:bg-gray-900/50">
                                                                    {isInvalidUpload ? (
                                                                        <div className="flex flex-col items-center justify-center w-full h-full text-muted-foreground gap-3 p-6 text-center animate-in fade-in zoom-in-95 duration-300">
                                                                            <img src="/images/invalid-image.svg" alt="Invalid" className="w-36 h-36 object-contain opacity-60 grayscale" />
                                                                            <div className="space-y-1">
                                                                                <p className="text-sm font-semibold text-gray-500">Image Unreachable</p>
                                                                                <p className="text-[10px] text-gray-400 max-w-[180px]">The selected file could not be loaded as an image.</p>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <img
                                                                            src={imagePreview}
                                                                            className="w-full h-full object-contain"
                                                                            onError={() => setIsInvalidUpload(true)}
                                                                            onLoad={() => setIsInvalidUpload(false)}
                                                                        />
                                                                    )}
                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                                        <Button type="button" variant="destructive" size="icon" className="rounded-full" onClick={handleRemoveImage}>
                                                                            <IconX size={18}/>
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <label className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-all group">
                                                                    <div className="flex flex-col items-center justify-center p-4 text-center">
                                                                        <div className="bg-primary/10 p-3 rounded-xl mb-3 group-hover:scale-110 transition-transform">
                                                                            <IconPhoto className="w-8 h-8 text-primary" />
                                                                        </div>
                                                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Drop Image</p>
                                                                        <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tight">PNG, JPG, WebP</p>
                                                                    </div>
                                                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                                                </label>
                                                            )}
                                                        </div>
                                                    </TabsContent>
                                                    <TabsContent value="url" className="mt-4 space-y-3">
                                                        <div className="space-y-1.5">
                                                            <Label className="text-xs">Image Address</Label>
                                                            <Input 
                                                                name="img" 
                                                                placeholder="https://..." 
                                                                value={formData.img} 
                                                                onChange={(e) => {
                                                                    handleChange(e);
                                                                    setIsInvalidUrl(false);
                                                                }}
                                                                className="h-9 text-sm"
                                                            />
                                                        </div>
                                                        {formData.img && formData.image_mode === 'url' && (
                                                            <div className="relative w-full aspect-square rounded-2xl overflow-hidden border bg-gray-50 dark:bg-gray-900/50 shadow-inner flex items-center justify-center">
                                                                {isInvalidUrl ? (
                                                                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-3 p-6 text-center animate-in fade-in zoom-in-95 duration-300">
                                                                        <img src="/images/invalid-image.svg" alt="Invalid" className="w-36 h-36 object-contain opacity-60 grayscale" />
                                                                        <div className="space-y-1">
                                                                            <p className="text-sm font-semibold text-gray-500">Image Unreachable</p>
                                                                            <p className="text-[10px] text-gray-400 max-w-[180px]">The provided URL could not be resolved or the image format is unsupported.</p>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <img 
                                                                        src={formData.img} 
                                                                        className="w-full h-full object-contain" 
                                                                        onError={() => setIsInvalidUrl(true)}
                                                                        onLoad={() => setIsInvalidUrl(false)}
                                                                    />
                                                                )}
                                                            </div>
                                                        )}
                                                    </TabsContent>
                                                </Tabs>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="inventory" className="mt-0 space-y-8 animate-in fade-in-50 duration-300">
                                        <div className="space-y-4">
                                            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b pb-2">{t('uom_mapping')}</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                                <div className="space-y-1"><label className="text-sm font-medium text-primary">{t('base_tracked_uom')}</label>
                                                    <Select onValueChange={(value) => handleSelectChange(value, 'base_uom_id')} value={formData.base_uom_id}>
                                                        <SelectTrigger><SelectValue placeholder="e.g. M2" /></SelectTrigger>
                                                        <SelectContent><SelectItem value="none">{t('uncategorized')}</SelectItem>{uoms.map((u: any) => <SelectItem key={u.id} value={String(u.id)}>{u.code} - {u.name}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1"><label className="text-sm font-medium text-emerald-600">{t('purchase_order_uom')}</label>
                                                    <Select onValueChange={(value) => handleSelectChange(value, 'purchase_uom_id')} value={formData.purchase_uom_id}>
                                                        <SelectTrigger><SelectValue placeholder="e.g. ROLL" /></SelectTrigger>
                                                        <SelectContent><SelectItem value="none">{t('uncategorized')}</SelectItem>{uoms.map((u: any) => <SelectItem key={u.id} value={String(u.id)}>{u.code} - {u.name}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1"><label className="text-sm font-medium">{t('uom_multiplier')}</label><Input name="uom_multiplier" type="number" step="0.0001" value={formData.uom_multiplier} onChange={handleChange} /></div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div className="space-y-1"><label className="text-sm font-medium">{t('length_mapping')}</label><Input name="length" type="number" step="0.01" value={formData.length} onChange={handleChange} placeholder="e.g. 15.00" /></div>
                                                <div className="space-y-1"><label className="text-sm font-medium">{t('width_mapping')}</label><Input name="width" type="number" step="0.01" value={formData.width} onChange={handleChange} placeholder="e.g. 1.52" /></div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b pb-2">{t('inventory_pricing')}</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                                <div className="space-y-1"><label className="text-sm font-medium">{t('purchase_cost')}</label><div className="relative"><span className="absolute left-3 top-3 text-sm text-gray-500">$</span><Input name="cost" type="number" step="0.01" value={formData.cost} onChange={handleChange} className="pl-6" /></div></div>
                                                <div className="space-y-1"><label className="text-sm font-medium">{t('selling_price')}</label><div className="relative"><span className="absolute left-3 top-3 text-sm text-emerald-500">$</span><Input name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} className="pl-6 font-semibold" /></div></div>
                                                <div className="space-y-1"><label className="text-sm font-medium text-red-500">{t('alert_reorder_level')}</label><Input name="reorder_level" type="number" value={formData.reorder_level} onChange={handleChange} /></div>
                                            </div>
                                            <div className="space-y-1.5"><label className="text-sm font-medium">{t('item_status')} <span className="text-red-500">*</span></label><Select onValueChange={(value) => handleSelectChange(value, 'is_active')} value={formData.is_active}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="1">{t('active_component')}</SelectItem><SelectItem value="0">{t('discontinued_inactive')}</SelectItem></SelectContent></Select></div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="description" className="mt-0 h-full animate-in fade-in-50 duration-300">
                                        <div className="space-y-4 min-h-[400px]">
                                            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b pb-2">{t('technical_description')}</h3>
                                            <CustomQuillEditor 
                                                variant='default'
                                                value={formData.description} 
                                                onChange={(val) => setFormData(prev => ({ ...prev, description: val }))}
                                                placeholder={t('describe_product_specs')}
                                            />
                                        </div>
                                    </TabsContent>
                                </div>
                            </ScrollArea>
                        </Tabs>
                    </form>
                    <div className="shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-background">
                        <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>{t('abort_configuration')}</Button>
                        <Button type="submit" form="prod-form" disabled={isSaving} className="bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20">{isSaving ? t('processing') : t('confirm_matrix_parameters')}</Button>
                    </div>
                </DialogContent>
            </Dialog>
            <DeleteModal isOpen={deleteModalOpen} setIsOpen={setDeleteModalOpen} onConfirm={executeDelete} isLoading={isDeleting} title={t('wipe_core_entity')} message={t('removing_product_msg')} />

            <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
                <DialogContent className="max-w-2xl p-0 overflow-hidden bg-transparent border-0 shadow-none [&>button]:hidden">
                    <div className="relative flex items-center justify-center w-full h-full min-h-[400px] bg-black/5 backdrop-blur-sm rounded-2xl group">
                        {imagePreviewUrl && (
                            <>
                                {isImageLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100/10 rounded-2xl">
                                        <div className="flex flex-col items-center gap-3">
                                            <IconLoader2 className="w-10 h-10 text-primary animate-spin" />
                                            <span className="text-xs font-medium text-gray-500">Fetching Image...</span>
                                        </div>
                                    </div>
                                )}
                                <img 
                                    src={imagePreviewUrl} 
                                    alt="Preview" 
                                    className={`max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-200 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
                                    onLoad={() => setIsImageLoading(false)}
                                    onError={(e) => {
                                        setIsImageLoading(false);
                                        (e.target as HTMLImageElement).src = '/images/invalid-image.svg';
                                    }}
                                />
                            </>
                        )}
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-4 right-4 text-white bg-black/20 rounded-full hover:bg-black/40 border-0"
                            onClick={() => setPreviewModalOpen(false)}
                        >
                            <IconX size={24} />
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ProductIndex;