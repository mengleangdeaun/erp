import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { ScrollArea } from '../../../components/ui/scroll-area';   
import { Checkbox } from '../../../components/ui/checkbox';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import DeleteModal from '../../../components/DeleteModal';
import ActionButtons from '../../../components/ui/ActionButtons';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { IconClipboardHeart } from '@tabler/icons-react';

const LeavePolicyIndex = () => {
    const [leavePolicies, setLeavePolicies] = useState<any[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingLeavePolicy, setEditingLeavePolicy] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Filter & Sort & Pagination state
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const initialFormState = {
        name: '',
        description: '',
        leave_type_id: '',
        accrual_type: 'yearly',
        accrual_rate: 0,
        carry_forward_limit: 0,
        min_days_per_app: 1,
        max_days_per_app: 0,
        require_approval: true,
        status: true,
    };

    const [formData, setFormData] = useState(initialFormState);

    // Helper to get cookie
    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const fetchLeavePolicies = () => {
        setLoading(true);
        fetch('/api/hr/leave-policies', {
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
                    setLeavePolicies(data);
                } else {
                    setLeavePolicies([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLeavePolicies([]);
                setLoading(false);
            });
    };

    const fetchLeaveTypes = () => {
        fetch('/api/hr/leave-types', {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
            },
            credentials: 'include',
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setLeaveTypes(data);
                }
            })
            .catch(err => console.error(err));
    };

    useEffect(() => {
        fetchLeavePolicies();
        fetchLeaveTypes();
    }, []);

    const handleCreate = () => {
        setEditingLeavePolicy(null);
        setFormData(initialFormState);
        setModalOpen(true);
    };

    const handleEdit = (policy: any) => {
        setEditingLeavePolicy(policy);
        setFormData({
            name: policy.name,
            description: policy.description || '',
            leave_type_id: String(policy.leave_type_id),
            accrual_type: policy.accrual_type,
            accrual_rate: policy.accrual_rate,
            carry_forward_limit: policy.carry_forward_limit,
            min_days_per_app: policy.min_days_per_app,
            max_days_per_app: policy.max_days_per_app,
            require_approval: policy.require_approval == 1 || policy.require_approval === true,
            status: policy.status == 1 || policy.status === true,
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
            const response = await fetch(`/api/hr/leave-policies/${itemToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
                },
                credentials: 'include',
            });

            if (response.ok) {
                toast.success('Leave Policy deleted successfully');
                fetchLeavePolicies();
            } else {
                toast.error('Failed to delete leave policy');
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        let val: any = value;
        if (type === 'checkbox') {
            val = (e.target as HTMLInputElement).checked;
        } else if (type === 'number') {
            val = parseFloat(value) || 0;
        }

        setFormData({ ...formData, [name]: val });
    };

    const handleSelectChange = (value: string, name: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const url = editingLeavePolicy ? `/api/hr/leave-policies/${editingLeavePolicy.id}` : '/api/hr/leave-policies';
        const method = editingLeavePolicy ? 'PUT' : 'POST';

        try {
            // Ensure CSRF cookie is set
            await fetch('/sanctum/csrf-cookie');

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
                },
                credentials: 'include',
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(`Leave Policy ${editingLeavePolicy ? 'updated' : 'created'} successfully`);
                setModalOpen(false);
                fetchLeavePolicies();
            } else {
                if (response.status === 401) {
                    window.location.href = '/login';
                }
                toast.error(data.message || `Failed to ${editingLeavePolicy ? 'update' : 'create'} leave policy`);

                // Show validation errors if present
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
    const filteredAndSortedLeavePolicies = useMemo(() => {
        let result = [...leavePolicies];

        // Search
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(policy =>
                policy.name?.toLowerCase().includes(q) ||
                policy.leave_type?.name?.toLowerCase().includes(q)
            );
        }

        // Sort
        result.sort((a, b) => {
            let valA = sortBy === 'leave_type' ? (a.leave_type?.name || '') : (a[sortBy] || '');
            let valB = sortBy === 'leave_type' ? (b.leave_type?.name || '') : (b[sortBy] || '');
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [leavePolicies, search, sortBy, sortDirection]);

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedLeavePolicies.length / itemsPerPage);
    const paginatedLeavePolicies = filteredAndSortedLeavePolicies.slice(
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
                icon={<IconClipboardHeart className="w-6 h-6 text-primary" />}
                title="Leave Policies"
                description="Manage leave rules, limits, and approval policies"
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onAdd={handleCreate}
                addLabel="Add Policy"
                onRefresh={fetchLeavePolicies}
                hasActiveFilters={sortBy !== 'name' || sortDirection !== 'asc'}
                onClearFilters={() => {
                    setSortBy('name');
                    setSortDirection('asc');
                }}
            />

            {loading ? (
                <TableSkeleton columns={7} rows={5} />
            ) : leavePolicies.length === 0 ? (
                <EmptyState
                    title="No Leave Policies Found"
                    description="Get started by creating your first leave policy."
                    actionLabel="Add Leave Policy"
                    onAction={handleCreate}
                />
            ) : filteredAndSortedLeavePolicies.length === 0 ? (
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
                                <SortableHeader label="Policy Name" value="name" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Leave Type" value="leave_type" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Accrual" value="accrual_type" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Rate" value="accrual_rate" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Limit" value="max_days_per_app" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Status" value="status" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <th className="text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedLeavePolicies.map((policy: any) => (
                                <tr key={policy.id}>
                                    <td className="whitespace-nowrap font-medium">{policy.name}</td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            {policy.leave_type && (
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: policy.leave_type?.color || '#000000' }}></div>
                                            )}
                                            {policy.leave_type?.name || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="capitalize">{policy.accrual_type}</td>
                                    <td>{parseFloat(policy.accrual_rate)} days</td>
                                    <td>{policy.max_days_per_app > 0 ? `${policy.max_days_per_app} max` : 'No Limit'}</td>
                                    <td>
                                        <span className={`badge ${policy.status ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                                            {policy.status ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <ActionButtons
                                            variant="inline"
                                            size="sm"
                                            skipDeleteConfirm={true}
                                            onEdit={() => handleEdit(policy)}
                                            onDelete={() => confirmDelete(policy.id)}
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
                            totalItems={filteredAndSortedLeavePolicies.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </div>
            )}


<Dialog open={modalOpen} onOpenChange={setModalOpen}>
  <DialogContent className="sm:max-w-[700px] w-[95vw] h-[90vh] flex flex-col p-0 border-0 shadow-2xl rounded-2xl overflow-hidden">
    {/* Header */}
    <div className="shrink-0 bg-gradient-to-r from-primary/10 to-transparent px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
      <div className="bg-primary/20 p-3 rounded-2xl shadow-sm">
        <IconClipboardHeart className="text-primary w-7 h-7" />
      </div>
      <div>
        <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
          {editingLeavePolicy ? 'Edit Leave Policy' : 'Create New Leave Policy'}
        </DialogTitle>
        <p className="text-sm text-gray-500 mt-1">
          {editingLeavePolicy
            ? 'Update the leave policy details below.'
            : 'Fill in the details to create a new leave policy.'}
        </p>
      </div>
    </div>

    <ScrollArea className="flex-1 min-h-0">
      <form id="leave-policy-form" onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Policy Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g. Standard Annual Leave"
              />
            </div>
            <div className="space-y-0">
              <Label htmlFor="leave_type_id" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Leave Type <span className="text-red-500">*</span>
              </Label>
              <SearchableSelect
                options={leaveTypes.map((type: any) => ({
                  value: String(type.id),
                  label: type.name,
                  color: type.color || '#000000'
                }))}
                value={formData.leave_type_id}
                onChange={(val) => handleSelectChange(String(val), 'leave_type_id')}
                placeholder="Select Leave Type"
                searchPlaceholder="Search leave types..."
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              placeholder="Describe the policy details and conditions..."
              className="bg-gray-50 dark:bg-gray-800/50 resize-none"
            />
          </div>
        </div>

        {/* Accrual Settings */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Accrual Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <Label htmlFor="accrual_type" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Accrual Type
              </Label>
              <Select
                onValueChange={(value) => handleSelectChange(value, 'accrual_type')}
                value={formData.accrual_type}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="accrual_rate" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Accrual Rate (Days) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="accrual_rate"
                name="accrual_rate"
                type="number"
                step="0.01"
                value={formData.accrual_rate}
                onChange={handleChange}
                required
                min="0"
                placeholder="e.g. 1.5"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="carry_forward_limit" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Carry Forward Limit
              </Label>
              <Input
                id="carry_forward_limit"
                name="carry_forward_limit"
                type="number"
                value={formData.carry_forward_limit}
                onChange={handleChange}
                min="0"
                placeholder="e.g. 5"
              />
            </div>
          </div>
        </div>

        {/* Application Limits */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Application Limits
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label htmlFor="min_days_per_app" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Min. Days Per Application
              </Label>
              <Input
                id="min_days_per_app"
                name="min_days_per_app"
                type="number"
                value={formData.min_days_per_app}
                onChange={handleChange}
                min="0"
                placeholder="e.g. 0.5"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="max_days_per_app" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Max. Days Per Application
              </Label>
              <Input
                id="max_days_per_app"
                name="max_days_per_app"
                type="number"
                value={formData.max_days_per_app}
                onChange={handleChange}
                min="0"
                placeholder="e.g. 10"
              />
              <p className="text-xs text-gray-500 mt-1">0 means unlimited</p>
            </div>
          </div>
        </div>

        {/* Additional Options */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Additional Options
          </h3>
          <div className="grid grid-cols-2 gap-5 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/30">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                name="require_approval"
                checked={formData.require_approval}
                onCheckedChange={(checked) => {
                  setFormData(prev => ({ ...prev, require_approval: checked }));
                }}
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                Requires Approval
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                name="status"
                checked={formData.status}
                onCheckedChange={(checked) => {
                  setFormData(prev => ({ ...prev, status: checked }));
                }}
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                Status Active
              </span>
            </label>
          </div>
        </div>
      </form>
    </ScrollArea>

    {/* Sticky Footer */}
    <div className="shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-background">
      <Button
        type="button"
        variant="ghost"
        className="px-5"
        onClick={() => setModalOpen(false)}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        form="leave-policy-form"
        disabled={isSaving}
        className="px-7 bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
      >
        {isSaving ? 'Saving...' : (editingLeavePolicy ? 'Save Changes' : 'Create Policy')}
      </Button>
    </div>
  </DialogContent>
</Dialog>

            <DeleteModal
                isOpen={deleteModalOpen}
                setIsOpen={setDeleteModalOpen}
                onConfirm={executeDelete}
                isLoading={isDeleting}
                title="Delete Leave Policy"
                message="Are you sure you want to delete this leave policy? This action cannot be undone."
            />

        </div>
    );
};

export default LeavePolicyIndex;
