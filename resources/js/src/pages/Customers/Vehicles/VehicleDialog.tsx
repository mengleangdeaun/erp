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
import api from '@/utils/api';
import { useCRMCreateVehicle, useCRMUpdateVehicle, useCRMCustomersMinimal, useCRMVehicleBrands, useCRMVehicleModels } from '@/hooks/useCRMData';
import { useTranslation } from 'react-i18next';
import { IconCar, IconLoader2, IconPlus } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';

// Integrated Quick Add Sub-component
const QuickAddFooter = ({ label, onAdd, isSaving }: { label: string, onAdd: (name: string) => void, isSaving: boolean }) => {
    const [isInputVisible, setIsInputVisible] = useState(false);
    const [name, setName] = useState('');

    if (isSaving) {
        return (
            <div className="flex items-center gap-2 px-4 py-3 text-[10px] font-bold uppercase text-primary/50 animate-pulse">
                <IconLoader2 size={14} className="animate-spin" />
                <span>Saving {label}...</span>
            </div>
        );
    }

    if (!isInputVisible) {
        return (
            <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); setIsInputVisible(true); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold uppercase text-primary hover:bg-primary/5 transition-colors"
            >
                <IconPlus size={14} stroke={3} />
                <span>Add New {label}</span>
            </button>
        );
    }

    return (
        <div className="p-3 space-y-3 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80" onClick={(e) => e.stopPropagation()}>
            <Input 
                autoFocus
                placeholder={`Enter ${label} Name...`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        onAdd(name);
                        setName('');
                        setIsInputVisible(false);
                    }
                    if (e.key === 'Escape') setIsInputVisible(false);
                }}
                className="h-9 text-[11px] font-bold rounded-lg border-primary/20 bg-white dark:bg-dark shadow-sm"
            />
            <div className="flex items-center gap-2">
                <Button 
                    size="sm" 
                    className="h-8 text-[9px] font-bold uppercase px-3 py-1 bg-primary hover:bg-primary/90 text-white"
                    onClick={() => {
                        if (name.trim()) onAdd(name);
                        setName('');
                        setIsInputVisible(false);
                    }}
                >Save</Button>
                <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 text-[9px] font-bold uppercase px-3 py-1 hover:bg-red-50 hover:text-red-500"
                    onClick={() => setIsInputVisible(false)}
                >Cancel</Button>
            </div>
        </div>
    );
};

interface VehicleDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    vehicle: any | null;
    onSave: () => void;
}

