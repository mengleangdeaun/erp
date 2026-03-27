import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
    IconReceipt, IconPlus, IconTrash, IconCar, IconUser, 
    IconPackage, IconTools, IconDeviceFloppy, IconLoader2, 
    IconX, IconSearch, IconChevronRight, IconFilter,
    IconShoppingCart, IconArrowLeft, IconBuildingWarehouse, IconBoxSeam,
    IconCreditCard, IconCheck, IconCoins, IconSearchOff, IconInfoCircle
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
import CustomerDialog from '../Customers/CustomerDialog';
import { 
    useCustomers, useServices, useProducts, useBranches, 
    useBrands, useCategories, usePaymentAccounts, useCustomerVehicles,
    useSaleRemarks
} from '@/hooks/usePOSData';
import { useCRMCustomerTypes } from '@/hooks/useCRMData';

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
    taxable_amount: number;
    notes: string;
    use_tax: boolean;
    global_tax_percent: number;
    sale_remark_id: number | null;
    invoice_image_path?: string;
    deposits: { amount: number; payment_account_id: number | null; date: string; notes: string; receipt: File | null }[];
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


// Integrated Quick Add Sub-component
const QuickAddFooter = ({ label, onAdd, isSaving }: { label: string, onAdd: (name: string) => void, isSaving: boolean }) => {
    const [isInputVisible, setIsInputVisible] = useState(false);
    const [name, setName] = useState('');

    if (isSaving) {
        return (
            <div className="flex items-center gap-2 px-4 py-3 text-[10px] font-black uppercase text-primary/50 animate-pulse">
                <IconLoader2 size={14} className="animate-spin" />
                <span>Saving {label}...</span>
            </div>
        );
    }

    if (!isInputVisible) {
        return (
            <button 
                onClick={(e) => { e.stopPropagation(); setIsInputVisible(true); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase text-primary hover:bg-primary/5 transition-colors"
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
                    className="h-8 text-[9px] font-black uppercase rounded-lg px-4 bg-primary hover:bg-primary/90 text-white"
                    onClick={() => {
                        if (name.trim()) onAdd(name);
                        setName('');
                        setIsInputVisible(false);
                    }}
                >Save</Button>
                <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 text-[9px] font-black uppercase rounded-lg px-4 hover:bg-red-50 hover:text-red-500"
                    onClick={() => setIsInputVisible(false)}
                >Cancel</Button>
            </div>
        </div>
    );
};


// Sub-component for Package Configuration Parts
const PartConfigurationCard = ({ 
    p, 
    tempSelectedParts, 
    setTempSelectedParts, 
    tempPartProductMap, 
    setTempPartProductMap, 
    products, 
    materials 
}: any) => (
    <div 
        onClick={() => setTempSelectedParts((prev: any) => prev.includes(p.id) ? prev.filter((x: any) => x !== p.id) : [...prev, p.id])}
        className={`group relative overflow-hidden rounded-lg border transition-all duration-500 p-0.5 cursor-pointer select-none ${
            tempSelectedParts.includes(p.id) 
                ? 'border-primary ring-2 ring-primary/10 bg-primary/[0.02]' 
                : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-primary/40'
        }`}
    >
        <div className="p-5 space-y-5">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <div 
                        className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
                            tempSelectedParts.includes(p.id) 
                                ? 'bg-primary border-primary text-white scale-110 shadow-lg shadow-primary/20' 
                                : 'bg-transparent border-gray-200 dark:border-gray-700 group-hover:border-primary/50'
                        }`}
                    >
                        {tempSelectedParts.includes(p.id) && <IconCheck size={16} stroke={4} />}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-gray-900 dark:text-white text-[11px] tracking-tight leading-none mb-1.5">{p.name}</span>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[7px] font-bold border-gray-200 dark:border-gray-800 text-gray-400 px-1.5 py-0.5 leading-none uppercase tracking-tighter">{p.code}</Badge>
                            {tempSelectedParts.includes(p.id) && <span className="text-[7px] font-bold text-primary animate-pulse tracking-widest uppercase">Active</span>}
                        </div>
                    </div>
                </div>
            </div>

            {tempSelectedParts.includes(p.id) && (
                <div className="pt-2 space-y-3 animate-in slide-in-from-top-4 duration-500">
                    {materials?.length > 0 ? (
                        <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                            <SearchableSelect 
                                options={materials.map((m: any) => {
                                    const prod = products.find((x: any) => x.id === m.product_id);
                                    return { 
                                        value: prod?.id, 
                                        label: prod ? `${prod.name} (${prod.code}) - $${prod.price}` : 'Unknown Product' 
                                    };
                                }).filter((x: any) => x.value)}
                                value={tempPartProductMap[p.id]}
                                onChange={(val) => setTempPartProductMap((prev: any) => ({ ...prev, [p.id]: val as number }))}
                                placeholder="Select Product..."
                                className="h-9 text-[10px] font-bold rounded-lg border-primary/20 bg-white dark:bg-dark shadow-sm"
                            />
                            {tempPartProductMap[p.id] && (
                                <p className="text-[8px] text-primary/60 italic ml-1 flex items-center gap-1.5 font-bold uppercase tracking-widest animate-in fade-in duration-300">
                                    <IconBoxSeam size={10} className="text-primary" />
                                    Allocated
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/50 dark:bg-gray-900/50 border border-dashed border-gray-200 dark:border-gray-800">
                            <IconInfoCircle size={12} className="text-gray-400" />
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">No consumables defined</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
);

const SalesCreate = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;
    const [search, setSearch] = useState('');
    const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [loadingOrder, setLoadingOrder] = useState(false);
    const [loadingVehicles, setLoadingVehicles] = useState(false);
    const [activeTab, setActiveTab] = useState<'services' | 'products'>('services');

    useEffect(() => {
        dispatch(setPageTitle(isEdit ? `${t('edit_sale')} #${id}` : t('point_of_sale', 'Point of Sale')));
    }, [dispatch, t, isEdit, id]);
    
    const [catalogSearch, setCatalogSearch] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
    
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [invoiceImageFile, setInvoiceImageFile] = useState<File | null>(null);
    const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
    const [showAddCustomer, setShowAddCustomer] = useState(false);

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
        taxable_amount: 0,
        notes: '',
        use_tax: true,
        global_tax_percent: 10,
        sale_remark_id: null,
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
    const { data: paymentAccounts = [], isLoading: isLoadingAccounts } = usePaymentAccounts(selectedBranchId);
    const { data: customerTypes = [] } = useCRMCustomerTypes();
    const { data: vehicles = [], isLoading: isLoadingVehicles } = useCustomerVehicles(form.customer_id);
    const { data: saleRemarks = [] } = useSaleRemarks({ all: true });

    const activeBranches = useMemo(() => branches.filter((b: any) => b.status === 'active'), [branches]);

    const isLoading = isLoadingCustomers || isLoadingBranches || isLoadingCategories;
    const isCatalogLoading = !selectedBranchId || isLoadingServices || isLoadingProducts;
    const isAccountsLoading = !selectedBranchId || isLoadingAccounts;

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
    
    const handleToggleParts = (parts: any[]) => {
        const ids = parts.map(p => p.id);
        const allSelected = ids.length > 0 && ids.every(id => tempSelectedParts.includes(id));
        
        if (allSelected) {
            setTempSelectedParts(prev => prev.filter(id => !ids.includes(id)));
            setTempPartProductMap(prev => {
                const next = { ...prev };
                ids.forEach(id => delete next[id]);
                return next;
            });
        } else {
            setTempSelectedParts(prev => Array.from(new Set([...prev, ...ids])));
        }
    };
    
    // Quick Add Brand/Model states
    const [isSavingBrand, setIsSavingBrand] = useState(false);
    const [isSavingModel, setIsSavingModel] = useState(false);
    
    const handleAddBrand = async (name: string) => {
        if (!name) return;
        setIsSavingBrand(true);
        try {
            const res = await fetch('/api/services/vehicle-brands', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({ name, is_active: true })
            });
            if (res.ok) {
                const created = await res.json();
                toast.success(`Brand "${name}" created successfully`);
                queryClient.invalidateQueries({ queryKey: ['brands'] });
                setNewVehicle((prev: any) => ({ ...prev, brand_id: created.id, model_id: null }));
            } else {
                const err = await res.json();
                toast.error(err.message || 'Failed to create brand');
            }
        } catch (error) {
            toast.error('Error creating brand');
        } finally {
            setIsSavingBrand(false);
        }
    };

    const handleAddModel = async (brandId: number, name: string) => {
        if (!name || !brandId) return;
        setIsSavingModel(true);
        try {
            const res = await fetch('/api/services/vehicle-models', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({ brand_id: brandId, name, is_active: true })
            });
            if (res.ok) {
                const created = await res.json();
                toast.success(`Model "${name}" created successfully`);
                queryClient.invalidateQueries({ queryKey: ['brands'] });
                setNewVehicle((prev: any) => ({ ...prev, model_id: created.id }));
            } else {
                const err = await res.json();
                toast.error(err.message || 'Failed to create model');
            }
        } catch (error) {
            toast.error('Error creating model');
        } finally {
            setIsSavingModel(false);
        }
    };
    const [isEditingService, setIsEditingService] = useState(false);
    const [editingServiceId, setEditingServiceId] = useState<number | null>(null);

    // Default branch selection
    useEffect(() => {
        if (!selectedBranchId && activeBranches.length > 0 && !isEdit) {
            setSelectedBranchId(activeBranches[0].id);
        }
    }, [activeBranches, selectedBranchId, isEdit]);

    // Fetch existing order for editing
    useEffect(() => {
        if (isEdit) {
            const fetchOrder = async () => {
                try {
                    const response = await fetch(`/api/sales/orders/${id}`);
                    if (!response.ok) throw new Error('Failed to fetch order');
                    const data = await response.json();
                    
                    setForm({
                        customer_id: data.customer_id,
                        vehicle_id: data.vehicle_id,
                        order_date: data.order_date,
                        items: data.items.map((i: any) => ({
                            service_id: i.itemable_type.includes('Service') ? i.itemable_id : null,
                            product_id: i.itemable_type.includes('Product') ? i.itemable_id : null,
                            job_part_id: i.job_part_id,
                            qty: parseFloat(i.quantity),
                            unit_price: parseFloat(i.unit_price),
                            discount_type: 'FIXED', 
                            discount_value: parseFloat(i.discount_amount || 0),
                            discount: parseFloat(i.discount_amount || 0),
                            tax_percent: 0,
                        })),
                        subtotal: parseFloat(data.subtotal),
                        tax_total: parseFloat(data.tax_total),
                        discount_total: parseFloat(data.discount_total),
                        global_discount_type: data.discount_type || 'FIXED',
                        global_discount_value: parseFloat(data.discount_value || 0),
                        grand_total: parseFloat(data.grand_total),
                        taxable_amount: parseFloat(data.taxable_amount || 0),
                        notes: data.notes || '',
                        use_tax: parseFloat(data.tax_percent) > 0,
                        global_tax_percent: parseFloat(data.tax_percent || 10),
                        sale_remark_id: data.sale_remark_id,
                        invoice_image_path: data.invoice_image_path,
                        deposits: [], // We don't edit old deposits in this flow usually
                    });

                    // Restore manual subtotal override if it existed
                    const items_sum = data.items.reduce((acc: number, i: any) => acc + (parseFloat(i.quantity) * parseFloat(i.unit_price)), 0);
                    const db_subtotal = parseFloat(data.subtotal);
                    if (Math.abs(items_sum - db_subtotal) > 0.01) {
                        setManualGrandTotal(db_subtotal);
                    } else {
                        setManualGrandTotal(null);
                    }

                    setSelectedBranchId(data.branch_id);
                } catch (error) {
                    toast.error('Error loading order data');
                    console.error(error);
                } finally {
                    setLoadingOrder(false);
                }
            };
            setLoadingOrder(true);
            fetchOrder();
        }
    }, [id, isEdit]);

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
        
        // Calculate all items to add in one batch
        const baseServiceItem: SalesOrderItem = { 
            service_id: selectedServiceForItems.id, 
            product_id: null, 
            qty: 1, 
            unit_price: parseFloat(selectedServiceForItems.base_price || 0), 
            discount_type: 'FIXED', 
            discount_value: 0, 
            discount: 0,
            tax_percent: 0
        };

        const newComponentItems: SalesOrderItem[] = [];
        
        tempSelectedParts.forEach((partId: number) => {
            const part = selectedServiceForItems.parts.find((p: any) => p.id === partId);
            if (part) {
                const productId = tempPartProductMap[partId];
                if (productId) {
                    const p = products.find((x: any) => x.id === productId);
                    if (p) {
                        newComponentItems.push({
                            service_id: selectedServiceForItems.id,
                            product_id: p.id,
                            job_part_id: part.id,
                            qty: 1,
                            unit_price: parseFloat(p.price || 0),
                            discount_type: 'FIXED',
                            discount_value: 0,
                            discount: 0,
                            tax_percent: 0
                        });
                    }
                } else {
                    newComponentItems.push({
                        service_id: selectedServiceForItems.id,
                        product_id: null,
                        job_part_id: part.id,
                        qty: 1,
                        unit_price: 0,
                        discount_type: 'FIXED',
                        discount_value: 0,
                        discount: 0,
                        tax_percent: 0
                    });
                }
            }
        });
        
        setForm(prev => {
            let items = [...prev.items];
            if (isEditingService) {
                items = items.filter(i => i.service_id !== editingServiceId);
            }
            return { 
                ...prev, 
                items: [...items, ...newComponentItems] 
            };
        });
        
        toast.success(isEditingService ? `${selectedServiceForItems.name} components updated` : `${selectedServiceForItems.name} components added to cart`);
        setSelectedServiceForItems(null);
        setTempPartProductMap({});
        setIsEditingService(false);
        setEditingServiceId(null);
    };

    const handleEditPackage = (serviceId: number) => {
        const s = services.find((x: any) => x.id === serviceId);
        if (!s) return;

        // Find items related to this service
        const serviceItems = form.items.filter(i => i.service_id === serviceId);
        const initialSelectedParts: number[] = [];
        const initialPartProductMap: Record<number, number> = {};

        serviceItems.forEach(item => {
            if (item.job_part_id) {
                initialSelectedParts.push(item.job_part_id);
                if (item.product_id) {
                    initialPartProductMap[item.job_part_id] = item.product_id;
                }
            }
        });

        setTempSelectedParts(initialSelectedParts);
        setTempPartProductMap(initialPartProductMap);
        setSelectedServiceForItems(s);
        setIsEditingService(true);
        setEditingServiceId(serviceId);
        setShowCheckoutDialog(false);
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
        setForm(prev => ({ ...prev, deposits: [...prev.deposits, { amount: 0, payment_account_id: null, date: format(new Date(), 'yyyy-MM-dd'), notes: '', receipt: null }] }));
    };

    const updateDeposit = (index: number, changes: Partial<SalesOrder['deposits'][0]>) => {
        const newDeps = [...form.deposits];
        newDeps[index] = { ...newDeps[index], ...changes };
        setForm(prev => ({ ...prev, deposits: newDeps }));
    };

    // Totals calculation
    const roundTo2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

    useEffect(() => {
        // 1. Determine Base Subtotal (Manual Override vs Item Sum)
        const items_sum = form.items.reduce((acc, item) => acc + (item.qty * item.unit_price), 0);
        const subtotal = roundTo2(manualGrandTotal !== null ? manualGrandTotal : items_sum);
        
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

        const total_discount = roundTo2(items_discount_total + global_discount_amount);
        
        // 4. Calculate Tax
        let raw_tax_total = 0;
        if (form.use_tax) {
            raw_tax_total = (subtotal - total_discount) * (form.global_tax_percent / 100);
        } else {
            raw_tax_total = updatedItems.reduce((acc, item) => acc + (((item.qty * item.unit_price) - item.discount) * (item.tax_percent / 100)), 0);
            if (manualGrandTotal !== null) raw_tax_total = 0; // We don't support item-level tax with manual subtotal override
        }

        const tax_total = roundTo2(raw_tax_total);
        const taxable_amount = roundTo2(subtotal - total_discount);
        
        setForm(prev => ({ 
            ...prev, 
            subtotal, 
            discount_total: total_discount, 
            tax_total, 
            taxable_amount,
            grand_total: roundTo2(subtotal - total_discount + tax_total) 
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
            formData.append('branch_id', (selectedBranchId || activeBranches[0]?.id || 1).toString());
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
            formData.append('taxable_amount', form.taxable_amount.toString());
            formData.append('tax_percent', form.global_tax_percent.toString());
            if (form.sale_remark_id) formData.append('sale_remark_id', form.sale_remark_id.toString());
            formData.append('discount_type', form.global_discount_type);
            formData.append('discount_value', form.global_discount_value.toString());

            form.items.forEach((item, idx) => {
                if (item.service_id) formData.append(`items[${idx}][service_id]`, item.service_id.toString());
                if (item.product_id) formData.append(`items[${idx}][product_id]`, item.product_id.toString());
                if (item.job_part_id) formData.append(`items[${idx}][job_part_id]`, item.job_part_id.toString());
                formData.append(`items[${idx}][qty]`, item.qty.toString());
                formData.append(`items[${idx}][unit_price]`, item.unit_price.toString());
                formData.append(`items[${idx}][discount]`, item.discount.toString());
            });

            form.deposits.forEach((dep: any, idx) => {
                formData.append(`deposits[${idx}][amount]`, dep.amount.toString());
                formData.append(`deposits[${idx}][payment_account_id]`, dep.payment_account_id?.toString() || '');
                formData.append(`deposits[${idx}][date]`, dep.date);
                formData.append(`deposits[${idx}][notes]`, dep.notes);
                if (dep.receipt) {
                    formData.append(`deposits[${idx}][receipt]`, dep.receipt);
                }
            });
            if (invoiceImageFile) {
                formData.append('invoice_image', invoiceImageFile);
            } else if (isEdit && form.invoice_image_path) {
                // If we are editing and no new file is selected, 
                // the backend already has it, but we could explicitly pass the path if needed.
                // However, the backend update logic I wrote preserves it if no target file is uploaded.
            }

            if (isEdit) {
                formData.append('_method', 'PUT');
            }

            const url = isEdit ? `/api/sales/orders/${id}` : '/api/sales/orders';

            const response = await fetch(url, {
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
                let errorMessage = 'Failed to process sale';
                try {
                    const data = await response.json();
                    errorMessage = data.message || data.error || errorMessage;
                    if (data.errors) {
                        // Handle Laravel validation errors if present
                        const firstError = Object.values(data.errors)[0];
                        if (Array.isArray(firstError) && firstError.length > 0) {
                            errorMessage = firstError[0] as string;
                        }
                    }
                } catch (e) {
                    // If JSON parsing fails, use the status text
                    errorMessage = `Server Error: ${response.status} ${response.statusText}`;
                }
                toast.error(errorMessage);
                console.error('Submission failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    url: response.url
                });
            }
        } catch (error) {
            console.error('Fatal submission error:', error);
            toast.error(error instanceof Error ? `Critical Error: ${error.message}` : 'A unexpected system error occurred');
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
            
            {loadingOrder && (
                <div className="absolute inset-0 bg-white/60 dark:bg-gray-950/60 backdrop-blur-sm z-[100] flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-300">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                        <IconReceipt className="absolute inset-0 m-auto text-primary" size={24} />
                    </div>
                    <div className="text-center">
                        <p className="text-xs font-black uppercase text-gray-900 dark:text-white tracking-[0.2em]">Retreiving Order</p>
                        <p className="text-[10px] text-gray-400 font-bold mt-1">Acquiring sale data from secure storage...</p>
                    </div>
                </div>
            )}
            
            {/* Top Navigation Bar */}
            <div className="bg-white dark:bg-gray-900 px-4 py-4.5 flex items-center justify-between border-b dark:border-gray-800 shrink-0">
                <div className="flex items-center gap-3 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/sales/orders')} className="h-8 w-8 p-0">
                        <IconArrowLeft size={16} />
                    </Button>
                    <div>
                        <h1 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
                            {isEdit ? 'Edit Sale' : 'Point of Sale'}
                        </h1>
                        <p className="text-[9px] font-black uppercase text-primary tracking-widest leading-none mt-0.5">
                            {isEdit ? `Order #${id}` : 'Direct Checkout'}
                        </p>
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
                        <SelectTrigger className="w-[140px] h-9 font-bold text-[11px]">
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
                            className="pl-9 pr-8 h-9 text-[11px] font-bold"
                        />
                        {catalogSearch && (
                            <button 
                                onClick={() => setCatalogSearch('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <IconX size={12} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <SearchableSelect 
                        options={activeBranches.map((b: any) => ({ value: b.id, label: b.name }))}
                        value={selectedBranchId}
                        onChange={(val) => setSelectedBranchId(val as number)}
                        placeholder="Select Branch..."
                        className="w-[150px] h-9 font-bold border-primary/30 text-[11px]"
                        loading={isLoadingBranches}
                    />
                    <div className="h-9 w-[1px] bg-gray-100 dark:bg-gray-800" />
<div className="relative inline-flex">
  <Button 
    disabled={saving || form.items.length === 0} 
    onClick={() => setShowCheckoutDialog(true)}
    className="bg-primary hover:bg-primary/90 text-white font-bold px-6 h-9 shadow-md shadow-primary/20 active:scale-95 transition-all text-[11px]"
  >
    <IconShoppingCart className="mr-1.5" size={14} />
    Checkout
  </Button>
  
  {form.items.length > 0 && (
    <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-white ring-2 ring-background">
      {form.items.length}
    </span>
  )}
</div>

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
                            <div className="grid mt-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredServices.length > 0 ? (
                                    filteredServices.map((s: any) => (
                                        <button 
                                            key={s.id}
                                            onClick={() => handleAddItem('service', s.id)}
                                            className="group relative flex flex-col p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 text-left overflow-hidden hover:-translate-y-1 active:scale-95"
                                        >
                                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                <IconTools size={80} stroke={1} />
                                            </div>
                                            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform shadow-inner">
                                                <IconTools size={24} />
                                            </div>
                                            <h3 className="font-black text-gray-900 dark:text-white text-sm leading-snug mb-2 tracking-tight line-clamp-2">{s.name}</h3>
                                            <div className="mt-auto flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest leading-none mb-1">Standard Rate</span>
                                                    <span className="text-xl font-black text-primary tracking-tighter">${parseFloat(s.base_price || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                                    <IconPlus size={16} stroke={4} />
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="col-span-full py-24 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="w-20 h-20 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center mb-6 shadow-inner ring-1 ring-gray-100 dark:ring-gray-800">
                                            {catalogSearch ? <IconSearchOff size={32} className="text-primary/40" /> : <IconTools size={32} className="text-primary/40" />}
                                        </div>
                                        <div className="max-w-xs space-y-2">
                                            <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">
                                                {catalogSearch ? 'No Results Found' : 'Service Catalog Empty'}
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-bold leading-relaxed px-4">
                                                {catalogSearch 
                                                    ? `We couldn't find any services matching "${catalogSearch}". Try broadening your search terms.` 
                                                    : 'This category does not contain any services yet. Please check again later or switch categories.'
                                                }
                                            </p>
                                        </div>
                                        <div className="mt-8 flex gap-3">
                                            {catalogSearch && (
                                                <Button variant="outline" size="sm" onClick={() => setCatalogSearch('')} className="h-8 text-[9px] font-black rounded-full px-5 border-primary/20 text-primary hover:bg-primary/5 shadow-sm">
                                                    CLEAR SEARCH
                                                </Button>
                                            )}
                                            {selectedCategoryId !== 'all' && (
                                                <Button variant="ghost" size="sm" onClick={() => setSelectedCategoryId('all')} className="h-8 text-[9px] font-black rounded-full px-5 text-gray-400 hover:text-gray-600">
                                                    RESET FILTERS
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="grid mt-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {filteredProducts.length > 0 ? (
                                    filteredProducts.map((p: any) => (
                                        <button 
                                            key={p.id}
                                            onClick={() => handleAddItem('product', p.id)}
                                            className="group flex flex-col p-3 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-emerald-500/40 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-300 text-left hover:-translate-y-1 active:scale-95"
                                        >
                                            <div className="aspect-square rounded-xl bg-gray-50 dark:bg-gray-850 flex items-center justify-center mb-4 overflow-hidden relative shadow-inner ring-1 ring-gray-100/50 dark:ring-gray-800/50">
                                                {p.img ? (
                                                    <img 
                                                        src={p.img} 
                                                        alt={p.name} 
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = '/images/invalid-image.svg';
                                                        }}
                                                    />
                                                ) : (
                                                    <IconPackage size={32} className="text-gray-200 dark:text-gray-700 group-hover:scale-110 transition-transform" />
                                                )}
                                                
                                                {selectedBranchId && (
                                                    <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                                                        {(p.branch_stock_qty === null || p.branch_stock_qty <= 0) ? (
                                                            <Badge variant="destructive" className="text-[7px] px-1.5 py-0.5 shadow-xl border-0 font-black uppercase ring-2 ring-white dark:ring-gray-900">OUT</Badge>
                                                        ) : p.branch_stock_qty <= (p.reorder_level || 5) && (
                                                            <Badge variant="warning" className="text-[7px] px-1.5 py-0.5 shadow-xl border-0 font-black uppercase bg-amber-500 text-white hover:bg-amber-600 ring-2 ring-white dark:ring-gray-900">LOW</Badge>
                                                        )}
                                                        <span className="bg-black/60 backdrop-blur-md text-white text-[8px] font-black px-2 py-0.75 rounded-full shadow-lg border border-white/10">
                                                            {p.branch_stock_qty || 0}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <h3 className="font-black text-gray-900 dark:text-white text-[10px] leading-tight line-clamp-2 min-h-[24px] tracking-tight group-hover:text-emerald-600 transition-colors uppercase opacity-80">{p.name}</h3>
                                            <div className="mt-3 flex items-center justify-between pt-2 border-t border-gray-50 dark:border-gray-800/50">
                                                <span className="text-xs font-black text-emerald-600 tracking-tighter shadow-emerald-500/10">${parseFloat(p.price || 0).toLocaleString()}</span>
                                                <div className="p-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                                                    <IconPlus size={12} stroke={4} />
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="col-span-full py-24 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="w-20 h-20 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center mb-6 shadow-inner ring-1 ring-gray-100 dark:ring-gray-800">
                                            {catalogSearch ? <IconSearchOff size={32} className="text-emerald-600/40" /> : <IconPackage size={32} className="text-emerald-600/40" />}
                                        </div>
                                        <div className="max-w-xs space-y-2">
                                            <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">
                                                {catalogSearch ? 'No Products Found' : 'Inventory Catalog Empty'}
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-bold leading-relaxed px-4">
                                                {catalogSearch 
                                                    ? `We couldn't find any products matching "${catalogSearch}". Try broadening your search terms.` 
                                                    : 'This category does not contain any physical inventory products yet.'
                                                }
                                            </p>
                                        </div>
                                        <div className="mt-8 flex gap-3">
                                            {catalogSearch && (
                                                <Button variant="outline" size="sm" onClick={() => setCatalogSearch('')} className="h-8 text-[9px] font-black rounded-full px-5 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/5 shadow-sm">
                                                    CLEAR SEARCH
                                                </Button>
                                            )}
                                            {selectedCategoryId !== 'all' && (
                                                <Button variant="ghost" size="sm" onClick={() => setSelectedCategoryId('all')} className="h-8 text-[9px] font-black rounded-full px-5 text-gray-400 hover:text-gray-600">
                                                    RESET FILTERS
                                                </Button>
                                            )}
                                        </div>
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
                onAddCustomer={() => setShowAddCustomer(true)}
                removeItem={removeItem}
                updateItem={updateItem}
                addDeposit={addDeposit}
                updateDeposit={updateDeposit}
                receiptFile={receiptFile}
                setReceiptFile={setReceiptFile}
                invoiceImageFile={invoiceImageFile}
                setInvoiceImageFile={setInvoiceImageFile}
                loadingVehicles={isLoadingVehicles}
                loadingCustomers={isLoadingCustomers}
                loadingAccounts={isAccountsLoading}
                onEditPackage={handleEditPackage}
                isEdit={isEdit}
                saleRemarks={saleRemarks}
            />

            {/* Service Item Selector Dialog */}
            <Dialog 
                open={!!selectedServiceForItems} 
                onOpenChange={(open) => !open && setSelectedServiceForItems(null)}
            >
                <DialogContent className="sm:max-w-6xl p-0 overflow-hidden border-none bg-white dark:bg-gray-950 shadow-2xl rounded-3xl animate-in fade-in zoom-in-95 duration-300">
                    <DialogHeader className="p-6 border-b dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-inner">
                                <IconTools size={24} />
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <DialogTitle className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
                                        Package Configuration
                                    </DialogTitle>
                                </div>
                                <DialogDescription className="text-xs text-gray-400 tracking-wider flex items-center gap-2">
                                    {selectedServiceForItems?.name}
                                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                                    Configure service components
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    
                    <ScrollArea className="max-h-[70vh]">
                        <div className="p-6 space-y-10 !pt-0">
                            {/* Implementation Parts Section */}
                            {selectedServiceForItems?.parts?.length > 0 && (
                                <section className="space-y-4">
                                    <div className="flex items-center justify-between border-b pb-4 dark:border-gray-800">
                                        <h4 className="text-[11px] font-bold uppercase tracking-widest text-primary flex items-center gap-3">
                                            <IconTools size={16} className="animate-pulse" /> 
                                            Configure Package Components
                                        </h4>
                                        <div className="flex items-center gap-3">
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => handleToggleParts(selectedServiceForItems.parts)}
                                                className="h-7 text-[8px] font-black uppercase tracking-widest border-primary/20 text-primary hover:bg-primary/5 rounded-lg px-3"
                                            >
                                                {selectedServiceForItems.parts.length > 0 && selectedServiceForItems.parts.every((p: any) => tempSelectedParts.includes(p.id)) ? 'Unselect All' : 'Select All'}
                                            </Button>
                                            <Badge variant="outline" className="text-[9px] font-bold border-primary/20 text-primary px-3 py-1 rounded-full bg-primary/5">
                                                {selectedServiceForItems.parts.length} Total Components
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {/* Left Side Column */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between px-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1 h-1 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                                    <h5 className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Left Side</h5>
                                                </div>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => handleToggleParts(selectedServiceForItems.parts.filter((p: any) => p.side?.toLowerCase() === 'left'))}
                                                    className="h-6 text-[7px] font-black uppercase tracking-tighter text-primary/60 hover:text-primary hover:bg-primary/5 px-2"
                                                >
                                                    {(() => {
                                                        const leftParts = selectedServiceForItems.parts.filter((p: any) => p.side?.toLowerCase() === 'left');
                                                        return leftParts.length > 0 && leftParts.every((p: any) => tempSelectedParts.includes(p.id)) ? 'Unselect All' : 'Select All';
                                                    })()}
                                                </Button>
                                            </div>
                                            <div className="space-y-4">
                                                {selectedServiceForItems.parts.filter((p: any) => p.side?.toLowerCase() === 'left').length > 0 ? (
                                                    selectedServiceForItems.parts.filter((p: any) => p.side?.toLowerCase() === 'left').map((p: any) => (
                                                        <PartConfigurationCard 
                                                            key={p.id} 
                                                            p={p} 
                                                            tempSelectedParts={tempSelectedParts} 
                                                            setTempSelectedParts={setTempSelectedParts} 
                                                            tempPartProductMap={tempPartProductMap} 
                                                            setTempPartProductMap={setTempPartProductMap}
                                                            products={products}
                                                            materials={selectedServiceForItems.materials}
                                                        />
                                                    ))
                                                ) : (
                                                    <div className="py-10 border border-dashed rounded-2xl flex flex-col items-center justify-center text-gray-300 dark:border-gray-800">
                                                        <IconTools size={24} className="opacity-20 mb-2" />
                                                        <span className="text-[9px] font-bold uppercase tracking-tight">No Left Components</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Main / Center Column */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between px-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1 h-1 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                                                    <h5 className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Main / Center</h5>
                                                </div>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => handleToggleParts(selectedServiceForItems.parts.filter((p: any) => !p.side || (p.side?.toLowerCase() !== 'left' && p.side?.toLowerCase() !== 'right')))}
                                                    className="h-6 text-[7px] font-black uppercase tracking-tighter text-primary/60 hover:text-primary hover:bg-primary/5 px-2"
                                                >
                                                    {(() => {
                                                        const mainParts = selectedServiceForItems.parts.filter((p: any) => !p.side || (p.side?.toLowerCase() !== 'left' && p.side?.toLowerCase() !== 'right'));
                                                        return mainParts.length > 0 && mainParts.every((p: any) => tempSelectedParts.includes(p.id)) ? 'Unselect All' : 'Select All';
                                                    })()}
                                                </Button>
                                            </div>
                                            <div className="space-y-4">
                                                {selectedServiceForItems.parts.filter((p: any) => !p.side || (p.side?.toLowerCase() !== 'left' && p.side?.toLowerCase() !== 'right')).length > 0 ? (
                                                    selectedServiceForItems.parts.filter((p: any) => !p.side || (p.side?.toLowerCase() !== 'left' && p.side?.toLowerCase() !== 'right')).map((p: any) => (
                                                        <PartConfigurationCard 
                                                            key={p.id} 
                                                            p={p} 
                                                            tempSelectedParts={tempSelectedParts} 
                                                            setTempSelectedParts={setTempSelectedParts} 
                                                            tempPartProductMap={tempPartProductMap} 
                                                            setTempPartProductMap={setTempPartProductMap}
                                                            products={products}
                                                            materials={selectedServiceForItems.materials}
                                                        />
                                                    ))
                                                ) : (
                                                    <div className="py-10 border border-dashed rounded-2xl flex flex-col items-center justify-center text-gray-300 dark:border-gray-800">
                                                        <IconTools size={24} className="opacity-20 mb-2" />
                                                        <span className="text-[9px] font-bold uppercase tracking-tight">No Main Components</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right Side Column */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between px-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                    <h5 className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Right Side</h5>
                                                </div>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => handleToggleParts(selectedServiceForItems.parts.filter((p: any) => p.side?.toLowerCase() === 'right'))}
                                                    className="h-6 text-[8px] font-black uppercase tracking-tighter text-primary/60 hover:text-primary hover:bg-primary/5 px-2"
                                                >
                                                    {(() => {
                                                        const rightParts = selectedServiceForItems.parts.filter((p: any) => p.side?.toLowerCase() === 'right');
                                                        return rightParts.length > 0 && rightParts.every((p: any) => tempSelectedParts.includes(p.id)) ? 'Unselect All' : 'Select All';
                                                    })()}
                                                </Button>
                                            </div>
                                            <div className="space-y-4">
                                                {selectedServiceForItems.parts.filter((p: any) => p.side?.toLowerCase() === 'right').length > 0 ? (
                                                    selectedServiceForItems.parts.filter((p: any) => p.side?.toLowerCase() === 'right').map((p: any) => (
                                                        <PartConfigurationCard 
                                                            key={p.id} 
                                                            p={p} 
                                                            tempSelectedParts={tempSelectedParts} 
                                                            setTempSelectedParts={setTempSelectedParts} 
                                                            tempPartProductMap={tempPartProductMap} 
                                                            setTempPartProductMap={setTempPartProductMap}
                                                            products={products}
                                                            materials={selectedServiceForItems.materials}
                                                        />
                                                    ))
                                                ) : (
                                                    <div className="py-10 border border-dashed rounded-2xl flex flex-col items-center justify-center text-gray-300 dark:border-gray-800">
                                                        <IconTools size={24} className="opacity-20 mb-2" />
                                                        <span className="text-[9px] font-bold uppercase tracking-tight">No Right Components</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}
                        </div>
                    </ScrollArea>
                    
                    <DialogFooter className="p-6 bg-gray-50/50 dark:bg-gray-900/50 border-t dark:border-gray-800 shrink-0">
                        <Button 
                            onClick={confirmServiceItems}
                            disabled={tempSelectedParts.length === 0 || tempSelectedParts.some(id => !tempPartProductMap[id])}
                            className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg shadow-xl shadow-primary/20 flex items-center justify-between px-8 group transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:pointer-events-none"
                        >
                            <div className="flex flex-col items-start gap-0.5">
                                <span className="text-sm tracking-tight uppercase">Include Selected Components</span>
                                <span className="text-[8px] font-bold text-white/60 tracking-widest leading-none uppercase">
                                    {tempSelectedParts.some(id => !tempPartProductMap[id]) 
                                        ? 'Selection is required for all parts' 
                                        : 'Update current cart session'}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-[1px] h-6 bg-white/20" />
                                <IconPlus size={20} className="transition-transform duration-500" stroke={3} />
                            </div>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

             <CustomerDialog
                isOpen={showAddCustomer}
                setIsOpen={setShowAddCustomer}
                customer={null}
                customerTypes={customerTypes}
                onSave={() => {
                    queryClient.invalidateQueries({ queryKey: ['customers'] });
                }}
            />

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
                                <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Brand</Label>
                                <SearchableSelect 
                                    options={brands.map((b: any) => ({ value: b.id, label: b.name }))}
                                    value={newVehicle.brand_id}
                                    onChange={(v) => setNewVehicle({ ...newVehicle, brand_id: v as number, model_id: null })}
                                    placeholder="Choose Brand..."
                                    className="h-11 rounded-lg"
                                    loading={isLoadingBrands}
                                    footer={
                                        <QuickAddFooter 
                                            label="Brand" 
                                            onAdd={handleAddBrand} 
                                            isSaving={isSavingBrand} 
                                        />
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Model</Label>
                                <SearchableSelect 
                                    disabled={!newVehicle.brand_id}
                                    options={(brands.find((b: any) => b.id === newVehicle.brand_id)?.models || []).map((m: any) => ({ 
                                        value: m.id, 
                                        label: m.name 
                                    }))}
                                    value={newVehicle.model_id}
                                    onChange={(v) => setNewVehicle({ ...newVehicle, model_id: v as number })}
                                    placeholder={!newVehicle.brand_id ? "Select Brand First" : "Select Model..."}
                                    emptyMessage={newVehicle.brand_id ? "No models found for this brand" : "Select a brand to see models"}
                                    className="h-11 rounded-lg"
                                    loading={isLoadingBrands}
                                    footer={
                                        newVehicle.brand_id && (
                                            <QuickAddFooter 
                                                label="Model" 
                                                onAdd={(name) => handleAddModel(newVehicle.brand_id!, name)} 
                                                isSaving={isSavingModel} 
                                            />
                                        )
                                    }
                                />
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
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-lg shadow-lg"
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
