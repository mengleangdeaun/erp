import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
    IconReceipt, IconPlus, IconTrash, IconCar, IconUser, 
    IconPackage, IconTools, IconDeviceFloppy, IconLoader2, 
    IconX, IconSearch, IconChevronRight, IconFilter,
    IconShoppingCart, IconArrowLeft, IconBuildingWarehouse, IconBoxSeam
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface SalesOrder {
    customer_id: number | null;
    vehicle_id: number | null;
    order_date: string;
    items: SalesOrderItem[];
    subtotal: number;
    tax_total: number;
    discount_total: number;
    grand_total: number;
    notes: string;
    use_tax: boolean;
    global_tax_percent: number;
    deposits: { amount: number; method: string; date: string; notes: string }[];
}

interface SalesOrderItem {
    service_id: number | null;
    product_id: number | null;
    job_part_id?: number | null;
    qty: number;
    unit_price: number;
    discount_type: 'FIXED' | 'PERCENT';
    discount_value: number;
    discount: number;
    tax_percent: number;
}

const SalesCreate = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    
    // Master data
    const [customers, setCustomers] = useState<any[]>([]);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [brands, setBrands] = useState<any[]>([]);
    const [models, setModels] = useState<any[]>([]);

    const [activeTab, setActiveTab] = useState<'services' | 'products'>('services');
    const [catalogSearch, setCatalogSearch] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
    const [categories, setCategories] = useState<any[]>([]);
    const [paymentAccounts, setPaymentAccounts] = useState<any[]>([]);
    const [manualGrandTotal, setManualGrandTotal] = useState<number | null>(null);
    const [receiptFile, setReceiptFile] = useState<File | null>(null);

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
        use_tax: false,
        global_tax_percent: 10,
        deposits: [],
    });

    // Inline Vehicle Registration state
    const [showAddVehicle, setShowAddVehicle] = useState(false);
    const [newVehicle, setNewVehicle] = useState({
        brand_id: null as number | null,
        model_id: null as number | null,
        plate_no: '',
        vin_last_4: '',
    });

    // Service Item Selection state
    const [selectedServiceForItems, setSelectedServiceForItems] = useState<any>(null);
    const [tempSelectedParts, setTempSelectedParts] = useState<number[]>([]);
    const [tempPartProductMap, setTempPartProductMap] = useState<Record<number, number>>({}); // part_id -> product_id

    useEffect(() => {
        fetchData();
    }, [selectedBranchId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [custRes, servRes, prodRes, branchRes, brandRes, catRes, accRes] = await Promise.all([
                fetch('/api/crm/customers?all=true'),
                fetch(`/api/services/list?all=true${selectedBranchId ? `&branch_id=${selectedBranchId}` : ''}`),
                fetch(`/api/inventory/products?all=true${selectedBranchId ? `&branch_id=${selectedBranchId}` : ''}`),
                fetch('/api/hr/branches'), 
                fetch('/api/services/vehicle-brands'),
                fetch('/api/inventory/categories'),
                fetch('/api/finance/payment-accounts?all=true'),
            ]);

            const [cust, serv, prod, bran, brnd, cats, accs] = await Promise.all([
                custRes.json(), servRes.json(), prodRes.json(), branchRes.json(), brandRes.json(), catRes.json(), accRes.json()
            ]);

            setCustomers(Array.isArray(cust) ? cust : (cust.data || []));
            setServices(Array.isArray(serv) ? serv : (serv.data || []));
            setProducts(Array.isArray(prod) ? prod : (prod.data || []));
            const branchesData = Array.isArray(bran) ? bran : (bran.data || []);
            setBranches(branchesData);
            if (!selectedBranchId && branchesData.length > 0) {
                setSelectedBranchId(branchesData[0].id);
            }
            setBrands(brnd);
            setCategories(cats);
            setPaymentAccounts(accs);
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
        if (type === 'service') {
            const s = services.find(x => x.id === id);
            if (!s) return;
            
            if ((s.parts && s.parts.length > 0) || (s.materials && s.materials.length > 0)) {
                setSelectedServiceForItems(s);
                setTempSelectedParts(s.parts.map((p: any) => p.id));
                const initialMap: Record<number, number> = {};
                // If there are suggested materials/products for parts, we could prepopulate here
                // For now, let's keep it clean
                setTempPartProductMap(initialMap);
                return;
            }
            addServiceItem(s);
        } else if (type === 'product') {
            const p = products.find(x => x.id === id);
            if (!p) return;
            addProductItem(p);
        }
    };

    const addServiceItem = (s: any) => {
        const item: SalesOrderItem = { 
            service_id: s.id, 
            product_id: null, 
            qty: 1, 
            unit_price: parseFloat(s.base_price || 0), 
            discount_type: 'FIXED', 
            discount_value: 0, 
            discount: 0,
            tax_percent: 0
        };
        setForm(prev => ({ ...prev, items: [...prev.items, item] }));
        toast.success(`${s.name} added to cart`);
    };

    const addProductItem = (p: any, unitPrice?: number) => {
        const item: SalesOrderItem = { 
            service_id: null, 
            product_id: p.id, 
            qty: 1, 
            unit_price: unitPrice !== undefined ? unitPrice : parseFloat(p.price || 0), 
            discount_type: 'FIXED', 
            discount_value: 0, 
            discount: 0,
            tax_percent: 0
        };
        setForm(prev => ({ ...prev, items: [...prev.items, item] }));
        toast.success(`${p.name} added to cart`);
    };

    const confirmServiceItems = () => {
        if (!selectedServiceForItems) return;
        addServiceItem(selectedServiceForItems);
        
        tempSelectedParts.forEach((partId: number) => {
            const part = selectedServiceForItems.parts.find((p: any) => p.id === partId);
            if (part) {
                // If a product is selected for this part, add it as a product item with job_part_id
                const productId = tempPartProductMap[partId];
                if (productId) {
                    const p = products.find((x: any) => x.id === productId);
                    if (p) {
                        const item: SalesOrderItem = {
                            service_id: selectedServiceForItems.id,
                            product_id: p.id,
                            job_part_id: part.id,
                            qty: 1,
                            unit_price: parseFloat(p.price || 0),
                            discount_type: 'FIXED',
                            discount_value: 0,
                            discount: 0,
                            tax_percent: 0
                        };
                        setForm((prev: any) => ({ ...prev, items: [...prev.items, item] }));
                    }
                } else {
                    // Just the part (no product)
                    const item: SalesOrderItem = {
                        service_id: selectedServiceForItems.id,
                        product_id: null,
                        job_part_id: part.id,
                        qty: 1,
                        unit_price: 0,
                        discount_type: 'FIXED',
                        discount_value: 0,
                        discount: 0,
                        tax_percent: 0
                    };
                    setForm((prev: any) => ({ ...prev, items: [...prev.items, item] }));
                }
            }
        });
        
        setSelectedServiceForItems(null);
        setTempPartProductMap({});
    };

    const updateItem = (index: number, changes: Partial<SalesOrderItem>) => {
        const newItems = [...form.items];
        newItems[index] = { ...newItems[index], ...changes };
        setForm(prev => ({ ...prev, items: newItems }));
    };

    const removeItem = (index: number) => {
        setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
    };

    const addDeposit = () => {
        setForm(prev => ({ ...prev, deposits: [...prev.deposits, { amount: 0, method: 'CASH', date: format(new Date(), 'yyyy-MM-dd'), notes: '' }] }));
    };

    const updateDeposit = (index: number, changes: any) => {
        const newDeps = [...form.deposits];
        newDeps[index] = { ...newDeps[index], ...changes };
        setForm(prev => ({ ...prev, deposits: newDeps }));
    };

    // Totals calculation
    useEffect(() => {
        const subtotal = form.items.reduce((acc, item) => acc + (item.qty * item.unit_price), 0);
        const updatedItems = form.items.map(item => {
            let discount = item.discount_type === 'PERCENT' ? (item.qty * item.unit_price) * (item.discount_value / 100) : item.discount_value;
            return { ...item, discount };
        });
        const discount_total = updatedItems.reduce((acc, item) => acc + item.discount, 0);
        let tax_total = 0;
        if (form.use_tax) {
            tax_total = (subtotal - discount_total) * (form.global_tax_percent / 100);
        } else {
            tax_total = updatedItems.reduce((acc, item) => acc + (((item.qty * item.unit_price) - item.discount) * (item.tax_percent / 100)), 0);
        }
        setForm(prev => ({ ...prev, subtotal, discount_total, tax_total, grand_total: subtotal - discount_total + tax_total }));
    }, [form.items, form.use_tax, form.global_tax_percent]);

    const handleSubmit = async () => {
        if (!form.customer_id || form.items.length === 0) {
            toast.error('Missing customer or items');
            return;
        }

        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('customer_id', form.customer_id.toString());
            formData.append('branch_id', (selectedBranchId || branches[0]?.id || 1).toString());
            if (form.vehicle_id) formData.append('vehicle_id', form.vehicle_id.toString());
            if ((form as any).payment_account_id) formData.append('payment_account_id', (form as any).payment_account_id.toString());
            formData.append('order_date', form.order_date);
            
            // Handle Grand Total override
            const finalGrandTotal = manualGrandTotal !== null ? manualGrandTotal : form.grand_total;
            formData.append('subtotal', form.subtotal.toString());
            formData.append('tax_total', form.tax_total.toString());
            formData.append('discount_total', form.discount_total.toString());
            formData.append('grand_total', finalGrandTotal.toString());
            formData.append('notes', form.notes);

            form.items.forEach((item, idx) => {
                if (item.service_id) formData.append(`items[${idx}][service_id]`, item.service_id.toString());
                if (item.product_id) formData.append(`items[${idx}][product_id]`, item.product_id.toString());
                if (item.job_part_id) formData.append(`items[${idx}][job_part_id]`, item.job_part_id.toString());
                formData.append(`items[${idx}][qty]`, item.qty.toString());
                formData.append(`items[${idx}][unit_price]`, item.unit_price.toString());
                formData.append(`items[${idx}][discount]`, item.discount.toString());
            });

            form.deposits.forEach((dep, idx) => {
                formData.append(`deposits[${idx}][amount]`, dep.amount.toString());
                formData.append(`deposits[${idx}][method]`, dep.method);
                formData.append(`deposits[${idx}][date]`, dep.date);
                formData.append(`deposits[${idx}][notes]`, dep.notes);
            });

            if (receiptFile) {
                formData.append('receipt', receiptFile);
            }

            const response = await fetch('/api/sales/orders', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: formData,
            });

            if (response.ok) {
                toast.success('Sale processed successfully!');
                navigate('/sales/orders');
            } else {
                const data = await response.json();
                toast.error(data.message || 'Failed to process sale');
            }
        } catch (error) {
            toast.error('A critical error occurred');
        } finally {
            setSaving(false);
        }
    };

    const filteredServices = services.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(catalogSearch.toLowerCase());
        const matchesCategory = selectedCategoryId === 'all' || s.category_id?.toString() === selectedCategoryId;
        return matchesSearch && matchesCategory;
    });
    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(catalogSearch.toLowerCase());
        const matchesCategory = selectedCategoryId === 'all' || p.category_id?.toString() === selectedCategoryId;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] bg-gray-50 dark:bg-gray-950 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-lg relative">
            
            {/* Top Navigation Bar */}
            <div className="bg-white dark:bg-gray-900 px-6 py-4 flex items-center justify-between border-b dark:border-gray-800 shrink-0">
                <div className="flex items-center gap-4 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/sales/orders')}>
                        <IconArrowLeft size={18} />
                    </Button>
                    <div>
                        <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Point of Sale</h1>
                        <p className="text-[10px] font-black uppercase text-primary tracking-widest leading-none mt-1">Direct Checkout & Installation</p>
                    </div>
                </div>

                <div className="flex-1 flex items-center justify-center gap-6 px-8">
                    <div className="flex items-center bg-gray-100 dark:bg-gray-900 p-1 h-10 rounded-lg shadow-inner border dark:border-gray-700 shrink-0">
                        <button 
                            onClick={() => setActiveTab('services')}
                            className={`px-4 py-1 rounded text-[10px] font-black transition-all ${activeTab === 'services' ? 'bg-white dark:bg-dark text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            SERVICES
                        </button>
                        <button 
                            onClick={() => setActiveTab('products')}
                            className={`px-4 py-1 rounded text-[10px] font-black transition-all ${activeTab === 'products' ? 'bg-white dark:bg-dark text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            PRODUCTS
                        </button>
                    </div>

                    <div className="h-8 w-[1px] bg-gray-100 dark:bg-gray-800 shrink-0" />

                    <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                        <SelectTrigger className="w-[160px] h-10 border-0 bg-transparent shadow-none font-bold text-xs ring-0 focus:ring-0">
                            <IconFilter size={14} className="mr-2 text-gray-400" />
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map((c: any) => (
                                <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="relative w-full max-w-xs">
                        <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <Input 
                            placeholder={`Quick search ${activeTab}...`} 
                            value={catalogSearch}
                            onChange={e => setCatalogSearch(e.target.value)}
                            className="pl-11 h-10 dark:bg-gray-900"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    <Select value={selectedBranchId?.toString()} onValueChange={(val) => setSelectedBranchId(parseInt(val))}>
                        <SelectTrigger className="w-[180px] h-10 font-bold border-primary relative overflow-hidden">
                            {loading ? (
                                <div className="flex items-center gap-1.5 text-primary">
                                    <div className="flex gap-1 items-center">
                                        <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-1 h-1 bg-primary rounded-full animate-bounce" />
                                    </div>
                                    <span className="text-[10px] uppercase tracking-tighter">Syncing...</span>
                                </div>
                            ) : (
                                <>
                                    <IconBuildingWarehouse size={14} className="mr-2 text-primary" />
                                    <SelectValue placeholder="Select Branch" />
                                </>
                            )}
                        </SelectTrigger>
                        <SelectContent className="rounded-lg border-gray-100 dark:border-gray-800 shadow-2xl">
                            {branches.map((b: any) => (
                                <SelectItem key={b.id} value={b.id.toString()} className="font-bold">{b.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <div className="h-10 w-[1px] bg-gray-100 dark:bg-gray-800" />
                    <div className="flex flex-col items-end mr-2">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter text-right">Current Session</span>
                        <span className="text-[11px] font-bold text-gray-900 dark:text-white whitespace-nowrap leading-none mt-1">
                            {format(new Date(), 'EEEE, dd MMM yyyy')}
                        </span>
                    </div>
                    <div className="h-10 w-[1px] bg-gray-100 dark:bg-gray-800" />
                    <Button 
                        disabled={saving || form.items.length === 0} 
                        onClick={handleSubmit}
                        className="bg-primary hover:bg-primary/90 text-white font-bold px-8 rounded-lg h-11 shadow-md shadow-primary/20 active:scale-95 transition-all"
                    >
                        {saving ? <IconLoader2 className="animate-spin mr-2" size={18} /> : <IconShoppingCart className="mr-2" size={18} />}
                        Process
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Side: Catalog Selection */}
                <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-950">
                    <div className="px-8 pt-6 pb-2 shrink-0 flex items-center justify-between">
                        <h2 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">
                            Available {activeTab}
                        </h2>
                        <div className="text-[10px] font-bold uppercase text-gray-300 tracking-widest mr-4">
                            Branch Matrix Registry
                        </div>
                    </div>

                    <ScrollArea className="flex-1 px-8 pb-8">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 animate-in fade-in duration-500">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                                    <IconBoxSeam className="absolute inset-0 m-auto text-primary/40" size={24} />
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-black uppercase text-gray-400 tracking-[0.2em]">Synchronizing Catalog</p>
                                    <p className="text-[10px] text-gray-300 font-bold mt-1">Fetching branch-specific matrix data...</p>
                                </div>
                            </div>
                        ) : activeTab === 'services' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredServices.length > 0 ? filteredServices.map(s => (
                                    <button 
                                        key={s.id}
                                        onClick={() => handleAddItem('service', s.id)}
                                        className="group relative flex flex-col p-5 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 text-left overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <IconTools size={80} stroke={1} />
                                        </div>
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <IconTools size={24} />
                                        </div>
                                        <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight mb-2">{s.name}</h3>
                                        <div className="mt-auto flex items-center justify-between">
                                            <span className="text-xl font-bold text-primary tracking-tighter">${parseFloat(s.base_price || 0).toLocaleString()}</span>
                                            <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400 group-hover:bg-primary group-hover:text-white transition-colors">
                                                <IconPlus size={16} stroke={3} />
                                            </div>
                                        </div>
                                    </button>
                                )) : (
                                    <div className="col-span-full py-20 text-center animate-in fade-in duration-500">
                                        <IconSearch size={40} className="mx-auto text-gray-200 mb-4" />
                                        <p className="text-sm font-bold text-gray-400">No services match your search</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {filteredProducts.length > 0 ? filteredProducts.map(p => (
                                    <button 
                                        key={p.id}
                                        onClick={() => handleAddItem('product', p.id)}
                                        className="group flex flex-col p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 text-left"
                                    >
                                        <div className="aspect-square rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-4 overflow-hidden relative">
                                            {p.img ? (
                                                <img 
                                                    src={p.img} 
                                                    alt={p.name} 
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = '/images/invalid-image.svg';
                                                    }}
                                                />
                                            ) : (
                                                <IconPackage size={32} className="text-gray-200 dark:text-gray-700" />
                                            )}
                                            
                                            {selectedBranchId && (
                                                <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                                                    {(p.branch_stock_qty === null || p.branch_stock_qty <= 0) ? (
                                                        <Badge variant="destructive" className="text-[8px] px-1 py-0 shadow-sm border-0 font-black uppercase">OUT OF STOCK</Badge>
                                                    ) : p.branch_stock_qty <= (p.reorder_level || 5) && (
                                                        <Badge variant="warning" className="text-[8px] px-1 py-0 shadow-sm border-0 font-black uppercase bg-amber-500 text-white hover:bg-amber-600">LOW STOCK</Badge>
                                                    )}
                                                    <span className="bg-black/40 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                                                        {p.branch_stock_qty || 0} left
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-gray-900 dark:text-white text-xs leading-snug line-clamp-2 min-h-[32px]">{p.name}</h3>
                                        <div className="mt-3 flex items-center justify-between">
                                            <span className="text-sm font-bold text-emerald-600 tracking-tight">${parseFloat(p.price || 0).toLocaleString()}</span>
                                            <div className="p-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                                <IconPlus size={14} stroke={3} />
                                            </div>
                                        </div>
                                    </button>
                                )) : (
                                    <div className="col-span-full py-20 text-center animate-in fade-in duration-500">
                                        <IconSearch size={40} className="mx-auto text-gray-200 mb-4" />
                                        <p className="text-sm font-bold text-gray-400">No products match your search</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </ScrollArea>
                </div>

                {/* Right Side: Cart & Checkout Summary */}
                <div className="w-[450px] bg-gray-50 dark:bg-black/20 border-l dark:border-gray-800 flex flex-col overflow-hidden shrink-0">
                    <ScrollArea className="flex-1 p-6">
                        <div className="space-y-6">
                            {/* Selection Section */}
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2 p-5 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:ring-2 hover:ring-primary/10">
                                    <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                        <IconUser size={12} className="text-primary" /> Active Customer
                                    </Label>
                                    <SearchableSelect 
                                        options={customers.map(c => ({ value: c.id, label: `${c.name || 'No Name'} (${c.customer_code})` }))}
                                        value={form.customer_id}
                                        onChange={(val) => { setForm({ ...form, customer_id: val as number, vehicle_id: null }); }}
                                        placeholder="Search by Name/ID..."
                                        className="border-0 bg-transparent shadow-none focus:ring-0 p-0 text-base font-bold text-gray-900 dark:text-white mt-1"
                                    />
                                </div>
                                <div className="space-y-2 p-5 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:ring-2 hover:ring-primary/10">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                            <IconCar size={12} className="text-primary" /> Vehicle (Optional)
                                        </Label>
                                        {form.customer_id && (
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => setShowAddVehicle(true)}
                                                className="h-6 px-2 text-[9px] font-bold text-primary hover:bg-primary/5 rounded-md"
                                            >
                                                <IconPlus size={10} className="mr-1" /> NEW VEHICLE
                                            </Button>
                                        )}
                                    </div>
                                    <SearchableSelect 
                                        options={vehicles.map(v => ({ value: v.id, label: `${v.plate_no} - ${v.brand?.name} ${v.model?.name}` }))}
                                        value={form.vehicle_id}
                                        onChange={(val) => setForm({ ...form, vehicle_id: val as number })}
                                        placeholder={form.customer_id ? (vehicles.length > 0 ? "Select Vehicle..." : "No vehicles found") : "Select Customer First"}
                                        disabled={!form.customer_id}
                                        className="border-0 bg-transparent shadow-none focus:ring-0 p-0 text-base font-bold text-gray-900 dark:text-white mt-1"
                                    />
                                </div>
                            </div>

                            {/* Cart Items */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Checkout Basket</h3>
                                    <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary border-0 px-2 py-0.5 text-[9px] font-bold">
                                        {form.items.length} ITEMS
                                    </Badge>
                                </div>

                                {form.items.length === 0 ? (
                                    <div className="py-12 flex flex-col items-center justify-center text-gray-300 dark:text-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                                        <IconShoppingCart size={40} stroke={1} className="mb-3 opacity-20" />
                                        <p className="text-[10px] uppercase font-bold tracking-widest">Cart is empty</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {form.items.map((item, idx) => {
                                            const s = item.service_id ? services.find(x => x.id === item.service_id) : null;
                                            const p = item.product_id ? products.find(x => x.id === item.product_id) : null;
                                            return (
                                                <div key={idx} className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 group transition-all hover:shadow-lg">
                                                    <div className="flex items-start gap-4">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.service_id ? 'bg-primary/10 text-primary' : 'bg-emerald-500/10 text-emerald-600'}`}>
                                                            {item.service_id ? <IconTools size={20} /> : <IconPackage size={20} />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <h4 className="font-bold text-gray-900 dark:text-white text-xs truncate max-w-[150px]">
                                                                    {s ? s.name : p ? p.name : 'Unknown'}
                                                                </h4>
                                                                <button onClick={() => removeItem(idx)} className="text-gray-300 hover:text-danger hover:scale-110 transition-all opacity-0 group-hover:opacity-100">
                                                                    <IconTrash size={14} />
                                                                </button>
                                                            </div>
                                                            <div className="flex items-center justify-between mt-3">
                                                                <div className="flex items-center bg-gray-50 dark:bg-gray-850 rounded-lg p-0.5 border dark:border-gray-800 shadow-inner">
                                                                    <button onClick={() => updateItem(idx, { qty: Math.max(1, item.qty - 1) })} className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-primary">-</button>
                                                                    <Input 
                                                                        type="number" 
                                                                        value={item.qty} 
                                                                        onChange={e => updateItem(idx, { qty: parseFloat(e.target.value) || 1 })}
                                                                        className="w-10 h-5 text-center font-bold border-0 bg-transparent p-0 focus-visible:ring-0 text-[10px]"
                                                                    />
                                                                    <button onClick={() => updateItem(idx, { qty: item.qty + 1 })} className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-primary">+</button>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span className="text-[10px] font-bold text-gray-900 dark:text-white">${((item.qty * item.unit_price) - item.discount).toFixed(2)}</span>
                                                                    <div className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter mt-0.5">${item.unit_price.toFixed(2)} / unit</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Additional Info Section */}
                            <div className="p-5 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                        Payment Account
                                    </Label>
                                    <Select 
                                        value={form.payment_account_id?.toString()} 
                                        onValueChange={(val) => setForm({ ...form, payment_account_id: parseInt(val) } as any)}
                                    >
                                        <SelectTrigger className="h-10 rounded-xl bg-gray-50 dark:bg-gray-800 border-0 font-bold text-xs">
                                            <SelectValue placeholder="Select Account..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {paymentAccounts.map(acc => (
                                                <SelectItem key={acc.id} value={acc.id.toString()}>{acc.name} ({acc.account_no})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                        Upload Receipt
                                    </Label>
                                    <div className="flex items-center gap-3">
                                        <Input 
                                            type="file" 
                                            onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                                            className="h-10 text-[10px] bg-gray-50 dark:bg-gray-800 border-0 rounded-xl"
                                        />
                                        {receiptFile && <IconReceipt size={18} className="text-primary" />}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <input 
                                        type="checkbox" 
                                        checked={form.use_tax} 
                                        onChange={e => setForm({ ...form, use_tax: e.target.checked })}
                                        className="w-4 h-4 rounded-lg border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">Apply VAT/Tax ({form.global_tax_percent}%)</Label>
                                </div>
                                
                                <div className="space-y-1">
                                    <Label className="text-[9px] font-bold uppercase text-gray-400 tracking-widest">Transaction Notes</Label>
                                    <textarea 
                                        value={form.notes}
                                        onChange={e => setForm({ ...form, notes: e.target.value })}
                                        placeholder="Internal memo..."
                                        className="w-full text-xs font-bold bg-gray-50 dark:bg-gray-800 border-0 rounded-lg p-3 focus:ring-1 focus:ring-primary min-h-[80px]"
                                    />
                                </div>
                            </div>
                        </div>
                    </ScrollArea>

                    {/* Summary Pane */}
                    <div className="p-8 bg-white dark:bg-gray-900 border-t-2 border-primary/10 shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.15)] relative">
                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                                <span>Cart Subtotal</span>
                                <span className="text-gray-900 dark:text-white">${form.subtotal.toFixed(2)}</span>
                            </div>
                            {form.discount_total > 0 && (
                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em] text-rose-500">
                                    <span>Global Discount</span>
                                    <span>-${form.discount_total.toFixed(2)}</span>
                                </div>
                            )}
                            {form.use_tax && (
                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                                    <span>Sales Tax ({form.global_tax_percent}%)</span>
                                    <span className="text-gray-900 dark:text-white">${form.tax_total.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="pt-4 border-t-2 border-dashed border-gray-100 dark:border-gray-800 flex justify-between items-end">
                                <div className="flex flex-col gap-2">
                                    <span className="text-[10px] font-bold text-primary uppercase tracking-[0.4em] mb-1">Grand Total</span>
                                    {manualGrandTotal !== null ? (
                                        <div className="flex items-center gap-2">
                                            <Input 
                                                type="number" 
                                                value={manualGrandTotal} 
                                                onChange={(e) => setManualGrandTotal(parseFloat(e.target.value) || 0)}
                                                className="w-32 h-10 text-xl font-bold tracking-tighter"
                                            />
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => setManualGrandTotal(null)}
                                                className="h-8 w-8 p-0 text-gray-400"
                                            >
                                                <IconX size={14} />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <span 
                                                onClick={() => setManualGrandTotal(form.grand_total)}
                                                className="text-4xl font-bold text-gray-900 dark:text-white tracking-tighter leading-none cursor-pointer hover:bg-primary/5 rounded px-1 transition-all"
                                            >
                                                ${form.grand_total.toFixed(2)}
                                            </span>
                                            <IconPlus 
                                                size={14} 
                                                className="text-primary cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity" 
                                                onClick={() => setManualGrandTotal(form.grand_total)}
                                            />
                                        </div>
                                    )}
                                </div>
                                <Badge className="bg-primary hover:bg-primary text-white font-bold px-2 py-1 rounded-lg text-[10px] uppercase tracking-widest">PAYABLE USD</Badge>
                            </div>
                        </div>

                        {/* Quick Payments Section */}
                        <div className="flex gap-2">
                            <Button 
                                onClick={addDeposit}
                                variant="outline" 
                                className="flex-1 rounded-lg border-gray-100 dark:border-gray-800 font-bold text-[10px] uppercase tracking-widest h-11"
                            >
                                + Add Deposit
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Service Item Selector Overlay */}
            {selectedServiceForItems && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-950 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden border border-white/20 dark:border-gray-800 flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b dark:border-gray-800 shrink-0 flex justify-between items-start">
                            <div>
                                <Badge className="mb-2 bg-primary/10 text-primary uppercase font-bold tracking-widest px-3 py-1 text-[9px]">Package Configuration</Badge>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight leading-none">{selectedServiceForItems.name}</h2>
                                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mt-2 italic">Select components to include in this professional service</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedServiceForItems(null)} className="rounded-full h-10 w-10 p-0 text-gray-400 hover:text-danger">
                                <IconX size={20} />
                            </Button>
                        </div>
                        
                        <ScrollArea className="flex-1 p-8">
                            <div className="space-y-8">
                                {/* Parts Section */}
                                {selectedServiceForItems.parts?.length > 0 && (
                                    <section>
                                        <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-5 flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Installation Parts & Products
                                        </h4>
                                        <div className="grid grid-cols-1 gap-4">
                                            {selectedServiceForItems.parts.map((p: any) => (
                                                <div key={p.id} className="space-y-3">
                                                    <div 
                                                        onClick={() => setTempSelectedParts((prev: any) => prev.includes(p.id) ? prev.filter((x: any) => x !== p.id) : [...prev, p.id])}
                                                        className={`w-full flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${tempSelectedParts.includes(p.id) ? 'bg-primary/5 border-primary shadow-sm shadow-primary/10' : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 opacity-60'}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${tempSelectedParts.includes(p.id) ? 'bg-primary text-white scale-110' : 'bg-gray-200 dark:bg-gray-800 text-gray-400 opacity-50'} transition-all`}>
                                                                {tempSelectedParts.includes(p.id) ? <IconChevronRight size={14} stroke={4} /> : <div className="w-1 h-1 rounded-full bg-current" />}
                                                            </div>
                                                            <span className="font-bold text-gray-900 dark:text-white text-xs">{p.name}</span>
                                                        </div>
                                                        <Badge variant="outline" className="text-[10px] font-bold uppercase border-gray-200 dark:border-gray-700">Part #{p.code}</Badge>
                                                    </div>
                                                    
                                                    {tempSelectedParts.includes(p.id) && (
                                                        <div className="pl-11 pr-4">
                                                            <Label className="text-[9px] font-bold uppercase text-gray-400 tracking-widest mb-2 block">Select Product for {p.name} (Optional)</Label>
                                                            <SearchableSelect 
                                                                options={products.map(prod => ({ value: prod.id, label: `${prod.name} (${prod.code}) - $${prod.price}` }))}
                                                                value={tempPartProductMap[p.id]}
                                                                onChange={(val) => setTempPartProductMap(prev => ({ ...prev, [p.id]: val as number }))}
                                                                placeholder="Search Product..."
                                                                className="h-10 text-xs font-bold rounded-xl"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Materials Section (Legacy / Suggested) */}
                                {selectedServiceForItems.materials?.length > 0 && (
                                    <section>
                                        <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-600 mb-5 flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> Suggested Consumables
                                        </h4>
                                        <div className="grid grid-cols-1 gap-3">
                                            {selectedServiceForItems.materials.map((m: any) => {
                                                const p = products.find(x => x.id === m.product_id);
                                                return (
                                                    <div key={m.product_id} className="w-full flex items-center justify-between p-4 rounded-2xl border bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-200 dark:bg-gray-800 text-gray-400">
                                                                <IconPackage size={14} />
                                                            </div>
                                                            <span className="font-bold text-gray-900 dark:text-white text-xs">{p?.name || 'Loading...'}</span>
                                                        </div>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            onClick={() => addProductItem(p)}
                                                            className="text-primary hover:bg-primary/5 h-8 font-bold text-[10px]"
                                                        >
                                                            ADD SEPARATELY
                                                        </Button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </section>
                                )}
                            </div>
                        </ScrollArea>
                        
                        <div className="p-8 bg-gray-50 dark:bg-black/20 border-t dark:border-gray-800 shrink-0">
                            <Button 
                                onClick={confirmServiceItems}
                                className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-14 rounded-xl shadow-xl shadow-primary/20 flex items-center justify-between px-8"
                            >
                                <span className="text-sm">Include Selected Components</span>
                                <IconPlus size={20} />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Vehicle Dialog */}
            <Dialog open={showAddVehicle} onOpenChange={setShowAddVehicle}>
                <DialogContent className="sm:max-w-[425px] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold tracking-tight">Register New Vehicle</DialogTitle>
                        <DialogDescription className="text-xs text-gray-400 ">
                            Quick registration for current transaction
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Brand</Label>
                                <Select onValueChange={(v) => setNewVehicle({ ...newVehicle, brand_id: parseInt(v), model_id: null })}>
                                    <SelectTrigger className="rounded-lg h-11">
                                        <SelectValue placeholder="Brand" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {brands.map((b: any) => (
                                            <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Model</Label>
                                <Select 
                                    disabled={!newVehicle.brand_id}
                                    onValueChange={(v) => setNewVehicle({ ...newVehicle, model_id: parseInt(v) })}
                                >
                                    <SelectTrigger className="rounded-lg h-11 ">
                                        <SelectValue placeholder="Model" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(brands.find((b: any) => b.id === newVehicle.brand_id)?.models || []).map((m: any) => (
                                            <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Plate Number / Reference</Label>
                            <Input 
                                placeholder="e.g. 2A-1234"
                                value={newVehicle.plate_no}
                                onChange={(e) => setNewVehicle({ ...newVehicle, plate_no: e.target.value })}
                                className="rounded-lg h-11"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button 
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-xl shadow-lg"
                            onClick={async () => {
                                if (!newVehicle.brand_id || !newVehicle.plate_no) {
                                    toast.error('Brand and Plate No are required');
                                    return;
                                }
                                try {
                                    const res = await fetch('/api/crm/customer-vehicles', {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                                        },
                                        body: JSON.stringify({
                                            customer_id: form.customer_id,
                                            brand_id: newVehicle.brand_id,
                                            model_id: newVehicle.model_id,
                                            plate_no: newVehicle.plate_no,
                                            status: 'ACTIVE'
                                        })
                                    });
                                    if (res.ok) {
                                        const created = await res.json();
                                        toast.success('Vehicle registered successfully');
                                        setVehicles(prev => [...prev, created]);
                                        setForm(prev => ({ ...prev, vehicle_id: created.id }));
                                        setShowAddVehicle(false);
                                        setNewVehicle({ brand_id: null, model_id: null, plate_no: '', vin_last_4: '' });
                                    } else {
                                        toast.error('Failed to register vehicle');
                                    }
                                } catch (e) {
                                    toast.error('Error registering vehicle');
                                }
                            }}
                        >
                            Complete Registration
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
};

export default SalesCreate;
