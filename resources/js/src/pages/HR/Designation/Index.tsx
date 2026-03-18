import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { ScrollArea } from '../../../components/ui/scroll-area';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import DeleteModal from '../../../components/DeleteModal';
import ActionButtons from '../../../components/ui/ActionButtons';
import SearchableMultiSelect from '../../../components/ui/SearchableMultiSelect';
import { Badge } from '../../../components/ui/badge';
import { IconBadge } from '@tabler/icons-react';

const DesignationIndex = () => {
    const [designations, setDesignations] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingDesignation, setEditingDesignation] = useState<any>(null);
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
        department_ids: [] as string[],
        description: '',
        status: 'active',
    };

    const [formData, setFormData] = useState<{ name: string, department_ids: string[], description: string, status: string }>(initialFormState);

    // Helper to get cookie
    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const fetchDesignations = () => {
        setLoading(true);
        fetch('/api/hr/designations', {
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
                    setDesignations(data);
                } else {
                    setDesignations([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setDesignations([]);
                setLoading(false);
            });
    };

    const fetchDepartments = () => {
        fetch('/api/hr/departments', {
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
                    setDepartments(data);
                }
            })
            .catch(err => console.error(err));
    };

    useEffect(() => {
        fetchDesignations();
        fetchDepartments();
    }, []);

    const handleCreate = () => {
        setEditingDesignation(null);
        setFormData(initialFormState);
        setModalOpen(true);
    };

    const handleEdit = (desig: any) => {
        setEditingDesignation(desig);
        setFormData({
            name: desig.name,
            department_ids: desig.departments ? desig.departments.map((d: any) => String(d.id)) : [],
            description: desig.description || '',
            status: desig.status,
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
            const response = await fetch(`/api/hr/designations/${itemToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
                },
                credentials: 'include',
            });

            if (response.ok) {
                toast.success('Designation deleted successfully');
                fetchDesignations();
            } else {
                toast.error('Failed to delete designation');
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
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSelectChange = (value: string | string[], name: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const url = editingDesignation ? `/api/hr/designations/${editingDesignation.id}` : '/api/hr/designations';
        const method = editingDesignation ? 'PUT' : 'POST';

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
                toast.success(`Designation ${editingDesignation ? 'updated' : 'created'} successfully`);
                setModalOpen(false);
                fetchDesignations();
            } else {
                if (response.status === 401) {
                    window.location.href = '/login';
                }
                toast.error(data.message || `Failed to ${editingDesignation ? 'update' : 'create'} designation`);
            }
        } catch (error) {
            console.error(error);
            toast.error('An error occurred');
        } finally {
            setIsSaving(false);
        }
    };

    // Derived state for table
    const filteredAndSortedDesignations = useMemo(() => {
        let result = [...designations];

        // Search
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(d =>
                d.name?.toLowerCase().includes(q) ||
                d.departments?.some((dept: any) =>
                    dept.name?.toLowerCase().includes(q) ||
                    dept.branches?.some((branch: any) => branch.name?.toLowerCase().includes(q))
                )
            );
        }

        // Sort
        result.sort((a, b) => {
            let valA = '';
            let valB = '';

            if (sortBy === 'department') {
                valA = a.departments?.[0]?.name || '';
                valB = b.departments?.[0]?.name || '';
            } else if (sortBy === 'branch') {
                valA = a.departments?.[0]?.branches?.[0]?.name || '';
                valB = b.departments?.[0]?.branches?.[0]?.name || '';
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
    }, [designations, search, sortBy, sortDirection]);

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedDesignations.length / itemsPerPage);
    const paginatedDesignations = filteredAndSortedDesignations.slice(
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
                icon={<IconBadge className="w-6 h-6 text-primary" />}
                title="Designations"
                description="Manage your organizational roles and job titles"
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onAdd={handleCreate}
                addLabel="Add Designation"
                onRefresh={fetchDesignations}
                hasActiveFilters={sortBy !== 'name' || sortDirection !== 'asc'}
                onClearFilters={() => {
                    setSortBy('name');
                    setSortDirection('asc');
                }}
            />

            {loading ? (
                <TableSkeleton columns={5} rows={5} />
            ) : designations.length === 0 ? (
                <EmptyState
                    title="No Designations Found"
                    description="Get started by creating your first designation."
                    actionLabel="Add Designation"
                    onAction={handleCreate}
                />
            ) : filteredAndSortedDesignations.length === 0 ? (
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
                                <SortableHeader label="Department" value="department" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Branch" value="branch" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Status" value="status" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <th className="text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedDesignations.map((desig: any) => (
                                <tr key={desig.id}>
                                    <td className="whitespace-nowrap font-medium">{desig.name}</td>
                                    <td>
                                        <div className="flex flex-wrap gap-1">
                                            {desig.departments && desig.departments.length > 0 ? (
                                                desig.departments.map((dept: any) => (
                                                    <span key={dept.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary whitespace-nowrap">
                                                        {dept.name}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-gray-400 italic text-sm">No Departments</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-wrap gap-1">
                                            {desig.departments && desig.departments.length > 0 ? (
                                                desig.departments.map((dept: any) => (
                                                    <span key={`branch-${dept.id}`} className="text-xs text-gray-500 whitespace-nowrap">
                                                        {dept.branches?.map((b: any) => b.name).join(', ')}{desig.departments.length > 1 ? ' | ' : ''}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <Badge 
                                        dot={true}
                                        size='sm'
                                        variant={desig.status === 'active' ? 'success' : 'destructive'}>
                                            {desig.status}
                                        </Badge>
                                    </td>
                                    <td>
                                        <ActionButtons skipDeleteConfirm={true}
                                            onEdit={() => handleEdit(desig)}
                                            onDelete={() => confirmDelete(desig.id)}
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
                            totalItems={filteredAndSortedDesignations.length}
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
        <IconBadge className="text-primary w-7 h-7" />
      </div>
      <div>
        <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
          {editingDesignation ? 'Edit Designation' : 'Create New Designation'}
        </DialogTitle>
        <p className="text-sm text-gray-500 mt-1">
          {editingDesignation 
            ? 'Update the designation details below.' 
            : 'Fill in the details to add a new designation.'}
        </p>
      </div>
    </div>

    <ScrollArea className="flex-1 min-h-0">
      <form id="designation-form" onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Designation Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Senior Software Engineer"
                required
              />
            </div>
            <div className="space-y-0">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Departments
              </label>
              <SearchableMultiSelect
                options={departments.map((dept: any) => ({
                  value: String(dept.id),
                  label: dept.name
                }))}
                value={formData.department_ids}
                onChange={(val) => handleSelectChange(val, 'department_ids')}
                placeholder="Select Departments"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Additional Details
          </h3>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the responsibilities and scope of this designation..."
              rows={4}
              className="bg-gray-50 dark:bg-gray-800/50 resize-none"
            />
          </div>
        </div>

        {/* Status */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Status
          </h3>
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
        form="designation-form"
        disabled={isSaving}
        className="px-7 bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
      >
        {isSaving ? 'Saving...' : (editingDesignation ? 'Save Changes' : 'Create Designation')}
      </Button>
    </div>
  </DialogContent>
</Dialog>

            <DeleteModal
                isOpen={deleteModalOpen}
                setIsOpen={setDeleteModalOpen}
                onConfirm={executeDelete}
                isLoading={isDeleting}
                title="Delete Designation"
                message="Are you sure you want to delete this designation? This action cannot be undone."
            />
        </div>
    );
};

export default DesignationIndex;
