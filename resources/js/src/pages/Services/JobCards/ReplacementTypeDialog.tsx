import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { IconCategory, IconDeviceFloppy, IconLoader2 } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ReplacementType {
    id: number;
    name: string;
    description: string | null;
    status: 'active' | 'inactive';
}

interface ReplacementTypeDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    type: ReplacementType | null;
    onSave?: () => void;
}

const ReplacementTypeDialog: React.FC<ReplacementTypeDialogProps> = ({ isOpen, setIsOpen, type, onSave }) => {
    const queryClient = useQueryClient();
    
    const [form, setForm] = useState({
        name: '',
        description: '',
        status: 'active' as 'active' | 'inactive'
    });

    useEffect(() => {
        if (isOpen) {
            if (type) {
                setForm({
                    name: type.name || '',
                    description: type.description || '',
                    status: type.status || 'active'
                });
            } else {
                setForm({
                    name: '',
                    description: '',
                    status: 'active'
                });
            }
        }
    }, [isOpen, type]);

    const mutation = useMutation({
        mutationFn: async (values: typeof form) => {
            const url = type?.id ? `/api/services/replacement-types/${type.id}` : '/api/services/replacement-types';
            const method = type?.id ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
                body: JSON.stringify(values),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Something went wrong');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['replacement-types'] });
            toast.success(type?.id ? 'Updated successfully' : 'Created successfully');
            setIsOpen(false);
            onSave?.();
        },
        onError: (error: any) => {
            toast.error(error.message || 'Something went wrong');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            toast.error('Name is required');
            return;
        }
        mutation.mutate(form);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[500px] flex flex-col p-0 border-none shadow-2xl rounded-3xl overflow-hidden">
                <DialogHeader className="shrink-0 p-6 bg-primary/5 dark:bg-primary/10 border-b border-primary/10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-primary/20 text-primary shadow-sm">
                            <IconCategory size={24} />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold">
                                {type ? 'Edit Category' : 'New Category'}
                            </DialogTitle>
                            <DialogDescription>
                                {type ? 'Update details for this replacement category.' : 'Create a new category for part replacements.'}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form id="replacement-type-form" onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <PerfectScrollbar options={{ suppressScrollX: true }} className="flex-1 min-h-0">
                        <div className="p-6 space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-semibold text-slate-600 dark:text-slate-400">Category Name <span className="text-destructive">*</span></Label>
                                <Input 
                                    id="name"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g. Peeling, Bubbling"
                                    className="h-11 rounded-xl border-slate-200 dark:border-zinc-800 focus:ring-primary/20"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-sm font-semibold text-slate-600 dark:text-slate-400">Detailed Description</Label>
                                <Textarea 
                                    id="description"
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    placeholder="Provide more context for this category..."
                                    className="min-h-[120px] rounded-2xl border-slate-200 dark:border-zinc-800 p-4 resize-none focus:ring-primary/20"
                                />
                            </div>

                            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border border-slate-100 dark:border-zinc-800">
                                <Checkbox 
                                    id="status" 
                                    checked={form.status === 'active'} 
                                    onCheckedChange={(checked) => setForm({ ...form, status: checked ? 'active' : 'inactive' })}
                                    className="w-5 h-5 rounded-md accent-primary cursor-pointer"
                                />
                                <div className="space-y-0.5">
                                    <Label htmlFor="status" className="font-bold text-sm block cursor-pointer mb-0">Active / Enabled</Label>
                                    <span className="text-[10px] font-bold text-slate-400 block pointer-events-none uppercase tracking-wider">Visible in selection lists</span>
                                </div>
                            </div>
                        </div>
                    </PerfectScrollbar>

                    <DialogFooter className="shrink-0 flex gap-3 p-6 border-t border-gray-100 dark:border-gray-800 bg-background sm:justify-between">
                        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="flex-1 h-11 font-bold">
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={mutation.isPending}
                            className="flex-1 h-11 font-bold shadow-lg shadow-primary/20 gap-2"
                        >
                            {mutation.isPending ? <IconLoader2 className="animate-spin" size={18} /> : <IconDeviceFloppy size={18} />}
                            {type ? 'Save Changes' : 'Create Category'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ReplacementTypeDialog;
