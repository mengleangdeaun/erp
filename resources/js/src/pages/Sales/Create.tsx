import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
    IconReceipt, IconPlus, IconTrash, IconCar, IconUser, 
    IconPackage, IconTools, IconDeviceFloppy, IconLoader2, 
    IconX, IconSearch, IconChevronRight, IconFilter,
    IconShoppingCart, IconArrowLeft, IconBuildingWarehouse, IconBoxSeam,
    IconCreditCard, IconCheck, IconCoins
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
import CheckoutDialog from './CheckoutDialog';
import { 
    useCustomers, useServices, useProducts, useBranches, 
    useBrands, useCategories, usePaymentAccounts, useCustomerVehicles
} from '@/hooks/usePOSData';

interface SalesOrder {
    customer_id: number | null;
    vehicle_id: number | null;
    order_date: string;
    items: SalesOrderItem[];
    subtotal: number;
    tax_total: number;
    discount_total: number;
    global_discount_type: 'FIXED' | 'PERCENT';
    global_discount_value: number;
    grand_total: number;
    notes: string;
    use_tax: boolean;
    global_tax_percent: number;
    deposits: { amount: number; payment_account_id: number | null; date: string; notes: string }[];
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

import { useQueryClient } from '@tanstack/react-query';

const SalesCreate = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [loadingVehicles, setLoadingVehicles] = useState(false);
    const [activeTab, setActiveTab] = useState<'services' | 'products'>('services');
    
