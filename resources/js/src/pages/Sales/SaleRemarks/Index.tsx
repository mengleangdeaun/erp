import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { IconPlus, IconEdit, IconTrash, IconCheck, IconX, IconTag, IconLoader2, IconDeviceFloppy } from '@tabler/icons-react';
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
import { useSaleRemarks } from '@/hooks/usePOSData';
import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import api from '@/utils/api';

interface SaleRemark {
    id: number;
    name: string;
    description: string;
    color_code: string;
    is_active: boolean;
}

const SaleRemarkIndex = () => {
    const queryClient = useQueryClient();
    
    // Pagination & Filters
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(15);

    // Remarks query
    const { data: remarksData, isLoading: loading } = useSaleRemarks({
        page: currentPage,
        per_page: perPage,
        search,
    });

    const remarks = remarksData?.data || [];
    const totalItems = remarksData?.total || 0;
    const totalPages = remarksData?.last_page || 1;

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRemark, setEditingRemark] = useState<SaleRemark | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        color_code: '#3b82f6',
        is_active: true
    });

    // Delete flow
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [remarkToDelete, setRemarkToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const handleOpenDialog = (remark?: SaleRemark) => {
        if (remark && remark.id === 1) {
            toast.error('System default category cannot be modified');
            return;
        }
        if (remark) {
            setEditingRemark(remark);
            setFormData({
                name: remark.name,
                description: remark.description || '',
                color_code: remark.color_code,
                is_active: !!remark.is_active
            });
        } else {
            setEditingRemark(null);
            setFormData({
                name: '',
                description: '',
                color_code: '#3b82f6',
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

        setIsSaving(true);
        try {
            const url = editingRemark ? `/sales/remarks/${editingRemark.id}` : '/sales/remarks';
            const method = editingRemark ? 'put' : 'post';
            

            await api[method](url, {
                ...formData,
                is_active: formData.is_active ? 1 : 0
            });

            toast.success(editingRemark ? 'Remark updated' : 'Remark created');
            setIsDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ['saleRemarks'] });
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Error saving remark');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = (id: number) => {
        setRemarkToDelete(id);
        setDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!remarkToDelete) return;
        if (remarkToDelete === 1) {
            toast.error('System default category cannot be deleted');
            return;
        }
        setIsDeleting(true);
        try {
            await api.delete(`/sales/remarks/${remarkToDelete}`);
            toast.success('Remark deleted');
            queryClient.invalidateQueries({ queryKey: ['saleRemarks'] });
        } catch (error) {
            toast.error('Error deleting remark');
        } finally {
            setIsDeleting(false);
            setDeleteModalOpen(false);
            setRemarkToDelete(null);
        }
    };

    return (
        <div className="space-y-6 pb-12">
            <FilterBar
                icon={<IconTag className="w-6 h-6 text-primary" />}
                title="Sale Remarks"
                description="Categorize your sales (Claim, Warranty, Normal, etc.)"
                search={search}
                setSearch={setSearch}
                onAdd={() => handleOpenDialog()}
                addLabel="Add Category"
                onRefresh={() => queryClient.invalidateQueries({ queryKey: ['saleRemarks'] })}
                itemsPerPage={perPage}
                setItemsPerPage={setPerPage}
            />

            {loading ? (
                <TableSkeleton columns={4} rows={5} />
            ) : remarks.length === 0 ? (
                <EmptyState
                    isSearch={!!search}
                    searchTerm={search}
                    title={search ? 'No results found' : 'No remarks available'}
                    description={search ? "We couldn't find any remarks matching your search." : 'Get started by creating your first sale remark.'}
                    onAction={() => handleOpenDialog()}
                    actionLabel="Add Category"
                    onClearFilter={() => setSearch('')}
                />
            ) : (
                <div className="panel bg-white dark:bg-gray-900 border-none shadow-sm overflow-hidden p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-white-dark/5 text-gray-500 uppercase text-[10px] font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 text-left">Name</th>
                                    <th className="px-6 py-4 text-left">Description</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {remarks.map((remark: SaleRemark) => (
                                    <tr key={remark.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div 
                                                    className="w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900 ring-1 ring-slate-100 dark:ring-zinc-800 shrink-0" 
                                                    style={{ backgroundColor: remark.color_code }} 
                                                />
                                                <span className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                                    <HighlightText text={remark.name} highlight={search} />
                                                    {remark.id === 1 && (
                                                        <Badge variant="secondary" className="text-[8px] font-black uppercase px-1.5 h-4 bg-slate-100 text-slate-500 border-none">
                                                            System
                                                        </Badge>
                                                    )}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            <HighlightText text={remark.description || '-'} highlight={search} />
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge
                                                size="sm"
                                                variant={remark.is_active ? 'success' : 'destructive'}
                                                className="text-[10px] font-black uppercase tracking-widest"
                                            >
                                                {remark.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <ActionButtons
                                                onEdit={remark.id === 1 ? undefined : () => handleOpenDialog(remark)}
                                                onDelete={remark.id === 1 ? undefined : () => handleDeleteClick(remark.id)}
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
                    <DialogHeader className="shrink-0 p-6 bg-primary/5 dark:bg-primary/10 border-b border-primary/10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-primary/20 text-primary shadow-sm">
                                <IconTag size={24} />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold">
                                    {editingRemark ? 'Edit Category' : 'Add Category'}
                                </DialogTitle>
                                <DialogDescription>
                                    {editingRemark ? 'Update the details for this sale remark category.' : 'Create a new category to organize your sales.'}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <PerfectScrollbar options={{ suppressScrollX: true }} className="flex-1 min-h-0">
                        <form id="remark-form" onSubmit={handleSave} className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name" className="text-sm font-semibold">Category Name <span className="text-danger">*</span></Label>
                                    <Input 
                                        id="name" 
                                        value={formData.name} 
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        placeholder="e.g. Warranty Claim" 
                                        className="h-11 rounded-xl"
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="description" className="text-sm font-semibold">Description</Label>
                                    <Input 
                                        id="description" 
                                        value={formData.description} 
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        placeholder="Optional description..."
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="color" className="text-sm font-semibold">Brand Color</Label>
                                    <div className="flex gap-3 items-center">
                                        <input 
                                            type="color" 
                                            id="color" 
                                            value={formData.color_code} 
                                            onChange={(e) => setFormData({...formData, color_code: e.target.value})}
                                            className="h-11 w-20 cursor-pointer bg-slate-50 border-none p-1"
                                        />
                                        <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">{formData.color_code}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800">
                                    <Checkbox 
                                        id="is_active" 
                                        checked={formData.is_active} 
                                        onCheckedChange={(checked: boolean) => setFormData({...formData, is_active: checked})}
                                        className="w-5 h-5 rounded-md accent-primary cursor-pointer"
                                    />
                                    <Label htmlFor="is_active" className="font-bold text-sm mb-0 cursor-pointer">Visible in POS Selection</Label>
                                </div>
                            </div>
                        </form>
                    </PerfectScrollbar>

                    <DialogFooter className="shrink-0 flex gap-3 p-6 border-t border-gray-100 dark:border-gray-800 bg-background">
                        <Button variant="ghost" className="flex-1 h-11 font-bold" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button 
                            type="submit" 
                            form="remark-form" 
                            className="flex-1 h-11 font-bold shadow-lg shadow-primary/20 gap-2"
                            disabled={isSaving}
                        >
                            {isSaving ? <IconLoader2 className="animate-spin" size={18} /> : <IconDeviceFloppy size={18} />}
                            {editingRemark ? 'Update Category' : 'Save Category'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <DeleteModal 
                isOpen={deleteModalOpen} 
                setIsOpen={setDeleteModalOpen} 
                onConfirm={executeDelete} 
                isLoading={isDeleting} 
                title="Delete Sale Remark" 
                message="Are you sure you want to delete this sale remark? This action cannot be undone." 
            />
        </div>
    );
};

export default SaleRemarkIndex;
