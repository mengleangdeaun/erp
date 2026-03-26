import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/button';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from '../../../components/ui/input';
import { Dialog, DialogContent, DialogTitle } from '../../../components/ui/dialog';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import PerfectScrollbar from 'react-perfect-scrollbar';
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
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import HighlightText from '../../../components/ui/HighlightText';
import { 
    usePurchaseReceives, 
    usePurchaseOrders, 
    useInventoryLocations,
    useCreatePurchaseReceive,
    usePurchaseOrderPendingItems
} from '@/hooks/useInventoryData';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useQueryClient } from '@tanstack/react-query';

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
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const queryClient = useQueryClient();
    const { formatDate, formatDateTime } = useFormatDate();
    
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

    // Query filters
    const queryParams = useMemo(() => {
        const p: any = {};
        if (search) p.search = search;
        if (locationId && locationId !== 'all') p.location_id = String(locationId);
        if (statusFilter && statusFilter !== 'all') p.status = statusFilter;
        if (dateRange?.from) p.start_date = format(dateRange.from, 'yyyy-MM-dd');
        if (dateRange?.to) p.end_date = format(dateRange.to, 'yyyy-MM-dd');
        return p;
    }, [search, locationId, statusFilter, dateRange]);

    // Queries
    const { data: prResponse, isLoading: prLoading } = usePurchaseReceives(queryParams);
    const { data: poData = [] } = usePurchaseOrders();
    const { data: locations = [] } = useInventoryLocations();
    const { data: pendingItemsData, isLoading: loadingItems } = usePurchaseOrderPendingItems(selectedPoId || null);

    const receives = Array.isArray(prResponse) ? prResponse : (prResponse?.data || []);
    const totalItems = Array.isArray(prResponse) ? prResponse.length : (prResponse?.total || 0);
    const pendingOrders = Array.isArray(poData) ? poData.filter((po: PO) => !['Cancelled', 'Completed'].includes(po.status)) : [];

    // Loading State
    const loading = useDelayedLoading(prLoading);

    // Mutations
    const receiveMutation = useCreatePurchaseReceive();
    const submitting = receiveMutation.isPending;

    useEffect(() => {
        dispatch(setPageTitle(t('purchase_receives')));
    }, [dispatch, t]);

    useEffect(() => {
        if (pendingItemsData) {
            const items = (Array.isArray(pendingItemsData) ? pendingItemsData : []).filter((it: PendingItem) => it.remaining_qty > 0);
            setPendingItems(items);
            const qtys: Record<number, string> = {};
            items.forEach((it: PendingItem) => { qtys[it.id] = String(it.remaining_qty); });
            setReceiveQtys(qtys);
        }
    }, [pendingItemsData]);

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

    const handlePoChange = (poId: string) => {
        setSelectedPoId(poId);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPoId) { toast.error(t('select_po_placeholder')); return; }
        if (!formData.location_id) { toast.error(t('select_receiving_location')); return; }

        const itemsPayload = pendingItems
            .filter(it => parseFloat(receiveQtys[it.id] || '0') > 0)
            .map(it => ({
                purchase_order_item_id: it.id,
                product_id: it.product.id,
                qty_received: parseFloat(receiveQtys[it.id]),
            }));

        if (itemsPayload.length === 0) { toast.error('Enter at least one quantity to receive'); return; }

        const payload = {
            purchase_order_id: parseInt(selectedPoId),
            ...formData,
            items: itemsPayload,
        };

        try {
            await receiveMutation.mutateAsync(payload);
            setModalOpen(false);
        } catch (error) {
            // Handled by mutation
        }
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
                title={t('purchase_receives')}
                description={t('record_track_goods_received_desc')}
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onAdd={openCreate}
                addLabel={t('new_receive')}
                onRefresh={() => queryClient.invalidateQueries({ queryKey: ['purchase-receives'] })}
                hasActiveFilters={sortBy !== 'receive_date' || sortDirection !== 'desc' || search !== '' || dateRange !== undefined || locationId !== 'all' || statusFilter !== 'all'}
                onClearFilters={clearFilters}
            >
                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('date_range')}</span>
                    <DateRangePicker
                        value={dateRange}
                        onChange={setDateRange}
                        placeholder={t('all_dates')}
                    />
                </div>

                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('physical_location')}</span>
                    <SearchableSelect
                        options={[
                            { value: 'all', label: t('all_locations') },
                            ...locations.map((l: any) => ({ value: l.id, label: l.name }))
                        ]}
                        value={locationId}
                        onChange={setLocationId}
                        placeholder="All Locations"
                    />
                </div>

                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('status')}</span>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                            <SelectValue placeholder={t('all_status')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="font-medium">{t('all_status')}</SelectItem>
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
                    title={t('no_purchase_receives_found_title')}
                    description={t('start_recording_first_goods_receipt')}
                    actionLabel={t('new_receive')}
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
                                    label={t('po_reference_label')}
                                    value="po_reference"
                                    currentSortBy={sortBy}
                                    currentDirection={sortDirection}
                                    onSort={setSortBy}
                                />
                                <SortableHeader
                                    label={t('supplier_label')}
                                    value="supplier"
                                    currentSortBy={sortBy}
                                    currentDirection={sortDirection}
                                    onSort={setSortBy}
                                />
                                <SortableHeader
                                    label={t('receive_date_label')}
                                    value="receive_date"
                                    currentSortBy={sortBy}
                                    currentDirection={sortDirection}
                                    onSort={setSortBy}
                                />
                                <SortableHeader
                                    label={t('physical_location')}
                                    value="location"
                                    currentSortBy={sortBy}
                                    currentDirection={sortDirection}
                                    onSort={setSortBy}
                                />
                                <SortableHeader
                                    label={t('reference_label')}
                                    value="reference_number"
                                    currentSortBy={sortBy}
                                    currentDirection={sortDirection}
                                    onSort={setSortBy}
                                />
                                <th>{t('items')}</th>
                                <SortableHeader
                                    label={t('status')}
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
                                    <td className="font-mono font-semibold text-primary">
                                        <HighlightText text={r.purchase_order?.po_number || ''} highlight={search} />
                                    </td>
                                    <td className="text-gray-700 dark:text-gray-200">
                                        <HighlightText text={r.purchase_order?.supplier?.name || ''} highlight={search} />
                                    </td>
                                    <td className="text-gray-600 dark:text-gray-300">{formatDateTime(r.receive_date)}</td>
                                    <td className="text-gray-600 dark:text-gray-300">
                                        <HighlightText text={r.location?.name || ''} highlight={search} />
                                    </td>
                                    <td className="text-gray-600 dark:text-gray-300">
                                        <HighlightText text={r.reference_number || '—'} highlight={search} />
                                    </td>
                                    <td className="text-gray-600 dark:text-gray-300">{r.items?.length || 0} {t('products')}</td>
                                    <td>
                                        <span className={`badge ${STATUS_CLASS[r.status] || ''}`}>
                                            {t(r.status.toLowerCase()) || r.status}
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
                            totalItems={totalItems}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </div>
            )}

