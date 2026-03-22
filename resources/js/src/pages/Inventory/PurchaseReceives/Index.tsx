import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '../../../components/ui/button';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from '../../../components/ui/input';
import { Dialog, DialogContent, DialogTitle } from '../../../components/ui/dialog';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { toast } from 'sonner';
import { PackageCheck, CheckCircle2, ShoppingCart, Plus, X, Calendar as IconCalendarIcon, Package } from 'lucide-react';
import { IconPackageImport, IconCalendar, IconClock } from '@tabler/icons-react';
import { useFormatDate } from '@/hooks/useFormatDate';
import { format } from 'date-fns';

// Custom components
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { DatePicker } from '../../../components/ui/date-picker';
import { TimePicker } from '../../../components/ui/time-picker';
import DateRangePicker from '../../../components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';

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
    purchase_order: { po_number: string; supplier: { name: string } };
    location: { name: string };
    items: any[];
}

const STATUS_CLASS: Record<string, string> = {
    Draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    Received: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
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
            ...(options.headers || {}) 
        },
        credentials: 'include',
    });

export default function PurchaseReceivesPage() {
    const { formatDate, formatDateTime } = useFormatDate();
    const [receives, setReceives] = useState<PR[]>([]);
    const [pendingOrders, setPendingOrders] = useState<PO[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filter, sort, pagination state
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('receive_date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [locationId, setLocationId] = useState<string | number>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPoId, setSelectedPoId] = useState('');
    const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
    const [receiveQtys, setReceiveQtys] = useState<Record<number, string>>({});
    const [formData, setFormData] = useState({ 
        location_id: '', 
        receive_date: '', 
        reference_number: '', 
        receiving_note: '' 
    });
    const [submitting, setSubmitting] = useState(false);
    const [loadingItems, setLoadingItems] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (locationId && locationId !== 'all') params.append('location_id', String(locationId));
            if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
            if (dateRange?.from) params.append('start_date', format(dateRange.from, 'yyyy-MM-dd'));
            if (dateRange?.to) params.append('end_date', format(dateRange.to, 'yyyy-MM-dd'));

            const [prRes, posRes, locRes] = await Promise.all([
                apiFetch(`/api/inventory/purchase-receives?${params.toString()}`),
                apiFetch('/api/inventory/purchase-orders'),
                apiFetch('/api/inventory/locations'),
            ]);
            if (prRes.status === 401) {
                window.location.href = '/auth/login';
                return;
            }
            const prData = await prRes.json();
            const posData = await posRes.json();
            const locData = await locRes.json();
            setReceives(Array.isArray(prData) ? prData : []);
            setPendingOrders(Array.isArray(posData) ? posData.filter((po: PO) => !['Cancelled', 'Completed'].includes(po.status)) : []);
            setLocations(Array.isArray(locData) ? locData : []);
        } catch { 
            toast.error('Failed to load data'); 
        } finally { 
            setLoading(false); 
        }
    }, [search, locationId, statusFilter, dateRange]);

    useEffect(() => { 
        fetchData(); 
    }, [fetchData]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, locationId, statusFilter, dateRange]);

    const openCreate = () => {
        setSelectedPoId('');
        setPendingItems([]);
        setReceiveQtys({});
        setFormData({ 
            location_id: '', 
            receive_date: new Date().toISOString().slice(0, 16), 
            reference_number: '', 
            receiving_note: '' 
        });
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

    // Derived data with filtering and sorting
    const filteredAndSortedReceives = useMemo(() => {
        let result = [...receives];

        // Backend handles search and core filters

        // Sort
        result.sort((a, b) => {
            let valA: any = a[sortBy as keyof PR] ?? '';
            let valB: any = b[sortBy as keyof PR] ?? '';

            // Nested sorting
            if (sortBy === 'po_reference') {
                valA = a.purchase_order?.po_number || '';
                valB = b.purchase_order?.po_number || '';
            } else if (sortBy === 'supplier') {
                valA = a.purchase_order?.supplier?.name || '';
                valB = b.purchase_order?.supplier?.name || '';
            } else if (sortBy === 'location') {
                valA = a.location?.name || '';
                valB = b.location?.name || '';
            }

            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [receives, sortBy, sortDirection]);

    const totalPages = Math.ceil(filteredAndSortedReceives.length / itemsPerPage);
    const paginatedReceives = filteredAndSortedReceives.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const clearFilters = () => {
        setSearch('');
        setDateRange(undefined);
        setLocationId('all');
        setStatusFilter('all');
        setSortBy('receive_date');
        setSortDirection('desc');
    };

    return (
        <div>
            <FilterBar
                icon={<PackageCheck className="w-6 h-6 text-primary" />}
                title="Purchase Receives"
                description="Record and track goods received from Purchase Orders"
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onAdd={openCreate}
                addLabel="New Receive"
                onRefresh={fetchData}
                hasActiveFilters={sortBy !== 'receive_date' || sortDirection !== 'desc' || search !== '' || dateRange !== undefined || locationId !== 'all' || statusFilter !== 'all'}
                onClearFilters={clearFilters}
            >
                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Date Range</span>
                    <DateRangePicker
                        value={dateRange}
                        onChange={setDateRange}
                        placeholder="All Dates"
                    />
                </div>

                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Location</span>
                    <SearchableSelect
                        options={[
                            { value: 'all', label: 'All Locations' },
                            ...locations.map(l => ({ value: l.id, label: l.name }))
                        ]}
                        value={locationId}
                        onChange={setLocationId}
                        placeholder="All Locations"
                    />
                </div>

                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Status</span>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="font-medium">All Status</SelectItem>
                            {Object.keys(STATUS_CLASS).map(s => (
                                <SelectItem key={s} value={s} className="font-medium">{s}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </FilterBar>

            {loading ? (
                <TableSkeleton columns={7} rows={5} />
            ) : receives.length === 0 ? (
                <EmptyState
                    title="No Purchase Receives Found"
                    description="Start by recording your first goods receipt."
                    actionLabel="New Receive"
                    onAction={openCreate}
                />
            ) : filteredAndSortedReceives.length === 0 ? (
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
                                    label="PO Reference"
                                    value="po_reference"
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
                                    label="Receive Date"
                                    value="receive_date"
                                    currentSortBy={sortBy}
                                    currentDirection={sortDirection}
                                    onSort={setSortBy}
                                />
                                <SortableHeader
                                    label="Location"
                                    value="location"
                                    currentSortBy={sortBy}
                                    currentDirection={sortDirection}
                                    onSort={setSortBy}
                                />
                                <SortableHeader
                                    label="Reference"
                                    value="reference_number"
                                    currentSortBy={sortBy}
                                    currentDirection={sortDirection}
                                    onSort={setSortBy}
                                />
                                <th>Items</th>
                                <SortableHeader
                                    label="Status"
                                    value="status"
                                    currentSortBy={sortBy}
                                    currentDirection={sortDirection}
                                    onSort={setSortBy}
                                />
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedReceives.map(r => (
                                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="font-mono font-semibold text-primary">{r.purchase_order?.po_number}</td>
                                    <td className="text-gray-700 dark:text-gray-200">{r.purchase_order?.supplier?.name}</td>
                                    <td className="text-gray-600 dark:text-gray-300">{formatDateTime(r.receive_date)}</td>
                                    <td className="text-gray-600 dark:text-gray-300">{r.location?.name}</td>
                                    <td className="text-gray-600 dark:text-gray-300">{r.reference_number || '—'}</td>
                                    <td className="text-gray-600 dark:text-gray-300">{r.items?.length || 0} products</td>
                                    <td>
                                        <span className={`badge ${STATUS_CLASS[r.status] || ''}`}>
                                            {r.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="border-t border-gray-100 dark:border-gray-800">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={filteredAndSortedReceives.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </div>
            )}

{/* Create PR Modal */}
<Dialog open={modalOpen} onOpenChange={setModalOpen}>
  <DialogContent className="sm:max-w-4xl w-[95vw] flex flex-col p-0 border-0 shadow-2xl rounded-2xl overflow-hidden">
    {/* Header */}
    <div className="shrink-0 bg-gradient-to-r from-green-600/10 to-transparent px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
      <div className="bg-green-600/20 p-3 rounded-2xl shadow-sm">
        <IconPackageImport className="text-green-600 w-7 h-7" />
      </div>
      <div>
        <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
          Record Goods Received
        </DialogTitle>
        <p className="text-sm text-gray-500 mt-1">
          Record items received from a purchase order into a specific location.
        </p>
      </div>
    </div>

    <form id="receive-form" onSubmit={handleSubmit} className="flex flex-col gap-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Purchase Order - takes more space */}
        <div className="md:col-span-3 space-y-1">
          <Label className="text-sm font-medium">Purchase Order <span className="text-red-500">*</span></Label>
          <SearchableSelect
            options={pendingOrders.map(po => ({ 
              value: String(po.id), 
              label: `${po.po_number} — ${po.supplier?.name}` 
            }))}
            value={selectedPoId}
            onChange={(val) => handlePoChange(String(val))}
            placeholder="Select a Purchase Order..."
          />
        </div>

        {/* Destination Location */}
        <div className="md:col-span-1 space-y-1">
          <Label className="text-sm font-medium">Destination Location <span className="text-red-500">*</span></Label>
          <SearchableSelect
            options={locations.map(l => ({ value: String(l.id), label: l.name }))}
            value={formData.location_id}
            onChange={(val) => setFormData(p => ({ ...p, location_id: String(val) }))}
            placeholder="Select location..."
          />
        </div>

        {/* Reference Number */}
        <div className="md:col-span-2 space-y-1">
          <Label className="text-sm font-medium">Reference Number</Label>
          <Input 
            value={formData.reference_number} 
            onChange={e => setFormData(p => ({ ...p, reference_number: e.target.value }))} 
            placeholder="e.g. Supplier Invoice / Delivery Note" 
          />
        </div>

        {/* Receiving Note */}
        <div className="md:col-span-2 space-y-1">
          <Label className="text-sm font-medium">Receiving Note</Label>
          <Input 
            value={formData.receiving_note} 
            onChange={e => setFormData(p => ({ ...p, receiving_note: e.target.value }))} 
            placeholder="Optional note about this receipt" 
          />
        </div>
      </div>

    
{/* Pending Items */}
{selectedPoId && (
  <div className="space-y-3">
    {/* Header with title and receive date/time */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
        Items to Receive
      </h3>

      {/* Receive Date & Time moved here */}
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium whitespace-nowrap">
          Receive Date <span className="text-red-500">*</span>
        </Label>
        <DatePicker
          value={formData.receive_date ? new Date(formData.receive_date) : undefined}
          onChange={(date) => {
            if (!date) return;
            const time = formData.receive_date ? formData.receive_date.split('T')[1]?.slice(0, 5) || '00:00' : '00:00';
            const newDate = format(date, 'yyyy-MM-dd') + 'T' + time;
            setFormData(p => ({ ...p, receive_date: newDate }));
          }}
        />
        <TimePicker
          value={formData.receive_date ? formData.receive_date.split('T')[1]?.slice(0, 5) : '00:00'}
          onChange={(time) => {
            const date = formData.receive_date ? formData.receive_date.split('T')[0] : format(new Date(), 'yyyy-MM-dd');
            const newDate = date + 'T' + time;
            setFormData(p => ({ ...p, receive_date: newDate }));
          }}
        />
      </div>
    </div>

    {/* Items list with ScrollArea */}
    <div className="rounded-lg border dark:border-gray-700">
      {loadingItems ? (
        <ScrollArea className="h-80">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 uppercase text-xs sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-3 py-3 text-right">Ordered</th>
                <th className="px-3 py-3 text-right">Received</th>
                <th className="px-3 py-3 text-right text-primary">Remaining</th>
                <th className="px-4 py-3 text-right w-40">Qty Receiving Now</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {/* Skeleton rows */}
              {[...Array(3)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 ml-auto"></div>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 ml-auto"></div>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 ml-auto"></div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24 ml-auto"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      ) : pendingItems.length === 0 ? (
        <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/20 p-6 flex items-center gap-4 text-green-700 dark:text-green-400">
          <CheckCircle2 className="h-6 w-6 shrink-0" />
          <div>
            <p className="font-semibold">All caught up!</p>
            <p className="text-sm">All items on this Purchase Order have been fully received.</p>
          </div>
        </div>
      ) : (
        <ScrollArea className="h-80">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 uppercase text-xs sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-3 py-3 text-right">Ordered</th>
                <th className="px-3 py-3 text-right">Received</th>
                <th className="px-3 py-3 text-right text-primary">Remaining</th>
                <th className="px-4 py-3 text-right w-40">Qty Receiving Now</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {pendingItems.map(it => (
                <tr key={it.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900 dark:text-white">{it.product.name}</p>
                    <p className="text-xs text-gray-500 font-mono tracking-tighter">{it.product.code}</p>
                  </td>
                  <td className="px-3 py-3 text-right text-gray-500">{it.order_qty}</td>
                  <td className="px-3 py-3 text-right text-green-600">{it.received_qty}</td>
                  <td className="px-3 py-3 text-right text-primary font-bold">{it.remaining_qty}</td>
                  <td className="px-4 py-3 text-right">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max={it.remaining_qty}
                      value={receiveQtys[it.id] || ''}
                      onChange={e => setReceiveQtys(prev => ({ ...prev, [it.id]: e.target.value }))}
                      className="text-right font-semibold"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      )}
    </div>
  </div>
)}
    </form>

    {/* Footer */}
    <div className="shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-background">
      <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
        Cancel
      </Button>
      <Button 
        type="submit" 
        form="receive-form"
        disabled={submitting || pendingItems.length === 0}
        className="px-7 bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
      >
        {submitting ? 'Processing...' : 'Confirm Receipt & Update Stock'}
      </Button>
    </div>
  </DialogContent>
</Dialog>
        </div>
    );
}
