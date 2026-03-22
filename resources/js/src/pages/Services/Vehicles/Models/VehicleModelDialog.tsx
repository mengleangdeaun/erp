import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { IconCar, IconDeviceFloppy, IconLoader2 } from '@tabler/icons-react';
import { toast } from 'sonner';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

interface VehicleModel {
    id: number;
    brand_id: number;
    name: string;
    is_active: boolean;
}

interface VehicleModelDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    model: VehicleModel | null;
    onSave: () => void;
}

const VehicleModelDialog = ({ isOpen, setIsOpen, model, onSave }: VehicleModelDialogProps) => {
    const [saving, setSaving] = useState(false);
    const [brands, setBrands] = useState<any[]>([]);
    const [form, setForm] = useState({
        brand_id: null as number | null,
        name: '',
        is_active: true,
    });

    useEffect(() => {
        if (isOpen) {
            fetchBrands();
        }
    }, [isOpen]);

    useEffect(() => {
        if (model && isOpen) {
            setForm({
                brand_id: model.brand_id,
                name: model.name,
                is_active: Boolean(model.is_active),
            });
        } else if (isOpen) {
            setForm({
                brand_id: null,
                name: '',
                is_active: true,
            });
        }
    }, [model, isOpen]);

    const fetchBrands = async () => {
        try {
            const response = await fetch('/api/services/vehicle-brands');
            const data = await response.json();
            setBrands(data);
        } catch (error) {
            toast.error('Failed to load vehicle brands');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.brand_id) {
            toast.error('Please select a brand');
            return;
        }

        setSaving(true);
        try {
            const method = model ? 'PUT' : 'POST';
            const url = model ? `/api/services/vehicle-models/${model.id}` : '/api/services/vehicle-models';
            
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
                toast.success(`Model ${model ? 'updated' : 'created'} successfully`);
                onSave();
                setIsOpen(false);
            } else {
                const data = await response.json();
                toast.error(data.message || 'Something went wrong');
            }
        } catch (error) {
            toast.error('Failed to save model');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <IconCar className="w-5 h-5" />
                        </div>
                        {model ? 'Edit Vehicle Model' : 'New Vehicle Model'}
                    </DialogTitle>
                    <DialogDescription>
                        Define a specific car model and link it to a brand.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-gray-500">Vehicle Brand</Label>
                        <SearchableSelect 
                            options={brands.map(b => ({ value: b.id, label: b.name }))}
                            value={form.brand_id}
                            onChange={(val) => setForm({ ...form, brand_id: val as number })}
                            placeholder="Select brand"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-gray-500">Model Name</Label>
                        <Input 
                            value={form.name} 
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            placeholder="e.g. Camry, X5, Model 3"
                            required
                            className="h-10"
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white-dark/5 rounded-xl border border-gray-100 dark:border-gray-800">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-semibold">Active Status</Label>
                            <p className="text-[10px] text-gray-500">Enable or disable this model in selection lists</p>
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
                {model ? 'Update' : 'Create'} Model
            </>
        )}
    </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default VehicleModelDialog;
