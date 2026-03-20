import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
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
import { IconUsers, IconUserPlus } from '@tabler/icons-react';
import { Checkbox } from '../../components/ui/checkbox';

const UsersIndex = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
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
        email: '',
        password: '',
        roles: [] as number[],
        branches: [] as number[],
    };

    const [formData, setFormData] = useState(initialFormState);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, rolesRes, branchesRes] = await Promise.all([
                fetch('/api/access-control/users').then(res => res.json()),
                fetch('/api/access-control/roles').then(res => res.json()),
                fetch('/api/hr/branches', { headers: { 'Accept': 'application/json' } }).then(res => res.json()),
            ]);

            setUsers(Array.isArray(usersRes) ? usersRes : []);
            setRoles(Array.isArray(rolesRes) ? rolesRes : []);
            setBranches(Array.isArray(branchesRes) ? branchesRes : []);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = () => {
        setEditingUser(null);
        setFormData(initialFormState);
        setModalOpen(true);
    };

    const handleEdit = (user: any) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '', // Reset password field
            roles: user.roles.map((r: any) => r.id),
            branches: user.branches.map((b: any) => b.id),
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
            const response = await fetch(`/api/access-control/users/${itemToDelete}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast.success('User deleted successfully');
                fetchData();
            } else {
                const data = await response.json();
                toast.error(data.message || 'Failed to delete user');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setIsDeleting(false);
            setDeleteModalOpen(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const url = editingUser ? `/api/access-control/users/${editingUser.id}` : '/api/access-control/users';
        const method = editingUser ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                toast.success(`User ${editingUser ? 'updated' : 'created'} successfully`);
                setModalOpen(false);
                fetchData();
            } else {
                const data = await response.json();
                toast.error(data.message || 'Failed to save user');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setIsSaving(false);
        }
    };

    const filteredUsers = useMemo(() => {
        let result = [...users];
        if (search) {
            result = result.filter(u => 
                u.name.toLowerCase().includes(search.toLowerCase()) || 
                u.email.toLowerCase().includes(search.toLowerCase())
            );
        }
        return result;
    }, [users, search]);

    const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div>
            <FilterBar
                icon={<IconUsers className="w-6 h-6 text-primary" />}
                title="System Users"
                description="Manage system users, assign roles and control their branch access."
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onAdd={handleCreate}
                addLabel="Add User"
                onRefresh={fetchData}
            />

            {loading ? (
                <TableSkeleton columns={4} rows={5} />
            ) : users.length === 0 ? (
                <EmptyState title="No Users Found" description="Start by adding your first system user." onAction={handleCreate} actionLabel="Add User" />
            ) : (
                <div className="table-responsive bg-white dark:bg-black rounded-lg border border-gray-100 dark:border-gray-800">
                    <table className="table-hover table-striped w-full table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Roles</th>
                                <th>Branches</th>
                                <th className="text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedUsers.map((user: any) => (
                                <tr key={user.id}>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                {user.name.charAt(0)}
                                            </div>
                                            <span className="font-medium">{user.name}</span>
                                        </div>
                                    </td>
                                    <td className="text-sm">{user.email}</td>
                                    <td>
                                        <div className="flex flex-wrap gap-1">
                                            {user.roles.map((r: any) => (
                                                <Badge key={r.id} variant="secondary">{r.name}</Badge>
                                            ))}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-wrap gap-1">
                                            {user.branches.map((b: any) => (
                                                <Badge key={b.id} variant="outline" className="text-primary">{b.name}</Badge>
                                            ))}
                                        </div>
                                    </td>
                                    <td>
                                        <ActionButtons onEdit={() => handleEdit(user)} onDelete={() => confirmDelete(user.id)} skipDeleteConfirm={true} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(filteredUsers.length / itemsPerPage)}
                        totalItems={filteredUsers.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{editingUser ? 'Edit User' : 'Create System User'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Full Name</label>
                                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="User Full Name" required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Email Address</label>
                                <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="user@example.com" required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Password {editingUser && '(Leave blank to keep current)'}</label>
                                <Input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="********" required={!editingUser} />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-primary">Assign Roles</label>
                                <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 dark:bg-dark-light/10 rounded-lg">
                                    {roles.map(role => (
                                        <div key={role.id} className="flex items-center space-x-2">
                                            <Checkbox 
                                                id={`role-${role.id}`} 
                                                checked={formData.roles.includes(role.id)}
                                                onCheckedChange={() => {
                                                    const exists = formData.roles.includes(role.id);
                                                    setFormData({
                                                        ...formData,
                                                        roles: exists ? formData.roles.filter(id => id !== role.id) : [...formData.roles, role.id]
                                                    });
                                                }}
                                            />
                                            <label htmlFor={`role-${role.id}`} className="text-xs cursor-pointer">{role.name}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-primary">Assign Branches</label>
                                <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 dark:bg-dark-light/10 rounded-lg">
                                    {branches.map(branch => (
                                        <div key={branch.id} className="flex items-center space-x-2">
                                            <Checkbox 
                                                id={`branch-${branch.id}`} 
                                                checked={formData.branches.includes(branch.id)}
                                                onCheckedChange={() => {
                                                    const exists = formData.branches.includes(branch.id);
                                                    setFormData({
                                                        ...formData,
                                                        branches: exists ? formData.branches.filter(id => id !== branch.id) : [...formData.branches, branch.id]
                                                    });
                                                }}
                                            />
                                            <label htmlFor={`branch-${branch.id}`} className="text-xs cursor-pointer">{branch.name}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="mt-6">
                            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save User'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <DeleteModal
                isOpen={deleteModalOpen}
                setIsOpen={setDeleteModalOpen}
                onConfirm={executeDelete}
                isLoading={isDeleting}
                title="Delete User"
                message="Are you sure you want to delete this user? This action cannot be undone."
            />
        </div>
    );
};

export default UsersIndex;
