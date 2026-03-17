import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Badge } from '../../../components/ui/badge';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { DatePicker } from '../../../components/ui/date-picker';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import DeleteModal from '../../../components/DeleteModal';
import ActionButtons from '../../../components/ui/ActionButtons';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import MediaSelector, { MediaFile } from '../../../components/MediaSelector';
import { IconArrowUpRight, IconBriefcase, IconFileText, IconX, IconExternalLink } from '@tabler/icons-react';

const toDateStr = (d: Date | undefined) => d ? d.toISOString().split('T')[0] : '';

const statusConfig: Record<string, { label: string; className: string }> = {
    pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    approved: { label: 'Approved', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

const PromotionIndex = () => {
    const [promotions, setPromotions] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [designations, setDesignations] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [mediaSelectorOpen, setMediaSelectorOpen] = useState(false);

    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('promotion_date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const initialFormState = {
        employee_id: '',
        previous_designation_id: '',
        new_designation_id: '',
        promotion_date: new Date().toISOString().split('T')[0],
        effective_date: new Date().toISOString().split('T')[0],
        salary_adjustment: '',
        reason: '',
        document: '',
        status: 'pending',
    };
    const [formData, setFormData] = useState<any>(initialFormState);

    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const fetchData = () => {
        setLoading(true);
        Promise.all([
            fetch('/api/hr/promotions', { headers: { 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' }, credentials: 'include' }).then(r => r.json()),
            fetch('/api/hr/employees?compact=true', { headers: { 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' }, credentials: 'include' }).then(r => r.json()),
            fetch('/api/hr/designations?compact=true', { headers: { 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' }, credentials: 'include' }).then(r => r.json()),
        ]).then(([promotionsData, employeesData, designationsData]) => {
            if (Array.isArray(promotionsData)) setPromotions(promotionsData);
            if (Array.isArray(employeesData)) setEmployees(employeesData);
            if (Array.isArray(designationsData)) setDesignations(designationsData);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    };

    useEffect(() => { fetchData(); }, []);

    // When employee changes, auto-populate previous designation
    const selectedEmployee = useMemo(() => {
        if (!formData.employee_id) return null;
        return employees.find(e => String(e.id) === String(formData.employee_id));
    }, [formData.employee_id, employees]);

    useEffect(() => {
        if (selectedEmployee?.designation_id && !editingItem) {
            setFormData((prev: any) => ({ ...prev, previous_designation_id: String(selectedEmployee.designation_id) }));
        }
    }, [selectedEmployee, editingItem]);

    const handleCreate = () => {
        setEditingItem(null);
        setFormData(initialFormState);
        setModalOpen(true);
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setFormData({
            employee_id: item.employee_id,
            previous_designation_id: item.previous_designation_id,
            new_designation_id: item.new_designation_id,
            promotion_date: item.promotion_date,
            effective_date: item.effective_date,
            salary_adjustment: item.salary_adjustment || '',
            reason: item.reason || '',
            document: item.document || '',
            status: item.status,
        });
        setModalOpen(true);
    };

    const confirmDelete = (id: number) => {
        setItemToDelete(id);
        setDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/hr/promotions/${itemToDelete}`, {
                method: 'DELETE',
                headers: { 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' },
                credentials: 'include',
            });
            if (response.ok) {
                toast.success('Promotion record deleted');
                fetchData();
            } else {
                toast.error('Failed to delete promotion');
            }
        } catch {
            toast.error('An error occurred');
        } finally {
            setIsDeleting(false);
            setDeleteModalOpen(false);
            setItemToDelete(null);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSelectChange = (value: string | number, name: string) => {
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const url = editingItem ? `/api/hr/promotions/${editingItem.id}` : '/api/hr/promotions';
        const method = editingItem ? 'PUT' : 'POST';
        try {
            await fetch('/sanctum/csrf-cookie');
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' },
                credentials: 'include',
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (response.ok) {
                toast.success(`Promotion ${editingItem ? 'updated' : 'created'} successfully`);
                setModalOpen(false);
                fetchData();
            } else {
                const firstError = data.errors ? Object.values(data.errors)[0] : data.message;
                toast.error(Array.isArray(firstError) ? firstError[0] : firstError || 'Error saving promotion');
            }
        } catch {
            toast.error('An error occurred');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSort = (column: string) => {
        if (sortBy === column) setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        else { setSortBy(column); setSortDirection('asc'); }
    };

    const filteredItems = useMemo(() => {
        if (!search) return promotions;
        const q = search.toLowerCase();
        return promotions.filter(item =>
            item.employee?.full_name?.toLowerCase().includes(q) ||
            item.previous_designation?.name?.toLowerCase().includes(q) ||
            item.new_designation?.name?.toLowerCase().includes(q) ||
            item.status?.toLowerCase().includes(q)
        );
    }, [promotions, search]);

    const sortedItems = useMemo(() => {
        return [...filteredItems].sort((a, b) => {
            let aVal = a[sortBy]; let bVal = b[sortBy];
            if (sortBy === 'employee.full_name') { aVal = a.employee?.full_name; bVal = b.employee?.full_name; }
            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();
            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredItems, sortBy, sortDirection]);

    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return sortedItems.slice(start, start + itemsPerPage);
    }, [sortedItems, currentPage, itemsPerPage]);

    const employeeOptions = useMemo(() =>
        employees.map(e => ({ value: e.id, label: `${e.full_name} (${e.employee_id})` }))
        , [employees]);

    const designationOptions = useMemo(() =>
        designations.map(d => ({ value: d.id, label: d.name }))
        , [designations]);

    const handleMediaSelect = (file: MediaFile) => {
        setFormData((prev: any) => ({ ...prev, document: file.url }));
        setMediaSelectorOpen(false);
    };

    return (
        <div>
            <FilterBar
                icon={<IconBriefcase className="w-6 h-6 text-primary" />}
                title="Employee Promotions"
                description="Track and manage employee promotions"
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
                onAdd={handleCreate}
                addLabel="Add Promotion"
                onRefresh={fetchData}
            />

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <TableSkeleton columns={6} rows={5} />
                    ) : sortedItems.length === 0 ? (
                        <EmptyState
                            isSearch={!!search}
                            searchTerm={search}
                            onClearFilter={() => setSearch('')}
                            title="No Promotions found"
                            description="Add a promotion to start tracking employee career growth."
                            actionLabel="Add Promotion"
                            onAction={handleCreate}
                        />
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 dark:bg-gray-800 border-y border-gray-100 dark:border-gray-700">
                                <tr>
                                    <SortableHeader label="Employee" value="employee.full_name" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <th className="px-6 py-4">Previous Role</th>
                                    <th className="px-6 py-4">New Role</th>
                                    <SortableHeader label="Promotion Date" value="promotion_date" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <SortableHeader label="Effective Date" value="effective_date" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <th className="px-6 py-4">Salary Adj.</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {paginatedItems.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            <div className="flex items-center gap-3">
                                                {item.employee?.profile_image ? (
                                                    <img src={item.employee.profile_image} alt={item.employee.full_name} className="w-8 h-8 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                        {item.employee?.full_name?.charAt(0)}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-semibold">{item.employee?.full_name}</div>
                                                    <div className="text-xs text-gray-500">{item.employee?.employee_id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">{item.previous_designation?.name || '-'}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-primary font-medium">
                                                <IconArrowUpRight size={15} />
                                                {item.new_designation?.name || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">{new Date(item.promotion_date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{new Date(item.effective_date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            {item.salary_adjustment && Number(item.salary_adjustment) !== 0
                                                ? <span className="font-mono text-emerald-600 dark:text-emerald-400">+{Number(item.salary_adjustment).toLocaleString()}</span>
                                                : <span className="text-gray-400">—</span>
                                            }
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[item.status]?.className}`}>
                                                {statusConfig[item.status]?.label ?? item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <ActionButtons skipDeleteConfirm={true} onEdit={() => handleEdit(item)} onDelete={() => confirmDelete(item.id)} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                {!loading && sortedItems.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(sortedItems.length / itemsPerPage)}
                        totalItems={sortedItems.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                )}
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[700px] w-[95vw] h-[90vh] flex flex-col p-0 border-0 shadow-2xl rounded-2xl overflow-hidden">
                    {/* Header */}
                    <div className="shrink-0 bg-gradient-to-r from-primary/10 to-transparent px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
                        <div className="bg-primary/20 p-3 rounded-2xl shadow-sm">
                            <IconBriefcase className="text-primary w-7 h-7" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingItem ? 'Edit Promotion' : 'Record New Promotion'}
                            </DialogTitle>
                            <p className="text-sm text-gray-500 mt-1">
                                {editingItem ? 'Update the promotion details below.' : 'Fill in the details to record an employee promotion.'}
                            </p>
                        </div>
                    </div>

                    <ScrollArea className="flex-1 min-h-0">
                        <form id="promotion-form" onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Employee & Status */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Employee Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Employee <span className="text-red-500">*</span></label>
                                        <SearchableSelect
                                            options={employeeOptions}
                                            value={formData.employee_id}
                                            onChange={(val) => handleSelectChange(val, 'employee_id')}
                                            placeholder="Search employee..."
                                            searchPlaceholder="Type name to search..."
                                            emptyMessage="No employees found"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status <span className="text-red-500">*</span></label>
                                        <Select onValueChange={(val) => handleSelectChange(val, 'status')} value={formData.status}>
                                            <SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="approved">Approved</SelectItem>
                                                <SelectItem value="rejected">Rejected</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Designations */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Designation Change</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Previous Designation <span className="text-red-500">*</span></label>
                                        <Select onValueChange={(val) => handleSelectChange(val, 'previous_designation_id')} value={String(formData.previous_designation_id)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={loading ? 'Loading...' : 'Select designation'} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {loading ? (
                                                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                                                ) : designations.length === 0 ? (
                                                    <SelectItem value="empty" disabled>No designations available</SelectItem>
                                                ) : (
                                                    designations.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">New Designation <span className="text-red-500">*</span></label>
                                        <Select onValueChange={(val) => handleSelectChange(val, 'new_designation_id')} value={String(formData.new_designation_id)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={loading ? 'Loading...' : 'Select new designation'} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {loading ? (
                                                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                                                ) : designations.length === 0 ? (
                                                    <SelectItem value="empty" disabled>No designations available</SelectItem>
                                                ) : (
                                                    designations.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Dates & Salary */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Schedule & Compensation</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Promotion Date <span className="text-red-500">*</span></label>
                                        <DatePicker
                                            value={formData.promotion_date}
                                            onChange={(d) => setFormData((prev: any) => ({ ...prev, promotion_date: toDateStr(d) }))}
                                            placeholder="Select promotion date"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Effective Date <span className="text-red-500">*</span></label>
                                        <DatePicker
                                            value={formData.effective_date}
                                            onChange={(d) => setFormData((prev: any) => ({ ...prev, effective_date: toDateStr(d) }))}
                                            placeholder="Select effective date"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Salary Adjustment</label>
                                        <Input type="number" name="salary_adjustment" value={formData.salary_adjustment} onChange={handleChange} placeholder="e.g. 500.00" className="bg-gray-50 dark:bg-gray-800/50" />
                                    </div>
                                </div>
                            </div>

                            {/* Reason */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Reason for Promotion</label>
                                <Textarea name="reason" value={formData.reason} onChange={handleChange} placeholder="Describe why this employee is being promoted..." rows={3} className="bg-gray-50 dark:bg-gray-800/50 resize-none" />
                            </div>

                            {/* Document */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Supporting Document</h3>
                                <div
                                    className={`relative group border-2 border-dashed rounded-xl p-5 transition-all duration-200 cursor-pointer ${formData.document ? 'border-primary/50 bg-primary/5' : 'border-gray-200 dark:border-gray-700 hover:border-primary/40 hover:bg-primary/5'}`}
                                    onClick={() => setMediaSelectorOpen(true)}
                                >
                                    <div className="flex flex-col items-center justify-center text-center gap-3">
                                        <div className={`p-3 rounded-full transition-colors ${formData.document ? 'bg-primary/20 text-primary' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 group-hover:bg-primary/10 group-hover:text-primary'}`}>
                                            <IconFileText stroke={1.5} size={28} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">Promotion Document</p>
                                            <p className="text-xs text-gray-500 mt-1">{formData.document ? 'Click to change document' : 'Upload or select PDF/Image'}</p>
                                        </div>
                                    </div>
                                    {formData.document && (
                                        <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button type="button" variant="secondary" size="icon" className="h-7 w-7 rounded-full shadow-sm" onClick={(e) => { e.stopPropagation(); window.open(formData.document, '_blank'); }}>
                                                <IconExternalLink className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button type="button" size="icon" className="h-7 w-7 rounded-full shadow-sm bg-red-100 text-red-600 hover:bg-red-200" onClick={(e) => { e.stopPropagation(); handleSelectChange('', 'document'); }}>
                                                <IconX className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </form>
                    </ScrollArea>

                    {/* Sticky Footer */}
                    <div className="shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-background">
                        <Button type="button" variant="ghost" className="px-5" onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button type="submit" form="promotion-form" disabled={isSaving} className="px-7 bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20">
                            {isSaving ? 'Processing...' : (editingItem ? 'Save Changes' : 'Record Promotion')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <DeleteModal
                isOpen={deleteModalOpen}
                setIsOpen={setDeleteModalOpen}
                onConfirm={executeDelete}
                isLoading={isDeleting}
                title="Delete Promotion"
                message="Are you sure you want to delete this promotion record? This action cannot be undone."
            />

            <MediaSelector
                open={mediaSelectorOpen}
                onOpenChange={setMediaSelectorOpen}
                onSelect={handleMediaSelect}
                acceptedType="all"
            />
        </div>
    );
};

export default PromotionIndex;
