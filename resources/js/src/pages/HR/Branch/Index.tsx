import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { ScrollArea } from '../../../components/ui/scroll-area';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import DeleteModal from '../../../components/DeleteModal';
import ActionButtons from '../../../components/ui/ActionButtons';
import { Badge } from '../../../components/ui/badge';
import { IconBuilding } from '@tabler/icons-react';

const BranchIndex = () => {
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState<any>(null);
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
        code: '',
        address: '',
        city: '',
        state: '',
        country: '',
        zip_code: '',
        phone: '',
        email: '',
        telegram_chat_id: '',
        telegram_topic_id: '',
        status: 'active',
    };

    const [formData, setFormData] = useState(initialFormState);

    const fetchBranches = () => {
        setLoading(true);
        fetch('/api/hr/branches', {
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
                if (!data) return; // Handle 401 redirect case
                if (Array.isArray(data)) {
                    setBranches(data);
                } else {
                    console.error('API response is not an array:', data);
                    setBranches([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Fetch error:', err);
                setBranches([]);
                setLoading(false);
            });
    };

    // Helper to get cookie
    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    useEffect(() => {
        fetchBranches();
    }, []);

    const handleCreate = () => {
        setEditingBranch(null);
        setFormData(initialFormState);
        setModalOpen(true);
    };

    const handleEdit = (branch: any) => {
        setEditingBranch(branch);
        setFormData({
            name: branch.name,
            code: branch.code,
            address: branch.address,
            city: branch.city,
            state: branch.state || '',
            country: branch.country,
            zip_code: branch.zip_code || '',
            phone: branch.phone || '',
            email: branch.email || '',
            status: branch.status,
            telegram_chat_id: branch.telegram_chat_id || '',
            telegram_topic_id: branch.telegram_topic_id || '',
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
            const response = await fetch(`/api/hr/branches/${itemToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
                },
                credentials: 'include',
            });

            if (response.ok) {
                toast.success('Branch deleted successfully');
                fetchBranches();
            } else {
                toast.error('Failed to delete branch');
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
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSelectChange = (value: string, name: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const url = editingBranch ? `/api/hr/branches/${editingBranch.id}` : '/api/hr/branches';
        const method = editingBranch ? 'PUT' : 'POST';

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
                toast.success(`Branch ${editingBranch ? 'updated' : 'created'} successfully`);
                setModalOpen(false);
                fetchBranches();
            } else {
                if (response.status === 401) {
                    window.location.href = 'auth/login';
                }
                toast.error(data.message || `Failed to ${editingBranch ? 'update' : 'create'} branch`);
            }
        } catch (error) {
            console.error(error);
            toast.error('An error occurred');
        } finally {
            setIsSaving(false);
        }
    };

    // Derived state for table
    const filteredAndSortedBranches = useMemo(() => {
        let result = [...branches];

        // Search
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(b =>
                b.name?.toLowerCase().includes(q) ||
                b.code?.toLowerCase().includes(q) ||
                b.city?.toLowerCase().includes(q)
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
    }, [branches, search, sortBy, sortDirection]);

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedBranches.length / itemsPerPage);
    const paginatedBranches = filteredAndSortedBranches.slice(
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
                icon={<IconBuilding className="w-6 h-6 text-primary" />}
                title="Branches"
                description="Manage your company's physical locations and offices"
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onAdd={handleCreate}
                addLabel="Add Branch"
                onRefresh={fetchBranches}
                hasActiveFilters={sortBy !== 'name' || sortDirection !== 'asc'}
                onClearFilters={() => {
                    setSortBy('name');
                    setSortDirection('asc');
                }}
            />

            {loading ? (
                <TableSkeleton columns={5} rows={5} />
            ) : branches.length === 0 ? (
                <EmptyState
                    title="No Branches Found"
                    description="Get started by creating your first branch."
                    actionLabel="Add Branch"
                    onAction={handleCreate}
                />
            ) : filteredAndSortedBranches.length === 0 ? (
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
                <div className="table-responsive bg-white dark:bg-black rounded-lg border border-gray-100 dark:border-gray-800">
                    <table className="table-hover table-striped w-full table">
                        <thead>
                            <tr>
                                <SortableHeader label="Name" value="name" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Code" value="code" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="City" value="city" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Status" value="status" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <th className="text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedBranches.map((branch: any) => (
                                <tr key={branch.id}>
                                    <td className="whitespace-nowrap font-medium">{branch.name}</td>
                                    <td>{branch.code}</td>
                                    <td>{branch.city}</td>
                                    <td>
                                        <Badge 
                                        dot={true}
                                        size='sm'
                                        variant={branch.status === 'active' ? 'success' : 'destructive'}>
                                            {branch.status}
                                        </Badge>
                                    </td>
                                    <td>
                                        <ActionButtons skipDeleteConfirm={true}
                                            onEdit={() => handleEdit(branch)}
                                            onDelete={() => confirmDelete(branch.id)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={filteredAndSortedBranches.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                    
                </div>
            )}

<Dialog open={modalOpen} onOpenChange={setModalOpen}>
  <DialogContent className="sm:max-w-[700px] w-[95vw] h-[90vh] flex flex-col p-0 border-0 shadow-2xl rounded-2xl overflow-hidden">
    {/* Header */}
    <div className="shrink-0 bg-gradient-to-r from-primary/10 to-transparent px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
      <div className="bg-primary/20 p-3 rounded-2xl shadow-sm">
        <IconBuilding className="text-primary w-7 h-7" />
      </div>
      <div>
        <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
          {editingBranch ? 'Edit Branch' : 'Create New Branch'}
        </DialogTitle>
        <p className="text-sm text-gray-500 mt-1">
          {editingBranch 
            ? 'Update the branch details below.' 
            : 'Fill in the details to add a new branch location.'}
        </p>
      </div>
    </div>

    <ScrollArea className="flex-1 min-h-0">
      <form id="branch-form" onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Branch Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Downtown Office"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Branch Code <span className="text-red-500">*</span>
              </label>
              <Input
                id="code"
                name="code"
                type="text"
                value={formData.code}
                onChange={handleChange}
                placeholder="e.g. BR-001"
                required
              />
            </div>
          </div>
        </div>

        {/* Location Details */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Location Details
          </h3>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Address <span className="text-red-500">*</span>
            </label>
            <Input
              id="address"
              name="address"
              type="text"
              value={formData.address}
              onChange={handleChange}
              placeholder="Street address"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                City <span className="text-red-500">*</span>
              </label>
              <Input
                id="city"
                name="city"
                type="text"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. New York"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                State / Province
              </label>
              <Input
                id="state"
                name="state"
                type="text"
                value={formData.state}
                onChange={handleChange}
                placeholder="e.g. NY"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Country <span className="text-red-500">*</span>
              </label>
              <Input
                id="country"
                name="country"
                type="text"
                value={formData.country}
                onChange={handleChange}
                placeholder="e.g. United States"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                ZIP / Postal Code
              </label>
              <Input
                id="zip_code"
                name="zip_code"
                type="text"
                value={formData.zip_code}
                onChange={handleChange}
                placeholder="e.g. 10001"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone Number
              </label>
              <Input
                id="phone"
                name="phone"
                type="text"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. +1 (555) 123-4567"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="branch@company.com"
              />
            </div>
          </div>
        </div>

        {/* Status & Telegram Integration */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Status & Notifications
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Status <span className="text-red-500">*</span>
              </label>
              <Select
                onValueChange={(value) => handleSelectChange(value, 'status')}
                value={formData.status}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Telegram Chat ID <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <Input
                id="telegram_chat_id"
                name="telegram_chat_id"
                type="text"
                value={formData.telegram_chat_id}
                onChange={handleChange}
                placeholder="e.g. -1001234567890"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Telegram Topic ID <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <Input
                id="telegram_topic_id"
                name="telegram_topic_id"
                type="text"
                value={formData.telegram_topic_id}
                onChange={handleChange}
                placeholder="e.g. 42"
              />
            </div>
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
        form="branch-form"
        disabled={isSaving}
        className="px-7 bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
      >
        {isSaving ? 'Saving...' : (editingBranch ? 'Save Changes' : 'Create Branch')}
      </Button>
    </div>
  </DialogContent>
</Dialog>

            <DeleteModal
                isOpen={deleteModalOpen}
                setIsOpen={setDeleteModalOpen}
                onConfirm={executeDelete}
                isLoading={isDeleting}
                title="Delete Branch"
                message="Are you sure you want to delete this branch? This action cannot be undone."
            />
        </div>
    );
};

export default BranchIndex;
