import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
import { IconUsers, IconUserPlus, IconUser } from '@tabler/icons-react';
import { Checkbox } from '../../components/ui/checkbox';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';


const UsersIndex = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
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

    useEffect(() => {
        dispatch(setPageTitle(t('system_users', 'System Users')));
    }, [dispatch, t]);

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
  <DialogContent className="sm:max-w-2xl w-[95vw] h-[90vh] flex flex-col p-0 border-0 shadow-2xl rounded-2xl overflow-hidden">
    {/* Header */}
    <div className="shrink-0 bg-gradient-to-r from-primary/10 to-transparent px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
      <div className="bg-primary/20 p-3 rounded-2xl shadow-sm">
        <IconUser className="text-primary w-7 h-7" /> {/* Use appropriate icon for users */}
      </div>
      <div>
        <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
          {editingUser ? 'Edit User' : 'Create System User'}
        </DialogTitle>
        <p className="text-sm text-gray-500 mt-1">
          {editingUser
            ? 'Update the user details and assigned roles/branches.'
            : 'Add a new system user with specific roles and branch access.'}
        </p>
      </div>
    </div>

    {/* Scrollable Form Area */}
    <ScrollArea className="flex-1 min-h-0">
      <form onSubmit={handleSubmit} className="pt-0 p-6 space-y-6">
        <div className="grid grid-cols-1 gap-4">
          {/* Full Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Full Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="User Full Name"
              required
              className="bg-gray-50 dark:bg-gray-800/50"
            />
          </div>

          {/* Email Address */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Email Address <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@example.com"
              required
              className="bg-gray-50 dark:bg-gray-800/50"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Password {editingUser && '(Leave blank to keep current)'}
            </label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="********"
              required={!editingUser}
              className="bg-gray-50 dark:bg-gray-800/50"
            />
          </div>

          {/* Roles Section */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-primary">Assign Roles</label>
            <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 dark:bg-gray-800/20 rounded-xl border border-gray-100 dark:border-gray-800">
              {roles.map((role) => (
                <div key={role.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`role-${role.id}`}
                    checked={formData.roles.includes(role.id)}
                    onCheckedChange={() => {
                      const exists = formData.roles.includes(role.id);
                      setFormData({
                        ...formData,
                        roles: exists
                          ? formData.roles.filter((id) => id !== role.id)
                          : [...formData.roles, role.id],
                      });
                    }}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary h-5 w-5 rounded-md"
                  />
                  <label
                    htmlFor={`role-${role.id}`}
                    className="text-xs font-medium mb-0 cursor-pointer text-gray-700 dark:text-gray-300"
                  >
                    {role.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Branches Section */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-primary">Assign Branches</label>
            <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 dark:bg-gray-800/20 rounded-xl border border-gray-100 dark:border-gray-800">
              {branches.map((branch) => (
                <div key={branch.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`branch-${branch.id}`}
                    checked={formData.branches.includes(branch.id)}
                    onCheckedChange={() => {
                      const exists = formData.branches.includes(branch.id);
                      setFormData({
                        ...formData,
                        branches: exists
                          ? formData.branches.filter((id) => id !== branch.id)
                          : [...formData.branches, branch.id],
                      });
                    }}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary h-5 w-5 rounded-md"
                  />
                  <label
                    htmlFor={`branch-${branch.id}`}
                    className="text-xs font-medium mb-0 cursor-pointer text-gray-700 dark:text-gray-300"
                  >
                    {branch.name}
                  </label>
                </div>
              ))}
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
        disabled={isSaving}
        className="px-7 bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
      >
        {isSaving ? 'Saving...' : 'Save User'}
      </Button>
    </div>
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
