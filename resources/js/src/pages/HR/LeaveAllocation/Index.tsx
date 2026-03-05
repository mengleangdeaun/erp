import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { DatePicker } from '../../../components/ui/date-picker';
import { Button } from '../../../components/ui/button';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import DeleteModal from '../../../components/DeleteModal';
import ActionButtons from '../../../components/ui/ActionButtons';
import { X, Users, Building, Building2 } from 'lucide-react';
import dayjs from 'dayjs';

const LeaveAllocationIndex = () => {
    const [allocations, setAllocations] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [policies, setPolicies] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingAllocation, setEditingAllocation] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Filter & Sort & Pagination state
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('employee');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const initialFormState = {
        employee_ids: [] as string[],
        leave_policy_id: '',
        effective_date: dayjs().format('YYYY-MM-DD'),
        expiration_date: '',
        is_active: true,
        approved_by: '',
    };

    const [formData, setFormData] = useState(initialFormState);

    // Helper to get cookie
    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const fetchAllocations = () => {
        setLoading(true);
        fetch('/api/hr/leave-allocations', {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
            },
            credentials: 'include',
        })
            .then(res => {
                if (res.status === 401) {
                    window.location.href = 'auth/login';
                    return null;
                }
                return res.json();
            })
            .then(data => {
                if (!data) return;
                if (Array.isArray(data)) {
                    setAllocations(data);
                } else {
                    setAllocations([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setAllocations([]);
                setLoading(false);
            });
    };

    const fetchDropdownData = () => {
        // Employees
        fetch('/api/hr/employees', {
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' },
            credentials: 'include',
        })
            .then(res => res.json())
            .then(data => setEmployees(Array.isArray(data) ? data : (data.data || [])))
            .catch(err => console.error(err));

        // Policies
        fetch('/api/hr/leave-policies', {
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' },
            credentials: 'include',
        })
            .then(res => res.json())
            .then(data => setPolicies(Array.isArray(data) ? data : []))
            .catch(err => console.error(err));

        // Departments
        fetch('/api/hr/departments', {
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' },
            credentials: 'include',
        })
            .then(res => res.json())
            .then(data => setDepartments(Array.isArray(data) ? data : (data.data || [])))
            .catch(err => console.error(err));

        // Branches
        fetch('/api/hr/branches', {
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' },
            credentials: 'include',
        })
            .then(res => res.json())
            .then(data => setBranches(Array.isArray(data) ? data : (data.data || [])))
            .catch(err => console.error(err));
    };

    useEffect(() => {
        fetchAllocations();
        fetchDropdownData();
    }, []);

    const handleCreate = () => {
        setEditingAllocation(null);
        setFormData(initialFormState);
        setModalOpen(true);
    };

    const handleEdit = (allocation: any) => {
        setEditingAllocation(allocation);
        setFormData({
            employee_ids: [String(allocation.employee_id)],
            leave_policy_id: String(allocation.leave_policy_id),
            effective_date: allocation.effective_date ? dayjs(allocation.effective_date).format('YYYY-MM-DD') : '',
            expiration_date: allocation.expiration_date ? dayjs(allocation.expiration_date).format('YYYY-MM-DD') : '',
            is_active: allocation.is_active == 1 || allocation.is_active === true,
            approved_by: allocation.approved_by ? String(allocation.approved_by) : '',
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
            const response = await fetch(`/api/hr/leave-allocations/${itemToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
                },
                credentials: 'include',
            });

            if (response.ok) {
                toast.success('Leave Allocation deleted successfully');
                fetchAllocations();
            } else {
                toast.error('Failed to delete leave allocation');
            }
        } catch (error) {
            console.error(error);
            toast.error('An error occurred');
        } finally {
            setIsDeleting(false);
            setDeleteModalOpen(false);
            setItemToDelete(null);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;

        let val: any = value;
        if (type === 'checkbox') {
            val = (e.target as HTMLInputElement).checked;
        }

        setFormData({ ...formData, [name]: val });
    };

    const handleSelectChange = (value: string, name: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEmployeeAdd = (val: string) => {
        if (!val) return;
        setFormData(prev => {
            if (prev.employee_ids.includes(val)) return prev;
            return { ...prev, employee_ids: [...prev.employee_ids, val] };
        });
    };

    const handleEmployeeRemove = (idToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            employee_ids: prev.employee_ids.filter(id => id !== idToRemove)
        }));
    };

    const handleQuickAssign = (type: 'all' | 'dept' | 'branch', id?: string | number) => {
        let targets: any[] = [];
        if (type === 'all') {
            targets = employees;
        } else if (type === 'dept') {
            targets = employees.filter(emp => String(emp.department_id) === String(id));
        } else if (type === 'branch') {
            targets = employees.filter(emp => String(emp.branch_id) === String(id));
        }

        const newIds = targets.map(emp => String(emp.id));

        setFormData(prev => {
            const combined = new Set([...prev.employee_ids, ...newIds]);
            return { ...prev, employee_ids: Array.from(combined) };
        });
    };

    const handleDateChange = (date: Date | undefined, name: string) => {
        setFormData(prev => ({ ...prev, [name]: date ? dayjs(date).format('YYYY-MM-DD') : '' }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const url = editingAllocation ? `/api/hr/leave-allocations/${editingAllocation.id}` : '/api/hr/leave-allocations';
        const method = editingAllocation ? 'PUT' : 'POST';

        // Clean up empty expiration date to send as null
        const payload: any = { ...formData };
        if (!payload.expiration_date) delete payload.expiration_date;
        if (!payload.approved_by) delete payload.approved_by;

        // If editing, map it back to singular payload if API expects update on exactly 1 ID.
        if (editingAllocation) {
            payload.employee_id = payload.employee_ids[0];
        }

        try {
            await fetch('/sanctum/csrf-cookie');
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
                },
                credentials: 'include',
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(data.message || `Leave Allocation ${editingAllocation ? 'updated' : 'created'} successfully`);
                setModalOpen(false);
                fetchAllocations();
            } else {
                if (response.status === 401) {
                    window.location.href = '/login';
                }
                toast.error(data.message || 'Failed to save allocation');
                if (data.errors) {
                    Object.values(data.errors).forEach((errArray: any) => {
                        toast.error(errArray[0]);
                    });
                }
            }
        } catch (error) {
            console.error(error);
            toast.error('An error occurred');
        } finally {
            setIsSaving(false);
        }
    };

    // Derived state for table
    const filteredAndSortedAllocations = useMemo(() => {
        let result = [...allocations];

        // Search
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(a =>
                a.employee?.full_name?.toLowerCase().includes(q) ||
                a.leave_policy?.name?.toLowerCase().includes(q)
            );
        }

        // Sort
        result.sort((a, b) => {
            let valA, valB;
            if (sortBy === 'employee') {
                valA = a.employee?.full_name || '';
                valB = b.employee?.full_name || '';
            } else if (sortBy === 'policy') {
                valA = a.leave_policy?.name || '';
                valB = b.leave_policy?.name || '';
            } else {
                valA = a[sortBy] || '';
                valB = b[sortBy] || '';
            }

            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [allocations, search, sortBy, sortDirection]);

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedAllocations.length / itemsPerPage);
    const paginatedAllocations = filteredAndSortedAllocations.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset page if search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    return (
        <div>
            <FilterBar
                title="Leave Allocations"
                description="Assign leave policies to employees"
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onAdd={handleCreate}
                addLabel="Assign Leave Policy"
                onRefresh={fetchAllocations}
                hasActiveFilters={sortBy !== 'employee' || sortDirection !== 'asc'}
                onClearFilters={() => {
                    setSortBy('employee');
                    setSortDirection('asc');
                }}
            />

            {loading ? (
                <TableSkeleton columns={6} rows={5} />
            ) : allocations.length === 0 ? (
                <EmptyState
                    title="No Allocations Found"
                    description="Get started by assigning a leave policy to an employee."
                    actionLabel="Assign Leave Policy"
                    onAction={handleCreate}
                />
            ) : filteredAndSortedAllocations.length === 0 ? (
                <EmptyState
                    isSearch
                    searchTerm={search}
                    onClearFilter={() => {
                        setSearch('');
                        setSortBy('employee');
                        setSortDirection('asc');
                    }}
                />
            ) : (
                <div className="table-responsive rounded-lg border">
                    <table className="table-hover table-striped w-full table">
                        <thead>
                            <tr>
                                <SortableHeader label="Employee" value="employee" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Policy" value="policy" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Effective Date" value="effective_date" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Mng/Approver" value="approved_by" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Status" value="is_active" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <th className="text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedAllocations.map((allocation: any) => (
                                <tr key={allocation.id}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            {allocation.employee?.profile_image ? (
                                                <img src={allocation.employee.profile_image.startsWith('http') ? allocation.employee.profile_image : `/storage/${allocation.employee.profile_image}`} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-500">
                                                    {allocation.employee?.full_name?.charAt(0) || '?'}
                                                </div>
                                            )}
                                            <div className="font-semibold text-gray-800 dark:text-gray-200">{allocation.employee?.full_name}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: allocation.leave_policy?.leave_type?.color || '#000' }}></div>
                                            <span className="font-medium">{allocation.leave_policy?.name}</span>
                                        </div>
                                    </td>
                                    <td>{dayjs(allocation.effective_date).format('MMM DD, YYYY')}</td>
                                    <td>{allocation.approver?.full_name ? <span className="text-sm">{allocation.approver.full_name}</span> : <span className="text-gray-400 text-xs italic">N/A</span>}</td>
                                    <td>
                                        <span className={`badge ${allocation.is_active ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                                            {allocation.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <ActionButtons
                                            variant='rounded'
                                            skipDeleteConfirm={true}
                                            onEdit={() => handleEdit(allocation)}
                                            onDelete={() => confirmDelete(allocation.id)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredAndSortedAllocations.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingAllocation ? 'Edit Allocation' : 'Assign Leave Policy'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="mt-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Column (Employee Selection) */}
                            <div className="space-y-4">
                                {!editingAllocation ? (
                                    <>
                                        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
                                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                                                <Users className="w-4 h-4" /> Build Roster
                                            </h3>

                                            <div className="space-y-4">
                                                <div>
                                                    <label htmlFor="individual_search" className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">1. Search Individuals</label>
                                                    <SearchableSelect
                                                        options={employees.map((emp: any) => ({ value: String(emp.id), label: emp.full_name }))}
                                                        value=""
                                                        onChange={(val) => handleEmployeeAdd(String(val))}
                                                        placeholder="Search & add individual..."
                                                        searchPlaceholder="Search employee name..."
                                                    />
                                                </div>

                                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">2. Quick Add Departments & Branches</label>
                                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                                        <SearchableSelect
                                                            options={departments.map((dept: any) => ({ value: String(dept.id), label: dept.name }))}
                                                            value=""
                                                            onChange={(val) => handleQuickAssign('dept', val)}
                                                            placeholder="Add Department..."
                                                        />
                                                        <SearchableSelect
                                                            options={branches.map((branch: any) => ({ value: String(branch.id), label: branch.name }))}
                                                            value=""
                                                            onChange={(val) => handleQuickAssign('branch', val)}
                                                            placeholder="Add Branch..."
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button type="button" variant="outline" size="sm" onClick={() => handleQuickAssign('all')} className="flex-1 border-primary/20 hover:bg-primary/5 text-primary">
                                                            Select All Staff
                                                        </Button>
                                                        <Button type="button" variant="soft-destructive" size="sm" onClick={() => setFormData(prev => ({ ...prev, employee_ids: [] }))} className="w-24">
                                                            Clear
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="font-semibold text-gray-800 dark:text-gray-200 flex justify-between items-end">
                                                <span>Selected Employees <span className="text-red-500">*</span></span>
                                                <span className="text-xs font-normal text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{formData.employee_ids.length} selected</span>
                                            </label>
                                            <div className="flex flex-wrap gap-2 mt-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg  overflow-y-auto bg-white dark:bg-black w-full">
                                                {formData.employee_ids.length === 0 ? (
                                                    <div className="w-full flex flex-col items-center justify-center text-sm text-gray-400 py-6">
                                                        <Users className="w-8 h-8 opacity-20 mb-2" />
                                                        <p>No employees selected yet</p>
                                                    </div>
                                                ) : (
                                                    formData.employee_ids.map(id => {
                                                        const emp = employees.find(e => String(e.id) === id);
                                                        return (
                                                            <div key={id} className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1.5 rounded-md text-sm border border-primary/20">
                                                                <span className="truncate max-w-[120px]">{emp ? emp.full_name : 'Unknown Employee'}</span>
                                                                <button type="button" onClick={() => handleEmployeeRemove(id)} className="hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 text-gray-500 rounded p-0.5 transition-colors">
                                                                    <X className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-lg border border-gray-100 dark:border-gray-800 h-full flex flex-col justify-center">
                                        <div className="text-center mb-4">
                                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                                                <Users className="w-8 h-8 text-primary" />
                                            </div>
                                            <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">Editing Single Allocation</h3>
                                            <p className="text-sm text-gray-500 mt-1">Bulk editing is not supported. Use creation for bulk assign.</p>
                                        </div>
                                        <div className="mt-2 text-center">
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Target Employee <span className="text-red-500">*</span></label>
                                            <div className="mt-2 p-3 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-md font-medium shadow-sm inline-block min-w-[200px]">
                                                {employees.find(e => String(e.id) === formData.employee_ids[0])?.full_name || 'Loading...'}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Column (Allocation Settings) */}
                            <div className="space-y-5 bg-white dark:bg-black p-5 rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
                               
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-800 pb-3">Policy Settings</h3>

                                <div>
                                    <label htmlFor="leave_policy_id" className="text-sm font-medium">Leave Policy Required <span className="text-red-500">*</span></label>
                                    <div className="mt-1">
                                        <SearchableSelect
                                            options={policies.map((policy: any) => ({ value: String(policy.id), label: policy.name }))}
                                            value={formData.leave_policy_id}
                                            onChange={(val) => handleSelectChange(String(val), 'leave_policy_id')}
                                            placeholder="Select Leave Policy"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="effective_date" className="text-sm font-medium">Effective Date <span className="text-red-500">*</span></label>
                                        <div className="mt-1">
                                            <DatePicker
                                                value={formData.effective_date}
                                                onChange={(date) => handleDateChange(date, 'effective_date')}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="expiration_date" className="text-sm font-medium">Expiration <span className="text-gray-400 font-normal">(Optional)</span></label>
                                        <div className="mt-1">
                                            <DatePicker
                                                value={formData.expiration_date}
                                                onChange={(date) => handleDateChange(date, 'expiration_date')}
                                                placeholder="No expiration"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="approved_by" className="text-sm font-medium">Specific Approver <span className="text-gray-400 font-normal">(Optional)</span></label>
                                    <div className="mt-1">
                                        <SearchableSelect
                                            options={employees.map((emp: any) => ({ value: String(emp.id), label: emp.full_name }))}
                                            value={formData.approved_by}
                                            onChange={(val) => handleSelectChange(String(val), 'approved_by')}
                                            placeholder="Select manager (default: HR)"
                                            searchPlaceholder="Search approver name..."
                                        />
                                    </div>
                                </div>

                                <div className="mt-6 p-4 border border-primary/20 bg-primary/5 rounded-md">
                                    <label className="flex items-center cursor-pointer">
                                        <input type="checkbox" className="form-checkbox text-primary rounded-sm focus:ring-primary" name="is_active" checked={formData.is_active} onChange={handleChange} />
                                        <span className="text-gray-800 dark:text-gray-200 font-medium ml-2">Allocation is Active</span>
                                    </label>
                                    <p className="text-xs text-gray-500 mt-1.5 ml-7">Inactive allocations cannot be used to request leaves.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
                            <Button type="button" variant='outline' size='sm' onClick={() => setModalOpen(false)} >Cancel</Button>
                            <Button type="submit" size='sm' disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save Allocation'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <DeleteModal
                isOpen={deleteModalOpen}
                setIsOpen={setDeleteModalOpen}
                onConfirm={executeDelete}
                isLoading={isDeleting}
                title="Delete Leave Allocation"
                message="Are you sure you want to delete this leave allocation? This action cannot be undone."
            />
        </div>
    );
};

export default LeaveAllocationIndex;
