import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { IconPlus, IconEdit, IconTrash, IconCheck, IconX, IconAlertTriangle, IconLoader2, IconDeviceFloppy } from '@tabler/icons-react';
import { toast } from 'sonner';
import TableSkeleton from '@/components/ui/TableSkeleton';
import FilterBar from '@/components/ui/FilterBar';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import ActionButtons from '@/components/ui/ActionButtons';
import HighlightText from '@/components/ui/HighlightText';
import DeleteModal from '@/components/DeleteModal';
import { Checkbox } from '@/components/ui/checkbox';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { useReplacementTypes, useCreateReplacementType, useUpdateReplacementType, useDeleteReplacementType } from '@/hooks/useJobCardData';
import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';

interface ReplacementType {
    id: number;
    name: string;
    description?: string;
    is_active: boolean;
    created_at: string;
}

const DamageTypesIndex = () => {
    const queryClient = useQueryClient();
    
    // Pagination & Filters
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(15);

    // Replacement Types query
    const { data: typesData, isLoading: loading } = useReplacementTypes({
        page: currentPage,
        per_page: perPage,
        search,
    });

    const types = typesData?.data || [];
    const totalItems = typesData?.total || 0;
    const totalPages = typesData?.last_page || 1;

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingType, setEditingType] = useState<ReplacementType | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        is_active: true
    });

    const createMutation = useCreateReplacementType();
    const updateMutation = useUpdateReplacementType();
    const deleteMutation = useDeleteReplacementType();

    // Delete flow
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [typeToDelete, setTypeToDelete] = useState<number | null>(null);

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const handleOpenDialog = (type?: ReplacementType) => {
        if (type) {
            setEditingType(type);
            setFormData({
                name: type.name,
                description: type.description || '',
                is_active: !!type.is_active
            });
        } else {
            setEditingType(null);
            setFormData({
                name: '',
                description: '',
                is_active: true
            });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!formData.name) {
            toast.error('Name is required');
            return;
        }

        const data = {
            ...formData,
            is_active: formData.is_active ? 1 : 0
        };

        if (editingType) {
            updateMutation.mutate({ id: editingType.id, data }, {
                onSuccess: () => setIsDialogOpen(false)
            });
        } else {
            createMutation.mutate(data, {
                onSuccess: () => setIsDialogOpen(false)
            });
        }
    };

    const handleDeleteClick = (id: number) => {
        setTypeToDelete(id);
        setDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!typeToDelete) return;
        deleteMutation.mutate(typeToDelete, {
            onSuccess: () => setDeleteModalOpen(false)
        });
    };

    const isSaving = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="space-y-6 pb-12">
            <FilterBar
                icon={<IconAlertTriangle className="w-6 h-6 text-orange-500" />}
                title="Damage & Replacement Types"
                description="Manage reasons for rework, failures, and warranty replacements."
                search={search}
                setSearch={setSearch}
                onAdd={() => handleOpenDialog()}
                addLabel="Add Type"
                onRefresh={() => queryClient.invalidateQueries({ queryKey: ['replacement-types'] })}
                itemsPerPage={perPage}
                setItemsPerPage={setPerPage}
            />

            {loading ? (
                <TableSkeleton columns={4} rows={5} />
            ) : types.length === 0 ? (
                <EmptyState
                    isSearch={!!search}
                    searchTerm={search}
                    title={search ? 'No results found' : 'No types available'}
                    description={search ? "We couldn't find any damage types matching your search." : 'Define your first damage/replacement reason (e.g. Scratched, Installation Error, Manufacturing Defect).'}
                    onAction={() => handleOpenDialog()}
                    actionLabel="Add Type"
                    onClearFilter={() => setSearch('')}
                />
            ) : (
                <div className="panel bg-white dark:bg-gray-900 border-none shadow-sm overflow-hidden p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-white-dark/5 text-gray-500 uppercase text-[10px] font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 text-left">Reason / Type</th>
                                    <th className="px-6 py-4 text-left">Description</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {types.map((type: ReplacementType) => (
                                    <tr key={type.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 transition-colors group">
                                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-gray-100 uppercase tracking-tight">
                                            <HighlightText text={type.name} highlight={search} />
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            <HighlightText text={type.description || '-'} highlight={search} />
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge
                                                size="sm"
                                                variant={type.is_active ? 'success' : 'destructive'}
                                                className="text-[10px] font-black uppercase tracking-widest"
                                            >
                                                {type.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <ActionButtons
                                                onEdit={() => handleOpenDialog(type)}
                                                onDelete={() => handleDeleteClick(type.id)}
                                                skipDeleteConfirm
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!loading && totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={perPage}
                    onPageChange={setCurrentPage}
                />
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px] flex flex-col p-0 border-none shadow-2xl rounded-3xl overflow-hidden">
                    <DialogHeader className="shrink-0 p-6 bg-orange-50 dark:bg-orange-500/10 border-b border-orange-100 dark:border-orange-500/20">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-orange-500/20 text-orange-600 shadow-sm">
                                <IconAlertTriangle size={24} />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold">
                                    {editingType ? 'Edit Damage Type' : 'Add Damage Type'}
                                </DialogTitle>
                                <DialogDescription>
                                    {editingType ? 'Update the details for this damage/replacement reason.' : 'Define a new reason for parts replacement or rework.'}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <PerfectScrollbar options={{ suppressScrollX: true }} className="flex-1 min-h-0">
                        <form id="type-form" onSubmit={handleSave} className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Reason Name <span className="text-danger">*</span></Label>
                                    <Input 
                                        id="name" 
                                        value={formData.name} 
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        placeholder="e.g. Scratched during install" 
                                        className="h-11 rounded-xl"
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="description" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Detailed Description</Label>
                                    <textarea 
                                        id="description" 
                                        value={formData.description} 
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        placeholder="Optional explanation of when this should be used..."
                                        className="flex min-h-[100px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                </div>
                                <div className="flex items-center gap-3 p-4 rounded-xl bg-orange-50/30 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20">
                                    <Checkbox 
                                        id="is_active" 
                                        checked={formData.is_active} 
                                        onCheckedChange={(checked: boolean) => setFormData({...formData, is_active: checked})}
                                        className="w-5 h-5 rounded-md accent-orange-500 cursor-pointer"
                                    />
                                    <Label htmlFor="is_active" className="font-bold text-sm mb-0 cursor-pointer text-gray-700 dark:text-gray-300">Enable Selection</Label>
                                </div>
                            </div>
                        </form>
                    </PerfectScrollbar>

                    <DialogFooter className="shrink-0 flex gap-3 p-6 border-t border-gray-100 dark:divide-gray-800 bg-background">
                        <Button variant="ghost" className="flex-1 h-11 font-bold text-gray-500" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button 
                            type="submit" 
                            form="type-form" 
                            className="flex-1 h-11 font-bold shadow-lg shadow-orange-500/20 gap-2 bg-orange-500 hover:bg-orange-600 transition-all active:scale-95"
                            disabled={isSaving}
                        >
                            {isSaving ? <IconLoader2 className="animate-spin" size={18} /> : <IconDeviceFloppy size={18} />}
                            {editingType ? 'Update Reason' : 'Save Reason'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <DeleteModal 
                isOpen={deleteModalOpen} 
                setIsOpen={setDeleteModalOpen} 
                onConfirm={executeDelete} 
                isLoading={deleteMutation.isPending} 
                title="Delete Damage Type" 
                message="Are you sure you want to delete this reason? This might affect existing reports that use this type." 
            />
        </div>
    );
};

export default DamageTypesIndex;
