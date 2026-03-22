import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { IconTools, IconDeviceFloppy, IconLoader2 } from '@tabler/icons-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface JobPart {
    id: number;
    name: string;
    code?: string;
    type?: string;
    is_active: boolean;
}

interface JobPartDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    part: JobPart | null;
    onSave: () => void;
}

const JobPartDialog = ({ isOpen, setIsOpen, part, onSave }: JobPartDialogProps) => {
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: '',
        code: '',
        type: '',
        is_active: true,
    });

    useEffect(() => {
        if (part) {
            setForm({
                name: part.name,
                code: part.code || '',
                type: part.type || '',
                is_active: Boolean(part.is_active),
            });
        } else {
            setForm({
                name: '',
                code: '',
                type: '',
                is_active: true,
            });
        }
    }, [part, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const method = part ? 'PUT' : 'POST';
            const url = part ? `/api/services/parts/${part.id}` : '/api/services/parts';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
                body: JSON.stringify(form),
            });

            if (response.ok) {
                toast.success(`Part ${part ? 'updated' : 'created'} successfully`);
                onSave();
                setIsOpen(false);
            } else {
                const data = await response.json();
                toast.error(data.message || 'Something went wrong');
            }
        } catch (error) {
            toast.error('Failed to save part');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <IconTools className="w-5 h-5" />
                        </div>
                        {part ? 'Edit Installation Part' : 'New Installation Part'}
                    </DialogTitle>
                    <DialogDescription>
                        Define a vehicle component for service tracking.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-gray-500">Part Name</Label>
                        <Input 
                            value={form.name} 
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            placeholder="e.g. Hood, Front Bumper, Full Door"
                            required
                            className="h-10"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-gray-500">Part Code</Label>
                        <Input 
                            value={form.code} 
                            onChange={e => setForm({ ...form, code: e.target.value })}
                            placeholder="e.g. FM-001"
                            className="h-10"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-gray-500">Category (Optional)</Label>
                         <Input 
                            value={form.type} 
                            onChange={e => setForm({ ...form, type: e.target.value })}
                            placeholder="e.g. Exterior, Interior, Glass"
                            className="h-10"
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white-dark/5 rounded-xl border border-gray-100 dark:border-gray-800">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-semibold">Active Status</Label>
                            <p className="text-[10px] text-gray-500">Enable or disable this part in the catalog</p>
                        </div>
                        <Switch 
                            checked={form.is_active} 
                            onCheckedChange={val => setForm({ ...form, is_active: val })} 
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="h-10">Cancel</Button>
    <Button type="submit" disabled={saving} className="h-10 gap-2 px-6">
        {saving ? (
            <>
                <IconLoader2 size={18} className="animate-spin" />
                Saving...
            </>
        ) : (
            <>
                <IconDeviceFloppy size={18} /> 
                {part ? 'Update' : 'Create'} Part
            </>
        )}
    </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default JobPartDialog;
