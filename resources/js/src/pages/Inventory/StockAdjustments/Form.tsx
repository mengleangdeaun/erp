import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { toast } from 'sonner';
import { Plus, X, ArrowLeft, Save, Settings2, Package, Trash2 } from 'lucide-react';
import { IconAdjustments, IconPackage, IconTrash } from '@tabler/icons-react';
import { format } from 'date-fns';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';

// Custom components
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { DatePicker } from '../../../components/ui/date-picker';
import { Card } from '../../../components/ui/card';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import { MapPin } from 'lucide-react';

interface Product { 
    id: number; 
    code: string; 
    name: string; 
    base_uom?: { name: string; short_name: string };
    stocks?: { location_id: number; quantity: number | string }[];
};
interface Location { id: number; name: string };
interface AdjustmentItem {
    product_id: string;
    location_id: string;
    current_qty: string;
    adjustment_qty: string;
    new_qty: string;
    reason: string;
    is_fetching?: boolean;
}

const emptyItem: AdjustmentItem = {
    product_id: '',
    location_id: '',
    current_qty: '0',
    adjustment_qty: '0',
    new_qty: '0',
    reason: 'ADJUSTMENT_STOCK_TAKE_CORRECTION', // Default reason
    is_fetching: false,
};

const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
};

const apiFetch = (url: string, options: RequestInit = {}) =>
    fetch(url, {
        ...options,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
            ...(options.headers || {}),
        },
        credentials: 'include',
    });

