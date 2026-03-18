import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Button } from '../../../components/ui/button';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import DeleteModal from '../../../components/DeleteModal';
import ActionButtons from '../../../components/ui/ActionButtons';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { IconTags } from '@tabler/icons-react';

const TagIndex = () => {
    const [tags, setTags] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTag, setEditingTag] = useState<any>(null);
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
        color: '#4361ee',
        is_active: '1',
    };

    const [formData, setFormData] = useState(initialFormState);

    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const fetchTags = () => {
        setLoading(true);
        fetch('/api/inventory/tags', {
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
                setTags(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setTags([]);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchTags();
    }, []);

    const handleCreate = () => {
        setEditingTag(null);
        setFormData(initialFormState);
        setModalOpen(true);
    };

    const handleEdit = (tag: any) => {
        setEditingTag(tag);
        setFormData({
            name: tag.name,
            color: tag.color || '#4361ee',
            is_active: tag.is_active ? '1' : '0',
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
            const response = await fetch(`/api/inventory/tags/${itemToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
                },
                credentials: 'include',
            });

            if (response.ok) {
                toast.success('Tag deleted successfully');
                fetchTags();
            } else {
                toast.error('Failed to delete tag');
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

        const url = editingTag ? `/api/inventory/tags/${editingTag.id}` : '/api/inventory/tags';
        const method = editingTag ? 'PUT' : 'POST';

        try {
            await fetch('/sanctum/csrf-cookie');

            const payload = { ...formData, is_active: formData.is_active === '1' };

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
                toast.success(`Tag ${editingTag ? 'updated' : 'created'} successfully`);
                setModalOpen(false);
                fetchTags();
            } else {
                toast.error(data.message || `Failed to ${editingTag ? 'update' : 'create'} tag`);
            }
        } catch (error) {
            console.error(error);
            toast.error('An error occurred');
        } finally {
            setIsSaving(false);
        }
    };

    // Derived state for table
    const filteredAndSortedTags = useMemo(() => {
        let result = [...tags];

        if (search) {
            const q = search.toLowerCase();
            result = result.filter(d => d.name?.toLowerCase().includes(q));
        }

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
    }, [tags, search, sortBy, sortDirection]);

    const totalPages = Math.ceil(filteredAndSortedTags.length / itemsPerPage);
    const paginatedTags = filteredAndSortedTags.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    return (
        <div>
            <FilterBar
                icon={<IconTags className="w-6 h-6 text-primary" />}
                title="Product Tags"
                description="Manage attributes to categorize your products"
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onAdd={handleCreate}
                addLabel="Add Tag"
                onRefresh={fetchTags}
                hasActiveFilters={sortBy !== 'name' || sortDirection !== 'asc'}
                onClearFilters={() => {
                    setSortBy('name');
                    setSortDirection('asc');
                }}
            />

            {loading ? (
                <TableSkeleton columns={3} rows={5} />
            ) : tags.length === 0 ? (
                <EmptyState
                    title="No Tags Found"
                    description="Get started by creating your first product tag."
                    actionLabel="Add Tag"
                    onAction={handleCreate}
                />
            ) : filteredAndSortedTags.length === 0 ? (
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
                                <SortableHeader label="Color" value="color" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Status" value="is_active" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <th className="text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedTags.map((tag: any) => (
                                <tr key={tag.id}>
                                    <td className="whitespace-nowrap font-medium">{tag.name}</td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-md border shadow-sm" style={{ backgroundColor: tag.color || 'transparent' }}></div>
                                            <span className="text-sm font-mono text-gray-500">{tag.color}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <Badge
                                            size="sm"
                                            variant={tag.is_active ? 'success' : 'destructive'}>
                                            {tag.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </td>
                                    <td>
                                        <ActionButtons skipDeleteConfirm={true}
                                            onEdit={() => handleEdit(tag)}
                                            onDelete={() => confirmDelete(tag.id)}
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
                            totalItems={filteredAndSortedTags.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </div>
            )}

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[500px] w-[95vw] flex flex-col p-0 border-0 shadow-2xl rounded-2xl overflow-hidden">
                    <div className="shrink-0 bg-gradient-to-r from-primary/10 to-transparent px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
                        <div className="bg-primary/20 p-3 rounded-2xl shadow-sm">
                            <IconTags className="text-primary w-7 h-7" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingTag ? 'Edit Tag' : 'Create New Tag'}
                            </DialogTitle>
                            <p className="text-sm text-gray-500 mt-1">
                                {editingTag ? 'Update the tag details below.' : 'Add a new product distinguishing tag.'}
                            </p>
                        </div>
                    </div>

                    <ScrollArea className="flex-1 min-h-0">
                        <form id="tag-form" onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Tag Name <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        id="name"
                                        name="name"
                                        type="text"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="e.g. Fragile"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Hex Color Format <span className="text-gray-400 text-xs">(Optional)</span>
                                    </label>
                                    <div className="flex gap-3">
                                        <div 
                                            className="w-12 h-12 rounded-xl shrink-0 border" 
                                            style={{backgroundColor: formData.color || '#ffffff'}}
                                        />
                                        <Input
                                            id="color"
                                            name="color"
                                            type="text"
                                            className="h-12 uppercase font-mono"
                                            value={formData.color}
                                            onChange={handleChange}
                                            placeholder="#RRGGBB"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Status <span className="text-red-500">*</span>
                                    </label>
                                    <Select onValueChange={(value) => handleSelectChange(value, 'is_active')} value={formData.is_active}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Active</SelectItem>
                                            <SelectItem value="0">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </form>
                    </ScrollArea>

                    <div className="shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-background">
                        <Button type="button" variant="ghost" className="px-5" onClick={() => setModalOpen(false)}> Cancel </Button>
                        <Button type="submit" form="tag-form" disabled={isSaving} className="px-7 bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20">
                            {isSaving ? 'Saving...' : (editingTag ? 'Save Changes' : 'Create Tag')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <DeleteModal
                isOpen={deleteModalOpen}
                setIsOpen={setDeleteModalOpen}
                onConfirm={executeDelete}
                isLoading={isDeleting}
                title="Delete Tag"
                message="Are you sure you want to delete this tag? This action cannot be undone."
            />
        </div>
    );
};

export default TagIndex;
