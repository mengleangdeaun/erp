import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
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
            <DialogContent className="sm:max-w-[500px] border-none shadow-2xl rounded-3xl overflow-hidden p-0">
                <DialogHeader className="p-6 bg-primary/5 border-b border-primary/10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-primary/20 text-primary">
                            <IconCategory className="w-6 h-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold">
                                {type ? 'Edit Replacement Category' : 'New Replacement Category'}
                            </DialogTitle>
                            <DialogDescription className='text-xs'>
                                Classify why a part is being replaced (e.g. Warranty, Damage)
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <ScrollArea className="max-h-[60vh]">
                        <div className="p-6 space-y-6">
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">Category Name <span className="text-destructive">*</span></Label>
                                <Input 
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g. Peeling, Bubbling"
                                    className="h-11 shadow-sm"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">Description</Label>
                                <Textarea 
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    placeholder="Provide more context for this category..."
                                    className="min-h-[100px] shadow-sm resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">Status</Label>
                                <Select 
                                    value={form.status}
                                    onValueChange={(val: any) => setForm({ ...form, status: val })}
                                >
                                    <SelectTrigger className="h-11 shadow-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                     <SelectContent>
                                         <SelectItem value="active">Active</SelectItem>
                                         <SelectItem value="inactive">Inactive</SelectItem>
                                     </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </ScrollArea>

                    <DialogFooter className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="h-11 px-6">
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={mutation.isPending}
                            className="h-11 gap-2 px-8 shadow-lg shadow-primary/20"
                        >
                            {mutation.isPending ? <IconLoader2 className="animate-spin" size={18} /> : <IconDeviceFloppy size={18} />}
                            {type ? 'Update' : 'Create'} Category
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ReplacementTypeDialog;
