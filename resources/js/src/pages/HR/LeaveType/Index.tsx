import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Checkbox } from '../../../components/ui/checkbox';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import DeleteModal from '../../../components/DeleteModal';
import ActionButtons from '../../../components/ui/ActionButtons';
import { Textarea } from '../../../components/ui/textarea';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { IconClipboardHeart } from '@tabler/icons-react';

const LeaveTypeIndex = () => {
    const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingLeaveType, setEditingLeaveType] = useState<any>(null);
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
        max_per_year: 0,
        is_paid: false,
        color: '#000000',
        status: true,
    };

    const [formData, setFormData] = useState(initialFormState);

    // Helper to get cookie
    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const fetchLeaveTypes = () => {
        setLoading(true);
        fetch('/api/hr/leave-types', {
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
                    setLeaveTypes(data);
                } else {
                    setLeaveTypes([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLeaveTypes([]);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchLeaveTypes();
    }, []);

    const handleCreate = () => {
        setEditingLeaveType(null);
        setFormData(initialFormState);
        setModalOpen(true);
    };

    const handleEdit = (type: any) => {
        setEditingLeaveType(type);
        setFormData({
            name: type.name,
            description: type.description || '',
            max_per_year: type.max_per_year || 0,
            is_paid: type.is_paid == 1 || type.is_paid === true,
            color: type.color || '#000000',
            status: type.status == 1 || type.status === true,
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
            const response = await fetch(`/api/hr/leave-types/${itemToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
                },
                credentials: 'include',
            });

            if (response.ok) {
                toast.success('Leave Type deleted successfully');
                fetchLeaveTypes();
            } else {
                toast.error('Failed to delete leave type');
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
            val = parseInt(value) || 0;
        }

        setFormData({ ...formData, [name]: val });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const url = editingLeaveType ? `/api/hr/leave-types/${editingLeaveType.id}` : '/api/hr/leave-types';
        const method = editingLeaveType ? 'PUT' : 'POST';

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
                toast.success(`Leave Type ${editingLeaveType ? 'updated' : 'created'} successfully`);
                setModalOpen(false);
                fetchLeaveTypes();
            } else {
                if (response.status === 401) {
                    window.location.href = '/login';
                }
                toast.error(data.message || `Failed to ${editingLeaveType ? 'update' : 'create'} leave type`);

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
    const filteredAndSortedLeaveTypes = useMemo(() => {
        let result = [...leaveTypes];

        // Search
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(type =>
                type.name?.toLowerCase().includes(q)
            );
        }

        // Sort
        result.sort((a, b) => {
            let valA = a[sortBy] || '';
            let valB = b[sortBy] || '';
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [leaveTypes, search, sortBy, sortDirection]);

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedLeaveTypes.length / itemsPerPage);
    const paginatedLeaveTypes = filteredAndSortedLeaveTypes.slice(
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
                title="Leave Types"
                description="Manage leave types available for employees"
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onAdd={handleCreate}
                addLabel="Add Leave Type"
                onRefresh={fetchLeaveTypes}
                hasActiveFilters={sortBy !== 'name' || sortDirection !== 'asc'}
                onClearFilters={() => {
                    setSortBy('name');
                    setSortDirection('asc');
                }}
            />

            {loading ? (
                <TableSkeleton columns={6} rows={5} />
            ) : leaveTypes.length === 0 ? (
                <EmptyState
                    title="No Leave Types Found"
                    description="Get started by creating your first leave type."
                    actionLabel="Add Leave Type"
                    onAction={handleCreate}
                />
            ) : filteredAndSortedLeaveTypes.length === 0 ? (
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
                                <SortableHeader label="Name" value="name" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Max/Year" value="max_per_year" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Paid" value="is_paid" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Color" value="color" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Status" value="status" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <th className="text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedLeaveTypes.map((type: any) => (
                                <tr key={type.id}>
                                    <td className="whitespace-nowrap font-medium">{type.name}</td>
                                    <td>{type.max_per_year || '-'}</td>
                                    <td>
                                        <Badge 
                                          size='sm'
                                          variant={type.is_paid ? 'success' : 'warning'}>
                                            {type.is_paid ? 'Paid' : 'Unpaid'}
                                        </Badge>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: type.color || '#000000' }}></div>
                                            <span>{type.color || 'None'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <Badge 
                                          size='sm'
                                          variant={type.status ? 'success' : 'destructive'}>
                                            {type.status ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </td>
                                    <td>
                                        <ActionButtons
                                            skipDeleteConfirm={true}
                                            onEdit={() => handleEdit(type)}
                                            onDelete={() => confirmDelete(type.id)}
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
                            totalItems={filteredAndSortedLeaveTypes.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </div>
            )}

<Dialog open={modalOpen} onOpenChange={setModalOpen}>
  <DialogContent className="sm:max-w-[700px] w-[95vw] flex flex-col p-0 border-0 shadow-2xl rounded-2xl overflow-hidden">
    {/* Header */}
    <div className="shrink-0 bg-gradient-to-r from-primary/10 to-transparent px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
      <div className="bg-primary/20 p-3 rounded-2xl shadow-sm">
        <IconClipboardHeart className="text-primary w-7 h-7" />
      </div>
      <div>
        <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
          {editingLeaveType ? 'Edit Leave Type' : 'Create New Leave Type'}
        </DialogTitle>
        <p className="text-sm text-gray-500 mt-1">
          {editingLeaveType
            ? 'Update the leave type details below.'
            : 'Fill in the details to add a new leave type.'}
        </p>
      </div>
    </div>

    <ScrollArea className="flex-1 min-h-0">
      <form id="leave-type-form" onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Basic Information
          </h3>
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Leave Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g. Annual Leave, Sick Leave"
            />
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
              rows={3}
              placeholder="Describe the leave type and any conditions..."
              className="bg-gray-50 dark:bg-gray-800/50 resize-none"
            />
          </div>
        </div>

        {/* Leave Settings */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Leave Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label htmlFor="max_per_year" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Max Days Per Year
              </Label>
              <Input
                id="max_per_year"
                name="max_per_year"
                type="number"
                value={formData.max_per_year}
                onChange={handleChange}
                min="0"
                placeholder="e.g. 20"
              />
              <p className="text-xs text-gray-500 mt-1">0 means unlimited</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="color" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Color Code
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="color"
                  name="color"
                  type="color"
                  className="h-10 w-10 p-1 border-0 rounded cursor-pointer"
                  value={formData.color}
                  onChange={handleChange}
                />
                <Input
                  type="text"
                  value={formData.color}
                  name="color"
                  onChange={handleChange}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="is_paid"
              name="is_paid"
              checked={formData.is_paid}
              onCheckedChange={(checked) => setFormData({ ...formData, is_paid: checked })}
            />
            <Label htmlFor="is_paid" className="text-sm mb-0 font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
              Is Paid Leave?
            </Label>
          </div>
        </div>

        {/* Status */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Status
          </h3>
          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="status"
              name="status"
              checked={formData.status}
              onCheckedChange={(checked) => setFormData({ ...formData, status: checked })}
            />
            <Label htmlFor="status" className="text-sm mb-0 font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
              Active?
            </Label>
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
        form="leave-type-form"
        disabled={isSaving}
        className="px-7 bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
      >
        {isSaving ? 'Saving...' : (editingLeaveType ? 'Save Changes' : 'Create Leave Type')}
      </Button>
    </div>
  </DialogContent>
</Dialog>

            <DeleteModal
                isOpen={deleteModalOpen}
                setIsOpen={setDeleteModalOpen}
                onConfirm={executeDelete}
                isLoading={isDeleting}
                title="Delete Leave Type"
                message="Are you sure you want to delete this leave type? This action cannot be undone."
            />
        </div>
    );
};

export default LeaveTypeIndex;
