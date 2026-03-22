import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IconCar, IconDeviceFloppy, IconLoader2, IconPhoto, IconTrash, IconUpload, IconLink } from '@tabler/icons-react';
import { toast } from 'sonner';
import MediaSelector, { MediaFile } from '@/components/MediaSelector';

interface VehicleBrand {
    id: number;
    name: string;
    image?: string;
    is_active: boolean;
}

interface VehicleBrandDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    brand: VehicleBrand | null;
    onSave: () => void;
}

const VehicleBrandDialog = ({ isOpen, setIsOpen, brand, onSave }: VehicleBrandDialogProps) => {
    const [saving, setSaving] = useState(false);
    const [mediaOpen, setMediaOpen] = useState(false);
    const [form, setForm] = useState<any>({
        name: '',
        image: '',
        is_active: true,
    });

    useEffect(() => {
        if (brand) {
            setForm({
                name: brand.name,
                image: brand.image || '',
                is_active: Boolean(brand.is_active),
            });
        } else {
            setForm({
                name: '',
                image: '',
                is_active: true,
            });
        }
    }, [brand, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('name', form.name);
            formData.append('is_active', form.is_active ? '1' : '0');
            
            if (form.image) {
                // If it's a File object (from Upload)
                if (form.image instanceof File) {
                    formData.append('image', form.image);
                } else {
                    // If it's a string (from URL or Media Selector)
                    formData.append('image', form.image);
                }
            }

            if (brand) {
                formData.append('_method', 'PUT');
            }

            const url = brand ? `/api/services/vehicle-brands/${brand.id}` : '/api/services/vehicle-brands';
            
            const response = await fetch(url, {
                method: 'POST', // Use POST with _method=PUT for file uploads in Laravel
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
                body: formData,
            });

            if (response.ok) {
                toast.success(`Brand ${brand ? 'updated' : 'created'} successfully`);
                onSave();
                setIsOpen(false);
            } else {
                const data = await response.json();
                toast.error(data.message || 'Something went wrong');
            }
        } catch (error) {
            toast.error('Failed to save brand');
        } finally {
            setSaving(false);
        }
    };

    const handleMediaSelect = (file: MediaFile) => {
        setForm({ ...form, image: file.url });
        setMediaOpen(false);
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <IconCar className="w-5 h-5" />
                            </div>
                            {brand ? 'Edit Vehicle Brand' : 'New Vehicle Brand'}
                        </DialogTitle>
                        <DialogDescription>
                            Define a car manufacturer (e.g., Toyota, BMW, Tesla) and its logo.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-gray-500">Brand Name</Label>
                            <Input 
                                value={form.name} 
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g. Mercedes-Benz"
                                required
                                className="h-10"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase text-gray-500">Brand Logo</Label>
                            
                            {/* Preview */}
                            <div className="flex items-start gap-4">
                                <div className="relative w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800 overflow-hidden group bg-gray-50 dark:bg-white-dark/5 flex items-center justify-center">
                                    {form.image ? (
                                        <>
                                            <img 
                                                src={typeof form.image === 'string' ? form.image : URL.createObjectURL(form.image)} 
                                                className="w-full h-full object-contain p-2"
                                                alt="Logo Preview"
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setForm({...form, image: ''})}
                                                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                            >
                                                <IconTrash className="text-white w-5 h-5" />
                                            </button>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center text-gray-400 p-2 text-center">
                                            <IconPhoto size={24} className="mb-1 opacity-50" />
                                            <span className="text-[10px]">No Logo</span>
                                        </div>
                                    )}
                                </div>

                                <Tabs defaultValue="media" className="flex-1">
                                    <TabsList className="grid w-full grid-cols-3 h-8 bg-gray-100/50 dark:bg-white-dark/10 p-1">
                                        <TabsTrigger value="media" className="text-[9px] uppercase font-bold py-1">
                                            <IconPhoto size={14} className="mr-1" /> Media
                                        </TabsTrigger>
                                        <TabsTrigger value="upload" className="text-[9px] uppercase font-bold py-1">
                                            <IconUpload size={14} className="mr-1" /> Upload
                                        </TabsTrigger>
                                        <TabsTrigger value="url" className="text-[9px] uppercase font-bold py-1">
                                            <IconLink size={14} className="mr-1" /> URL
                                        </TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="media" className="mt-2">
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            className="w-full gap-2 text-xs h-9 border-dashed hover:bg-primary/5 hover:text-primary hover:border-primary/50 transition-all"
                                            onClick={() => setMediaOpen(true)}
                                        >
                                            <IconPhoto size={16} /> Open Library
                                        </Button>
                                    </TabsContent>
                                    <TabsContent value="upload" className="mt-2">
                                        <div className="relative">
                                            <Input 
                                                type="file" 
                                                accept="image/*"
                                                onChange={e => {
                                                    if(e.target.files?.[0]) {
                                                        setForm({...form, image: e.target.files[0]});
                                                    }
                                                }}
                                                className="h-9 text-[10px] py-1 opacity-0 absolute inset-0 cursor-pointer z-10"
                                            />
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                className="w-full gap-2 text-xs h-9 border-dashed"
                                            >
                                                <IconUpload size={16} /> Choose File
                                            </Button>
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="url" className="mt-2">
                                        <Input 
                                            placeholder="https://example.com/logo.png"
                                            value={typeof form.image === 'string' ? form.image : ''}
                                            onChange={e => setForm({...form, image: e.target.value})}
                                            className="h-9 text-xs"
                                        />
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white-dark/5 rounded-xl border border-gray-100 dark:border-gray-800">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-semibold">Active Status</Label>
                                <p className="text-[10px] text-gray-500">Enable or disable this brand in selection lists</p>
                            </div>
                            <Switch 
                                checked={form.is_active} 
                                onCheckedChange={val => setForm({ ...form, is_active: val })} 
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="h-10">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={saving} className="h-10 gap-2 px-6">
                                {saving ? (
                                    <>
                                        <IconLoader2 size={18} className="animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <IconDeviceFloppy size={18} /> 
                                        {brand ? 'Update' : 'Create'} Brand
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <MediaSelector 
                open={mediaOpen}
                onOpenChange={setMediaOpen}
                onSelect={handleMediaSelect}
                acceptedType="photo"
            />
        </>
    );
};

export default VehicleBrandDialog;
