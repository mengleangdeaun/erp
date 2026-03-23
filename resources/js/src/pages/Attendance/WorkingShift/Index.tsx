import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Checkbox } from '../../../components/ui/checkbox';
import { Badge } from '../../../components/ui/badge';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import DeleteModal from '../../../components/DeleteModal';
import ActionButtons from '../../../components/ui/ActionButtons';
import { TimePicker } from '../../../components/ui/time-picker';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { IconClock, IconCalendarPlus, IconCoffee, IconRepeat, IconSeparator, IconTransferVertical } from '@tabler/icons-react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';


const WorkingShiftIndex = () => {
    const dispatch = useDispatch();
    const [workingShifts, setWorkingShifts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingShift, setEditingShift] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const initialFormState = {
        name: '',
        shift_type: 'continuous',
        description: '',
        status: 'active',
        working_days: {
            monday: { is_working: true, start_time: '08:00', end_time: '17:00', has_break: false, break_start: '', break_end: '' },
            tuesday: { is_working: true, start_time: '08:00', end_time: '17:00', has_break: false, break_start: '', break_end: '' },
            wednesday: { is_working: true, start_time: '08:00', end_time: '17:00', has_break: false, break_start: '', break_end: '' },
            thursday: { is_working: true, start_time: '08:00', end_time: '17:00', has_break: false, break_start: '', break_end: '' },
            friday: { is_working: true, start_time: '08:00', end_time: '17:00', has_break: false, break_start: '', break_end: '' },
            saturday: { is_working: false, start_time: '', end_time: '', has_break: false, break_start: '', break_end: '' },
            sunday: { is_working: false, start_time: '', end_time: '', has_break: false, break_start: '', break_end: '' },
        }
    };

    const [formData, setFormData] = useState<any>(initialFormState);

    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    useEffect(() => {
        dispatch(setPageTitle('Working Shifts'));
    }, [dispatch]);

    const fetchWorkingShifts = () => {
        setLoading(true);
        fetch('/api/attendance/working-shifts', {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
            },
            credentials: 'include',
        })
            .then(res => {
                if (res.status === 401) { window.location.href = '/login'; return null; }
                return res.json();
            })
            .then(data => {
                if (!data) return;
                if (Array.isArray(data)) setWorkingShifts(data);
                else setWorkingShifts([]);
                setLoading(false);
            })
            .catch(err => { console.error(err); setWorkingShifts([]); setLoading(false); });
    };

    useEffect(() => { fetchWorkingShifts(); }, []);

    const handleCreate = () => { setEditingShift(null); setFormData(initialFormState); setModalOpen(true); };

    const handleEdit = (shift: any) => {
        setEditingShift(shift);
        let parsedWorkingDays = { ...initialFormState.working_days };
        if (shift.working_days) {
            try {
                const incomingDays = typeof shift.working_days === 'string' ? JSON.parse(shift.working_days) : shift.working_days;
                // Merge each day to ensure all keys like has_break exist
                Object.keys(incomingDays).forEach(day => {
                    if ((parsedWorkingDays as any)[day]) {
                        (parsedWorkingDays as any)[day] = { ...(parsedWorkingDays as any)[day], ...incomingDays[day] };
                    }
                });
            } catch (e) {
                console.error('Failed to parse working_days', e);
            }
        }
        setFormData({
            name: shift.name,
            shift_type: shift.shift_type || 'continuous',
            description: shift.description || '',
            status: shift.status,
            working_days: parsedWorkingDays
        });
        setModalOpen(true);
    };

    const confirmDelete = (id: number) => { setItemToDelete(id); setDeleteModalOpen(true); };

    const executeDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/attendance/working-shifts/${itemToDelete}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' },
                credentials: 'include',
            });
            if (response.ok) { toast.success('Working Shift deleted successfully'); fetchWorkingShifts(); }
            else toast.error('Failed to delete working shift');
        } catch (error) { toast.error('An error occurred'); }
        finally { setIsDeleting(false); setDeleteModalOpen(false); setItemToDelete(null); }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (value: string, name: string) => setFormData((prev: any) => ({ ...prev, [name]: value }));

    const handleDayChange = (day: string, field: string, value: any) => {
        setFormData((prev: any) => ({
            ...prev,
            working_days: { ...prev.working_days, [day]: { ...prev.working_days[day], [field]: value } }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const url = editingShift ? `/api/attendance/working-shifts/${editingShift.id}` : '/api/attendance/working-shifts';
        const method = editingShift ? 'PUT' : 'POST';
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
                toast.success(`Working Shift ${editingShift ? 'updated' : 'created'} successfully`);
                setModalOpen(false);
                fetchWorkingShifts();
            } else {
                if (response.status === 401) window.location.href = '/login';
                const msg = data.errors ? Object.values(data.errors).flat().join(', ') : data.message || 'Failed to save';
                toast.error(msg);
            }
        } catch (error) { toast.error('An error occurred while saving'); }
        finally { setIsSaving(false); }
    };

    const handleSort = (column: string) => {
        if (sortBy === column) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        else { setSortBy(column); setSortDirection('asc'); }
    };

    const renderScheduleSummary = (workingDays: any) => {
        if (!workingDays) return <span className="text-gray-400">Not set</span>;
        const days = typeof workingDays === 'string' ? JSON.parse(workingDays) : workingDays;
        let workingCount = 0;
        Object.values(days).forEach((d: any) => { if (d.is_working) workingCount++; });
        return (
            <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded text-xs">
                    {workingCount} working days
                </span>
            </div>
        );
    };

    const filteredShifts = useMemo(() => {
        if (!search) return workingShifts;
        const lowerSearch = search.toLowerCase();
        return workingShifts.filter(shift =>
            shift.name.toLowerCase().includes(lowerSearch) ||
            (shift.description && shift.description.toLowerCase().includes(lowerSearch))
        );
    }, [workingShifts, search]);

    const sortedShifts = useMemo(() => {
        return [...filteredShifts].sort((a, b) => {
            let aVal = a[sortBy]; let bVal = b[sortBy];
            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();
            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredShifts, sortBy, sortDirection]);

    const paginatedShifts = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return sortedShifts.slice(start, start + itemsPerPage);
    }, [sortedShifts, currentPage, itemsPerPage]);

    return (
        <div>
            <FilterBar
                icon={<IconTransferVertical className="w-6 h-6 text-primary" />}
                title="Working Shifts"
                description="Manage employee shift schedules"
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={(val: number) => { setItemsPerPage(val); setCurrentPage(1); }}
                onAdd={handleCreate}
                addLabel="Add Working Shift"
                onRefresh={fetchWorkingShifts}
            />

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <TableSkeleton columns={5} rows={5} />
                    ) : sortedShifts.length === 0 ? (
                        <EmptyState
                            isSearch={!!search}
                            searchTerm={search}
                            onClearFilter={() => setSearch('')}
                            title="No working shifts yet"
                            description="Create your first working shift to get started."
                            actionLabel="Add Working Shift"
                            onAction={handleCreate}
                        />
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 dark:bg-gray-800 border-y border-gray-100 dark:border-gray-700">
                                <tr>
                                    <SortableHeader label="Name" value="name" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <th className="px-6 py-4 font-medium">Schedule</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium">Description</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {paginatedShifts.map((shift: any) => (
                                    <tr key={shift.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{shift.name}</td>
                                        <td className="px-6 py-4">{renderScheduleSummary(shift.working_days)}</td>
                                        <td className="px-6 py-4">
                                            <Badge 
                                              size='sm'
                                              variant={shift.status === 'active' ? 'success' : 'destructive'}>
                                                {shift.status === 'active' ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{shift.description || '-'}</td>
                                        <td className="px-6 py-4">
                                            <ActionButtons variant='rounded' skipDeleteConfirm={true} onEdit={() => handleEdit(shift)} onDelete={() => confirmDelete(shift.id)} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {!loading && sortedShifts.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(sortedShifts.length / itemsPerPage)}
                        totalItems={sortedShifts.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                )}
            </div>

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[1050px] w-[95vw] h-[90vh] flex flex-col p-0 border-0 shadow-2xl rounded-2xl overflow-hidden">
                    {/* Header */}
                    <div className="shrink-0 bg-gradient-to-r from-primary/10 to-transparent px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
                        <div className="bg-primary/20 p-3 rounded-2xl shadow-sm">
                            <IconClock className="text-primary w-7 h-7" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingShift ? 'Edit Working Shift' : 'Add New Working Shift'}
                            </DialogTitle>
                            <p className="text-sm text-gray-500 mt-1">
                                {editingShift ? 'Update the details for this shift schedule.' : 'Configure a new shift schedule for employees.'}
                            </p>
                        </div>
                    </div>

                    <ScrollArea className="flex-1 min-h-0">
                        <form id="shift-form" onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Shift Name <span className="text-red-500">*</span></label>
                                    <Input name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Morning Shift" required className="bg-gray-50 dark:bg-gray-800/50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Status</label>
                                    <Select onValueChange={(val) => handleSelectChange(val, 'status')} value={formData.status}>
                                        <SelectTrigger className="bg-gray-50 dark:bg-gray-800/50"><SelectValue placeholder="Select Status" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Shift Type</label>
                                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                                        <button
                                            type="button"
                                            onClick={() => handleSelectChange('continuous', 'shift_type')}
                                            className={cn(
                                                "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all",
                                                formData.shift_type === 'continuous'
                                                    ? "bg-white dark:bg-gray-700 shadow-sm text-primary"
                                                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                            )}
                                        >
                                            <IconRepeat size={14} stroke={2.5} />
                                            Continuous
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleSelectChange('split', 'shift_type')}
                                            className={cn(
                                                "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all",
                                                formData.shift_type === 'split'
                                                    ? "bg-white dark:bg-gray-700 shadow-sm text-primary"
                                                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                            )}
                                        >
                                            <IconSeparator size={14} stroke={2.5} />
                                            Split Session
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1 italic">
                                        {formData.shift_type === 'continuous'
                                            ? "* 2 scans required (In/Out) with optional break."
                                            : "* 4 scans required (Morning In/Out, Afternoon In/Out)."}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Description</label>
                                    <Textarea name="description" value={formData.description} onChange={handleChange} placeholder="Optional description..." rows={2} className="bg-gray-50 dark:bg-gray-800/50 resize-none h-11 min-h-[44px]" />
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Daily Schedule</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
                                    {Object.keys(initialFormState.working_days).map((day) => {
                                        const dayData = formData.working_days[day];
                                        const isWorking = dayData?.is_working || false;
                                        const hasBreak = dayData?.has_break || false;

                                        return (
                                            <div
                                                key={day}
                                                className={cn(
                                                    "relative flex flex-col gap-4 p-4 border rounded-2xl transition-all duration-300",
                                                    isWorking
                                                        ? "border-primary/20 bg-white dark:bg-gray-800/50 shadow-sm ring-1 ring-primary/5"
                                                        : "border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/10 grayscale opacity-60"
                                                )}
                                            >
                                                {/* Day Header */}
                                                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800/50 pb-3 mb-1">
                                                    <span className="capitalize font-bold text-sm tracking-tight text-gray-900 dark:text-white">
                                                        {day}
                                                    </span>
                                                    <Checkbox
                                                        id={`day-${day}`}
                                                        checked={isWorking}
                                                        onCheckedChange={(checked) => handleDayChange(day, 'is_working', !!checked)}
                                                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary h-5 w-5 rounded-md"
                                                    />
                                                </div>

                                                <div className="flex flex-col gap-5 relative pl-4">
                                                    {/* Vertical Timeline Thread */}
                                                    <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-gradient-to-b from-primary/30 via-gray-100 dark:via-gray-800 to-primary/30 rounded-full" />

                                                    {/* Start Time Section */}
                                                    <div className="relative">
                                                        <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-white dark:bg-gray-900 border-2 border-primary z-10" />
                                                        <label className="text-[10px] uppercase text-primary font-bold mb-1.5 block tracking-wider">
                                                            {formData.shift_type === 'split' ? 'Session 1: In' : 'Start Work'}
                                                        </label>
                                                        <TimePicker
                                                            disabled={!isWorking}
                                                            value={dayData?.start_time || ''}
                                                            onChange={(val) => handleDayChange(day, 'start_time', val)}
                                                            className="w-full text-xs h-9 bg-gray-50/50 dark:bg-gray-900/50 border-gray-200/60 dark:border-gray-700/50"
                                                            icon={<IconClock size={14} stroke={2} />}
                                                        />
                                                    </div>

                                                    {/* Break/Session 2 Section Container */}
                                                    <div className="pt-1">
                                                        {formData.shift_type === 'continuous' ? (
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <Checkbox
                                                                    id={`break-${day}`}
                                                                    checked={hasBreak}
                                                                    onCheckedChange={(checked) => handleDayChange(day, 'has_break', !!checked)}
                                                                    disabled={!isWorking}
                                                                    className="h-4 w-4 rounded shadow-none data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                                                                />
                                                                <label
                                                                    htmlFor={`break-${day}`}
                                                                    className={cn(
                                                                        "text-[11px] mb-0 font-bold uppercase tracking-wide cursor-pointer select-none flex items-center gap-1.5",
                                                                        hasBreak ? "text-orange-600 dark:text-orange-400" : "text-gray-400"
                                                                    )}
                                                                >
                                                                    <IconCoffee size={14} stroke={2} />
                                                                    {hasBreak ? 'With Break' : 'Add Break'}
                                                                </label>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <div className="bg-blue-500 h-1.5 w-1.5 rounded-full" />
                                                                <span className="text-[11px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                                                                    Split Session Active
                                                                </span>
                                                            </div>
                                                        )}

                                                        {(hasBreak || formData.shift_type === 'split') && isWorking && (
                                                            <div className={cn(
                                                                "space-y-3 p-2.5 rounded-xl border",
                                                                formData.shift_type === 'split'
                                                                    ? "bg-blue-50/30 dark:bg-blue-900/5 border-blue-100/50 dark:border-blue-900/20"
                                                                    : "bg-orange-50/30 dark:bg-orange-900/5 border-orange-100/50 dark:border-orange-900/20"
                                                            )}>
                                                                <div className="grid grid-cols-1 gap-2.5">
                                                                    <div className="space-y-1">
                                                                        <label className={cn(
                                                                            "text-[9px] uppercase font-bold block ml-1",
                                                                            formData.shift_type === 'split' ? "text-blue-500" : "text-orange-500/80"
                                                                        )}>
                                                                            {formData.shift_type === 'split' ? 'Session 1: Out' : 'Break Start'}
                                                                        </label>
                                                                        <TimePicker
                                                                            value={dayData?.break_start || ''}
                                                                            onChange={(val) => handleDayChange(day, 'break_start', val)}
                                                                            className={cn(
                                                                                "w-full text-[11px] h-8 bg-white dark:bg-gray-900",
                                                                                formData.shift_type === 'split' ? "border-blue-200/50 dark:border-blue-800/30" : "border-orange-200/50 dark:border-orange-800/30"
                                                                            )}
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <label className={cn(
                                                                            "text-[9px] uppercase font-bold block ml-1",
                                                                            formData.shift_type === 'split' ? "text-blue-500" : "text-orange-500/80"
                                                                        )}>
                                                                            {formData.shift_type === 'split' ? 'Session 2: In' : 'Break End'}
                                                                        </label>
                                                                        <TimePicker
                                                                            value={dayData?.break_end || ''}
                                                                            onChange={(val) => handleDayChange(day, 'break_end', val)}
                                                                            className={cn(
                                                                                "w-full text-[11px] h-8 bg-white dark:bg-gray-900",
                                                                                formData.shift_type === 'split' ? "border-blue-200/50 dark:border-blue-800/30" : "border-orange-200/50 dark:border-orange-800/30"
                                                                            )}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* End Time Section */}
                                                    <div className="relative">
                                                        <div className="absolute -left-[21px] bottom-1.5 w-3 h-3 rounded-full bg-white dark:bg-gray-900 border-2 border-primary z-10" />
                                                        <label className="text-[10px] uppercase text-primary font-bold mb-1.5 block tracking-wider">
                                                            {formData.shift_type === 'split' ? 'Session 2: Out' : 'End Work'}
                                                        </label>
                                                        <TimePicker
                                                            disabled={!isWorking}
                                                            value={dayData?.end_time || ''}
                                                            onChange={(val) => handleDayChange(day, 'end_time', val)}
                                                            className="w-full text-xs h-9 bg-gray-50/50 dark:bg-gray-900/50 border-gray-200/60 dark:border-gray-700/50"
                                                            icon={<IconClock size={14} stroke={2} />}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </form>
                    </ScrollArea>

                    {/* Sticky Footer */}
                    <div className="shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-background">
                        <Button type="button" variant="ghost" className="px-5" onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button type="submit" form="shift-form" disabled={isSaving} className="px-7 bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20">
                            {isSaving ? 'Processing...' : 'Save Shift Schedule'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <DeleteModal
                isOpen={deleteModalOpen}
                setIsOpen={setDeleteModalOpen}
                onConfirm={executeDelete}
                isLoading={isDeleting}
                title="Delete Working Shift"
                message="Are you sure you want to delete this working shift? This action cannot be undone."
            />
        </div>
    );
};

export default WorkingShiftIndex;
