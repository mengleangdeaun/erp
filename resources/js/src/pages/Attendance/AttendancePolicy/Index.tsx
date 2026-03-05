import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import DeleteModal from '../../../components/DeleteModal';
import ActionButtons from '../../../components/ui/ActionButtons';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { IconShieldCheck } from '@tabler/icons-react';

const AttendancePolicyIndex = () => {
    const [policies, setPolicies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState<any>(null);
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
        late_tolerance_minutes: 0,
        early_departure_tolerance_minutes: 0,
        overtime_minimum_minutes: 0,
        description: '',
        status: 'active',
    };

    const [formData, setFormData] = useState(initialFormState);

    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const fetchPolicies = () => {
        setLoading(true);
        fetch('/api/attendance/attendance-policies', {
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' },
            credentials: 'include',
        })
            .then(res => {
                if (res.status === 401) { window.location.href = '/login'; return null; }
                return res.json();
            })
            .then(data => {
                if (!data) return;
                if (Array.isArray(data)) setPolicies(data);
                else setPolicies([]);
                setLoading(false);
            })
            .catch(err => { console.error(err); setPolicies([]); setLoading(false); });
    };

    useEffect(() => { fetchPolicies(); }, []);

    const handleCreate = () => { setEditingPolicy(null); setFormData(initialFormState); setModalOpen(true); };

    const handleEdit = (policy: any) => {
        setEditingPolicy(policy);
        setFormData({
            name: policy.name,
            late_tolerance_minutes: policy.late_tolerance_minutes || 0,
            early_departure_tolerance_minutes: policy.early_departure_tolerance_minutes || 0,
            overtime_minimum_minutes: policy.overtime_minimum_minutes || 0,
            description: policy.description || '',
            status: policy.status,
        });
        setModalOpen(true);
    };

    const confirmDelete = (id: number) => { setItemToDelete(id); setDeleteModalOpen(true); };

    const executeDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/attendance/attendance-policies/${itemToDelete}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' },
                credentials: 'include',
            });
            if (response.ok) { toast.success('Policy deleted successfully'); fetchPolicies(); }
            else toast.error('Failed to delete policy');
        } catch (error) { toast.error('An error occurred'); }
        finally { setIsDeleting(false); setDeleteModalOpen(false); setItemToDelete(null); }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? (value === '' ? 0 : Number(value)) : value }));
    };

    const handleSelectChange = (value: string, name: string) => setFormData(prev => ({ ...prev, [name]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const url = editingPolicy ? `/api/attendance/attendance-policies/${editingPolicy.id}` : '/api/attendance/attendance-policies';
        const method = editingPolicy ? 'PUT' : 'POST';
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
                toast.success(`Policy ${editingPolicy ? 'updated' : 'created'} successfully`);
                setModalOpen(false);
                fetchPolicies();
            } else {
                if (response.status === 401) window.location.href = '/login';
                const msg = data.errors ? Object.values(data.errors).flat().join(', ') : data.message || 'Failed to save policy';
                toast.error(msg);
            }
        } catch (error) { toast.error('An error occurred while saving'); }
        finally { setIsSaving(false); }
    };

    const handleSort = (column: string) => {
        if (sortBy === column) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        else { setSortBy(column); setSortDirection('asc'); }
    };

    const filteredPolicies = useMemo(() => {
        if (!search) return policies;
        const lowerSearch = search.toLowerCase();
        return policies.filter(policy =>
            policy.name.toLowerCase().includes(lowerSearch) ||
            (policy.description && policy.description.toLowerCase().includes(lowerSearch))
        );
    }, [policies, search]);

    const sortedPolicies = useMemo(() => {
        return [...filteredPolicies].sort((a, b) => {
            let aVal = a[sortBy]; let bVal = b[sortBy];
            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();
            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredPolicies, sortBy, sortDirection]);

    const paginatedPolicies = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return sortedPolicies.slice(start, start + itemsPerPage);
    }, [sortedPolicies, currentPage, itemsPerPage]);

    return (
        <div>
            <FilterBar
                title="Attendance Policies"
                description="Configure complex rules like grace periods and overtime"
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={(val: number) => { setItemsPerPage(val); setCurrentPage(1); }}
                onAdd={handleCreate}
                addLabel="Add New Policy"
                onRefresh={fetchPolicies}
            />

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <TableSkeleton columns={6} rows={5} />
                    ) : sortedPolicies.length === 0 ? (
                        <EmptyState
                            isSearch={!!search}
                            searchTerm={search}
                            onClearFilter={() => setSearch('')}
                            title="No attendance policies yet"
                            description="Create your first attendance policy to get started."
                            actionLabel="Add New Policy"
                            onAction={handleCreate}
                        />
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 dark:bg-gray-800 border-y border-gray-100 dark:border-gray-700">
                                <tr>
                                    <SortableHeader label="Name" value="name" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <th className="px-6 py-4 font-medium text-center">Late Tolerance</th>
                                    <th className="px-6 py-4 font-medium text-center">Early Departure Tolerance</th>
                                    <th className="px-6 py-4 font-medium text-center">Min. Overtime</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {paginatedPolicies.map((policy: any) => (
                                    <tr key={policy.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{policy.name}</td>
                                        <td className="px-6 py-4 text-center">
                                            {policy.late_tolerance_minutes > 0 ? (
                                                <span className="text-orange-600 dark:text-orange-400 font-medium">{policy.late_tolerance_minutes} mins</span>
                                            ) : <span className="text-gray-400">0</span>}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {policy.early_departure_tolerance_minutes > 0 ? (
                                                <span className="text-blue-600 dark:text-blue-400 font-medium">{policy.early_departure_tolerance_minutes} mins</span>
                                            ) : <span className="text-gray-400">0</span>}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {policy.overtime_minimum_minutes > 0 ? (
                                                <span className="text-purple-600 dark:text-purple-400 font-medium">{policy.overtime_minimum_minutes} mins</span>
                                            ) : <span className="text-gray-400">0</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${policy.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                {policy.status === 'active' ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <ActionButtons skipDeleteConfirm={true} size="sm" onEdit={() => handleEdit(policy)} onDelete={() => confirmDelete(policy.id)} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {!loading && sortedPolicies.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(sortedPolicies.length / itemsPerPage)}
                        totalItems={sortedPolicies.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                )}
            </div>

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[600px] w-[95vw] h-[90vh] flex flex-col p-0 border-0 shadow-2xl rounded-2xl overflow-hidden">
                    {/* Header */}
                    <div className="shrink-0 bg-gradient-to-r from-primary/10 to-transparent px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
                        <div className="bg-primary/20 p-3 rounded-2xl shadow-sm">
                            <IconShieldCheck className="text-primary w-7 h-7" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingPolicy ? 'Edit Attendance Policy' : 'Create Attendance Policy'}
                            </DialogTitle>
                            <p className="text-sm text-gray-500 mt-1">
                                {editingPolicy ? 'Update the details for this policy.' : 'Configure grace periods and overtime rules.'}
                            </p>
                        </div>
                    </div>

                    <ScrollArea className="flex-1 min-h-0">
                        <form id="policy-form" onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Policy Name <span className="text-red-500">*</span></label>
                                <Input name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Standard Policy" required className="bg-gray-50 dark:bg-gray-800/50" />
                            </div>

                            <div className="p-5 border rounded-xl bg-gray-50/50 dark:bg-gray-800/20 space-y-5">
                                <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Tolerance Rules</h4>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium block">Late Tolerance (Minutes)</label>
                                            <Input type="number" min="0" name="late_tolerance_minutes" value={formData.late_tolerance_minutes} onChange={handleChange} className="bg-white dark:bg-gray-900" />
                                            <p className="text-[11px] text-gray-500">Grace period before being marked late.</p>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium block">Early Departure (Minutes)</label>
                                            <Input type="number" min="0" name="early_departure_tolerance_minutes" value={formData.early_departure_tolerance_minutes} onChange={handleChange} className="bg-white dark:bg-gray-900" />
                                            <p className="text-[11px] text-gray-500">Permitted early leave time.</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium block">Minimum Overtime (Minutes)</label>
                                        <Input type="number" min="0" name="overtime_minimum_minutes" value={formData.overtime_minimum_minutes} onChange={handleChange} className="bg-white dark:bg-gray-900" />
                                        <p className="text-[11px] text-gray-500">Minimum extra minutes worked to be considered overtime.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Description</label>
                                <Textarea name="description" value={formData.description} onChange={handleChange} placeholder="Details about this policy..." rows={3} className="bg-gray-50 dark:bg-gray-800/50 resize-none" />
                            </div>
                        </form>
                    </ScrollArea>

                    {/* Sticky Footer */}
                    <div className="shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-background">
                        <Button type="button" variant="ghost" className="px-5" onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button type="submit" form="policy-form" disabled={isSaving} className="px-7 bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20">
                            {isSaving ? 'Processing...' : 'Save Policy'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <DeleteModal
                isOpen={deleteModalOpen}
                setIsOpen={setDeleteModalOpen}
                onConfirm={executeDelete}
                isLoading={isDeleting}
                title="Delete Attendance Policy"
                message="Are you sure you want to delete this policy? This action cannot be undone."
            />
        </div>
    );
};

export default AttendancePolicyIndex;
