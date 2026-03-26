import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Dialog, DialogContent, DialogTitle } from '../../../components/ui/dialog';
import { Switch } from '../../../components/ui/switch';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { toast } from 'sonner';
import { Building2, Phone, Mail, Paperclip } from 'lucide-react';
import { IconBuildingWarehouse } from '@tabler/icons-react'; // or use Building2
import PerfectScrollbar from 'react-perfect-scrollbar';

// Custom components (adjust paths as needed)
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import DeleteModal from '../../../components/DeleteModal';
import ActionButtons from '../../../components/ui/ActionButtons';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import HighlightText from '../../../components/ui/HighlightText';

interface Supplier {
    id: number;
    name: string;
    contact_person: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    note: string | null;
    attachment_file: string | null;
    is_active: boolean;
}

const emptyForm = {
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    note: '',
    is_active: true,
    attachment_file: '',
};

const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
};

const SuppliersPage = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [modalOpen, setModalOpen] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ ...emptyForm });
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle(t('suppliers')));
    }, [dispatch, t]);

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/inventory/suppliers', {
                headers: { 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' },
                credentials: 'include',
            });
            if (res.status === 401) {
                window.location.href = '/auth/login';
                return;
            }
            const data = await res.json();
            setSuppliers(Array.isArray(data) ? data : []);
        } catch {
            toast.error(t('error_msg'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSuppliers(); }, []);

    // Reset page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const openCreate = () => {
        setEditId(null);
        setFormData({ ...emptyForm });
        setAttachmentFile(null);
        setModalOpen(true);
    };

    const openEdit = (s: Supplier) => {
        setEditId(s.id);
        setFormData({
            name: s.name,
            contact_person: s.contact_person || '',
            phone: s.phone || '',
            email: s.email || '',
            address: s.address || '',
            note: s.note || '',
            is_active: s.is_active,
            attachment_file: s.attachment_file || '',
        });
        setAttachmentFile(null);
        setModalOpen(true);
    };

    const confirmDelete = (id: number) => {
        setItemToDelete(id);
        setDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        await fetch('/sanctum/csrf-cookie');
        try {
            const res = await fetch(`/api/inventory/suppliers/${itemToDelete}`, {
                method: 'DELETE',
                headers: { 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' },
                credentials: 'include',
            });
            if (res.ok) {
                toast.success(t('supplier_deleted'));
                fetchSuppliers();
            } else {
                toast.error(t('error_msg'));
            }
        } catch {
            toast.error(t('error_msg'));
        } finally {
            setIsDeleting(false);
            setDeleteModalOpen(false);
            setItemToDelete(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        await fetch('/sanctum/csrf-cookie');

        const form = new FormData();
        Object.entries(formData).forEach(([k, v]) => {
            if (typeof v === 'boolean') {
                form.append(k, v ? '1' : '0');
            } else {
                form.append(k, String(v));
            }
        });
        if (attachmentFile) form.append('attachment_file', attachmentFile);

        const url = editId ? `/api/inventory/suppliers/${editId}` : '/api/inventory/suppliers';
        if (editId) form.append('_method', 'PUT');

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' },
                credentials: 'include',
                body: form,
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(editId ? t('supplier_updated') : t('supplier_created'));
                setModalOpen(false);
                fetchSuppliers();
            } else {
                toast.error(data.message || t('error_msg'));
            }
        } catch {
            toast.error(t('error_msg'));
        } finally {
            setSubmitting(false);
        }
    };

    // Derived data with filtering and sorting
    const filteredAndSortedSuppliers = useMemo(() => {
        let result = [...suppliers];

        // Filter by search
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(s =>
                s.name.toLowerCase().includes(q) ||
                (s.email || '').toLowerCase().includes(q) ||
                (s.contact_person || '').toLowerCase().includes(q) ||
                (s.phone || '').includes(q)
            );
        }

        // Sort
        result.sort((a, b) => {
            let valA = a[sortBy as keyof Supplier] ?? '';
            let valB = b[sortBy as keyof Supplier] ?? '';
            if (sortBy === 'is_active') {
                // boolean comparison
                valA = a.is_active ? 1 : 0;
                valB = b.is_active ? 1 : 0;
            } else if (typeof valA === 'string') {
                valA = valA.toLowerCase();
                valB = (valB as string).toLowerCase();
            }
            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [suppliers, search, sortBy, sortDirection]);

    const totalPages = Math.ceil(filteredAndSortedSuppliers.length / itemsPerPage);
    const paginatedSuppliers = filteredAndSortedSuppliers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Helper to clear filters (search + sort)
    const clearFilters = () => {
        setSearch('');
        setSortBy('name');
        setSortDirection('asc');
    };

    return (
        <div>
            <FilterBar
                icon={<Building2 className="w-6 h-6 text-primary" />}
                title={t('suppliers')}
                description={t('manage_vendor_supplier_desc')}
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onAdd={openCreate}
                addLabel={t('add_supplier')}
                onRefresh={fetchSuppliers}
                hasActiveFilters={sortBy !== 'name' || sortDirection !== 'asc' || search !== ''}
                onClearFilters={clearFilters}
            />

            {loading ? (
                <TableSkeleton columns={6} rows={5} />
            ) : suppliers.length === 0 ? (
                <EmptyState
                    title={t('no_suppliers_found_title')}
                    description={t('start_adding_first_supplier')}
                    actionLabel={t('add_supplier')}
                    onAction={openCreate}
                />
            ) : filteredAndSortedSuppliers.length === 0 ? (
                <EmptyState
                    isSearch
                    searchTerm={search}
                    onClearFilter={clearFilters}
                />
            ) : (
                <div className="table-responsive bg-white dark:bg-black rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
                    <table className="table-hover table-striped w-full table">
                        <thead>
                            <tr>
                                <SortableHeader
                                    label={t('supplier_name')}
                                    value="name"
                                    currentSortBy={sortBy}
                                    currentDirection={sortDirection}
                                    onSort={setSortBy}
                                />
                                <SortableHeader
                                    label={t('contact_person')}
                                    value="contact_person"
                                    currentSortBy={sortBy}
                                    currentDirection={sortDirection}
                                    onSort={setSortBy}
                                />
                                <SortableHeader
                                    label={t('phone_email')}
                                    value="phone"      // we'll sort by phone, but you could change to email
                                    currentSortBy={sortBy}
                                    currentDirection={sortDirection}
                                    onSort={setSortBy}
                                />
                                <th className="text-left">{t('attachment')}</th>
                                <SortableHeader
                                    label={t('status')}
                                    value="is_active"
                                    currentSortBy={sortBy}
                                    currentDirection={sortDirection}
                                    onSort={setSortBy}
                                />
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedSuppliers.map((s, idx) => (
                                <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                                        <HighlightText text={s.name} highlight={search} />
                                    </td>
                                    <td className="text-gray-600 dark:text-gray-300">
                                        <HighlightText text={s.contact_person || '—'} highlight={search} />
                                    </td>
                                    <td className="text-gray-600 dark:text-gray-300">
                                        <div className="flex flex-col gap-0.5">
                                            {s.phone && (
                                                <span className="flex items-center gap-1 text-xs">
                                                    <Phone className="h-3 w-3" /> 
                                                    <HighlightText text={s.phone} highlight={search} />
                                                </span>
                                            )}
                                            {s.email && (
                                                <span className="flex items-center gap-1 text-xs">
                                                    <Mail className="h-3 w-3" /> 
                                                    <HighlightText text={s.email} highlight={search} />
                                                </span>
                                            )}
                                            {!s.phone && !s.email && '—'}
                                        </div>
                                    </td>
                                    <td>
                                        {s.attachment_file ? (
                                            <a
                                                href={`/storage/${s.attachment_file}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-primary hover:underline text-xs"
                                            >
                                                <Paperclip className="h-3 w-3" /> {t('view_file')}
                                            </a>
                                        ) : '—'}
                                    </td>
                                    <td>
                                        <Badge variant={s.is_active ? 'success' : 'destructive'}>
                                            {s.is_active ? t('active') : t('inactive')}
                                        </Badge>
                                    </td>
                                    <td className="text-right">
                                        <ActionButtons
                                            skipDeleteConfirm={true}
                                            onEdit={() => openEdit(s)}
                                            onDelete={() => confirmDelete(s.id)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="border-t border-gray-100 dark:border-gray-800">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={filteredAndSortedSuppliers.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[600px] w-[95vw] max-h-[90vh] h-full flex flex-col p-0 border-0 shadow-2xl rounded-2xl overflow-hidden">
                    <div className="shrink-0 bg-gradient-to-r from-primary/10 to-transparent px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
                        <div className="bg-primary/20 p-3 rounded-2xl shadow-sm">
                            <Building2 className="text-primary w-7 h-7" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                                {editId ? t('edit_supplier') : t('add_new_supplier')}
                            </DialogTitle>
                            <p className="text-sm text-gray-500 mt-1">
                                {editId ? t('update_supplier_details_desc') : t('enter_supplier_info_desc')}
                            </p>
                        </div>
                    </div>

                    <PerfectScrollbar option={{ suppressScrollX: true }} className="flex-1 min-h-0 max-h-[70vh]">
                        <form id="supplier-form" onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 space-y-1">
                                    <Label className="text-sm font-medium">
                                        {t('supplier_name')} <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        name="name"
                                        value={formData.name}
                                        onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                        required
                                        placeholder="e.g. Acme Supplies Co."
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-sm font-medium">{t('contact_person')}</Label>
                                    <Input
                                        name="contact_person"
                                        value={formData.contact_person}
                                        onChange={e => setFormData(p => ({ ...p, contact_person: e.target.value }))}
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-sm font-medium">{t('phone')}</Label>
                                    <Input
                                        name="phone"
                                        value={formData.phone}
                                        onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                                        placeholder="+1 555 0000"
                                    />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <Label className="text-sm font-medium">{t('email')}</Label>
                                    <Input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                                        placeholder="contact@supplier.com"
                                    />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <Label className="text-sm font-medium">{t('address')}</Label>
                                    <Textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
                                        rows={2}
                                        placeholder="Full address..."
                                    />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <Label className="text-sm font-medium">{t('note')}</Label>
                                    <Textarea
                                        name="note"
                                        value={formData.note}
                                        onChange={e => setFormData(p => ({ ...p, note: e.target.value }))}
                                        rows={2}
                                        placeholder="Any additional notes..."
                                    />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <Label className="text-sm font-medium">{t('attachment_file')}</Label>
                                    <Input
                                        type="file"
                                        onChange={e => setAttachmentFile(e.target.files?.[0] || null)}
                                    />
                                    {editId && formData.attachment_file && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            {t('current_file')}: {formData.attachment_file}
                                        </p>
                                    )}
                                </div>
                                <div className="col-span-2 flex items-center gap-3">
                                    <Switch
                                        id="is_active"
                                        checked={formData.is_active}
                                        onCheckedChange={v => setFormData(p => ({ ...p, is_active: v }))}
                                    />
                                    <Label htmlFor="is_active" className="text-sm font-medium">{t('active')}</Label>
                                </div>
                            </div>
                        </form>
                    </PerfectScrollbar>

                    <div className="shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-background">
                        <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
                            {t('cancel')}
                        </Button>
                        <Button
                            type="submit"
                            form="supplier-form"
                            disabled={submitting}
                            className="px-7 bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
                        >
                            {submitting ? t('processing') : (editId ? t('update') : t('add_new_supplier'))}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <DeleteModal
                isOpen={deleteModalOpen}
                setIsOpen={setDeleteModalOpen}
                onConfirm={executeDelete}
                isLoading={isDeleting}
                title={t('delete_supplier')}
                message={t('delete_adj_confirm')}
            />
        </div>
    );
};
export default SuppliersPage;