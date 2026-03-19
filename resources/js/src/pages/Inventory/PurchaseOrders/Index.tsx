import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Dialog, DialogContent, DialogTitle } from '../../../components/ui/dialog';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { toast } from 'sonner';
import { PlusCircle, Pencil, Trash2, ShoppingCart, Plus, X, Calendar as IconCalendarIcon, PackageCheck } from 'lucide-react';
import { IconShoppingCart, IconCalendar, IconClock } from '@tabler/icons-react';

// Custom components (adjust paths as needed)
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import DeleteModal from '../../../components/DeleteModal';
import ActionButtons from '../../../components/ui/ActionButtons';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { DatePicker } from '../../../components/ui/date-picker';
import { TimePicker } from '../../../components/ui/time-picker';
import { format } from 'date-fns';
import { useFormatDate } from '@/hooks/useFormatDate';

interface Supplier { id: number; name: string; }
interface Product { id: number; code: string; name: string; }
interface POItem { product_id: string; order_qty: string; unit_cost: string; }
interface PO {
    id: number; po_number: string; order_date: string; expected_delivery_date: string | null;
    status: string; total_amount: number; note: string | null;
    supplier: Supplier; items: any[];
}

const STATUS_CLASS: Record<string, string> = {
    Draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    Ordered: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    Partial: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    Completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    Cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const emptyItem: POItem = { product_id: '', order_qty: '', unit_cost: '' };
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

export default function PurchaseOrdersPage() {
    const { formatDate } = useFormatDate();
    const [orders, setOrders] = useState<PO[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [locations, setLocations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter, sort, pagination state
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('po_number');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        supplier_id: '',
        order_date: '',
        expected_delivery_date: '',
        status: 'Draft',
        note: '',
    });
    const [items, setItems] = useState<POItem[]>([{ ...emptyItem }]);
    const [submitting, setSubmitting] = useState(false);

    // Delete modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Good Receive modal state
    const [receiveModalOpen, setReceiveModalOpen] = useState(false);
    const [receivingPo, setReceivingPo] = useState<PO | null>(null);
    const [pendingItems, setPendingItems] = useState<any[]>([]);
    const [loadingPending, setLoadingPending] = useState(false);
    const [receiving, setReceiving] = useState(false);
    const [receiveFormData, setReceiveFormData] = useState({
        location_id: '',
        receive_date: new Date().toISOString().slice(0, 10),
        reference_number: '',
        receiving_note: '',
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [ordersRes, suppliersRes, productsRes, locationsRes] = await Promise.all([
                apiFetch('/api/inventory/purchase-orders'),
                apiFetch('/api/inventory/suppliers'),
                apiFetch('/api/inventory/products'),
                apiFetch('/api/inventory/locations'),
            ]);
            if (ordersRes.status === 401) {
                window.location.href = '/auth/login';
                return;
            }
            setOrders(await ordersRes.json());
            setSuppliers(await suppliersRes.json());
            setProducts(await productsRes.json());
            setLocations(await locationsRes.json());
        } catch {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    

    // Reset page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const openCreate = () => {
        setEditId(null);
        setFormData({
            supplier_id: '',
            order_date: new Date().toISOString().slice(0, 16),
            expected_delivery_date: '',
            status: 'Draft',
            note: '',
        });
        setItems([{ ...emptyItem }]);
        setModalOpen(true);
    };

    const openEdit = (po: PO) => {
        setEditId(po.id);
        setFormData({
            supplier_id: String(po.supplier.id),
            order_date: po.order_date?.slice(0, 16) || '',
            expected_delivery_date: po.expected_delivery_date || '',
            status: po.status,
            note: po.note || '',
        });
        setItems(po.items.map((i: any) => ({
            product_id: String(i.product_id),
            order_qty: String(i.order_qty),
            unit_cost: String(i.unit_cost),
        })));
        setModalOpen(true);
    };

    const openReceive = async (po: PO) => {
        setReceivingPo(po);
        setReceiveFormData({
            location_id: '',
            receive_date: new Date().toISOString().slice(0, 10),
            reference_number: '',
            receiving_note: '',
        });
        setReceiveModalOpen(true);
        setLoadingPending(true);
        try {
            const res = await apiFetch(`/api/inventory/purchase-orders/${po.id}/pending-items`);
            if (res.ok) {
                const items = await res.json();
                setPendingItems(items.map((i: any) => ({ ...i, qty_received: i.remaining_qty })));
            } else {
                toast.error('Failed to load pending items');
            }
        } catch {
            toast.error('Failed to load pending items');
        } finally {
            setLoadingPending(false);
        }
    };

    const confirmDelete = (id: number) => {
        setItemToDelete(id);
        setDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        await fetch('/sanctum/csrf-cookie');
        try {
            const res = await apiFetch(`/api/inventory/purchase-orders/${itemToDelete}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('PO deleted');
                fetchData();
            } else {
                const err = await res.json();
                toast.error(err.message || 'Only Draft POs can be deleted');
            }
        } catch {
            toast.error('An error occurred');
        } finally {
            setIsDeleting(false);
            setDeleteModalOpen(false);
            setItemToDelete(null);
        }
    };

    const handleSelectChange = (value: string | number, name: string) => {
        setFormData(prev => ({ ...prev, [name]: String(value) }));
    };

    const updateItem = (idx: number, key: keyof POItem, value: string | number) => {
        setItems(prev => prev.map((it, i) => (i === idx ? { ...it, [key]: String(value) } : it)));
    };

    const totalAmount = items.reduce(
        (sum, it) => sum + (parseFloat(it.order_qty) || 0) * (parseFloat(it.unit_cost) || 0),
        0
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (items.some(it => !it.product_id)) {
            toast.error('All line items need a product selected');
            return;
        }
        setSubmitting(true);
        await fetch('/sanctum/csrf-cookie');

        const payload = {
            ...formData,
            items: items.map(it => ({
                product_id: parseInt(it.product_id),
                order_qty: parseFloat(it.order_qty),
                unit_cost: parseFloat(it.unit_cost),
            })),
        };

        try {
            const url = editId ? `/api/inventory/purchase-orders/${editId}` : '/api/inventory/purchase-orders';
            const method = editId ? 'PUT' : 'POST';
            const res = await apiFetch(url, { method, body: JSON.stringify(payload) });
            if (res.ok) {
                toast.success(editId ? 'Purchase Order updated' : 'Purchase Order created');
                setModalOpen(false);
                fetchData();
            } else {
                const err = await res.json();
                toast.error(err.message || 'Failed to save PO');
            }
        } catch {
            toast.error('An error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReceiveSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!receiveFormData.location_id) {
            toast.error('Please select a receiving location');
            return;
        }
        
        const itemsToReceive = pendingItems.filter(i => parseFloat(i.qty_received) > 0);
        if (itemsToReceive.length === 0) {
            toast.error('Please enter at least one quantity to receive');
            return;
        }

        setReceiving(true);
        await fetch('/sanctum/csrf-cookie');
        const payload = {
            purchase_order_id: receivingPo?.id,
            location_id: parseInt(receiveFormData.location_id),
            receive_date: receiveFormData.receive_date,
            reference_number: receiveFormData.reference_number,
            receiving_note: receiveFormData.receiving_note,
            items: itemsToReceive.map(i => ({
                purchase_order_item_id: i.id,
                product_id: i.product.id,
                qty_received: parseFloat(i.qty_received)
            }))
        };
        try {
            const res = await apiFetch('/api/inventory/purchase-receives', { method: 'POST', body: JSON.stringify(payload) });
            if (res.ok) {
                toast.success('Items received successfully');
                setReceiveModalOpen(false);
                fetchData();
            } else {
                const err = await res.json();
                toast.error(err.message || 'Failed to receive items');
            }
        } catch {
            toast.error('An error occurred');
        } finally {
            setReceiving(false);
        }
    };

    // Derived data with filtering and sorting
    const filteredAndSortedOrders = useMemo(() => {
        let result = [...orders];

        // Filter by search
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(
                o =>
                    o.po_number.toLowerCase().includes(q) ||
                    (o.supplier?.name || '').toLowerCase().includes(q)
            );
        }

        // Sort
        result.sort((a, b) => {
            let valA = a[sortBy as keyof PO] ?? '';
            let valB = b[sortBy as keyof PO] ?? '';

            // Special handling for supplier name (nested object)
            if (sortBy === 'supplier') {
                valA = a.supplier?.name || '';
                valB = b.supplier?.name || '';
            }
            // Handle date fields
            if (sortBy === 'order_date' || sortBy === 'expected_delivery_date') {
                valA = a[sortBy] || '';
                valB = b[sortBy] || '';
            }
            // Total amount numeric
            if (sortBy === 'total_amount') {
                valA = a.total_amount;
                valB = b.total_amount;
            }
            // Status string
            if (sortBy === 'status') {
                valA = a.status || '';
                valB = b.status || '';
            }

            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [orders, search, sortBy, sortDirection]);

    const totalPages = Math.ceil(filteredAndSortedOrders.length / itemsPerPage);
    const paginatedOrders = filteredAndSortedOrders.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const clearFilters = () => {
        setSearch('');
        setSortBy('po_number');
        setSortDirection('asc');
    };

    return (
        <div>
            <FilterBar
                icon={<ShoppingCart className="w-6 h-6 text-primary" />}
                title="Purchase Orders"
                description="Track your company's procurement purchasing cycle"
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onAdd={openCreate}
                addLabel="New PO"
                onRefresh={fetchData}
                hasActiveFilters={sortBy !== 'po_number' || sortDirection !== 'asc' || search !== ''}
                onClearFilters={clearFilters}
            />

            {loading ? (
                <TableSkeleton columns={7} rows={5} />
            ) : orders.length === 0 ? (
                <EmptyState
                    title="No Purchase Orders Found"
                    description="Start by creating your first purchase order."
                    actionLabel="New PO"
                    onAction={openCreate}
                />
            ) : filteredAndSortedOrders.length === 0 ? (
                <EmptyState
                    isSearch
                    searchTerm={search}
                    onClearFilter={clearFilters}
                />
            ) : (
                <div className="table-responsive bg-white dark:bg-black rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
                    <table className="table-hover table-striped w-full table">
                        <thead>
                            <tr>
                                <SortableHeader
                                    label="PO Number"
                                    value="po_number"
                                    currentSortBy={sortBy}
                                    currentDirection={sortDirection}
                                    onSort={setSortBy}
                                />
                                <SortableHeader
                                    label="Supplier"
                                    value="supplier"
                                    currentSortBy={sortBy}
                                    currentDirection={sortDirection}
                                    onSort={setSortBy}
                                />
                                <SortableHeader
                                    label="Order Date"
                                    value="order_date"
                                    currentSortBy={sortBy}
                                    currentDirection={sortDirection}
                                    onSort={setSortBy}
                                />
                                <SortableHeader
                                    label="Expected Delivery"
                                    value="expected_delivery_date"
                                    currentSortBy={sortBy}
                                    currentDirection={sortDirection}
                                    onSort={setSortBy}
                                />
                                <SortableHeader
                                    label="Total Amount"
                                    value="total_amount"
                                    currentSortBy={sortBy}
                                    currentDirection={sortDirection}
                                    onSort={setSortBy}
                                    className="text-right"
                                />
                                <SortableHeader
                                    label="Status"
                                    value="status"
                                    currentSortBy={sortBy}
                                    currentDirection={sortDirection}
                                    onSort={setSortBy}
                                />
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedOrders.map(o => (
                                <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="font-mono font-semibold text-primary">{o.po_number}</td>
                                    <td className="text-gray-700 dark:text-gray-200">{o.supplier?.name}</td>
                                    <td className="text-gray-600 dark:text-gray-300">
                                        {formatDate(o.order_date)}
                                    </td>
                                    <td className="text-gray-600 dark:text-gray-300">
                                        {formatDate(o.expected_delivery_date)}
                                    </td>
                                    <td className="text-left font-semibold">
                                        ${parseFloat(String(o.total_amount)).toFixed(2)}
                                    </td>
                                    <td>
                                        <span className={`badge ${STATUS_CLASS[o.status] || ''}`}>
                                            {o.status}
                                        </span>
                                    </td>
                                    <td className="text-right">
                                        <ActionButtons
                                            onReceive={['Ordered', 'Partial'].includes(o.status) ? () => openReceive(o) : undefined}
                                            onEdit={!['Completed', 'Cancelled'].includes(o.status) ? () => openEdit(o) : undefined}
                                            onDelete={o.status === 'Draft' ? () => confirmDelete(o.id) : undefined}
                                            skipDeleteConfirm
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="border-t border-gray-100 dark:border-gray-800">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={filteredAndSortedOrders.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
{/* Create/Edit Modal */}
<Dialog open={modalOpen} onOpenChange={setModalOpen}>
    <DialogContent className="sm:max-w-5xl w-[95vw] flex flex-col p-0 border-0 shadow-2xl rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-primary/10 to-transparent px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
            <div className="bg-primary/20 p-3 rounded-2xl shadow-sm">
                <ShoppingCart className="text-primary w-7 h-7" />
            </div>
            <div>
                <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                    {editId ? 'Edit Purchase Order' : 'Create Purchase Order'}
                </DialogTitle>
                <p className="text-sm text-gray-500 mt-1">
                    {editId ? 'Update the order details and line items.' : 'Enter the purchase order information.'}
                </p>
            </div>
        </div>

        {/* Two‑column form area */}
        <form id="po-form" onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-6 p-6">
            {/* Left column – Order Details */}
            <div className="lg:w-80 space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Order Details
                </h3>
                <div className="space-y-4">
                    <div className="space-y-1">
                        <Label className="text-sm font-medium">
                            Supplier <span className="text-red-500">*</span>
                        </Label>
                        <SearchableSelect
                            options={suppliers.map(s => ({ value: String(s.id), label: s.name }))}
                            value={formData.supplier_id}
                            onChange={(val) => handleSelectChange(val, 'supplier_id')}
                            placeholder="Select supplier..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-sm font-medium mb-0">
                                Order Date <span className="text-red-500">*</span>
                            </Label>
                            <DatePicker
                                value={formData.order_date ? new Date(formData.order_date) : undefined}
                                onChange={(date) => {
                                    if (!date) return;
                                    const time = formData.order_date ? formData.order_date.split('T')[1]?.slice(0, 5) || '00:00' : '00:00';
                                    const newDate = format(date, 'yyyy-MM-dd') + 'T' + time;
                                    setFormData(p => ({ ...p, order_date: newDate }));
                                }}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-sm font-medium mb-0">Time</Label>
                            <TimePicker
                                value={formData.order_date ? formData.order_date.split('T')[1]?.slice(0, 5) : '00:00'}
                                onChange={(time) => {
                                    const date = formData.order_date ? formData.order_date.split('T')[0] : format(new Date(), 'yyyy-MM-dd');
                                    const newDate = date + 'T' + time;
                                    setFormData(p => ({ ...p, order_date: newDate }));
                                }}
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-sm font-medium">Expected Delivery</Label>
                        <DatePicker
                            value={formData.expected_delivery_date ? new Date(formData.expected_delivery_date) : undefined}
                            onChange={(date) => {
                                setFormData(p => ({ ...p, expected_delivery_date: date ? format(date, 'yyyy-MM-dd') : '' }));
                            }}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-sm font-medium">Status</Label>
                        <Select
                            value={formData.status}
                            onValueChange={v => setFormData(p => ({ ...p, status: v }))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {['Draft', 'Ordered', 'Cancelled'].map(s => (
                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-sm font-medium">Note</Label>
                        <Textarea
                            value={formData.note}
                            onChange={e => setFormData(p => ({ ...p, note: e.target.value }))}
                            rows={3}
                        />
                    </div>
                </div>
            </div>

            {/* Right column – Line Items */}
            <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Order Items
                    </h3>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setItems(p => [...p, { ...emptyItem }])}
                        className="flex items-center gap-1"
                    >
                        <Plus className="h-4 w-4" /> Add Row
                    </Button>
                </div>
                <div className="rounded-lg border dark:border-gray-700 overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 uppercase text-xs sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 text-left">Product</th>
                                    <th className="px-3 py-2 text-left">Order Qty</th>
                                    <th className="px-3 py-2 text-left">Unit Cost</th>
                                    <th className="px-3 py-2 text-right">Total</th>
                                    <th className="px-3 py-2"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {items.map((it, idx) => (
                                    <tr key={idx}>
                                        <td className="px-3 py-2">
                                            <SearchableSelect
                                                options={products.map(p => ({ value: String(p.id), label: `${p.code} - ${p.name}` }))}
                                                value={it.product_id}
                                                onChange={(val) => updateItem(idx, 'product_id', val)}
                                                placeholder="Select product..."
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                value={it.order_qty}
                                                onChange={e => updateItem(idx, 'order_qty', e.target.value)}
                                                placeholder="Qty"
                                                required
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={it.unit_cost}
                                                onChange={e => updateItem(idx, 'unit_cost', e.target.value)}
                                                placeholder="Cost"
                                                required
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">
                                            ${((parseFloat(it.order_qty) || 0) * (parseFloat(it.unit_cost) || 0)).toFixed(2)}
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            {items.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setItems(p => p.filter((_, i) => i !== idx))}
                                                    className="text-red-400 hover:text-red-600"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50 dark:bg-gray-800 sticky bottom-0">
                                <tr>
                                    <td colSpan={3} className="px-3 py-2 text-right font-semibold text-gray-600">
                                        Total Amount:
                                    </td>
                                    <td className="px-3 py-2 text-right font-bold text-lg text-primary">
                                        ${totalAmount.toFixed(2)}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </form>

        {/* Footer */}
        <div className="shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-background">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
                Cancel
            </Button>
            <Button
                type="submit"
                form="po-form"
                disabled={submitting}
                className="px-7 bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
            >
                {submitting ? 'Saving...' : editId ? 'Update PO' : 'Create PO'}
            </Button>
        </div>
    </DialogContent>
</Dialog>

            {/* Delete Confirmation Modal */}
            <DeleteModal
                isOpen={deleteModalOpen}
                setIsOpen={setDeleteModalOpen}
                onConfirm={executeDelete}
                isLoading={isDeleting}
                title="Delete Purchase Order"
                message="Are you sure you want to delete this purchase order? This action cannot be undone."
            />

            {/* Good Receive Modal */}
            <Dialog open={receiveModalOpen} onOpenChange={setReceiveModalOpen}>
                <DialogContent className="sm:max-w-4xl p-0 border-0 shadow-2xl rounded-2xl overflow-hidden">
                    <div className="shrink-0 bg-gradient-to-r from-green-500/10 to-transparent px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
                        <div className="bg-green-500/20 p-3 rounded-2xl shadow-sm">
                            <PackageCheck className="text-green-600 w-7 h-7" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                                Receive Goods - {receivingPo?.po_number}
                            </DialogTitle>
                            <p className="text-sm text-gray-500 mt-1">
                                Record items received from this purchase order.
                            </p>
                        </div>
                    </div>

                    <form id="receive-form" onSubmit={handleReceiveSubmit} className="flex flex-col gap-6 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <Label className="text-sm font-medium">
                                    Location <span className="text-red-500">*</span>
                                </Label>
                                <SearchableSelect
                                    options={locations.map(l => ({ value: String(l.id), label: l.name }))}
                                    value={receiveFormData.location_id}
                                    onChange={(val) => setReceiveFormData(p => ({ ...p, location_id: String(val) }))}
                                    placeholder="Select location..."
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-sm font-medium">Receive Date <span className="text-red-500">*</span></Label>
                                <DatePicker
                                    value={receiveFormData.receive_date ? new Date(receiveFormData.receive_date) : undefined}
                                    onChange={(date) => {
                                        setReceiveFormData(p => ({ ...p, receive_date: date ? format(date, 'yyyy-MM-dd') : '' }));
                                    }}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-sm font-medium">Reference Book</Label>
                                <Input
                                    value={receiveFormData.reference_number}
                                    onChange={e => setReceiveFormData(p => ({ ...p, reference_number: e.target.value }))}
                                    placeholder="e.g. Delivery Note"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-sm font-medium">Note</Label>
                                <Input
                                    value={receiveFormData.receiving_note}
                                    onChange={e => setReceiveFormData(p => ({ ...p, receiving_note: e.target.value }))}
                                    placeholder="Optional note"
                                />
                            </div>
                        </div>

                        <div className="rounded-lg border dark:border-gray-700 overflow-hidden">
                            <div className="max-h-96 overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 uppercase text-xs sticky top-0">
                                        <tr>
                                            <th className="px-3 py-2 text-left">Product</th>
                                            <th className="px-3 py-2 text-center">Ordered</th>
                                            <th className="px-3 py-2 text-center">Received</th>
                                            <th className="px-3 py-2 text-center">Remaining</th>
                                            <th className="px-3 py-2 text-center w-32">Qty to Receive</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y dark:divide-gray-700">
                                        {loadingPending ? (
                                            <tr>
                                                <td colSpan={5} className="px-3 py-6 text-center text-gray-500">Loading items...</td>
                                            </tr>
                                        ) : pendingItems.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-3 py-6 text-center text-gray-500">No pending items found.</td>
                                            </tr>
                                        ) : pendingItems.map((it, idx) => (
                                            <tr key={it.id}>
                                                <td className="px-3 py-2 font-medium">{it.product?.code} - {it.product?.name}</td>
                                                <td className="px-3 py-2 text-center text-gray-600">{it.order_qty}</td>
                                                <td className="px-3 py-2 text-center text-green-600">{it.received_qty}</td>
                                                <td className="px-3 py-2 text-center text-orange-600 font-semibold">{it.remaining_qty}</td>
                                                <td className="px-3 py-2">
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        max={it.remaining_qty > 0 ? it.remaining_qty : undefined}
                                                        value={it.qty_received}
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            setPendingItems(prev => prev.map((item, i) => i === idx ? { ...item, qty_received: val } : item));
                                                        }}
                                                        className="text-center"
                                                        disabled={it.remaining_qty <= 0}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </form>

                    <div className="shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-background">
                        <Button type="button" variant="ghost" onClick={() => setReceiveModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            form="receive-form"
                            disabled={receiving || pendingItems.length === 0 || loadingPending}
                            className="px-7 bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-600/20"
                        >
                            {receiving ? 'Receiving...' : 'Receive Goods'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}