{/* Create PR Modal */}
 <Dialog open={modalOpen} onOpenChange={setModalOpen}>
  <DialogContent className="sm:max-w-4xl w-[95vw] max-h-[90vh] h-full flex flex-col p-0 border-0 shadow-2xl rounded-2xl overflow-hidden">
    {/* Header */}
    <div className="shrink-0 bg-gradient-to-r from-green-600/10 to-transparent px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
      <div className="bg-green-600/20 p-3 rounded-2xl shadow-sm">
        <IconPackageImport className="text-green-600 w-7 h-7" />
      </div>
      <div>
        <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
          {t('record_goods_received')}
        </DialogTitle>
        <p className="text-sm text-gray-500 mt-1">
          {t('record_items_received_from_po_into_loc_desc')}
        </p>
      </div>
    </div>
    
     <PerfectScrollbar option={{ suppressScrollX: true }} className="flex-1 min-h-0">
      <form id="receive-form" onSubmit={handleSubmit} className="flex flex-col gap-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Purchase Order - takes more space */}
          <div className="md:col-span-3 space-y-1">
            <Label className="text-sm font-medium">{t('purchase_order')} <span className="text-red-500">*</span></Label>
            <SearchableSelect
              options={pendingOrders.map((po: any) => ({ 
                value: String(po.id), 
                label: `${po.po_number} — ${po.supplier?.name}` 
              }))}
              value={selectedPoId}
              onChange={(val) => handlePoChange(String(val))}
              placeholder={t('select_po_placeholder')}
            />
          </div>

          {/* Destination Location */}
          <div className="md:col-span-1 space-y-1">
            <Label className="text-sm font-medium">{t('physical_location')} <span className="text-red-500">*</span></Label>
            <SearchableSelect
              options={locations.map((l: any) => ({ value: String(l.id), label: l.name }))}
              value={formData.location_id}
              onChange={(val) => setFormData((p: any) => ({ ...p, location_id: String(val) }))}
              placeholder={t('select_location_placeholder')}
            />
          </div>

          {/* Reference Number */}
          <div className="md:col-span-2 space-y-1">
            <Label className="text-sm font-medium">{t('reference_label')}</Label>
            <Input 
              value={formData.reference_number} 
              onChange={e => setFormData((p: any) => ({ ...p, reference_number: e.target.value }))} 
              placeholder={t('ref_number_placeholder')} 
            />
          </div>

          {/* Receiving Note */}
          <div className="md:col-span-2 space-y-1">
            <Label className="text-sm font-medium">{t('note')}</Label>
            <Input 
              value={formData.receiving_note} 
              onChange={e => setFormData((p: any) => ({ ...p, receiving_note: e.target.value }))} 
              placeholder={t('optional_note_receipt_placeholder')} 
            />
          </div>
        </div>

      
  {/* Pending Items */}
  {selectedPoId && (
    <div className="space-y-3">
      {/* Header with title and receive date/time */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
          {t('items_to_receive')}
        </h3>

        {/* Receive Date & Time moved here */}
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium whitespace-nowrap">
            {t('receive_date_label')} <span className="text-red-500">*</span>
          </Label>
          <DatePicker
            value={formData.receive_date ? new Date(formData.receive_date) : undefined}
            onChange={(date) => {
              if (!date) return;
              const time = formData.receive_date ? formData.receive_date.split('T')[1]?.slice(0, 5) || '00:00' : '00:00';
              const newDate = format(date, 'yyyy-MM-dd') + 'T' + time;
              setFormData((p: any) => ({ ...p, receive_date: newDate }));
            }}
          />
          <TimePicker
            value={formData.receive_date ? formData.receive_date.split('T')[1]?.slice(0, 5) : '00:00'}
            onChange={(time) => {
              const date = formData.receive_date ? formData.receive_date.split('T')[0] : format(new Date(), 'yyyy-MM-dd');
              const newDate = date + 'T' + time;
              setFormData((p: any) => ({ ...p, receive_date: newDate }));
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
                  <th className="px-4 py-3 text-left">{t('product')}</th>
                  <th className="px-3 py-3 text-right">{t('ordered')}</th>
                  <th className="px-3 py-3 text-right">{t('received')}</th>
                  <th className="px-3 py-3 text-right text-primary">{t('remaining')}</th>
                  <th className="px-4 py-3 text-right w-40">{t('qty_receiving_now')}</th>
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
              <p className="font-semibold">{t('all_caught_up')}</p>
              <p className="text-sm">{t('all_items_received_desc')}</p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-80">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 uppercase text-xs sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left">{t('product')}</th>
                  <th className="px-3 py-3 text-right">{t('ordered')}</th>
                  <th className="px-3 py-3 text-right">{t('received')}</th>
                  <th className="px-3 py-3 text-right text-primary">{t('remaining')}</th>
                  <th className="px-4 py-3 text-right w-40">{t('qty_receiving_now')}</th>
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
                        onChange={e => setReceiveQtys((prev: Record<number, string>) => ({ ...prev, [it.id]: e.target.value }))}
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
    </PerfectScrollbar>

    {/* Footer */}
    <div className="shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-background">
      <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
        {t('cancel')}
      </Button>
      <Button 
        type="submit" 
        form="receive-form"
        disabled={submitting || pendingItems.length === 0}
        className="px-7 bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
      >
        {submitting ? t('processing') : t('confirm_receipt_update_stock')}
      </Button>
    </div>
  </DialogContent>
</Dialog>
        </div>
    );
}