    const [catalogSearch, setCatalogSearch] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
    
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);

    const [form, setForm] = useState<SalesOrder>({
        customer_id: null,
        vehicle_id: null,
        order_date: format(new Date(), 'yyyy-MM-dd'),
        items: [],
        subtotal: 0,
        tax_total: 0,
        discount_total: 0,
        global_discount_type: 'FIXED',
        global_discount_value: 0,
        grand_total: 0,
        notes: '',
        use_tax: true,
        global_tax_percent: 10,
        deposits: [],
    });

    const [manualGrandTotal, setManualGrandTotal] = useState<number | null>(null);

    // React Query Hooks (Cached & Optimized)
    const { data: customers = [], isLoading: isLoadingCustomers } = useCustomers();
    const { data: services = [], isLoading: isLoadingServices } = useServices(selectedBranchId);
    const { data: products = [], isLoading: isLoadingProducts } = useProducts(selectedBranchId);
    const { data: branches = [], isLoading: isLoadingBranches } = useBranches();
    const { data: brands = [], isLoading: isLoadingBrands } = useBrands();
    const { data: categories = [], isLoading: isLoadingCategories } = useCategories();
    const { data: paymentAccounts = [], isLoading: isLoadingAccounts } = usePaymentAccounts();
    const { data: vehicles = [], isLoading: isLoadingVehicles } = useCustomerVehicles(form.customer_id);

    const isLoading = isLoadingCustomers || isLoadingBranches || isLoadingCategories || isLoadingAccounts;
    const isCatalogLoading = isLoadingServices || isLoadingProducts;

    // Inline Vehicle Registration state
    const [showAddVehicle, setShowAddVehicle] = useState(false);
    const [newVehicle, setNewVehicle] = useState({
        brand_id: null as number | null,
        model_id: null as number | null,
        plate_number: '',
        vin_last_4: '',
        year: '' as string | number,
    });

    // Service Item Selection state
    const [selectedServiceForItems, setSelectedServiceForItems] = useState<any>(null);
    const [tempSelectedParts, setTempSelectedParts] = useState<number[]>([]);
    const [tempPartProductMap, setTempPartProductMap] = useState<Record<number, number>>({}); // part_id -> product_id

    // Default branch selection
    useEffect(() => {
        if (!selectedBranchId && branches.length > 0) {
            setSelectedBranchId(branches[0].id);
        }
    }, [branches, selectedBranchId]);

    const handleAddItem = (type: 'service' | 'product', id: number) => {
        if (type === 'service') {
            const s = services.find((x: any) => x.id === id);
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
            const p = products.find((x: any) => x.id === id);
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
        setForm(prev => ({ ...prev, deposits: [...prev.deposits, { amount: 0, payment_account_id: null, date: format(new Date(), 'yyyy-MM-dd'), notes: '' }] }));
    };

    const updateDeposit = (index: number, changes: Partial<SalesOrder['deposits'][0]>) => {
        const newDeps = [...form.deposits];
        newDeps[index] = { ...newDeps[index], ...changes };
        setForm(prev => ({ ...prev, deposits: newDeps }));
    };

    // Totals calculation
    useEffect(() => {
        // 1. Determine Base Subtotal (Manual Override vs Item Sum)
        const items_sum = form.items.reduce((acc, item) => acc + (item.qty * item.unit_price), 0);
        const subtotal = manualGrandTotal !== null ? manualGrandTotal : items_sum;
        
        // 2. Calculate Item-level discounts (Only if no manual override)
        let items_discount_total = 0;
        const updatedItems = form.items.map(item => {
            let discount = item.discount_type === 'PERCENT' 
                ? (item.qty * item.unit_price) * (item.discount_value / 100) 
                : item.discount_value;
            if (manualGrandTotal !== null) discount = 0; // Ignore item discounts if manual subtotal is set
            return { ...item, discount };
        });
        items_discount_total = updatedItems.reduce((acc, item) => acc + item.discount, 0);
        
        // 3. Calculate Global Discount (Applied to Subtotal)
        let global_discount_amount = 0;
        if (form.global_discount_type === 'PERCENT') {
            global_discount_amount = subtotal * (form.global_discount_value / 100);
        } else {
            global_discount_amount = form.global_discount_value;
        }

        const total_discount = items_discount_total + global_discount_amount;
        
        // 4. Calculate Tax
        let tax_total = 0;
        if (form.use_tax) {
            tax_total = (subtotal - total_discount) * (form.global_tax_percent / 100);
        } else {
            tax_total = updatedItems.reduce((acc, item) => acc + (((item.qty * item.unit_price) - item.discount) * (item.tax_percent / 100)), 0);
            if (manualGrandTotal !== null) tax_total = 0; // We don't support item-level tax with manual subtotal override
        }

        setForm(prev => ({ 
            ...prev, 
            subtotal, 
            discount_total: total_discount, 
            tax_total, 
            grand_total: subtotal - total_discount + tax_total 
        }));
    }, [form.items, form.use_tax, form.global_tax_percent, form.global_discount_type, form.global_discount_value, manualGrandTotal]);

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
            
            // Handle Grand Total override (Base + optional VAT)
            // Note: form.grand_total already incorporates manualGrandTotal if it was set in the useEffect
            const finalTax = form.tax_total;
            const finalGrandTotal = form.grand_total;

            formData.append('subtotal', form.subtotal.toString());
            formData.append('tax_total', finalTax.toString());
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
                formData.append(`deposits[${idx}][payment_account_id]`, dep.payment_account_id?.toString() || '');
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

    const filteredServices = services.filter((s: any) => {
        const matchesSearch = s.name.toLowerCase().includes(catalogSearch.toLowerCase());
        const matchesCategory = selectedCategoryId === 'all' || s.category_id?.toString() === selectedCategoryId;
        return matchesSearch && matchesCategory;
    });
    const filteredProducts = products.filter((p: any) => {
        const matchesSearch = p.name.toLowerCase().includes(catalogSearch.toLowerCase());
        const matchesCategory = selectedCategoryId === 'all' || p.category_id?.toString() === selectedCategoryId;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] bg-gray-50 dark:bg-gray-950 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-lg relative">
            
            {/* Top Navigation Bar */}
            <div className="bg-white dark:bg-gray-900 px-4 py-4.5 flex items-center justify-between border-b dark:border-gray-800 shrink-0">
                <div className="flex items-center gap-3 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/sales/orders')} className="h-8 w-8 p-0">
                        <IconArrowLeft size={16} />
                    </Button>
                    <div>
                        <h1 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Point of Sale</h1>
                        <p className="text-[9px] font-black uppercase text-primary tracking-widest leading-none mt-0.5">Direct Checkout</p>
                    </div>
                </div>

                <div className="flex-1 flex items-center justify-center gap-4 px-4">
                    <div className="flex items-center bg-gray-100 dark:bg-gray-900 p-0.5 rounded h-8 shadow-inner border dark:border-gray-700 shrink-0">
                        <button 
                            onClick={() => setActiveTab('services')}
                            className={`px-3 py-1 rounded text-[9px] font-black transition-all ${activeTab === 'services' ? 'bg-white dark:bg-dark text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            SERVICES
                        </button>
                        <button 
                            onClick={() => setActiveTab('products')}
                            className={`px-3 py-1 rounded text-[9px] font-black transition-all ${activeTab === 'products' ? 'bg-white dark:bg-dark text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            PRODUCTS
                        </button>
                    </div>

                    <div className="h-6 w-[1px] bg-gray-100 dark:bg-gray-800 shrink-0" />

                    <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                        <SelectTrigger className="w-[140px] h-8 border-0 bg-transparent shadow-none font-bold text-[11px] ring-0 focus:ring-0">
                            <IconFilter size={12} className="mr-1.5 text-gray-400" />
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent className="border-gray-100 dark:border-gray-800">
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map((c: any) => (
                                <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="relative w-full max-w-[200px]">
                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                        <Input 
                            placeholder={`Search ${activeTab}...`} 
                            value={catalogSearch}
                            onChange={e => setCatalogSearch(e.target.value)}
                            className="pl-9 h-9 text-[11p]"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <SearchableSelect 
                        options={branches.map((b: any) => ({ value: b.id, label: b.name }))}
                        value={selectedBranchId}
                        onChange={(val) => setSelectedBranchId(val as number)}
                        placeholder="Select Branch..."
                        className="w-[150px] h-9 font-bold border-primary/30 text-[11px]"
                        loading={isLoadingBranches}
                    />
                    <div className="h-9 w-[1px] bg-gray-100 dark:bg-gray-800" />
                    <Button 
                        disabled={saving || form.items.length === 0} 
                        onClick={() => setShowCheckoutDialog(true)}
                        className="bg-primary hover:bg-primary/90 text-white font-bold px-6 h-9 shadow-md shadow-primary/20 active:scale-95 transition-all text-[11px]"
                    >
                        <IconShoppingCart className="mr-1.5" size={14} />
                        Checkout ({form.items.length})
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Side: Catalog Selection */}
                <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-950">
                    <div className="px-4 pt-4 pb-2 shrink-0 flex items-center justify-between">
                        <h2 className="text-[9px] font-black uppercase text-gray-400 tracking-widest">
                            Available {activeTab}
                        </h2>
                    </div>

                    <ScrollArea className="flex-1 px-4 pb-4">
                        {isCatalogLoading ? (
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
                                {filteredServices.length > 0 ? filteredServices.map((s: any) => (
                                    <button 
                                        key={s.id}
                                        onClick={() => handleAddItem('service', s.id)}
                                        className="group relative flex flex-col p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 text-left overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <IconTools size={60} stroke={1} />
                                        </div>
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <IconTools size={20} />
                                        </div>
                                        <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight mb-2">{s.name}</h3>
                                        <div className="mt-auto flex items-center justify-between">
                                            <span className="text-lg font-bold text-primary tracking-tighter">${parseFloat(s.base_price || 0).toLocaleString()}</span>
                                            <div className="p-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400 group-hover:bg-primary group-hover:text-white transition-colors">
                                                <IconPlus size={14} stroke={3} />
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
                                {filteredProducts.length > 0 ? filteredProducts.map((p: any) => (
                                    <button 
                                        key={p.id}
                                        onClick={() => handleAddItem('product', p.id)}
                                        className="group flex flex-col p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 text-left"
                                    >
                                        <div className="aspect-square rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-3 overflow-hidden relative">
                                            {p.img ? (
                                                <img 
                                                    src={p.img} 
                                                    alt={p.name} 
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = '/images/invalid-image.svg';
                                                    }}
                                                />
                                            ) : (
                                                <IconPackage size={24} className="text-gray-200 dark:text-gray-700" />
                                            )}
                                            
                                            {selectedBranchId && (
                                                <div className="absolute top-1.5 right-1.5 flex flex-col gap-1 items-end">
                                                    {(p.branch_stock_qty === null || p.branch_stock_qty <= 0) ? (
                                                        <Badge variant="destructive" className="text-[7px] px-1 py-0 shadow-sm border-0 font-black uppercase">OUT</Badge>
                                                    ) : p.branch_stock_qty <= (p.reorder_level || 5) && (
                                                        <Badge variant="warning" className="text-[7px] px-1 py-0 shadow-sm border-0 font-black uppercase bg-amber-500 text-white hover:bg-amber-600">LOW</Badge>
                                                    )}
                                                    <span className="bg-black/40 backdrop-blur-md text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                                                        {p.branch_stock_qty || 0}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-gray-900 dark:text-white text-[10px] leading-tight line-clamp-2 min-h-[24px]">{p.name}</h3>
                                        <div className="mt-2 flex items-center justify-between">
                                            <span className="text-xs font-bold text-emerald-600 tracking-tight">${parseFloat(p.price || 0).toLocaleString()}</span>
                                            <div className="p-1 rounded-lg bg-gray-50 dark:bg-gray-850 text-gray-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                                <IconPlus size={12} stroke={3} />
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

            </div>

            {/* Standalone Checkout Dialog */}
            <CheckoutDialog 
                open={showCheckoutDialog}
                onOpenChange={setShowCheckoutDialog}
                form={form}
                setForm={setForm}
                customers={customers}
                vehicles={vehicles}
                paymentAccounts={paymentAccounts}
                saving={saving}
                onSubmit={handleSubmit}
                services={services}
                products={products}
                manualGrandTotal={manualGrandTotal}
                setManualGrandTotal={setManualGrandTotal}
                onAddVehicle={() => setShowAddVehicle(true)}
                removeItem={removeItem}
                updateItem={updateItem}
                addDeposit={addDeposit}
                updateDeposit={updateDeposit}
                receiptFile={receiptFile}
                setReceiptFile={setReceiptFile}
                loadingVehicles={loadingVehicles}
            />

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
                                                                options={products.map((prod: any) => ({ value: prod.id, label: `${prod.name} (${prod.code}) - $${prod.price}` }))}
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
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Plate Number / Ref</Label>
                                <Input 
                                    placeholder="e.g. 2A-1234"
                                    value={newVehicle.plate_number}
                                    onChange={(e) => setNewVehicle({ ...newVehicle, plate_number: e.target.value })}
                                    className="rounded-lg h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Year</Label>
                                <Input 
                                    type="number"
                                    placeholder="2024"
                                    value={newVehicle.year}
                                    onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })}
                                    className="rounded-lg h-11"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button 
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-xl shadow-lg"
                            onClick={async () => {
                                if (!newVehicle.brand_id || !newVehicle.plate_number) {
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
                                            plate_number: newVehicle.plate_number,
                                            year: newVehicle.year,
                                            status: 'ACTIVE'
                                        })
                                    });
                                    if (res.ok) {
                                        const created = await res.json();
                                        toast.success('Vehicle registered successfully');
                                        
                                        // Invalidate & Refetch via React Query
                                        queryClient.invalidateQueries({ queryKey: ['customerVehicles', form.customer_id] });
                                        
                                        setForm((prev: any) => ({ ...prev, vehicle_id: created.id }));
                                        setShowAddVehicle(false);
                                        setNewVehicle({ brand_id: null, model_id: null, plate_number: '', vin_last_4: '', year: '' });
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
