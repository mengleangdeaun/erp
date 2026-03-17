import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { DatePicker } from '../../../components/ui/date-picker';
import { ScrollArea } from '../../../components/ui/scroll-area';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import DeleteModal from '../../../components/DeleteModal';
import ActionButtons from '../../../components/ui/ActionButtons';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import MediaSelector, { MediaFile } from '../../../components/MediaSelector';
import { IconUserOff, IconFileText, IconX, IconExternalLink, IconPaperclip } from '@tabler/icons-react';

const toDateStr = (d: Date | undefined) => d ? d.toISOString().split('T')[0] : '';

const statusConfig: Record<string, { label: string; className: string }> = {
    pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    approved: { label: 'Approved', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    completed: { label: 'Completed', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
};

const ResignationIndex = () => {
    const [resignations, setResignations] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [mediaSelectorOpen, setMediaSelectorOpen] = useState(false);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('resignation_date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const today = new Date().toISOString().split('T')[0];
    const initialFormState = {
        employee_id: '',
        resignation_date: today,
        last_working_day: today,
        notice_period: 30,
        reason: '',
        description: '',
        document: '',
        status: 'pending',
        exit_interview_conducted: false,
        exit_interview_date: '',
        exit_feedback: '',
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
            fetch('/api/hr/resignations', { headers: { 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' }, credentials: 'include' }).then(r => r.json()),
            fetch('/api/hr/employees?compact=true', { headers: { 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' }, credentials: 'include' }).then(r => r.json()),
        ]).then(([resData, empData]) => {
            if (Array.isArray(resData)) setResignations(resData);
            if (Array.isArray(empData)) setEmployees(empData);
            setLoading(false);
        }).catch(err => { console.error(err); setLoading(false); });
    };

    useEffect(() => { fetchData(); }, []);

    const handleCreate = () => {
        setEditingItem(null);
        setFormData(initialFormState);
        setModalOpen(true);
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setFormData({
            employee_id: item.employee_id,
            resignation_date: item.resignation_date,
            last_working_day: item.last_working_day,
            notice_period: item.notice_period,
            reason: item.reason || '',
            description: item.description || '',
            document: item.document || '',
            status: item.status,
            exit_interview_conducted: item.exit_interview_conducted || false,
            exit_interview_date: item.exit_interview_date || '',
            exit_feedback: item.exit_feedback || '',
        });
        setModalOpen(true);
    };

    const confirmDelete = (id: number) => { setItemToDelete(id); setDeleteModalOpen(true); };

    const executeDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/hr/resignations/${itemToDelete}`, {
                method: 'DELETE',
                headers: { 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' },
                credentials: 'include',
            });
            if (res.ok) { toast.success('Resignation record deleted'); fetchData(); }
            else toast.error('Failed to delete');
        } catch { toast.error('An error occurred'); }
        finally { setIsDeleting(false); setDeleteModalOpen(false); setItemToDelete(null); }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setFormData((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSelectChange = (value: string | number | boolean, name: string) =>
        setFormData((prev: any) => ({ ...prev, [name]: value }));

    const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) =>
        setFormData((prev: any) => ({ ...prev, [e.target.name]: e.target.checked }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const url = editingItem ? `/api/hr/resignations/${editingItem.id}` : '/api/hr/resignations';
        const method = editingItem ? 'PUT' : 'POST';
        try {
            await fetch('/sanctum/csrf-cookie');
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' },
                credentials: 'include',
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(`Resignation ${editingItem ? 'updated' : 'recorded'} successfully`);
                setModalOpen(false);
                fetchData();
            } else {
                const firstError = data.errors ? Object.values(data.errors)[0] : data.message;
                toast.error(Array.isArray(firstError) ? firstError[0] : firstError || 'Error saving');
            }
        } catch { toast.error('An error occurred'); }
        finally { setIsSaving(false); }
    };

    const handleSort = (column: string) => {
        if (sortBy === column) setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        else { setSortBy(column); setSortDirection('asc'); }
    };

    const filteredItems = useMemo(() => {
        if (!search) return resignations;
        const q = search.toLowerCase();
        return resignations.filter(item =>
            item.employee?.full_name?.toLowerCase().includes(q) ||
            item.status?.toLowerCase().includes(q)
        );
    }, [resignations, search]);

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

    return (
        <div>
            <FilterBar
                icon={<IconUserOff className="w-6 h-6 text-primary" />}
                title="Employee Resignations"
                description="Track and manage employee resignation records"
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
                onAdd={handleCreate}
                addLabel="Record Resignation"
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
                            title="No Resignation records found"
                            description="Record an employee resignation to track offboarding."
                            actionLabel="Record Resignation"
                            onAction={handleCreate}
                        />
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 dark:bg-gray-800 border-y border-gray-100 dark:border-gray-700">
                                <tr>
                                    <SortableHeader label="Employee" value="employee.full_name" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <SortableHeader label="Resignation Date" value="resignation_date" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <SortableHeader label="Last Working Day" value="last_working_day" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <th className="px-6 py-4">Notice</th>
                                    <th className="px-6 py-4">Exit Interview</th>
                                    <th className="px-6 py-4">Media</th>
                                    <SortableHeader label="Status" value="status" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
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
                                        <td className="px-6 py-4 whitespace-nowrap">{new Date(item.resignation_date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{new Date(item.last_working_day).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-gray-700 dark:text-gray-300">{item.notice_period}d</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.exit_interview_conducted ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Conducted</span>
                                            ) : (
                                                <span className="text-gray-400 text-xs">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.document ? (
                                                <a
                                                    href={item.document}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    title="View Document"
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 transition-colors dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-900/40"
                                                >
                                                    <IconPaperclip size={15} />
                                                </a>
                                            ) : (
                                                <span className="text-gray-300 dark:text-gray-600">—</span>
                                            )}
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
                <DialogContent className="sm:max-w-[750px] w-[95vw] h-[90vh] flex flex-col p-0 border-0 shadow-2xl rounded-2xl overflow-hidden">
                    {/* Sticky Header */}
                    <div className="shrink-0 bg-gradient-to-r from-rose-500/10 to-transparent px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
                        <div className="bg-rose-500/20 p-3 rounded-2xl shadow-sm">
                            <IconUserOff className="text-rose-500 w-7 h-7" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingItem ? 'Edit Resignation' : 'Record Resignation'}
                            </DialogTitle>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {editingItem ? 'Update the offboarding details below.' : 'Fill in the details to log an employee resignation.'}
                            </p>
                        </div>
                    </div>

                    {/* Scrollable Form Body */}
                    <ScrollArea className="flex-1 min-h-0">
                        <form id="resignation-form" onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Employee & Status */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Resignation Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1">
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
                                    <div className="space-y-2.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status <span className="text-red-500">*</span></label>
                                        <Select onValueChange={(val) => handleSelectChange(val, 'status')} value={formData.status}>
                                            <SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="approved">Approved</SelectItem>
                                                <SelectItem value="rejected">Rejected</SelectItem>
                                                <SelectItem value="rejected">Completed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Dates & Notice Period */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Dates & Notice Period</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Resignation Date <span className="text-red-500">*</span></label>
                                        <DatePicker
                                            value={formData.resignation_date}
                                            onChange={(d) => setFormData((prev: any) => ({ ...prev, resignation_date: toDateStr(d) }))}
                                            placeholder="Select resignation date"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Working Day <span className="text-red-500">*</span></label>
                                        <DatePicker
                                            value={formData.last_working_day}
                                            onChange={(d) => setFormData((prev: any) => ({ ...prev, last_working_day: toDateStr(d) }))}
                                            placeholder="Select last working day"
                                        />
                                    </div>
                                    <div className="space-y-2.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notice Period (days)</label>
                                        <Input type="number" name="notice_period" value={formData.notice_period} onChange={handleChange} min={0} className="bg-gray-50 dark:bg-gray-800/50" />
                                    </div>
                                </div>
                            </div>

                            {/* Reason & Description */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Reason & Description</h3>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Reason</label>
                                    <Input name="reason" value={formData.reason} onChange={handleChange} placeholder="e.g., Better opportunity, Personal reasons" className="bg-gray-50 dark:bg-gray-800/50" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                                    <Textarea name="description" value={formData.description} onChange={handleChange} placeholder="Additional details about this resignation..." rows={3} className="bg-gray-50 dark:bg-gray-800/50 resize-none" />
                                </div>
                            </div>

                            {/* Document Attachment */}
                            <div className="space-y-3">
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
                                            <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">Resignation Letter / Document</p>
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

                            {/* Exit Interview */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Exit Interview</h3>
                                <label className="flex items-center gap-3 cursor-pointer group w-fit">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            name="exit_interview_conducted"
                                            checked={formData.exit_interview_conducted}
                                            onChange={handleCheckbox}
                                            className="sr-only peer"
                                        />
                                        <div className="w-10 h-6 bg-gray-200 dark:bg-gray-700 peer-checked:bg-primary rounded-full transition-colors"></div>
                                        <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4"></div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Exit Interview Conducted</span>
                                </label>

                                {formData.exit_interview_conducted && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pl-1">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Exit Interview Date</label>
                                            <DatePicker
                                                value={formData.exit_interview_date}
                                                onChange={(d) => setFormData((prev: any) => ({ ...prev, exit_interview_date: toDateStr(d) }))}
                                                placeholder="Select interview date"
                                            />
                                        </div>
                                        <div className="space-y-1.5 md:col-span-2">
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Exit Feedback</label>
                                            <Textarea name="exit_feedback" value={formData.exit_feedback} onChange={handleChange} placeholder="Summary of the exit interview feedback..." rows={3} className="bg-gray-50 dark:bg-gray-800/50 resize-none" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </form>
                    </ScrollArea>

                    {/* Sticky Footer */}
                    <div className="shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-background">
                        <Button type="button" variant="ghost" className="px-5" onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button
                            type="submit"
                            form="resignation-form"
                            disabled={isSaving}
                            className="px-7 bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20"
                        >
                            {isSaving ? 'Processing...' : (editingItem ? 'Save Changes' : 'Record Resignation')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <DeleteModal
                isOpen={deleteModalOpen}
                setIsOpen={setDeleteModalOpen}
                onConfirm={executeDelete}
                isLoading={isDeleting}
                title="Delete Resignation Record"
                message="Are you sure you want to delete this resignation record? This action cannot be undone."
            />

            <MediaSelector
                open={mediaSelectorOpen}
                onOpenChange={setMediaSelectorOpen}
                onSelect={(file: MediaFile) => { setFormData((prev: any) => ({ ...prev, document: file.url })); setMediaSelectorOpen(false); }}
                acceptedType="all"
            />
        </div>
    );
};

export default ResignationIndex;