export default function StockAdjustmentForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const isEdit = !!id;

    const [loading, setLoading] = useState(isEdit);
    const [configsLoading, setConfigsLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    
    const [formData, setFormData] = useState({
        date: format(new Date(), 'yyyy-MM-dd'),
        notes: '',
        location_id: '',
    });
    const [items, setItems] = useState<AdjustmentItem[]>([{ ...emptyItem }]);

    const filteredProducts = useMemo(() => {
        if (!formData.location_id) return products;
        return products.filter(p => 
            p.stocks?.some(s => String(s.location_id) === formData.location_id && parseFloat(String(s.quantity)) > 0)
        );
    }, [products, formData.location_id]);

    useEffect(() => {
        dispatch(setPageTitle(isEdit ? 'Edit Stock Adjustment' : 'New Stock Adjustment'));
        fetchConfigs();
        if (isEdit) fetchAdjustment();
    }, [id, isEdit]);

    const fetchConfigs = async () => {
        setConfigsLoading(true);
        try {
            const [prodRes, locRes] = await Promise.all([
                apiFetch('/api/inventory/products?all=true'),
                apiFetch('/api/inventory/locations')
            ]);
            const prodData = await prodRes.json();
            const locData = await locRes.json();
            
            setProducts(Array.isArray(prodData) ? prodData : (prodData.data || []));
            setLocations(Array.isArray(locData) ? locData : (locData.data || []));
        } catch {
            toast.error('Failed to load configuration data');
        } finally {
            setConfigsLoading(false);
        }
    };

    const fetchAdjustment = async () => {
        try {
            const res = await apiFetch(`/api/inventory/stock-adjustments/${id}`);
            if (res.ok) {
                const data = await res.json();
                if (data.status === 'COMPLETED') {
                    toast.error('Cannot edit a completed adjustment');
                    navigate('/inventory/stock-adjustments');
                    return;
                }
                setFormData({
                    date: data.date.slice(0, 10),
                    notes: data.notes || '',
                    location_id: data.items.length > 0 ? String(data.items[0].location_id) : '',
                });
                setItems(data.items.map((i: any) => ({
                    product_id: String(i.product_id),
                    location_id: String(i.location_id),
                    current_qty: String(i.current_qty),
                    adjustment_qty: String(i.adjustment_qty),
                    new_qty: String(i.new_qty),
                    reason: i.reason || 'ADJUSTMENT_STOCK_TAKE_CORRECTION',
                })));
            }
        } catch {
            toast.error('Failed to load adjustment details');
        } finally {
            setLoading(false);
        }
    };

    const fetchCurrentStock = async (productId: string, locationId: string, index: number) => {
        if (!productId || !locationId) return;
        updateItem(index, 'is_fetching' as any, true as any);
        try {
            const res = await apiFetch(`/api/inventory/stocks?product_id=${productId}&location_id=${locationId}`);
            const data = await res.json();
            const qty = data.length > 0 ? parseFloat(data[0].quantity) : 0;
            updateItem(index, 'current_qty', String(qty));
        } catch {
            console.error('Failed to fetch current stock');
        } finally {
            updateItem(index, 'is_fetching' as any, false as any);
        }
    };

    const updateItem = (index: number, key: keyof AdjustmentItem, value: any) => {
        setItems(prev => {
            const newItems = [...prev];
            newItems[index] = { ...newItems[index], [key]: value };
            
            // Auto calculate New Qty if Adjustment Qty or Current Qty changed
            if (key === 'adjustment_qty' || key === 'current_qty' ) {
                const adj = parseFloat(newItems[index].adjustment_qty) || 0;
                const curr = parseFloat(newItems[index].current_qty) || 0;
                newItems[index].new_qty = String(curr + adj);
            }
            // Auto calculate Adjustment Qty if New Qty changed
            else if (key === 'new_qty') {
                const n = parseFloat(newItems[index].new_qty) || 0;
                const curr = parseFloat(newItems[index].current_qty) || 0;
                newItems[index].adjustment_qty = String(n - curr);
            }

            // Fetch current stock if product changed
            if (key === 'product_id' && formData.location_id) {
                fetchCurrentStock(value, formData.location_id, index);
            }

            return newItems;
        });
    };

    // Effect to refetch all stock when location changes
    useEffect(() => {
        if (formData.location_id) {
            items.forEach((item, idx) => {
                if (item.product_id) {
                    fetchCurrentStock(item.product_id, formData.location_id, idx);
                }
            });
        }
    }, [formData.location_id]);

    const handleSubmit = async (e: React.FormEvent, status: 'DRAFT' | 'PENDING' = 'DRAFT') => {
        if (e) e.preventDefault();
        
        if (!formData.location_id) {
            toast.error('Please select an adjustment location.');
            return;
        }

        const validItems = items.filter(it => it.product_id);
        if (validItems.length === 0) {
            toast.error('Please add at least one product.');
            return;
        }

        const invalidItems = validItems.filter(it => parseFloat(it.new_qty) < 0);
        if (invalidItems.length > 0) {
            toast.error('Some items result in negative stock. Please correct them.');
            return;
        }

        setSubmitting(true);
        await fetch('/sanctum/csrf-cookie');
        
        const payload = {
            date: formData.date,
            notes: formData.notes,
            items: items.filter(it => it.product_id).map(it => ({
                product_id: parseInt(it.product_id),
                location_id: parseInt(formData.location_id),
                current_qty: parseFloat(it.current_qty),
                adjustment_qty: parseFloat(it.adjustment_qty),
                new_qty: parseFloat(it.new_qty),
                reason: it.reason,
            })),
            status: status
        };

        try {
            const url = isEdit ? `/api/inventory/stock-adjustments/${id}` : '/api/inventory/stock-adjustments';
            const method = isEdit ? 'PUT' : 'POST';
            const res = await apiFetch(url, { method, body: JSON.stringify(payload) });
            if (res.ok) {
                toast.success(isEdit ? 'Adjustment updated' : 'Adjustment created');
                navigate('/inventory/stock-adjustments');
            } else {
                const err = await res.json();
                toast.error(err.message || 'Failed to save adjustment');
            }
        } catch {
            toast.error('An error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div><TableSkeleton columns={4} rows={10} /></div>;

    return (
        <div>
            {/* Custom Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2.5 rounded-lg border border-primary/20 shadow-sm">
                            <IconAdjustments className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                                {isEdit ? 'Edit Stock Adjustment' : 'New Stock Adjustment'}
                            </h1>
                            <p className="text-sm text-gray-500">Correct manually your inventory stock levels</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-3 pr-3 border-r border-gray-100 dark:border-gray-800">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 shrink-0 mb-0">Adjustment Date</Label>
                        <DatePicker
                            value={new Date(formData.date)}
                            onChange={(date) => setFormData(p => ({ ...p, date: date ? format(date, 'yyyy-MM-dd') : '' }))}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => navigate('/inventory/stock-adjustments')} className="h-10 text-xs">Cancel</Button>
                        <Button 
                            type="button"
                            variant="secondary" 
                            onClick={(e) => handleSubmit(e, 'DRAFT')} 
                            disabled={submitting} 
                            className="h-10 text-xs flex items-center gap-2 border border-gray-200 dark:border-gray-800"
                        >
                            {submitting ? 'Saving...' : <><Save className="w-3.5 h-3.5" /> Save as Draft</>}
                        </Button>
                        <Button 
                            type="button"
                            onClick={(e) => handleSubmit(e, 'PENDING')} 
                            disabled={submitting} 
                            className="h-10 text-xs flex items-center gap-2 shadow-md shadow-primary/20"
                        >
                            {submitting ? 'Submitting...' : <><Save className="w-3.5 h-3.5" /> Submit for Approval</>}
                        </Button>
                    </div>
                </div>
            </div>

            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                {/* Meta Section: Location Selection */}
                <Card className="p-5 border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 mb-1">
                                <MapPin className="w-3.5 h-3.5" /> Adjustment Location
                                <span className="text-red-500">*</span>
                            </Label>
                            <SearchableSelect
                                options={locations.map(l => ({ value: String(l.id), label: l.name }))}
                                value={formData.location_id}
                                onChange={(val: string | number) => setFormData(p => ({ ...p, location_id: String(val) }))}
                                placeholder="Select the location you are adjusting"
                                loading={configsLoading}
                            />
                        </div>
                        <div className="hidden md:block pb-1">
                            <p className="text-xs text-gray-500 italic">
                                {formData.location_id 
                                    ? "Only products available in this location will be selectable below." 
                                    : "Please select a location first to enable product selection."}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="p-0 border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                    <div className="p-4 bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">
                             <Package className="w-4 h-4" /> Adjustment Items
                            <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                {items.length} Product{items.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto min-h-[300px]">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50/30 dark:bg-gray-900/10 text-gray-500 font-medium uppercase text-[10px] tracking-[0.1em] border-b border-gray-100 dark:border-gray-800">
                                <tr>
                                    <th className="px-6 py-4 text-left font-bold min-w-[350px]">Product Name / Code</th>
                                    <th className="px-6 py-4 text-right w-32 font-bold whitespace-nowrap">On Hand</th>
                                    <th className="px-6 py-4 text-right w-32 font-bold whitespace-nowrap">Adjustment</th>
                                    <th className="px-6 py-4 text-right w-32 font-bold whitespace-nowrap text-primary underline decoration-2 underline-offset-4">Final Qty</th>
                                    <th className="px-6 py-4 text-left w-64 font-bold">Reason</th>
                                    <th className="px-6 py-4 w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {items.map((it, idx) => (
                                    <tr key={idx} className="group hover:bg-gray-50/20 dark:hover:bg-gray-900/10 transition-colors">
                                        <td className="px-6 py-4">
                                            <SearchableSelect
                                                options={filteredProducts.map(p => ({ 
                                                    value: String(p.id), 
                                                    label: `${p.code} - ${p.name}` 
                                                }))}
                                                value={it.product_id}
                                                onChange={(val) => updateItem(idx, 'product_id', String(val))}
                                                placeholder={formData.location_id ? "Select Product..." : "Select Location First"}
                                                loading={configsLoading}
                                                disabled={!formData.location_id}
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {it.is_fetching ? (
                                                <div className="flex justify-end pr-3">
                                                    <div className="h-5 w-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-end pr-1">
                                                    <span className="font-bold text-gray-700 dark:text-gray-300 text-lg leading-none tracking-tight">
                                                        {parseFloat(it.current_qty)}
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Input
                                                type="number"
                                                value={it.adjustment_qty}
                                                onChange={(e) => updateItem(idx, 'adjustment_qty', e.target.value)}
                                                className={`h-10 text-right font-semibold ${
                                                    parseFloat(it.adjustment_qty) > 0 ? 'text-green-600' : 
                                                    parseFloat(it.adjustment_qty) < 0 ? 'text-red-500' : ''
                                                }`}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <Input
                                                type="number"
                                                value={it.new_qty}
                                                onChange={(e) => updateItem(idx, 'new_qty', e.target.value)}
                                                className={`h-10 text-right font-bold transition-all ${
                                                    parseFloat(it.new_qty) < 0 
                                                        ? 'border-red-500 bg-red-50 text-red-600 focus:ring-red-500' 
                                                        : 'text-primary bg-primary/5 border-primary/20 focus:bg-primary/10'
                                                }`}
                                            />
                                            {parseFloat(it.new_qty) < 0 && (
                                                <p className="text-[9px] text-red-500 font-bold mt-1 text-right italic">Invalid Negative Stock</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Select value={it.reason} onValueChange={(val) => updateItem(idx, 'reason', val)}>
                                                <SelectTrigger className="h-10 bg-white/50 dark:bg-black/20 text-xs shadow-none border-gray-100 dark:border-gray-800">
                                                    <SelectValue placeholder="Select Reason" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ADJUSTMENT_DAMAGE">Damage</SelectItem>
                                                    <SelectItem value="ADJUSTMENT_FOUND">Found</SelectItem>
                                                    <SelectItem value="ADJUSTMENT_STOCK_TAKE_CORRECTION">Stock Take</SelectItem>
                                                    <SelectItem value="ADJUSTMENT_OTHER">Other</SelectItem>
                                                    <SelectItem value="STOCK_IN_MANUAL">Manual In</SelectItem>
                                                    <SelectItem value="STOCK_OUT_MANUAL">Manual Out</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {items.length > 1 && (
                                                <Button 
                                                    type="button" 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => setItems(p => p.filter((_, i) => i !== idx))} 
                                                    className="h-8 w-8 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                             <Button type="button" variant="ghost" size="sm" onClick={() => setItems(p => [...p, { ...emptyItem }])} className="text-primary font-black text-[10px] uppercase tracking-[0.2em] gap-2 ml-2">
                                <Plus className="w-4 h-4" /> Add Row
                            </Button>
                        </div>
                    </div>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="p-5 md:col-span-3 border-gray-100 dark:border-gray-800 shadow-sm space-y-3">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Notes / Internal Remarks</Label>
                         <Textarea
                            value={formData.notes}
                            onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                            placeholder="Why are you making this adjustment? (Optional)"
                            rows={3}
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none shadow-none"
                        />
                    </Card>
                    <div className="md:col-span-1 space-y-4">
                        <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 shadow-inner">
                            <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-3">Adjustment Summary</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-medium tracking-tight">Total Items</span>
                                    <span className="font-black text-gray-900 dark:text-white">{items.length}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm pt-2 mt-2 border-t border-primary/10">
                                    <span className="text-gray-500 font-medium tracking-tight">Auto-Status</span>
                                    <span className="font-black text-primary/70 uppercase text-[10px] tracking-widest">PENDING</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
