import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { IconPackages, IconDeviceFloppy, IconPlus, IconTrash, IconInfoCircle, IconLoader2 } from '@tabler/icons-react';
import { toast } from 'sonner';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ServiceMaterial {
    product_id: number;
    suggested_qty: number;
    product?: any;
}

interface Service {
    id: number;
    name: string;
    code: string;
    base_price: string | number;
    description: string | null;
    category_id: number | null;
    is_active: boolean;
    materials: ServiceMaterial[];
    parts: any[];
}

interface ServiceDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    service: Service | null;
    onSave: () => void;
}

const ServiceDialog = ({ isOpen, setIsOpen, service, onSave }: ServiceDialogProps) => {
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [availableParts, setAvailableParts] = useState<any[]>([]);

    const [form, setForm] = useState({
        name: '',
        code: '',
        base_price: 0,
        description: '',
        category_id: null as number | null,
        is_active: true,
        materials: [] as ServiceMaterial[],
        parts: [] as number[],
    });

    useEffect(() => {
        if (isOpen) {
            fetchInitialData();
        }
    }, [isOpen]);

    useEffect(() => {
        if (service && isOpen) {
            setForm({
                name: service.name,
                code: service.code,
                base_price: Number(service.base_price),
                description: service.description || '',
                category_id: service.category_id,
                is_active: Boolean(service.is_active),
                materials: service.materials.map(m => ({
                    product_id: m.product_id,
                    suggested_qty: Number(m.suggested_qty)
                })),
                parts: service.parts.map(p => p.id),
            });
        } else if (isOpen) {
            setForm({
                name: '',
                code: '',
                base_price: 0,
                description: '',
                category_id: null,
                is_active: true,
                materials: [],
                parts: [],
            });
        }
    }, [service, isOpen]);

    const fetchInitialData = async () => {
        try {
            const [catsRes, prodsRes, partsRes] = await Promise.all([
                fetch('/api/inventory/categories'),
                fetch('/api/inventory/products?all=true'),
                fetch('/api/services/parts')
            ]);
            
            const cats = await catsRes.json();
            const prods = await prodsRes.json();
            const parts = await partsRes.json();

            setCategories(Array.isArray(cats) ? cats : []);
            setProducts(Array.isArray(prods) ? prods : (prods.data || []));
            setAvailableParts(Array.isArray(parts) ? parts : []);
        } catch (error) {
            toast.error('Failed to load form data');
        }
    };

    const handleAddMaterial = () => {
        setForm({
            ...form,
            materials: [...form.materials, { product_id: 0, suggested_qty: 1 }]
        });
    };

    const handleRemoveMaterial = (index: number) => {
        const newMats = [...form.materials];
        newMats.splice(index, 1);
        setForm({ ...form, materials: newMats });
    };

    const handleMaterialChange = (index: number, field: string, value: any) => {
        const newMats = [...form.materials];
        newMats[index] = { ...newMats[index], [field]: value };
        setForm({ ...form, materials: newMats });
    };

    const togglePart = (partId: number) => {
        const newParts = form.parts.includes(partId)
            ? form.parts.filter(id => id !== partId)
            : [...form.parts, partId];
        setForm({ ...form, parts: newParts });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!form.name || !form.code) {
            toast.error('Name and Code are required');
            return;
        }

        setSaving(true);
        try {
            const method = service ? 'PUT' : 'POST';
            const url = service ? `/api/services/list/${service.id}` : '/api/services/list';
            
            // Clean materials: remove invalid entries
            const cleanedMaterials = form.materials.filter(m => m.product_id > 0);
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
                body: JSON.stringify({
                    ...form,
                    materials: cleanedMaterials
                }),
            });

            if (response.ok) {
                toast.success(`Service ${service ? 'updated' : 'created'} successfully`);
                onSave();
                setIsOpen(false);
            } else {
                const data = await response.json();
                toast.error(data.message || 'Something went wrong');
            }
        } catch (error) {
            toast.error('Failed to save service');
        } finally {
            setSaving(false);
        }
    };

    return (
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="sm:max-w-[700px] h-[90vh] flex flex-col p-0 overflow-hidden">
    {/* Header – fixed at top */}
    <DialogHeader className="shrink-0 p-6 pb-2">
      <DialogTitle className="flex items-center gap-2 text-xl font-bold">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <IconPackages className="w-5 h-5" />
        </div>
        {service ? 'Edit Service' : 'New Service'}
      </DialogTitle>
      <DialogDescription>
        Configure service details, associated parts, and suggested material usage.
      </DialogDescription>
    </DialogHeader>

    {/* Scrollable form area */}
    <ScrollArea className="flex-1 min-h-0">
      <form id="service-form" onSubmit={handleSubmit} className="p-6 !pt-0 space-y-6">
        {/* Basic Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-gray-500">Service Name</Label>
            <Input 
              value={form.name} 
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. PPF Full Front"
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-gray-500">Service Code</Label>
            <Input 
              value={form.code} 
              onChange={e => setForm({ ...form, code: e.target.value })}
              placeholder="e.g. SRV-PPF-FF"
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-gray-500">Category</Label>
            <SearchableSelect 
              options={categories.map(c => ({ value: c.id, label: c.name }))}
              value={form.category_id}
              onChange={(val) => setForm({ ...form, category_id: val as number })}
              placeholder="Select category"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-gray-500">Base Price ($)</Label>
            <Input 
              type="number"
              step="0.01"
              value={form.base_price} 
              onChange={e => setForm({ ...form, base_price: parseFloat(e.target.value) })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase text-gray-500">Description</Label>
          <Textarea 
            value={form.description} 
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Details about this service..."
            className="min-h-[80px]"
          />
        </div>

        {/* Parts Mapping */}
        <div className="space-y-3">
          <Label className="text-xs font-bold uppercase text-gray-500 block border-b pb-2">Installation Parts Mapping</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {availableParts.map(part => (
              <button
                key={part.id}
                type="button"
                onClick={() => togglePart(part.id)}
                className={`
                  flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-all
                  ${form.parts.includes(part.id) 
                    ? 'bg-primary/10 border-primary text-primary font-semibold shadow-sm' 
                    : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-600 hover:border-gray-300'
                  }
                `}
              >
                <span className="truncate">{part.name}</span>
                {form.parts.includes(part.id) && <IconPackages size={14} className="shrink-0" />}
              </button>
            ))}
          </div>
          {availableParts.length === 0 && (
            <p className="text-center py-2 text-xs text-gray-400 italic bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              No parts defined. Go to Parts Management to add some.
            </p>
          )}
        </div>

        {/* Material Suggested Usage */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <Label className="text-xs font-bold uppercase text-gray-500">Material Associations (Suggested)</Label>
            <Button type="button" variant="ghost" size="sm" onClick={handleAddMaterial} className="h-7 text-[10px] gap-1 px-2">
              <IconPlus size={14} /> Add Material
            </Button>
          </div>
          
          <div className="space-y-2">
            {form.materials.map((mat, index) => (
              <div key={index} className="flex items-center gap-2 bg-gray-50/50 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                <div className="flex-1">
                  <SearchableSelect 
                    options={products.map(p => ({ value: p.id, label: p.name, description: p.sku }))}
                    value={mat.product_id || null}
                    onChange={(val) => handleMaterialChange(index, 'product_id', val)}
                    placeholder="Select product"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="w-24">
                  <Input 
                    type="number"
                    step="0.01"
                    value={mat.suggested_qty}
                    onChange={(e) => handleMaterialChange(index, 'suggested_qty', parseFloat(e.target.value))}
                    placeholder="Qty"
                    className="h-9 text-xs"
                  />
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleRemoveMaterial(index)}
                  className="h-9 w-9 text-red-400 hover:text-red-500 hover:bg-red-50"
                >
                  <IconTrash size={16} />
                </Button>
              </div>
            ))}
            {form.materials.length === 0 && (
              <p className="text-center py-2 text-xs text-gray-400 italic">
                Optional: predefined materials will auto-load in POS.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
          <div className="space-y-0.5">
            <Label className="text-sm font-semibold">Active Catalog Service</Label>
            <p className="text-[10px] text-gray-500">Hidden services will not appear in POS selection</p>
          </div>
          <Switch 
            checked={form.is_active} 
            onCheckedChange={val => setForm({ ...form, is_active: val })} 
          />
        </div>
      </form>
    </ScrollArea>

    {/* Sticky Footer */}
    <div className="shrink-0 flex justify-end gap-2 p-6 border-t bg-gray-50/50 dark:bg-gray-800/50">
      <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="h-10">
        Cancel
      </Button>
      <Button 
        type="submit" 
        form="service-form"
        disabled={saving} 
        className="h-10 gap-2 px-6 min-w-[140px]"
      >
        {saving ? (
          <><IconLoader2 className="animate-spin" size={18} /> Saving...</>
        ) : (
          <><IconDeviceFloppy size={18} /> {service ? 'Update' : 'Create'} Service</>
        )}
      </Button>
    </div>
  </DialogContent>
</Dialog>
    );
};

export default ServiceDialog;
