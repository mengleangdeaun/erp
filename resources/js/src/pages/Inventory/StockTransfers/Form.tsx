import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { toast } from 'sonner';
import { 
    Plus, 
    Trash2, 
    Save, 
    ArrowLeft, 
    Package, 
    MapPin, 
    Calendar, 
    AlertCircle,
    ArrowRight,
    AlertTriangle
} from 'lucide-react';
import { IconArrowsExchange } from '@tabler/icons-react';
import { useFormatDate } from '@/hooks/useFormatDate';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { DatePicker } from '../../../components/ui/date-picker';
import { Label } from '../../../components/ui/label';
import { format } from 'date-fns';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import TableSkeleton from '../../../components/ui/TableSkeleton';

interface TransferItem {
    product_id: string;
    product_name?: string;
    product_code?: string;
    quantity: number;
    is_fetching?: boolean;
    current_qty?: number;
}

interface Location {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    code: string;
    base_uom?: { name: string; short_name: string };
    stocks?: { location_id: number; quantity: number | string }[];
}

const emptyItem: TransferItem = {
    product_id: '',
    quantity: 1,
    is_fetching: false,
    current_qty: 0,
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

export default function StockTransferForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const isEdit = !!id;

    const [loading, setLoading] = useState(isEdit);
    const [configsLoading, setConfigsLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [fromLocationId, setFromLocationId] = useState('');
    const [toLocationId, setToLocationId] = useState('');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<TransferItem[]>([{ ...emptyItem }]);

    // Options
    const [locations, setLocations] = useState<Location[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    const filteredProducts = useMemo(() => {
        if (!fromLocationId) return products;
        return products.filter(p => 
            p.stocks?.some(s => String(s.location_id) === fromLocationId && parseFloat(String(s.quantity)) > 0)
        );
    }, [products, fromLocationId]);

    useEffect(() => {
        dispatch(setPageTitle(isEdit ? 'Edit Stock Transfer' : 'New Stock Transfer'));
        fetchConfigs();
        if (isEdit) fetchTransfer();
    }, [id, isEdit]);

    const fetchConfigs = async () => {
        setConfigsLoading(true);
        try {
            const [locRes, prodRes] = await Promise.all([
                apiFetch('/api/inventory/locations'),
                apiFetch('/api/inventory/products')
            ]);
            setLocations(await locRes.json());
            setProducts(await prodRes.json());
        } catch {
            toast.error('Failed to load configuration data');
        } finally {
            setConfigsLoading(false);
        }
    };

    const fetchTransfer = async () => {
        setLoading(true);
        try {
            const res = await apiFetch(`/api/inventory/stock-transfers/${id}`);
            if (res.ok) {
                const data = await res.json();
                setDate(data.date.slice(0, 10));
                setFromLocationId(String(data.from_location_id));
                setToLocationId(String(data.to_location_id));
                setNotes(data.notes || '');
                setItems(data.items.map((it: any) => ({
                    product_id: String(it.product_id),
                    quantity: Number(it.quantity),
                    current_qty: Number(it.current_qty || 0),
                    is_fetching: false,
                })));
            }
        } catch {
            toast.error('Failed to load transfer');
        } finally {
            setLoading(false);
        }
    };

    const fetchCurrentStock = async (productId: string, locationId: string, index: number) => {
        if (!productId || !locationId) return;
        updateItem(index, 'is_fetching', true);
        try {
            const res = await apiFetch(`/api/inventory/stocks?product_id=${productId}&location_id=${locationId}`);
            const data = await res.json();
            const qty = data.length > 0 ? parseFloat(data[0].quantity) : 0;
            updateItem(index, 'current_qty', qty);
        } catch {
            console.error('Failed to fetch current stock');
        } finally {
            updateItem(index, 'is_fetching', false);
        }
    };

    const addItem = () => {
        setItems([...items, { ...emptyItem }]);
    };

    const removeItem = (index: number) => {
        if (items.length <= 1) return;
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof TransferItem, value: any) => {
        setItems(prev => {
            const newItems = [...prev];
            newItems[index] = { ...newItems[index], [field]: value };
            
            // Fetch current stock if product changed or if location was just selected
            if (field === 'product_id' && fromLocationId) {
                fetchCurrentStock(String(value), fromLocationId, index);
            }
            
            return newItems;
        });
    };

    // Effect to refetch all stock when source location changes
    useEffect(() => {
        if (fromLocationId) {
            items.forEach((item, idx) => {
                if (item.product_id) {
                    fetchCurrentStock(item.product_id, fromLocationId, idx);
                }
            });
        }
    }, [fromLocationId]);

    const handleSubmit = async (status: 'DRAFT' | 'PENDING' = 'DRAFT') => {
        if (!fromLocationId || !toLocationId) {
            toast.error('Source and destination locations are required');
            return;
        }
        if (fromLocationId === toLocationId) {
            toast.error('Source and destination must be different');
            return;
        }

        const validItems = items.filter(it => it.product_id && it.quantity > 0);
        if (validItems.length === 0) {
            toast.error('Add at least one product with a valid quantity');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                date,
                from_location_id: fromLocationId,
                to_location_id: toLocationId,
                notes,
                status,
                items: validItems.map(it => ({
                    product_id: it.product_id,
                    quantity: it.quantity
                }))
            };

            // Validation for stock on hand
            const overStockItems = validItems.filter(it => it.quantity > (it.current_qty || 0));
            if (overStockItems.length > 0) {
                toast.error('Some items exceed the available stock on hand');
                return;
            }

            const url = isEdit ? `/api/inventory/stock-transfers/${id}` : '/api/inventory/stock-transfers';
            const method = isEdit ? 'PUT' : 'POST';

            const res = await apiFetch(url, {
                method,
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success(isEdit ? 'Transfer updated' : 'Transfer created');
                navigate('/inventory/stock-transfers');
            } else {
                const err = await res.json();
                toast.error(err.message || 'Failed to save transfer');
            }
        } catch {
            toast.error('An error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div><TableSkeleton columns={4} rows={10} /></div>;

    return (
        <div className="pb-20">
            {/* Custom Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2.5 rounded-lg border border-primary/20 shadow-sm">
                            <IconArrowsExchange className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                                {isEdit ? 'Edit Stock Transfer' : 'New Stock Transfer'}
                            </h1>
                            <p className="text-sm text-gray-500">Move products between warehouses or stores</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-3 pr-3 border-r border-gray-100 dark:border-gray-800">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 shrink-0 mb-0">Transfer Date</Label>
                        <DatePicker
                            value={date ? new Date(date) : undefined}
                            onChange={(d: Date | undefined) => setDate(d ? format(d, 'yyyy-MM-dd') : '')}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => navigate('/inventory/stock-transfers')} className="h-10 text-xs">Cancel</Button>
                        <Button 
                            type="button"
                            variant="secondary" 
                            onClick={() => handleSubmit('DRAFT')} 
                            disabled={submitting} 
                            className="h-10 text-xs flex items-center gap-2 border border-gray-200 dark:border-gray-800"
                        >
                            {submitting ? 'Saving...' : <><Save className="w-3.5 h-3.5" /> Save as Draft</>}
                        </Button>
                        <Button 
                            type="button"
                            onClick={() => handleSubmit('PENDING')} 
                            disabled={submitting} 
                            className="h-10 text-xs flex items-center gap-2 shadow-md shadow-primary/20"
                        >
                            {submitting ? 'Submitting...' : <><Save className="w-3.5 h-3.5" /> Submit for Approval</>}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {/* Locations Selection */}
<Card className="p-5 border-gray-100 dark:border-gray-800 shadow-sm">
  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
    
    {/* FROM */}
    <div className="space-y-3">
      <Label className="text-[10px] font-black uppercase tracking-widest text-red-500 flex items-center gap-2">
        <MapPin className="w-3.5 h-3.5" /> SOURCE (FROM)
      </Label>
      <SearchableSelect
        options={locations.map(l => ({ value: String(l.id), label: l.name }))}
        value={fromLocationId}
        onChange={(val: string | number) => setFromLocationId(String(val))}
        placeholder="Select source location"
        loading={configsLoading}
      />
    </div>

    {/* CONNECTOR */}
    <div className="hidden md:flex justify-center">
      <div className="bg-white dark:bg-gray-950 p-2 rounded-full border border-gray-100 dark:border-gray-800 shadow-sm text-primary">
        <ArrowRight className="w-5 h-5" />
      </div>
    </div>

    {/* TO */}
    <div className="space-y-3">
      <Label className="text-[10px] font-black uppercase tracking-widest text-green-600 flex items-center gap-2">
        <MapPin className="w-3.5 h-3.5" /> DESTINATION (TO)
      </Label>
      <SearchableSelect
        options={locations.map(l => ({ value: String(l.id), label: l.name }))}
        value={toLocationId}
        onChange={(val: string | number) => setToLocationId(String(val))}
        placeholder="Select destination"
        loading={configsLoading}
      />
    </div>

  </div>

  {fromLocationId && toLocationId && fromLocationId === toLocationId && (
    <div className="mt-4 bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-100 dark:border-red-900/20 flex gap-3 text-red-600 items-center">
      <AlertCircle className="w-4 h-4 shrink-0" />
      <p className="text-xs font-bold uppercase tracking-tight">
        Source and destination locations must be different.
      </p>
    </div>
  )}
</Card>

                <Card className="p-0 border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                    <div className="p-4 bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                             <Package className="w-4 h-4" /> Transfer Items
                            <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                {items.length} Product{items.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto min-h-[300px]">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50/30 dark:bg-gray-900/10 text-gray-500 font-medium uppercase text-[10px] tracking-widest border-b border-gray-100 dark:border-gray-800">
                                <tr>
                                    <th className="px-6 py-4 text-left font-bold min-w-[400px]">Product</th>
                                    <th className="px-6 py-4 text-right w-32 font-bold whitespace-nowrap">On Hand</th>
                                    <th className="px-6 py-4 text-right w-40 font-bold whitespace-nowrap text-primary">Transfer Qty</th>
                                    <th className="px-6 py-4 w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {items.map((it, idx) => (
                                    <tr key={idx} className="group hover:bg-gray-50/20 dark:hover:bg-gray-900/10 transition-colors">
                                        <td className="px-5 py-4">
                                            <SearchableSelect
                                                options={filteredProducts.map(p => ({ 
                                                    value: String(p.id), 
                                                    label: `${p.code} - ${p.name}` 
                                                }))}
                                                value={it.product_id}
                                                onChange={(val: string | number) => updateItem(idx, 'product_id', String(val))}
                                                placeholder={!fromLocationId ? "Select Source Location First" : "Search available products..."}
                                                loading={configsLoading}
                                                disabled={!fromLocationId}
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {!fromLocationId ? (
                                                <span className="text-[10px] text-gray-300 italic">Select Source</span>
                                            ) : it.is_fetching ? (
                                                <div className="flex justify-end pr-3">
                                                    <div className="h-5 w-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-end pr-1">
                                                    <span className="font-bold text-gray-700 dark:text-gray-300 text-lg leading-none">
                                                        {it.current_qty !== undefined ? parseFloat(it.current_qty.toString()) : 0}
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <Input
                                                    type="number"
                                                    value={it.quantity}
                                                    onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                                                    className={`h-10 text-right font-bold transition-all ${
                                                        it.product_id && it.quantity > (it.current_qty || 0) 
                                                            ? 'border-red-500 bg-red-50 text-red-600 focus:ring-red-500' 
                                                            : 'text-primary bg-primary/5 border-primary/20 focus:bg-primary/10'
                                                    }`}
                                                    min="1"
                                                    step="1"
                                                />
                                                {it.product_id && it.quantity > (it.current_qty || 0) && (
                                                    <div className="flex items-center gap-1 text-[10px] text-red-500 font-bold justify-end px-1">
                                                        <AlertTriangle className="w-2.5 h-2.5" />
                                                        Insufficient Stock
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {items.length > 1 && (
                                                <Button 
                                                    type="button" 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => removeItem(idx)} 
                                                    className="h-8 w-8 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="p-5 border-t border-gray-100 dark:border-gray-800">
                             <Button type="button" variant="ghost" size="sm" onClick={addItem} className="text-primary font-black text-[10px] uppercase tracking-widest gap-2">
                                <Plus className="w-4 h-4" /> Add Another Row
                            </Button>
                        </div>
                    </div>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="p-5 md:col-span-3 border-gray-100 dark:border-gray-800 shadow-sm space-y-3">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Notes / Internal Remarks</Label>
                         <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Why are you transferring these items? (Optional)"
                            rows={3}
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                        />
                    </Card>
                    <div className="md:col-span-1 space-y-4">
                        <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 shadow-inner">
                            <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-3">Transfer Summary</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-medium">Total Items</span>
                                    <span className="font-black text-gray-900 dark:text-white">{items.length}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-medium">Total Qty</span>
                                    <span className="font-black text-gray-900 dark:text-white">
                                        {items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0)}
                                    </span>
                                </div>
                                <div className="pt-2 mt-2 border-t border-primary/10 flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-medium">Auto-Status</span>
                                    <span className="font-black text-primary/70 uppercase text-[10px]">READY</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
