import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { IconSettings, IconDeviceFloppy, IconUsersGroup } from '@tabler/icons-react';
import { toast } from 'sonner';
import { useCRMCustomerTypeCreate, useCRMCustomerTypeUpdate } from '@/hooks/useCRMData';

interface CustomerType {
    id: number;
    name: string;
    description: string | null;
    is_default: boolean;
}

interface CustomerTypeDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    type: CustomerType | null;
    onSave: () => void;
}

const CustomerTypeDialog = ({ isOpen, setIsOpen, type, onSave }: CustomerTypeDialogProps) => {
    const createMutation = useCRMCustomerTypeCreate();
    const updateMutation = useCRMCustomerTypeUpdate();

    const [form, setForm] = useState({
        name: '',
        description: '',
        is_default: false,
    });

    const saving = createMutation.isPending || updateMutation.isPending;

    useEffect(() => {
        if (type) {
            setForm({
                name: type.name,
                description: type.description || '',
                is_default: type.is_default,
            });
        } else {
            setForm({
                name: '',
                description: '',
                is_default: false,
            });
        }
    }, [type, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (type) {
                await updateMutation.mutateAsync({ id: type.id, data: form });
                toast.success('Customer type updated successfully');
            } else {
                await createMutation.mutateAsync(form);
                toast.success('Customer type created successfully');
            }
            onSave();
            setIsOpen(false);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to save customer type');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <IconUsersGroup className="w-5 h-5" />
                        </div>
                        {type ? 'Edit Customer Type' : 'New Customer Type'}
                    </DialogTitle>
                    <DialogDescription>
                        Define a dynamic category for your customers.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-gray-500">Type Name</Label>
                        <Input 
                            value={form.name} 
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            placeholder="e.g. VIP, Wholesale"
                            required
                            className="h-10"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-gray-500">Description</Label>
                        <Textarea 
                            value={form.description} 
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            placeholder="Brief details about this type..."
                            className="min-h-[80px]"
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white-dark/5 rounded-xl border border-gray-100 dark:border-gray-800">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-semibold">Default Type</Label>
                            <p className="text-[10px] text-gray-500">Automatically assign to new customers</p>
                        </div>
                        <Switch 
                            checked={form.is_default} 
                            onCheckedChange={val => setForm({ ...form, is_default: val })} 
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="h-10">Cancel</Button>
                        <Button type="submit" disabled={saving} className="h-10 gap-2 px-6">
                            {saving ? 'Saving...' : <><IconDeviceFloppy size={18} /> {type ? 'Update' : 'Create'} Type</>}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CustomerTypeDialog;
