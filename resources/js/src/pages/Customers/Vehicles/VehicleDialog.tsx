import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { toast } from 'sonner';
import { IconCar, IconLoader2 } from '@tabler/icons-react';
import { useCRMCreateVehicle, useCRMUpdateVehicle, useCRMCustomersMinimal, useCRMVehicleBrands, useCRMVehicleModels } from '@/hooks/useCRMData';

interface VehicleDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    vehicle: any | null;
    onSave: () => void;
}

const VehicleDialog = ({ isOpen, setIsOpen, vehicle, onSave }: VehicleDialogProps) => {
    const createMutation = useCRMCreateVehicle();
    const updateMutation = useCRMUpdateVehicle();
    
    // Form state
    const [formData, setFormData] = useState({
        customer_id: null as number | null,
        brand_id: null as number | null,
        model_id: null as number | null,
        plate_number: '',
        vin_last_4: '',
        color: '',
        year: '' as string | number,
        current_mileage: '' as string | number,
    });

    // Queries
    const { data: customersRaw = [], isLoading: customersLoading } = useCRMCustomersMinimal();
    const { data: brands = [], isLoading: brandsLoading } = useCRMVehicleBrands();
    const { data: models = [], isLoading: modelsLoading } = useCRMVehicleModels(formData.brand_id);

    const customers = Array.isArray(customersRaw) ? customersRaw : (customersRaw?.data || []);
    const fetchingData = customersLoading || brandsLoading;
    const loading = createMutation.isPending || updateMutation.isPending;

    useEffect(() => {
        if (isOpen) {
            if (vehicle) {
                setFormData({
                    customer_id: vehicle.customer_id,
                    brand_id: vehicle.brand_id,
                    model_id: vehicle.model_id,
                    plate_number: vehicle.plate_number || '',
                    vin_last_4: vehicle.vin_last_4 || '',
                    color: vehicle.color || '',
                    year: vehicle.year || '',
                    current_mileage: vehicle.current_mileage || '',
                });
            } else {
                setFormData({
                    customer_id: null,
                    brand_id: null,
                    model_id: null,
                    plate_number: '',
                    vin_last_4: '',
                    color: '',
                    year: '',
                    current_mileage: '',
                });
            }
        }
    }, [isOpen, vehicle]);

    const handleBrandChange = (val: number | string) => {
        const brandId = val as number;
        setFormData({ ...formData, brand_id: brandId, model_id: null });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.customer_id || !formData.brand_id || !formData.model_id || !formData.plate_number) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            if (vehicle) {
                await updateMutation.mutateAsync({ id: vehicle.id, data: formData });
                toast.success('Vehicle updated successfully');
            } else {
                await createMutation.mutateAsync(formData);
                toast.success('Vehicle registered successfully');
            }
            setIsOpen(false);
            onSave();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'An error occurred while saving');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="p-6 pb-4 bg-primary/5">
                        <DialogTitle className="flex items-center gap-3 text-xl font-black text-primary">
                            <div className="p-2 rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
                                <IconCar size={24} />
                            </div>
                            {vehicle ? 'Edit Vehicle Info' : 'Register New Vehicle'}
                        </DialogTitle>
                        <DialogDescription className="text-gray-500 font-medium">
                            Enter the vehicle details for your customer's fleet.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto bg-white dark:bg-gray-900 relative min-h-[300px]">
                        {fetchingData && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-[1px]">
                                <div className="flex flex-col items-center gap-3">
                                    <IconLoader2 className="w-10 h-10 text-primary animate-spin" />
                                    <p className="text-sm font-bold text-primary animate-pulse uppercase tracking-widest">Retrieving Data...</p>
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold uppercase text-gray-400 tracking-widest ml-1">Owner (Customer) <span className="text-danger">*</span></Label>
                                <SearchableSelect 
                                    options={customers.map(c => ({ value: c.id, label: `${c.name || 'No Name'} (${c.customer_code}) - ${c.phone || ''}` }))}
                                    value={formData.customer_id}
                                    onChange={(val) => setFormData({ ...formData, customer_id: val as number })}
                                    placeholder="Search Customer..."
                                    className="h-11 font-bold text-sm bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-800"
                                    disabled={fetchingData}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold uppercase text-gray-400 tracking-widest ml-1">Brand <span className="text-danger">*</span></Label>
                                    <SearchableSelect 
                                        options={brands.map(b => ({ value: b.id, label: b.name }))}
                                        value={formData.brand_id}
                                        onChange={handleBrandChange}
                                        placeholder="Select Brand..."
                                        className="h-11 font-bold text-sm bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-800"
                                        disabled={fetchingData}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold uppercase text-gray-400 tracking-widest ml-1">Model <span className="text-danger">*</span></Label>
                                    <SearchableSelect 
                                        options={models.map(m => ({ value: m.id, label: m.name }))}
                                        value={formData.model_id}
                                        onChange={(val) => setFormData({ ...formData, model_id: val as number })}
                                        placeholder={formData.brand_id ? "Select Model..." : "Select Brand First"}
                                        className="h-11 font-bold text-sm bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-800"
                                        disabled={!formData.brand_id}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold uppercase text-gray-400 tracking-widest ml-1">Plate Number <span className="text-danger">*</span></Label>
                                    <Input 
                                        value={formData.plate_number}
                                        onChange={e => setFormData({ ...formData, plate_number: e.target.value.toUpperCase() })}
                                        placeholder="ABC-1234"
                                        className="h-11 font-bold text-sm bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-800"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold uppercase text-gray-400 tracking-widest ml-1">VIN (Last 4)</Label>
                                    <Input 
                                        value={formData.vin_last_4}
                                        onChange={e => setFormData({ ...formData, vin_last_4: e.target.value.toUpperCase().slice(0, 4) })}
                                        placeholder="1234"
                                        maxLength={4}
                                        className="h-11 font-bold text-sm bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-800"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold uppercase text-gray-400 tracking-widest ml-1">Color</Label>
                                    <Input 
                                        value={formData.color}
                                        onChange={e => setFormData({ ...formData, color: e.target.value })}
                                        placeholder="White"
                                        className="h-11 font-bold text-sm bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-800"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold uppercase text-gray-400 tracking-widest ml-1">Year</Label>
                                    <Input 
                                        type="number"
                                        value={formData.year}
                                        onChange={e => setFormData({ ...formData, year: e.target.value })}
                                        placeholder="2024"
                                        className="h-11 font-bold text-sm bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-800 text-center"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold uppercase text-gray-400 tracking-widest ml-1">Mileage</Label>
                                    <Input 
                                        type="number"
                                        value={formData.current_mileage}
                                        onChange={e => setFormData({ ...formData, current_mileage: e.target.value })}
                                        placeholder="0"
                                        className="h-11 font-bold text-sm bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-800 text-right"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 pt-4 bg-gray-50 dark:bg-gray-900/50 border-t dark:border-gray-800">
                        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="font-bold text-gray-500">Cancel</Button>
                        <Button 
                            type="submit" 
                            disabled={loading}
                            className="bg-primary hover:bg-primary/90 text-white font-bold px-8 shadow-lg shadow-primary/20"
                        >
                            {loading ? <IconLoader2 className="mr-2 animate-spin" size={18} /> : null}
                            {vehicle ? 'Update Vehicle' : 'Register Vehicle'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default VehicleDialog;
