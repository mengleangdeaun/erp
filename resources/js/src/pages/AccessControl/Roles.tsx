import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ScrollArea } from '../../components/ui/scroll-area';
import FilterBar from '../../components/ui/FilterBar';
import TableSkeleton from '../../components/ui/TableSkeleton';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import SortableHeader from '../../components/ui/SortableHeader';
import DeleteModal from '../../components/DeleteModal';
import { Textarea } from '../../components/ui/textarea';
import ActionButtons from '../../components/ui/ActionButtons';
import { Badge } from '../../components/ui/badge';
import { IconShieldLock, IconCheck, IconX, IconShield } from '@tabler/icons-react';
import { Checkbox } from '../../components/ui/checkbox';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';


const RolesIndex = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const [roles, setRoles] = useState<any[]>([]);
    const [permissions, setPermissions] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<any>(null);
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
        permissions: [] as number[],
    };

    const [formData, setFormData] = useState(initialFormState);

    const fetchRoles = () => {
        setLoading(true);
        fetch('/api/access-control/roles', {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setRoles(data);
                } else {
                    setRoles([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setRoles([]);
                setLoading(false);
            });
    };

    const fetchPermissions = () => {
        fetch('/api/access-control/permissions')
            .then(res => res.json())
            .then(data => {
                setPermissions(data);
            })
            .catch(err => console.error(err));
    };

    useEffect(() => {
        fetchRoles();
        fetchPermissions();
    }, []);

    useEffect(() => {
        dispatch(setPageTitle(t('roles_permissions', 'Roles & Permissions')));
    }, [dispatch, t]);

    const handleCreate = () => {
        setEditingRole(null);
        setFormData(initialFormState);
        setModalOpen(true);
    };

    const handleEdit = (role: any) => {
        setEditingRole(role);
        setFormData({
            name: role.name,
            description: role.description || '',
            permissions: role.permissions.map((p: any) => p.id),
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
            const response = await fetch(`/api/access-control/roles/${itemToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                toast.success('Role deleted successfully');
                fetchRoles();
            } else {
                const data = await response.json();
                toast.error(data.message || 'Failed to delete role');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setIsDeleting(false);
            setDeleteModalOpen(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handlePermissionToggle = (permissionId: number) => {
        setFormData(prev => {
            const exists = prev.permissions.includes(permissionId);
            if (exists) {
                return { ...prev, permissions: prev.permissions.filter(id => id !== permissionId) };
            } else {
                return { ...prev, permissions: [...prev.permissions, permissionId] };
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const url = editingRole ? `/api/access-control/roles/${editingRole.id}` : '/api/access-control/roles';
        const method = editingRole ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                toast.success(`Role ${editingRole ? 'updated' : 'created'} successfully`);
                setModalOpen(false);
                fetchRoles();
            } else {
                const data = await response.json();
                toast.error(data.message || 'Failed to save role');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setIsSaving(false);
        }
    };

    const filteredRoles = useMemo(() => {
        let result = [...roles];
        if (search) {
            result = result.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
        }
        return result;
    }, [roles, search]);

    const paginatedRoles = filteredRoles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div>
            <FilterBar
                icon={<IconShieldLock className="w-6 h-6 text-primary" />}
                title="Roles & Permissions"
                description="Manage user roles and their associated access permissions."
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onAdd={handleCreate}
                addLabel="Add Role"
                onRefresh={fetchRoles}
            />

            {loading ? (
                <TableSkeleton columns={3} rows={5} />
            ) : roles.length === 0 ? (
                <EmptyState title="No Roles Found" description="Start by creating your first system role." onAction={handleCreate} actionLabel="Add Role" />
            ) : (
                <div className="table-responsive bg-white dark:bg-black rounded-lg border border-gray-100 dark:border-gray-800">
                    <table className="table-hover table-striped w-full table">
                        <thead>
                            <tr>
                                <th>Role Name</th>
                                <th>Description</th>
                                <th>Permissions</th>
                                <th className="text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedRoles.map((role: any) => (
                                <tr key={role.id}>
                                    <td className="font-bold">{role.name}</td>
                                    <td className="text-sm">{role.description}</td>
                                    <td>
                                        <div className="flex flex-wrap gap-1">
                                            {role.permissions.slice(0, 3).map((p: any) => (
                                                <Badge key={p.id} variant="secondary" className="text-[10px]">{p.name}</Badge>
                                            ))}
                                            {role.permissions.length > 3 && (
                                                <Badge variant="secondary" className="text-[10px]">+{role.permissions.length - 3} more</Badge>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <ActionButtons onEdit={() => handleEdit(role)} onDelete={() => confirmDelete(role.id)} skipDeleteConfirm={true} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(filteredRoles.length / itemsPerPage)}
                        totalItems={filteredRoles.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

<Dialog open={modalOpen} onOpenChange={setModalOpen}>
  <DialogContent className="sm:max-w-[1050px] w-[95vw] h-[90vh] flex flex-col p-0 border-0 shadow-2xl rounded-2xl overflow-hidden">
    {/* Header */}
    <div className="shrink-0 bg-gradient-to-r from-primary/10 to-transparent px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
      <div className="bg-primary/20 p-3 rounded-2xl shadow-sm">
        <IconShield className="text-primary w-7 h-7" /> {/* Use an appropriate icon for roles */}
      </div>
      <div>
        <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
          {editingRole ? 'Edit Role' : 'Create Role'}
        </DialogTitle>
        <p className="text-sm text-gray-500 mt-1">
          {editingRole
            ? 'Modify the role details and its permissions.'
            : 'Define a new role and assign the corresponding permissions.'}
        </p>
      </div>
    </div>

    {/* Scrollable Form Area */}
    <ScrollArea className="flex-1 min-h-0">
      <form id="role-form" onSubmit={handleSubmit} className="pt-0 p-6 space-y-6">
        {/* Role Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Role Name <span className="text-red-500">*</span>
            </label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Admin, Manager, Viewer"
              required
              className="bg-gray-50 dark:bg-gray-800/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Optional description..."
              rows={2}
              className="bg-gray-50 dark:bg-gray-800/50 resize-none h-11 min-h-[44px]"
            />
          </div>
        </div>

        {/* Permissions Section */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b pb-2">
            Permissions
          </h3>
          {Object.entries(permissions).map(([module, perms]: [string, any]) => (
            <div
              key={module}
              className="bg-gray-50 dark:bg-dark-light/10 p-4 rounded-lg border border-gray-100 dark:border-gray-800"
            >
              <h4 className="text-sm font-bold text-primary mb-3 uppercase tracking-wider">
                {module}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {perms.map((p: any) => (
                  <div key={p.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`p-${p.id}`}
                      checked={formData.permissions.includes(p.id)}
                      onCheckedChange={() => handlePermissionToggle(p.id)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary h-5 w-5 rounded-md"
                    />
                    <label
                      htmlFor={`p-${p.id}`}
                      className="text-xs font-medium cursor-pointer text-gray-700 dark:text-gray-300"
                    >
                      {p.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </form>
    </ScrollArea>

    {/* Sticky Footer */}
    <div className="shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-background">
      <Button type="button" variant="ghost" className="px-5" onClick={() => setModalOpen(false)}>
        Cancel
      </Button>
      <Button
        type="submit"
        form="role-form"
        disabled={isSaving}
        className="px-7 bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
      >
        {isSaving ? 'Saving...' : 'Save Role'}
      </Button>
    </div>
  </DialogContent>
</Dialog>

            <DeleteModal
                isOpen={deleteModalOpen}
                setIsOpen={setDeleteModalOpen}
                onConfirm={executeDelete}
                isLoading={isDeleting}
                title="Delete Role"
                message="Are you sure you want to delete this role? Users assigned to this role will lose their permissions."
            />
        </div>
    );
};

export default RolesIndex;
