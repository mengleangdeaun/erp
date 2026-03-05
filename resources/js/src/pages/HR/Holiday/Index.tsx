import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { DatePicker } from '../../../components/ui/date-picker';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Checkbox } from '../../../components/ui/checkbox';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import DeleteModal from '../../../components/DeleteModal';
import ActionButtons from '../../../components/ui/ActionButtons';
import SearchableMultiSelect from '../../../components/ui/SearchableMultiSelect';
import { IconConfetti, IconCalendarEvent, IconInfoCircle, IconMapPin, IconClock } from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';

const HOLIDAY_CATEGORIES = [
    'National Holidays',
    'Religious',
    'Company Specific',
    'Regional Events'
];

const toDateStr = (d: Date | undefined) => d ? format(d, 'yyyy-MM-dd') : '';

const HolidayIndex = () => {
    const [holidays, setHolidays] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('start_date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const initialFormState = {
        name: '',
        category: 'National Holidays',
        start_date: toDateStr(new Date()),
        end_date: toDateStr(new Date()),
        description: '',
        is_paid: true,
        is_half_day: false,
        branch_ids: []
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
            fetch('/api/hr/holidays', { headers: { Accept: 'application/json' } }).then(r => r.json()),
            fetch('/api/hr/branches', { headers: { Accept: 'application/json' } }).then(r => r.json())
        ]).then(([holidayData, branchData]) => {
            if (Array.isArray(holidayData)) setHolidays(holidayData);
            if (Array.isArray(branchData)) setBranches(branchData);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            toast.error('Failed to load data');
            setLoading(false);
        });
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
            name: item.name,
            category: item.category,
            start_date: item.start_date ? format(parseISO(item.start_date), 'yyyy-MM-dd') : '',
            end_date: item.end_date ? format(parseISO(item.end_date), 'yyyy-MM-dd') : '',
            description: item.description || '',
            is_paid: item.is_paid,
            is_half_day: item.is_half_day,
            branch_ids: item.branches?.map((b: any) => b.id.toString()) || []
        });
        setModalOpen(true);
    };

    const confirmDelete = (id: number) => { setItemToDelete(id); setDeleteModalOpen(true); };

    const executeDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/hr/holidays/${itemToDelete}`, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || ''
                },
                credentials: 'include',
            });
            if (res.ok) {
                toast.success('Holiday deleted');
                fetchData();
            } else toast.error('Failed to delete');
        } catch { toast.error('An error occurred'); }
        finally { setIsDeleting(false); setDeleteModalOpen(false); setItemToDelete(null); }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setFormData((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSelectChange = (value: any, name: string) =>
        setFormData((prev: any) => ({ ...prev, [name]: value }));

    const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) =>
        setFormData((prev: any) => ({ ...prev, [e.target.name]: e.target.checked }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const url = editingItem ? `/api/hr/holidays/${editingItem.id}` : '/api/hr/holidays';
        const method = editingItem ? 'PUT' : 'POST';
        try {
            await fetch('/sanctum/csrf-cookie');
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || ''
                },
                credentials: 'include',
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(`Holiday ${editingItem ? 'updated' : 'created'} successfully`);
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
        if (!search) return holidays;
        const q = search.toLowerCase();
        return holidays.filter(item =>
            item.name.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q)
        );
    }, [holidays, search]);

    const sortedItems = useMemo(() => {
        return [...filteredItems].sort((a, b) => {
            let aVal = a[sortBy]; let bVal = b[sortBy];
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

    const branchOptions = useMemo(() =>
        branches.map(b => ({ value: b.id.toString(), label: b.name }))
        , [branches]);

    return (
        <div>
            <FilterBar
                title="Holiday Management"
                description="Manage company and national holidays"
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
                onAdd={handleCreate}
                addLabel="Add Holiday"
                onRefresh={fetchData}
            />

            <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <TableSkeleton columns={7} rows={5} />
                    ) : sortedItems.length === 0 ? (
                        <EmptyState
                            isSearch={!!search}
                            searchTerm={search}
                            onClearFilter={() => setSearch('')}
                            title="No holidays found"
                            description="Start by adding holidays to the calendar."
                            actionLabel="Add Holiday"
                            onAction={handleCreate}
                        />
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 dark:bg-gray-800 border-y border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4">Name</th>
                                    <SortableHeader label="Category" value="category" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <SortableHeader label="Start Date" value="start_date" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <SortableHeader label="End Date" value="end_date" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Branches</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {paginatedItems.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                                    <IconConfetti size={18} />
                                                </div>
                                                <span className="font-semibold text-gray-900 dark:text-white">{item.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.start_date ? format(parseISO(item.start_date), 'MMM dd, yyyy') : '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.end_date ? format(parseISO(item.end_date), 'MMM dd, yyyy') : '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {item.is_paid && (
                                                    <span className="text-[10px] font-bold text-green-600 uppercase">Paid</span>
                                                )}
                                                {item.is_half_day && (
                                                    <span className="text-[10px] font-bold text-amber-600 uppercase">Half Day</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 max-w-[200px]">
                                            <div className="flex flex-wrap gap-1">
                                                {item.branches?.map((b: any) => (
                                                    <span key={b.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-medium rounded border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400">
                                                        <IconMapPin size={10} /> {b.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <ActionButtons
                                                skipDeleteConfirm={true}
                                                onEdit={() => handleEdit(item)}
                                                onDelete={() => confirmDelete(item.id)}
                                            />
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

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[700px] p-0 border-0 shadow-2xl rounded-2xl overflow-hidden">
                    <div className="bg-gradient-to-r from-primary/10 to-transparent px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
                        <div className="bg-primary/20 p-3 rounded-2xl">
                            <IconCalendarEvent className="text-primary w-7 h-7" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingItem ? 'Edit Holiday' : 'Add New Holiday'}
                            </DialogTitle>
                            <p className="text-sm text-gray-500 mt-0.5">Configuration for public or company holidays.</p>
                        </div>
                    </div>

                    <ScrollArea className="max-h-[70vh]">
                        <form id="holiday-form" onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Holiday Name <span className="text-red-500">*</span></label>
                                    <Input name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Lunar New Year" required />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category <span className="text-red-500">*</span></label>
                                    <Select
                                        onValueChange={(val) => handleSelectChange(val, 'category')}
                                        value={formData.category}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {HOLIDAY_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Start Date <span className="text-red-500">*</span></label>
                                    <DatePicker
                                        value={formData.start_date}
                                        onChange={(d) => handleSelectChange(toDateStr(d), 'start_date')}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">End Date <span className="text-red-500">*</span></label>
                                    <DatePicker
                                        value={formData.end_date}
                                        onChange={(d) => handleSelectChange(toDateStr(d), 'end_date')}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Applicable Branches <span className="text-red-500">*</span></label>
                                <SearchableMultiSelect
                                    options={branchOptions}
                                    value={formData.branch_ids}
                                    onChange={(val) => handleSelectChange(val, 'branch_ids')}
                                    placeholder="Select branches..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl">
                                    <div className="flex-1">
                                        <label className="text-sm font-bold text-gray-900 dark:text-white block">Paid Holiday</label>
                                        <span className="text-[10px] text-gray-500">Employee gets paid for this day</span>
                                    </div>
                                    <Checkbox
                                        name="is_paid"
                                        checked={formData.is_paid}
                                        onCheckedChange={(checked) => handleSelectChange(checked, 'is_paid')}
                                    />
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl">
                                    <div className="flex-1">
                                        <label className="text-sm font-bold text-gray-900 dark:text-white block">Half Day</label>
                                        <span className="text-[10px] text-gray-500">Only half workday is off</span>
                                    </div>
                                    <Checkbox
                                        name="is_half_day"
                                        checked={formData.is_half_day}
                                        onCheckedChange={(checked) => handleSelectChange(checked, 'is_half_day')}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                                <Textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Enjoy your holiday break!"
                                    rows={3}
                                />
                            </div>
                        </form>
                    </ScrollArea>

                    <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
                        <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button
                            type="submit"
                            form="holiday-form"
                            disabled={isSaving}
                            className="bg-primary text-white"
                        >
                            {isSaving ? 'Saving...' : (editingItem ? 'Update Holiday' : 'Save Holiday')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <DeleteModal
                isOpen={deleteModalOpen}
                setIsOpen={setDeleteModalOpen}
                onConfirm={executeDelete}
                isLoading={isDeleting}
                title="Delete Holiday"
                message="Are you sure you want to remove this holiday? This will affect the calendar of all linked employees."
            />
        </div>
    );
};

export default HolidayIndex;
