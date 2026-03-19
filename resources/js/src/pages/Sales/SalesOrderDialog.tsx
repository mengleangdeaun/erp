import { useEffect, useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IconReceipt, IconPlus, IconTrash, IconCar, IconUser, IconPackage, IconTools, IconDeviceFloppy, IconLoader2, IconX, IconInfoCircle } from '@tabler/icons-react';
import { toast } from 'sonner';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SalesOrder {
    id?: number;
    order_no?: string;
    customer_id: number | null;
    vehicle_id: number | null;
    order_date: string;
    items: SalesOrderItem[];
    subtotal: number;
    tax_total: number;
    discount_total: number;
    grand_total: number;
    notes: string;
}

interface SalesOrderItem {
    service_id: number | null;
    product_id: number | null;
    qty: number;
    unit_price: number;
    discount: number;
}

interface SalesOrderDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    order: any | null;
    onSave: () => void;
}

const SalesOrderDialog = ({ isOpen, setIsOpen, order, onSave }: SalesOrderDialogProps) => {
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Master data
    const [customers, setCustomers] = useState<any[]>([]);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);

    const [form, setForm] = useState<SalesOrder>({
        customer_id: null,
        vehicle_id: null,
        order_date: format(new Date(), 'yyyy-MM-dd'),
        items: [],
        subtotal: 0,
        tax_total: 0,
        discount_total: 0,
        grand_total: 0,
        notes: '',
    });

    // Inline Vehicle Registration state
    const [showAddVehicle, setShowAddVehicle] = useState(false);
    const [newVehicle, setNewVehicle] = useState({
        brand_id: null as number | null,
        model_id: null as number | null,
        plate_no: '',
        vin_last_4: '',
    });
    const [brands, setBrands] = useState<any[]>([]);
    const [models, setModels] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchMasterData();
            if (order) {
                // View Mode
                setForm({
                    customer_id: order.customer_id,
                    vehicle_id: order.vehicle_id,
                    order_date: order.order_date,
                    items: order.items || [],
                    subtotal: parseFloat(order.subtotal),
                    tax_total: parseFloat(order.tax_total),
                    discount_total: parseFloat(order.discount_total),
                    grand_total: parseFloat(order.grand_total),
                    notes: order.notes || '',
                });
            } else {
                // Create Mode
                setForm({
                    customer_id: null,
                    vehicle_id: null,
                    order_date: format(new Date(), 'yyyy-MM-dd'),
                    items: [],
                    subtotal: 0,
                    tax_total: 0,
                    discount_total: 0,
                    grand_total: 0,
                    notes: '',
                });
            }
        }
    }, [isOpen, order]);

    const fetchMasterData = async () => {
        setLoading(true);
        try {
            const [custRes, servRes, prodRes, branchRes, brandRes] = await Promise.all([
                fetch('/api/crm/customers'),
                fetch('/api/services/list'),
                fetch('/api/inventory/products'),
                fetch('/api/hr/branches'), 
                fetch('/api/services/vehicle-brands'),
            ]);

            const [cust, serv, prod, bran, brnd] = await Promise.all([
                custRes.json(), servRes.json(), prodRes.json(), branchRes.json(), brandRes.json()
            ]);

            setCustomers(cust);
            setServices(serv);
            setProducts(prod);
            setBranches(bran);
            setBrands(brnd);
        } catch (error) {
            toast.error('Failed to load transaction data');
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomerVehicles = async (cid: number) => {
        try {
            const response = await fetch(`/api/crm/customer-vehicles?customer_id=${cid}`);
            const data = await response.json();
            setVehicles(data);
        } catch (error) {
            toast.error('Failed to load customer vehicles');
        }
    };

    useEffect(() => {
        if (form.customer_id) {
            fetchCustomerVehicles(form.customer_id);
        } else {
            setVehicles([]);
        }
    }, [form.customer_id]);

    const handleAddItem = (type: 'service' | 'product', id: number) => {
        let item: any;
        if (type === 'service') {
            const s = services.find(x => x.id === id);
            item = { service_id: s.id, product_id: null, qty: 1, unit_price: parseFloat(s.price), discount: 0 };
        } else {
            const p = products.find(x => x.id === id);
            item = { service_id: null, product_id: p.id, qty: 1, unit_price: parseFloat(p.price || 0), discount: 0 };
        }
        setForm(prev => ({ ...prev, items: [...prev.items, item] }));
    };

    const updateItem = (index: number, changes: Partial<SalesOrderItem>) => {
        const newItems = [...form.items];
        newItems[index] = { ...newItems[index], ...changes };
        setForm({ ...form, items: newItems });
    };

    const removeItem = (index: number) => {
        setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
    };

    // Calculate totals whenever items change
    useEffect(() => {
        const subtotal = form.items.reduce((acc, item) => acc + (item.qty * item.unit_price), 0);
        const discount_total = form.items.reduce((acc, item) => acc + (parseFloat(item.discount as any) || 0), 0);
        const grand_total = subtotal - discount_total;
        setForm(prev => ({ ...prev, subtotal, discount_total, grand_total }));
    }, [form.items]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (order) return; // Read-only for now if order exists

        if (!form.customer_id || !form.vehicle_id || form.items.length === 0) {
            toast.error('Missing customer, vehicle, or items');
            return;
        }

        setSaving(true);
        try {
            const response = await fetch('/api/sales/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
                body: JSON.stringify({
                    ...form,
                    branch_id: branches[0]?.id || 1, // Auto-pick first branch for now
                }),
            });

            if (response.ok) {
                toast.success('Sale processed and Job Card initiated!');
                onSave();
                setIsOpen(false);
            } else {
                const data = await response.json();
                toast.error(data.message || 'Payment processing failed');
            }
        } catch (error) {
            toast.error('Critical transaction error');
        } finally {
            setSaving(false);
        }
    };

    const handleAddVehicle = async () => {
        if (!form.customer_id || !newVehicle.brand_id || !newVehicle.model_id || !newVehicle.plate_no) {
            toast.error('Please fill all vehicle fields');
            return;
        }
        try {
            const response = await fetch('/api/crm/customer-vehicles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
                body: JSON.stringify({ ...newVehicle, customer_id: form.customer_id }),
            });
            if (response.ok) {
                const data = await response.json();
                toast.success('Vehicle added');
                fetchCustomerVehicles(form.customer_id);
                setForm({ ...form, vehicle_id: data.id });
                setShowAddVehicle(false);
            }
        } catch (error) {
            toast.error('Failed to add vehicle');
        }
    };

    const fetchModels = async (bid: number) => {
        try {
            const response = await fetch(`/api/services/vehicle-models?brand_id=${bid}`);
            const data = await response.json();
            setModels(data);
        } catch (error) {
            toast.error('Failed to load models');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-[1000px] w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden border-0 shadow-2xl rounded-2xl bg-gray-50 dark:bg-gray-900">
                <DialogHeader className="p-6 bg-white dark:bg-gray-900 border-b dark:border-gray-800 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-sm">
                                <IconReceipt className="w-6 h-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                                    {order ? `Invoiced Order: ${order.order_no}` : 'Point of Sale (POS)'}
                                </DialogTitle>
                                <DialogDescription className="text-xs font-medium text-gray-400 uppercase tracking-widest mt-0.5">
                                    {order ? `Processed on ${format(new Date(order.order_date), 'dd MMMM yyyy')}` : 'Initiate direct sale or installation service'}
                                </DialogDescription>
                            </div>
                        </div>
                        {order && (
                            <Badge variant={order.status === 'Completed' ? 'success' : 'warning'} className="px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-full shadow-sm">
                                {order.status}
                            </Badge>
                        )}
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-0">
                    {/* Left Side: Order Builder */}
                    <div className="flex-1 flex flex-col bg-white dark:bg-gray-950 border-r dark:border-gray-800 overflow-hidden">
                        <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                            {/* Customer & Vehicle Header */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5 p-4 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:bg-white dark:hover:bg-gray-900">
                                    <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1">
                                        <IconUser size={12} className="text-primary" /> Active Customer
                                    </Label>
                                    <SearchableSelect 
                                        options={customers.map(c => ({ value: c.id, label: `${c.name} (${c.customer_code})` }))}
                                        value={form.customer_id}
                                        onChange={(val) => { setForm({ ...form, customer_id: val as number, vehicle_id: null }); }}
                                        placeholder="Search by Name/PIN..."
                                        disabled={!!order}
                                        className="border-0 bg-transparent shadow-none focus:ring-0 p-0 text-lg font-bold"
                                    />
                                </div>
                                <div className="space-y-1.5 p-4 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:bg-white dark:hover:bg-gray-900">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1">
                                            <IconCar size={12} className="text-primary" /> Service Vehicle
                                        </Label>
                                        {!order && form.customer_id && (
                                            <button 
                                                type="button" 
                                                className="text-[10px] font-bold text-primary hover:underline uppercase tracking-tighter"
                                                onClick={() => setShowAddVehicle(true)}
                                            >
                                                + New Car
                                            </button>
                                        )}
                                    </div>
                                    <SearchableSelect 
                                        options={vehicles.map(v => ({ value: v.id, label: `${v.plate_no} - ${v.brand?.name} ${v.model?.name}` }))}
                                        value={form.vehicle_id}
                                        onChange={(val) => setForm({ ...form, vehicle_id: val as number })}
                                        placeholder={form.customer_id ? "Select Vehicle..." : "Select Customer First"}
                                        disabled={!!order || !form.customer_id}
                                        className="border-0 bg-transparent shadow-none focus:ring-0 p-0 text-lg font-bold"
                                    />
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="space-y-4 pt-4">
                                <div className="flex items-center justify-between border-b dark:border-gray-800 pb-2">
                                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                                        Order Composition
                                        <Badge variant="secondary" className="rounded-full h-5 min-w-[20px] p-0 flex items-center justify-center text-[10px]">
                                            {form.items.length}
                                        </Badge>
                                    </h3>
                                </div>
                                
                                {form.items.length === 0 ? (
                                    <div className="py-12 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 dark:bg-gray-900/20 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-800 italic">
                                        <IconReceipt size={48} className="opacity-10 mb-4" />
                                        <p className="text-sm font-medium tracking-tight">The order manifest is currently empty.</p>
                                        <p className="text-[10px] uppercase font-bold tracking-widest mt-1">Add catalog items from the sidebar</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {form.items.map((item, idx) => {
                                            const s = item.service_id ? services.find(x => x.id === item.service_id) : null;
                                            const p = item.product_id ? products.find(x => x.id === item.product_id) : null;
                                            return (
                                                <div key={idx} className="group relative flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all">
                                                    <div className={`p-3 rounded-xl ${item.service_id ? 'bg-primary/5 text-primary' : 'bg-emerald-500/10 text-emerald-600'}`}>
                                                        {item.service_id ? <IconTools size={20} /> : <IconPackage size={20} />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-gray-900 dark:text-white leading-tight">
                                                            {s ? s.name : p ? p.name : 'Unknown Item'}
                                                        </h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge variant="outline" className="text-[9px] font-black h-4 uppercase tracking-tighter opacity-70">
                                                                {item.service_id ? 'Service' : 'Product'}
                                                            </Badge>
                                                            {item.service_id && (
                                                                <span className="text-[10px] text-primary/70 font-bold uppercase tracking-widest flex items-center gap-0.5">
                                                                    <IconInfoCircle size={10} /> {s.parts?.length || 0} Parts Mapped
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-6">
                                                        <div className="flex flex-col items-end">
                                                            <Label className="text-[9px] font-bold text-gray-400 uppercase">Qty</Label>
                                                            <Input 
                                                                type="number" 
                                                                value={item.qty} 
                                                                onChange={e => updateItem(idx, { qty: parseFloat(e.target.value) || 0 })}
                                                                className="w-16 h-8 text-right font-bold border-0 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                                                disabled={!!order}
                                                            />
                                                        </div>
                                                        <div className="flex flex-col items-end min-w-[80px]">
                                                            <Label className="text-[9px] font-bold text-gray-400 uppercase">Price</Label>
                                                            <span className="font-black text-gray-900 dark:text-white">${(item.qty * item.unit_price).toFixed(2)}</span>
                                                        </div>
                                                        {!order && (
                                                            <button 
                                                                onClick={() => removeItem(idx)}
                                                                className="opacity-0 group-hover:opacity-100 p-2 text-danger hover:bg-danger/10 rounded-lg transition-all"
                                                            >
                                                                <IconTrash size={18} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Order Notes */}
                        <div className="p-6 border-t dark:border-gray-800 bg-white/50 dark:bg-black/20 shrink-0">
                            <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1.5 block">Internal Order Remarks</Label>
                            <Input 
                                value={form.notes} 
                                onChange={e => setForm({ ...form, notes: e.target.value })}
                                placeholder="Add special instructions or customer requests..."
                                className="h-10 text-sm font-medium border-0 bg-transparent p-0 focus-visible:ring-0 placeholder:text-gray-300"
                                disabled={!!order}
                            />
                        </div>
                    </div>

                    {/* Right Side: Catalog & Summary */}
                    <div className="w-full lg:w-[320px] bg-gray-50 dark:bg-gray-900 border-l dark:border-gray-800 flex flex-col shrink-0">
                        {/* Selector Tabs/Catalog */}
                        <div className="flex-1 overflow-hidden flex flex-col">
                            <div className="p-4 border-b dark:border-gray-800">
                                <Label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Global Catalog Search</Label>
                                <div className="mt-2 text-xs text-gray-400 font-medium">Add items by selecting below:</div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                                <section>
                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">Service Packages</h5>
                                    <div className="grid grid-cols-1 gap-2">
                                        {services.map(s => (
                                            <button 
                                                key={s.id}
                                                onClick={() => handleAddItem('service', s.id)}
                                                disabled={!!order}
                                                className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-primary/50 hover:shadow-md transition-all text-left"
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900 dark:text-white text-xs">{s.name}</span>
                                                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">${s.price}</span>
                                                </div>
                                                <IconPlus size={14} className="text-primary" />
                                            </button>
                                        ))}
                                    </div>
                                </section>
                                
                                <section>
                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-3">Retail Products</h5>
                                    <div className="grid grid-cols-1 gap-2">
                                        {products.slice(0, 10).map(p => (
                                            <button 
                                                key={p.id}
                                                onClick={() => handleAddItem('product', p.id)}
                                                disabled={!!order}
                                                className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-emerald-500/50 hover:shadow-md transition-all text-left"
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900 dark:text-white text-xs">{p.name}</span>
                                                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">${p.price || 0}</span>
                                                </div>
                                                <IconPlus size={14} className="text-emerald-600" />
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        </div>

                        {/* Totals Summary */}
                        <div className="p-6 bg-white dark:bg-gray-950 border-t-4 border-primary shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)]">
                            <div className="space-y-2 mb-6">
                                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase">
                                    <span>Subtotal</span>
                                    <span>${form.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold text-danger uppercase opacity-80">
                                    <span>Discounts</span>
                                    <span>-${form.discount_total.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t dark:border-gray-800">
                                    <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Grand Total</span>
                                    <span className="text-2xl font-black text-primary tracking-tighter">${form.grand_total.toFixed(2)}</span>
                                </div>
                            </div>
                            
                            {!order ? (
                                <Button 
                                    className="w-full h-14 rounded-2xl text-base font-black uppercase tracking-widest gap-3 shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    onClick={handleSubmit}
                                    disabled={saving || form.items.length === 0}
                                >
                                    {saving ? <><IconLoader2 className="animate-spin" /> Finalizing...</> : <><IconDeviceFloppy /> Process Checkout</>}
                                </Button>
                            ) : (
                                <Button variant="outline" className="w-full h-12 rounded-xl text-xs font-black uppercase opacity-50 cursor-default">
                                    Transaction Record
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Inline Vehicle Form Dialog Overlay */}
                {showAddVehicle && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl shadow-2xl p-6 ring-1 ring-white/10">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-primary/10 text-primary"><IconCar size={20} /></div>
                                    <h3 className="font-black uppercase tracking-widest text-lg">Quick Car Reg</h3>
                                </div>
                                <button onClick={() => setShowAddVehicle(false)} className="text-gray-400 hover:text-white"><IconX size={20} /></button>
                            </div>
                            
                            <div className="space-y-5">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Manufacturer</Label>
                                    <SearchableSelect 
                                        options={brands.map(b => ({ value: b.id, label: b.name }))}
                                        value={newVehicle.brand_id}
                                        onChange={(val) => { setNewVehicle({ ...newVehicle, brand_id: val as number, model_id: null }); fetchModels(val as number); }}
                                        placeholder="Select Brand..."
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Vehicle Model</Label>
                                    <SearchableSelect 
                                        options={models.map(m => ({ value: m.id, label: m.name }))}
                                        value={newVehicle.model_id}
                                        onChange={(val) => setNewVehicle({ ...newVehicle, model_id: val as number })}
                                        placeholder="Select Model..."
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Plate Number / RIN</Label>
                                    <Input 
                                        value={newVehicle.plate_no}
                                        onChange={e => setNewVehicle({ ...newVehicle, plate_no: e.target.value.toUpperCase() })}
                                        placeholder="PHNOM PENH 2X-9999"
                                        className="font-black uppercase h-12 text-lg"
                                    />
                                </div>
                                <Button className="w-full h-12 text-xs font-black uppercase tracking-widest mt-2 shadow-lg shadow-primary/20" onClick={handleAddVehicle}>
                                    Confirm Vehicle Link
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default SalesOrderDialog;
