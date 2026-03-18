import { useState, useEffect, useCallback } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { toast } from 'sonner';
import { PlusCircle, Search, PackageCheck, CheckCircle2 } from 'lucide-react';
import { useFormatDate } from '../../../hooks/useFormatDate';

interface Location { id: number; name: string; }
interface PO { id: number; po_number: string; supplier: { name: string }; status: string; }
interface PendingItem {
    id: number;
    product: { id: number; code: string; name: string };
    order_qty: number;
    received_qty: number;
    remaining_qty: number;
}
interface PR {
    id: number;
    receive_date: string;
    reference_number: string | null;
    status: string;
    purchaseOrder: { po_number: string; supplier: { name: string } };
    location: { name: string };
    items: any[];
}

const STATUS_CLASS: Record<string, string> = {
    Draft: 'bg-gray-100 text-gray-600',
    Received: 'bg-green-100 text-green-700',
};

const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
};

const apiFetch = (url: string, options: RequestInit = {}) =>
    fetch(url, {
        ...options,
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '', ...(options.headers || {}) },
        credentials: 'include',
    });

export default function PurchaseReceivesPage() {
    const { formatDateTime } = useFormatDate();
    const [receives, setReceives] = useState<PR[]>([]);
    const [pendingOrders, setPendingOrders] = useState<PO[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);

    const [selectedPoId, setSelectedPoId] = useState('');
    const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
    const [receiveQtys, setReceiveQtys] = useState<Record<number, string>>({});
    const [formData, setFormData] = useState({ location_id: '', receive_date: '', reference_number: '', receiving_note: '' });
    const [submitting, setSubmitting] = useState(false);
    const [loadingItems, setLoadingItems] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [prRes, posRes, locRes] = await Promise.all([
                apiFetch('/api/inventory/purchase-receives'),
                apiFetch('/api/inventory/purchase-orders'),
                apiFetch('/api/inventory/locations'),
            ]);
            const prData = await prRes.json();
            const posData = await posRes.json();
            const locData = await locRes.json();
            setReceives(Array.isArray(prData) ? prData : []);
            setPendingOrders(Array.isArray(posData) ? posData.filter((po: PO) => !['Cancelled', 'Completed'].includes(po.status)) : []);
            setLocations(Array.isArray(locData) ? locData : []);
        } catch { toast.error('Failed to load data'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const openCreate = () => {
        setSelectedPoId('');
        setPendingItems([]);
        setReceiveQtys({});
        setFormData({ location_id: '', receive_date: new Date().toISOString().slice(0, 16), reference_number: '', receiving_note: '' });
        setModalOpen(true);
    };

    const loadPendingItems = async (poId: string) => {
        if (!poId) { setPendingItems([]); return; }
        setLoadingItems(true);
        try {
            const res = await apiFetch(`/api/inventory/purchase-orders/${poId}/pending-items`);
            const data = await res.json();
            const items = (Array.isArray(data) ? data : []).filter((it: PendingItem) => it.remaining_qty > 0);
            setPendingItems(items);
            const qtys: Record<number, string> = {};
            items.forEach((it: PendingItem) => { qtys[it.id] = String(it.remaining_qty); });
            setReceiveQtys(qtys);
        } catch { toast.error('Failed to load PO items'); }
        finally { setLoadingItems(false); }
    };

    const handlePoChange = (poId: string) => {
        setSelectedPoId(poId);
        loadPendingItems(poId);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPoId) { toast.error('Select a Purchase Order'); return; }
        if (!formData.location_id) { toast.error('Select a destination location'); return; }

        const itemsPayload = pendingItems
            .filter(it => parseFloat(receiveQtys[it.id] || '0') > 0)
            .map(it => ({
                purchase_order_item_id: it.id,
                product_id: it.product.id,
                qty_received: parseFloat(receiveQtys[it.id]),
            }));

        if (itemsPayload.length === 0) { toast.error('Enter at least one quantity to receive'); return; }

        setSubmitting(true);
        await fetch('/sanctum/csrf-cookie');
        try {
            const res = await apiFetch('/api/inventory/purchase-receives', {
                method: 'POST',
                body: JSON.stringify({
                    purchase_order_id: parseInt(selectedPoId),
                    ...formData,
                    items: itemsPayload,
                }),
            });
            if (res.ok) {
                toast.success('Goods received! Stock has been updated automatically.');
                setModalOpen(false);
                fetchData();
            } else {
                const err = await res.json();
                toast.error(err.message || 'Failed to save PR');
            }
        } catch {
            toast.error('An error occurred');
        } finally { setSubmitting(false); }
    };

    const filtered = receives.filter(r =>
        (r.purchaseOrder?.po_number || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.reference_number || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.location?.name || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <PackageCheck className="h-6 w-6 text-primary" /> Purchase Receives
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Record goods received against Purchase Orders</p>
                </div>
                <Button onClick={openCreate} className="flex items-center gap-2">
                    <PlusCircle className="h-4 w-4" /> New Receive
                </Button>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input className="pl-9" placeholder="Search receives..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <div className="rounded-xl border dark:border-gray-700 overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3 text-left">PO Reference</th>
                            <th className="px-4 py-3 text-left">Supplier</th>
                            <th className="px-4 py-3 text-left">Receive Date</th>
                            <th className="px-4 py-3 text-left">Location</th>
                            <th className="px-4 py-3 text-left">Reference</th>
                            <th className="px-4 py-3 text-left">Items</th>
                            <th className="px-4 py-3 text-left">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                        {loading ? (
                            <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-12 text-gray-400">No receives found.</td></tr>
                        ) : filtered.map(r => (
                            <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <td className="px-4 py-3 font-mono font-semibold text-primary">{r.purchaseOrder?.po_number}</td>
                                <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{r.purchaseOrder?.supplier?.name}</td>
                                <td className="px-4 py-3 text-gray-600">{formatDateTime(r.receive_date)}</td>
                                <td className="px-4 py-3 text-gray-600">{r.location?.name}</td>
                                <td className="px-4 py-3 text-gray-600">{r.reference_number || '—'}</td>
                                <td className="px-4 py-3 text-gray-600">{r.items?.length || 0} products</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASS[r.status] || ''}`}>{r.status}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create PR Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Record Goods Received</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-5 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-1">
                                <Label>Purchase Order <span className="text-red-500">*</span></Label>
                                <Select value={selectedPoId} onValueChange={handlePoChange}>
                                    <SelectTrigger><SelectValue placeholder="Select a Purchase Order..." /></SelectTrigger>
                                    <SelectContent>
                                        {pendingOrders.map(po => (
                                            <SelectItem key={po.id} value={String(po.id)}>
                                                {po.po_number} — {po.supplier?.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label>Receive to Location <span className="text-red-500">*</span></Label>
                                <Select value={formData.location_id} onValueChange={v => setFormData(p => ({ ...p, location_id: v }))}>
                                    <SelectTrigger><SelectValue placeholder="Select location..." /></SelectTrigger>
                                    <SelectContent>
                                        {locations.map(l => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label>Receiving Date <span className="text-red-500">*</span></Label>
                                <Input type="datetime-local" value={formData.receive_date} onChange={e => setFormData(p => ({ ...p, receive_date: e.target.value }))} required />
                            </div>
                            <div className="space-y-1">
                                <Label>Reference Number</Label>
                                <Input value={formData.reference_number} onChange={e => setFormData(p => ({ ...p, reference_number: e.target.value }))} placeholder="Supplier invoice / delivery note..." />
                            </div>
                            <div className="space-y-1">
                                <Label>Receiving Note</Label>
                                <Textarea value={formData.receiving_note} onChange={e => setFormData(p => ({ ...p, receiving_note: e.target.value }))} rows={2} />
                            </div>
                        </div>

                        {/* Pending Items */}
                        {selectedPoId && (
                            <div className="space-y-2">
                                <Label className="text-base font-semibold">Items to Receive</Label>
                                {loadingItems ? (
                                    <p className="text-gray-400 text-sm py-4 text-center">Loading items...</p>
                                ) : pendingItems.length === 0 ? (
                                    <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 p-4 flex items-center gap-2 text-green-700 dark:text-green-400 text-sm">
                                        <CheckCircle2 className="h-5 w-5 shrink-0" /> All items on this PO have been fully received!
                                    </div>
                                ) : (
                                    <div className="rounded-lg border dark:border-gray-700 overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 uppercase text-xs">
                                                <tr>
                                                    <th className="px-3 py-2 text-left">Product</th>
                                                    <th className="px-3 py-2 text-right">Ordered</th>
                                                    <th className="px-3 py-2 text-right">Received</th>
                                                    <th className="px-3 py-2 text-right">Remaining</th>
                                                    <th className="px-3 py-2 text-right">Qty Receiving Now</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y dark:divide-gray-700">
                                                {pendingItems.map(it => (
                                                    <tr key={it.id}>
                                                        <td className="px-3 py-2">
                                                            <p className="font-medium">{it.product.name}</p>
                                                            <p className="text-xs text-gray-400">{it.product.code}</p>
                                                        </td>
                                                        <td className="px-3 py-2 text-right text-gray-500">{it.order_qty}</td>
                                                        <td className="px-3 py-2 text-right text-green-600">{it.received_qty}</td>
                                                        <td className="px-3 py-2 text-right text-orange-500 font-semibold">{it.remaining_qty}</td>
                                                        <td className="px-3 py-2 text-right w-32">
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                max={it.remaining_qty}
                                                                value={receiveQtys[it.id] || ''}
                                                                onChange={e => setReceiveQtys(prev => ({ ...prev, [it.id]: e.target.value }))}
                                                                className="text-right"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={submitting || pendingItems.length === 0}>
                                {submitting ? 'Processing...' : 'Confirm Receipt & Update Stock'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
