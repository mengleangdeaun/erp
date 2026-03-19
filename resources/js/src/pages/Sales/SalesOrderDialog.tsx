import { useEffect, useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IconReceipt, IconPlus, IconTrash, IconCar, IconUser, IconPackage, IconTools, IconDeviceFloppy, IconLoader2, IconX, IconInfoCircle, IconSearch } from '@tabler/icons-react';
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
                fetch('/api/crm/customers?all=true'),
                fetch('/api/services/list'),
                fetch('/api/inventory/products'),
                fetch('/api/hr/branches'), 
                fetch('/api/services/vehicle-brands'),
            ]);

            const [cust, serv, prod, bran, brnd] = await Promise.all([
                custRes.json(), servRes.json(), prodRes.json(), branchRes.json(), brandRes.json()
            ]);

            setCustomers(Array.isArray(cust) ? cust : (cust.data || []));
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
            if (!s) return;
            item = { service_id: s.id, product_id: null, qty: 1, unit_price: parseFloat(s.base_price || 0), discount: 0 };
        } else {
            const p = products.find(x => x.id === id);
            if (!p) return;
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
        const subtotal = form.items.reduce((acc, item) => acc + ((item.qty || 0) * (item.unit_price || 0)), 0);
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
                        <div className="p-8 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
                            {/* Customer & Vehicle Selection */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2.5 p-5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:ring-2 hover:ring-primary/10">
                                    <Label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Active Customer
                                    </Label>
                                    <SearchableSelect 
                                        options={customers.map(c => ({ value: c.id, label: `${c.name || 'No Name'} (${c.customer_code})` }))}
                                        value={form.customer_id}
                                        onChange={(val) => { setForm({ ...form, customer_id: val as number, vehicle_id: null }); }}
                                        placeholder="Search by Name/PIN..."
                                        disabled={!!order}
                                        className="border-0 bg-transparent shadow-none focus:ring-0 p-0 text-lg font-black text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div className="space-y-2.5 p-5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:ring-2 hover:ring-primary/10">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Service Vehicle
                                        </Label>
                                        {!order && form.customer_id && (
                                            <button 
                                                type="button" 
                                                className="text-[10px] font-black text-primary hover:text-primary/80 uppercase tracking-widest transition-colors"
                                                onClick={() => setShowAddVehicle(true)}
                                            >
                                                + New Vehicle
                                            </button>
                                        )}
                                    </div>
                                    <SearchableSelect 
                                        options={vehicles.map(v => ({ value: v.id, label: `${v.plate_no} - ${v.brand?.name} ${v.model?.name}` }))}
                                        value={form.vehicle_id}
                                        onChange={(val) => setForm({ ...form, vehicle_id: val as number })}
                                        placeholder={form.customer_id ? "Select Vehicle..." : "Select Customer First"}
                                        disabled={!!order || !form.customer_id}
                                        className="border-0 bg-transparent shadow-none focus:ring-0 p-0 text-lg font-black text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            {/* Order Items Section */}
                            <div className="space-y-5">
                                <div className="flex items-center justify-between border-b dark:border-gray-800 pb-3">
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 flex items-center gap-3">
                                        Order Items
                                        <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary border-0 px-2.5 py-0.5 text-[10px] font-bold">
                                            {form.items.length}
                                        </Badge>
                                    </h3>
                                </div>
                                
                                {form.items.length === 0 ? (
                                    <div className="py-20 flex flex-col items-center justify-center text-gray-300 dark:text-gray-700 bg-gray-50/50 dark:bg-gray-900/20 rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-gray-800 transition-colors">
                                        <div className="p-6 rounded-full bg-white dark:bg-gray-900 shadow-sm mb-6">
                                            <IconReceipt size={40} className="text-gray-200 dark:text-gray-800" />
                                        </div>
                                        <p className="text-base font-bold text-gray-400 dark:text-gray-600 tracking-tight">Your order manifest is empty</p>
                                        <p className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-300 dark:text-gray-700 mt-2">Select items from catalog to proceed</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {form.items.map((item, idx) => {
                                            const s = item.service_id ? services.find(x => x.id === item.service_id) : null;
                                            const p = item.product_id ? products.find(x => x.id === item.product_id) : null;
                                            return (
                                                <div key={idx} className="group relative flex items-center gap-5 p-5 rounded-[1.5rem] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300">
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${item.service_id ? 'bg-primary/10 text-primary' : 'bg-emerald-500/10 text-emerald-600'}`}>
                                                        {item.service_id ? <IconTools size={28} stroke={1.5} /> : <IconPackage size={28} stroke={1.5} />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-black text-gray-900 dark:text-white text-base truncate pr-8">
                                                            {s ? s.name : p ? p.name : 'Unknown Item'}
                                                        </h4>
                                                        <div className="flex items-center gap-3 mt-1.5">
                                                            <Badge className={`text-[9px] font-black px-2 py-0 h-4 uppercase tracking-widest border-0 rounded-full ${item.service_id ? 'bg-primary/10 text-primary' : 'bg-emerald-500/10 text-emerald-600'}`}>
                                                                {item.service_id ? 'Professional' : 'Retail Item'}
                                                            </Badge>
                                                            {item.service_id && s?.parts?.length > 0 && (
                                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                                                    <div className="w-1 h-1 rounded-full bg-gray-300" /> {s.parts.length} Parts Defined
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-8 shrink-0">
                                                        <div className="flex flex-col items-center">
                                                            <Label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Qty</Label>
                                                            <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-xl p-1 shadow-inner">
                                                                <Input 
                                                                    type="number" 
                                                                    value={item.qty} 
                                                                    onChange={e => updateItem(idx, { qty: parseFloat(e.target.value) || 0 })}
                                                                    className="w-14 h-8 text-center font-black border-0 bg-transparent p-0 focus-visible:ring-0 text-sm"
                                                                    disabled={!!order}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end min-w-[100px]">
                                                            <Label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Amount</Label>
                                                            <span className="text-lg font-black text-gray-900 dark:text-white tracking-tighter">${(item.qty * item.unit_price).toFixed(2)}</span>
                                                        </div>
                                                        {!order && (
                                                            <button 
                                                                onClick={() => removeItem(idx)}
                                                                className="opacity-0 group-hover:opacity-100 p-2.5 text-danger bg-danger/5 hover:bg-danger/20 rounded-xl transition-all duration-200"
                                                                title="Remove Item"
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

                        {/* Order Footer / Meta */}
                        <div className="p-6 border-t dark:border-gray-800 bg-gray-50/50 dark:bg-black/20 shrink-0">
                            <div className="flex items-center gap-4">
                                <IconInfoCircle size={20} className="text-gray-300 shrink-0" />
                                <div className="flex-1">
                                    <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1 block">Internal Order Remarks</Label>
                                    <Input 
                                        value={form.notes} 
                                        onChange={e => setForm({ ...form, notes: e.target.value })}
                                        placeholder="Add special instructions, warranty notes or customer preferences..."
                                        className="h-8 text-sm font-bold border-0 bg-transparent p-0 focus-visible:ring-0 placeholder:text-gray-300 dark:placeholder:text-gray-700"
                                        disabled={!!order}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Smart Catalog */}
                    <div className="w-full lg:w-[360px] bg-gray-50 dark:bg-gray-900 border-l dark:border-gray-800 flex flex-col shrink-0">
                        <div className="flex-1 overflow-hidden flex flex-col">
                            <div className="p-6 border-b dark:border-gray-800 bg-white/50 dark:bg-white/5">
                                <Label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.3em]">Master Catalog</Label>
                                <div className="mt-2 relative">
                                    <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <Input 
                                        placeholder="Quick filter catalog..."
                                        className="h-10 pl-9 rounded-xl border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-xs font-bold shadow-sm"
                                        disabled={!!order}
                                    />
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                                <section>
                                    <h5 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary mb-4 flex items-center gap-2">
                                        <div className="w-2 h-0.5 bg-primary" /> Service Packages
                                    </h5>
                                    <div className="grid grid-cols-1 gap-3">
                                        {services.map(s => (
                                            <button 
                                                key={s.id}
                                                onClick={() => handleAddItem('service', s.id)}
                                                disabled={!!order}
                                                className="group flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-gray-850 border border-gray-100 dark:border-gray-800 hover:border-primary/40 hover:shadow-lg transition-all text-left relative overflow-hidden active:scale-95"
                                            >
                                                <div className="flex flex-col relative z-10">
                                                    <span className="font-black text-gray-900 dark:text-white text-xs tracking-tight">{s.name}</span>
                                                    <span className="text-[10px] text-primary font-black uppercase mt-1 tracking-widest">${parseFloat(s.base_price || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400 group-hover:bg-primary group-hover:text-white transition-colors relative z-10 shadow-sm">
                                                    <IconPlus size={14} stroke={3} />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </section>
                                
                                <section>
                                    <h5 className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-4 flex items-center gap-2">
                                        <div className="w-2 h-0.5 bg-emerald-600" /> Retail Products
                                    </h5>
                                    <div className="grid grid-cols-1 gap-3">
                                        {products.slice(0, 15).map(p => (
                                            <button 
                                                key={p.id}
                                                onClick={() => handleAddItem('product', p.id)}
                                                disabled={!!order}
                                                className="group flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-gray-850 border border-gray-100 dark:border-gray-800 hover:border-emerald-500/40 hover:shadow-lg transition-all text-left relative overflow-hidden active:scale-95"
                                            >
                                                <div className="flex flex-col relative z-10">
                                                    <span className="font-black text-gray-900 dark:text-white text-xs tracking-tight">{p.name}</span>
                                                    <span className="text-[10px] text-emerald-600 font-black uppercase mt-1 tracking-widest">${parseFloat(p.price || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors relative z-10 shadow-sm">
                                                    <IconPlus size={14} stroke={3} />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        </div>

                        {/* Checkout Summary - Premium Section */}
                        <div className="p-8 bg-white dark:bg-gray-950 border-t-2 border-primary/20 shadow-[0_-15px_40px_-15px_rgba(0,0,0,0.15)] relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <IconReceipt size={120} stroke={1} className="text-primary rotate-12" />
                            </div>
                            
                            <div className="space-y-3 mb-8 relative z-10">
                                <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <span>Subtotal Base</span>
                                    <span className="text-gray-900 dark:text-white">${form.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-black text-danger uppercase tracking-widest">
                                    <span>Applied Discounts</span>
                                    <span>-${form.discount_total.toFixed(2)}</span>
                                </div>
                                <div className="pt-5 mt-4 border-t-2 border-dashed border-gray-100 dark:border-gray-800">
                                    <div className="flex justify-between items-end">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Total Amount</span>
                                            <span className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter leading-none mt-1">
                                                ${form.grand_total.toFixed(2)}
                                            </span>
                                        </div>
                                        <Badge className="bg-primary/10 text-primary border-0 rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-widest">USD</Badge>
                                    </div>
                                </div>
                            </div>
                            
                            {!order ? (
                                <Button 
                                    className="w-full h-16 rounded-2xl text-base font-black uppercase tracking-[0.2em] gap-3 shadow-2xl shadow-primary/30 transition-all hover:scale-[1.03] active:scale-[0.97] bg-primary hover:bg-primary/90 text-white relative z-10"
                                    onClick={handleSubmit}
                                    disabled={saving || form.items.length === 0}
                                >
                                    {saving ? <><IconLoader2 className="animate-spin" /> Finalizing Transaction</> : <><IconDeviceFloppy size={24} /> Process Checkout</>}
                                </Button>
                            ) : (
                                <div className="relative z-10 flex flex-col items-center gap-3">
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Transaction Sealed</div>
                                    <Button variant="outline" className="w-full h-12 rounded-xl text-xs font-black uppercase tracking-widest bg-gray-50/50 dark:bg-white/5 border-gray-100 dark:border-gray-800 cursor-default opacity-60">
                                        View Record
                                    </Button>
                                </div>
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
