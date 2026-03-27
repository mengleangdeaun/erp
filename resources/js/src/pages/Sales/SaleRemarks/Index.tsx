import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { IconPlus, IconEdit, IconTrash, IconCheck, IconX, IconTag } from '@tabler/icons-react';
import { toast } from 'sonner';
import TableSkeleton from '@/components/ui/TableSkeleton';

interface SaleRemark {
    id: number;
    name: string;
    description: string;
    color_code: string;
    is_active: boolean;
}

const SaleRemarkIndex = () => {
    const [remarks, setRemarks] = useState<SaleRemark[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRemark, setEditingRemark] = useState<SaleRemark | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        color_code: '#3b82f6',
        is_active: true
    });

    useEffect(() => {
        fetchRemarks();
    }, []);

    const fetchRemarks = async () => {
        try {
            const response = await fetch('/api/sales/remarks');
            const data = await response.json();
            setRemarks(data);
        } catch (error) {
            toast.error('Failed to fetch sale remarks');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (remark?: SaleRemark) => {
        if (remark) {
            setEditingRemark(remark);
            setFormData({
                name: remark.name,
                description: remark.description || '',
                color_code: remark.color_code,
                is_active: remark.is_active
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

    const handleSave = async () => {
        if (!formData.name) {
            toast.error('Name is required');
            return;
        }

        try {
            const url = editingRemark ? `/api/sales/remarks/${editingRemark.id}` : '/api/sales/remarks';
            const method = editingRemark ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error('Failed to save');

            toast.success(editingRemark ? 'Remark updated' : 'Remark created');
            setIsDialogOpen(false);
            fetchRemarks();
        } catch (error) {
            toast.error('Error saving remark');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this remark?')) return;

        try {
            const response = await fetch(`/api/sales/remarks/${id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                }
            });

            if (!response.ok) throw new Error('Failed to delete');

            toast.success('Remark deleted');
            fetchRemarks();
        } catch (error) {
            toast.error('Error deleting remark');
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-primary/10 text-primary rounded-xl">
                            <IconTag size={28} />
                        </div>
                        Sale Remarks
                    </h1>
                    <p className="text-muted-foreground font-medium">Categorize your sales (Claim, Warranty, Normal, etc.)</p>
                </div>
                <Button onClick={() => handleOpenDialog()} className="h-11 px-6 rounded-xl font-black uppercase text-[11px] tracking-widest gap-2 shadow-lg shadow-primary/20">
                    <IconPlus size={18} /> Add Category
                </Button>
            </div>

            <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-3xl overflow-hidden shadow-sm">
                {loading ? (
                    <TableSkeleton columns={4} rows={5} />
                ) : (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-100 dark:border-zinc-800">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Name</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Description</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right text-slate-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-900">
                            {remarks.map((remark) => (
                                <tr key={remark.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div 
                                                className="w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900 ring-1 ring-slate-100 dark:ring-zinc-800" 
                                                style={{ backgroundColor: remark.color_code }} 
                                            />
                                            <span className="font-bold text-sm">{remark.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-sm text-muted-foreground font-medium">{remark.description || '-'}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        {remark.is_active ? (
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                                <IconCheck size={12} /> Active
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest border border-slate-200">
                                                <IconX size={12} /> Inactive
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(remark)} className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
                                                <IconEdit size={18} />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(remark.id)} className="h-9 w-9 rounded-xl hover:bg-rose-100 hover:text-rose-600 transition-all">
                                                <IconTrash size={18} />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {remarks.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-20">
                                            <IconTag size={48} />
                                            <span className="font-bold uppercase tracking-widest text-xs">No Remarks Found</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md p-0 border-none rounded-3xl overflow-hidden shadow-2xl">
                    <DialogHeader className="p-8 bg-slate-50 dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800">
                        <DialogTitle className="text-2xl font-black tracking-tight">
                            {editingRemark ? 'Edit Category' : 'Add Category'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category Name</Label>
                                <Input 
                                    id="name" 
                                    value={formData.name} 
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="e.g. Warranty Claim" 
                                    className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description</Label>
                                <Input 
                                    id="description" 
                                    value={formData.description} 
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder="Optional description..."
                                    className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="color" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Brand Color</Label>
                                <div className="flex gap-3 items-center">
                                    <input 
                                        type="color" 
                                        id="color" 
                                        value={formData.color_code} 
                                        onChange={(e) => setFormData({...formData, color_code: e.target.value})}
                                        className="h-12 w-20 rounded-xl cursor-pointer bg-slate-50 border-none p-1"
                                    />
                                    <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">{formData.color_code}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <input 
                                    type="checkbox" 
                                    id="is_active" 
                                    checked={formData.is_active} 
                                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                                    className="w-5 h-5 rounded-md accent-primary"
                                />
                                <Label htmlFor="is_active" className="font-bold text-sm cursor-pointer">Visible in POS Selection</Label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="p-8 bg-slate-50 dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800">
                        <div className="flex gap-3 w-full">
                            <Button variant="ghost" className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest h-12" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest h-12 shadow-lg shadow-primary/20" onClick={handleSave}>Save Category</Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SaleRemarkIndex;
