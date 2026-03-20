import { useState, useEffect, useMemo } from 'react';
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
import ActionButtons from '../../components/ui/ActionButtons';
import { Badge } from '../../components/ui/badge';
import { IconShieldLock, IconCheck, IconX } from '@tabler/icons-react';
import { Checkbox } from '../../components/ui/checkbox';

const RolesIndex = () => {
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
                <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col p-0">
                    <DialogHeader className="p-6 border-b">
                        <DialogTitle>{editingRole ? 'Edit Role' : 'Create Role'}</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="flex-1 p-6">
                        <form id="role-form" onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Role Name</label>
                                    <Input name="name" value={formData.name} onChange={handleChange} required />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Description</label>
                                    <textarea
                                        name="description"
                                        className="form-textarea mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-dark dark:border-gray-700"
                                        rows={3}
                                        value={formData.description}
                                        onChange={handleChange}
                                    ></textarea>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-md font-bold border-b pb-2">Permissions</h3>
                                {Object.entries(permissions).map(([module, perms]: [string, any]) => (
                                    <div key={module} className="bg-gray-50 dark:bg-dark-light/10 p-4 rounded-lg">
                                        <h4 className="text-sm font-bold text-primary mb-3 uppercase tracking-wider">{module}</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {perms.map((p: any) => (
                                                <div key={p.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`p-${p.id}`}
                                                        checked={formData.permissions.includes(p.id)}
                                                        onCheckedChange={() => handlePermissionToggle(p.id)}
                                                    />
                                                    <label htmlFor={`p-${p.id}`} className="text-xs font-medium cursor-pointer">
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
                    <div className="p-4 border-t flex justify-end gap-2 bg-gray-50 dark:bg-black">
                        <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button type="submit" form="role-form" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Role'}</Button>
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