const VehicleDialog = ({ isOpen, setIsOpen, vehicle, onSave }: VehicleDialogProps) => {
    const { t } = useTranslation();
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

    const queryClient = useQueryClient();
    const [isSavingBrand, setIsSavingBrand] = useState(false);
    const [isSavingModel, setIsSavingModel] = useState(false);

    const handleQuickAddBrand = async (name: string) => {
        if (!name) return;
        setIsSavingBrand(true);
        try {
            const res = await api.post('/services/vehicle-brands', { name, is_active: true });
            if (res.data) {
                toast.success(`Brand "${name}" created`);
                queryClient.invalidateQueries({ queryKey: ['crm_vehicle_brands'] });
                setFormData(prev => ({ ...prev, brand_id: res.data.id, model_id: null }));
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to create brand');
        } finally {
            setIsSavingBrand(false);
        }
    };

    const handleQuickAddModel = async (name: string) => {
        if (!name || !formData.brand_id) return;
        setIsSavingModel(true);
        try {
            const res = await api.post('/services/vehicle-models', { brand_id: formData.brand_id, name, is_active: true });
            if (res.data) {
                toast.success(`Model "${name}" created`);
                queryClient.invalidateQueries({ queryKey: ['crm_vehicle_models'] });
                setFormData(prev => ({ ...prev, model_id: res.data.id }));
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to create model');
        } finally {
            setIsSavingModel(false);
        }
    };

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
            toast.error(t('fill_required_fields'));
            return;
        }

        try {
            if (vehicle) {
                await updateMutation.mutateAsync({ id: vehicle.id, data: formData });
                toast.success(t('success_update_vehicle'));
            } else {
                await createMutation.mutateAsync(formData);
                toast.success(t('success_register_vehicle'));
            }
            setIsOpen(false);
            onSave();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || t('error_saving'));
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
                <form onSubmit={handleSubmit}>
    <DialogHeader className="shrink-0 p-6 bg-primary/5 dark:bg-primary/10 border-b border-primary/10">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-primary/20 text-primary shadow-sm">
          <IconCar className="w-6 h-6" />
        </div>
        <div>
          <DialogTitle className="text-xl font-bold">
            {vehicle ? t('edit_vehicle_info') : t('register_new_vehicle')}
          </DialogTitle>
          <DialogDescription>
            {vehicle ? t('update_details_for', { no: vehicle.plate_number }) : t('enter_vehicle_info')}
          </DialogDescription>
        </div>
      </div>
    </DialogHeader>

                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto bg-white dark:bg-gray-900 relative min-h-[300px]">
                        {fetchingData && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-[1px]">
                                <div className="flex flex-col items-center gap-3">
                                    <IconLoader2 className="w-10 h-10 text-primary animate-spin" />
                                    <p className="text-sm font-bold text-primary animate-pulse uppercase tracking-widest">{t('retrieving_data')}</p>
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-1">
                                <Label className="text-[11px] font-bold uppercase text-gray-400 tracking-widest ml-1">{t('owner_customer')} <span className="text-danger">*</span></Label>
                                <SearchableSelect 
                                    options={customers.map((c: any) => ({ value: c.id, label: `${c.name || 'No Name'} (${c.customer_code}) - ${c.phone || ''}` }))}
                                    value={formData.customer_id}
                                    onChange={(val) => setFormData({ ...formData, customer_id: val as number })}
                                    placeholder={t('search_customer')}
                                    className="h-11 font-bold text-sm dark:bg-dark rounded-lg"
                                    disabled={fetchingData}
                                    loading={customersLoading}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-[11px] font-bold uppercase text-gray-400 tracking-widest ml-1">{t('brand_label')} <span className="text-danger">*</span></Label>
                                    <SearchableSelect 
                                        options={brands.map((b: any) => ({ value: b.id, label: b.name }))}
                                        value={formData.brand_id}
                                        onChange={handleBrandChange}
                                        placeholder={t('select_brand')}
                                        className="h-11 font-bold text-sm dark:bg-dark rounded-lg"
                                        disabled={fetchingData || brandsLoading}
                                        loading={brandsLoading}
                                        footer={
                                            <QuickAddFooter 
                                                label="Brand" 
                                                onAdd={handleQuickAddBrand} 
                                                isSaving={isSavingBrand} 
                                            />
                                        }
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[11px] font-bold uppercase text-gray-400 tracking-widest ml-1">{t('model_label')} <span className="text-danger">*</span></Label>
                                    <SearchableSelect 
                                        options={models.map((m: any) => ({ value: m.id, label: m.name }))}
                                        value={formData.model_id}
                                        onChange={(val) => setFormData({ ...formData, model_id: val as number })}
                                        placeholder={formData.brand_id ? t('select_model') : t('select_brand_first')}
                                        className="h-11 font-bold text-sm dark:bg-dark rounded-lg"
                                        disabled={!formData.brand_id || modelsLoading}
                                        loading={modelsLoading}
                                        footer={
                                            formData.brand_id && (
                                                <QuickAddFooter 
                                                    label="Model" 
                                                    onAdd={handleQuickAddModel} 
                                                    isSaving={isSavingModel} 
                                                />
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold uppercase text-gray-400 tracking-widest ml-1">{t('plate_number')} <span className="text-danger">*</span></Label>
                                    <Input 
                                        value={formData.plate_number}
                                        onChange={e => setFormData({ ...formData, plate_number: e.target.value.toUpperCase() })}
                                        placeholder="ABC-1234"
                                        className="h-11 font-bold text-sm rounded-lg"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold uppercase text-gray-400 tracking-widest ml-1">{t('vin_last_4_label')}</Label>
                                    <Input 
                                        value={formData.vin_last_4}
                                        onChange={e => setFormData({ ...formData, vin_last_4: e.target.value.toUpperCase().slice(0, 4) })}
                                        placeholder="1234"
                                        maxLength={4}
                                        className="h-11 font-bold text-sm  rounded-lg"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold uppercase text-gray-400 tracking-widest ml-1">{t('color_label')}</Label>
                                    <Input 
                                        value={formData.color}
                                        onChange={e => setFormData({ ...formData, color: e.target.value })}
                                        placeholder="White"
                                        className="h-11 font-bold text-sm  rounded-lg"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold uppercase text-gray-400 tracking-widest ml-1">{t('year_label')}</Label>
                                    <Input 
                                        type="number"
                                        value={formData.year}
                                        onChange={e => setFormData({ ...formData, year: e.target.value })}
                                        placeholder="2024"
                                        className="h-11 font-bold text-sm text-center rounded-lg"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold uppercase text-gray-400 tracking-widest ml-1">{t('mileage_label')}</Label>
                                    <Input 
                                        type="number"
                                        value={formData.current_mileage}
                                        onChange={e => setFormData({ ...formData, current_mileage: e.target.value })}
                                        placeholder="0"
                                        className="h-11 font-bold text-sm  text-right rounded-lg"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 pt-4 bg-gray-50 dark:bg-dark border-t dark:border-gray-800">
                        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="font-bold text-gray-500">{t('cancel')}</Button>
                        <Button 
                            type="submit" 
                            disabled={loading}
                            className="bg-primary hover:bg-primary/90 text-white font-bold px-8 shadow-primary/20"
                        >
                            {loading ? <IconLoader2 className="mr-2 animate-spin" size={18} /> : null}
                            {vehicle ? t('update_vehicle_btn') : t('register_vehicle_btn')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default VehicleDialog;
