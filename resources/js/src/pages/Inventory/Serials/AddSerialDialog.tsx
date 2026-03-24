import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useCreateSerial } from '@/hooks/useSerialData';
import { useInventoryProducts, useBranches, useInventoryLocations } from '@/hooks/useInventoryData';
import { IconHash, IconRuler2, IconBuildingStore, IconPackage, IconMapPin } from '@tabler/icons-react';

const AddSerialDialog = ({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (val: boolean) => void }) => {
    const { data: products = [] } = useInventoryProducts();
    const { data: branches = [] } = useBranches();
    const { data: locations = [] } = useInventoryLocations();
    const createMutation = useCreateSerial();

    const [form, setForm] = useState({
        product_id: '',
        serial_number: '',
        length: '',
        width: '',
        branch_id: '',
        location_id: '',
        notes: ''
    });

    // Auto-select primary location when branch changes
    useEffect(() => {
        if (form.branch_id && locations.length > 0) {
            const branchLocations = locations.filter((loc: any) => loc.branch_id === parseInt(form.branch_id));
            const primary = branchLocations.find((loc: any) => loc.is_primary);
            if (primary) {
                setForm(prev => ({ ...prev, location_id: primary.id.toString() }));
            } else if (branchLocations.length > 0) {
                setForm(prev => ({ ...prev, location_id: branchLocations[0].id.toString() }));
            }
        }
    }, [form.branch_id, locations]);

    const productOptions = products.map((p: any) => ({
        value: p.id,
        label: p.name,
        description: `${p.code} | ${p.width || 0}x${p.length || 0}`
    }));

    const branchOptions = branches.map((b: any) => ({
        value: b.id,
        label: b.name
    }));

    const locationOptions = locations
        .filter((loc: any) => !form.branch_id || loc.branch_id === parseInt(form.branch_id))
        .map((loc: any) => ({
            value: loc.id,
            label: loc.name,
            description: loc.is_primary ? 'Primary Location' : ''
        }));

    const handleSubmit = async () => {
        try {
            await createMutation.mutateAsync(form);
            setIsOpen(false);
            setForm({ product_id: '', serial_number: '', length: '', width: '', branch_id: '', location_id: '', notes: '' });
        } catch (error) {
            // Error handled by mutation toast
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[450px] rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <IconRuler2 className="text-primary" />
                        Register New Roll
                    </DialogTitle>
                </DialogHeader>
                
                <div className="grid gap-6 py-4">
                    <div className="grid">
                        <Label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                            <IconPackage size={14} /> Product
                        </Label>
                        <SearchableSelect 
                            options={productOptions}
                            value={form.product_id}
                            onChange={(val) => {
                                const prod = products.find((p: any) => p.id === val);
                                setForm({ ...form, product_id: val as string, width: prod?.width?.toString() || '' });
                            }}
                            placeholder="Select Product..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid">
                            <Label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                <IconBuildingStore size={14} /> Branch
                            </Label>
                            <SearchableSelect 
                                options={branchOptions}
                                value={form.branch_id}
                                onChange={(val) => setForm({ ...form, branch_id: val as string, location_id: '' })}
                                placeholder="Select Branch..."
                            />
                        </div>

                        <div className="grid">
                            <Label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                <IconMapPin size={14} /> Location
                            </Label>
                            <SearchableSelect 
                                options={locationOptions}
                                value={form.location_id}
                                onChange={(val) => setForm({ ...form, location_id: val as string })}
                                placeholder="Select Location..."
                                disabled={!form.branch_id}
                            />
                        </div>
                    </div>

                    <div className="grid">
                        <Label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                            <IconHash size={14} /> Serial Number
                        </Label>
                        <Input 
                            placeholder="e.g. AY-12345"
                            value={form.serial_number}
                            onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                            
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid">
                            <Label className="text-xs font-bold uppercase tracking-widest text-gray-400">Total Length (m)</Label>
                            <Input 
                                type="number"
                                placeholder="30"
                                value={form.length}
                                onChange={(e) => setForm({ ...form, length: e.target.value })}
                                className="font-bold"
                            />
                        </div>
                        <div className="grid">
                            <Label className="text-xs font-bold uppercase tracking-widest text-gray-400">Width (m)</Label>
                            <Input 
                                type="number"
                                placeholder="1.52"
                                value={form.width}
                                onChange={(e) => setForm({ ...form, width: e.target.value })}
                                className=" font-bold"
                            />
                        </div>
                    </div>

                    {form.length && form.width && (
                        <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center gap-2">
                                <IconRuler2 size={16} className="text-primary" />
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">Initial Area</span>
                            </div>
                            <span className="text-xs font-black text-primary">
                                {(parseFloat(form.length) * parseFloat(form.width)).toFixed(2)} SQM
                            </span>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)} >Cancel</Button>
                    <Button onClick={handleSubmit} disabled={createMutation.isPending} className="px-8 flex items-center gap-2">
                        {createMutation.isPending ? 'Registering...' : 'Add Roll to Inventory'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AddSerialDialog;
