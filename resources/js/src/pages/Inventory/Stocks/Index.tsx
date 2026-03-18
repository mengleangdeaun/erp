import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle } from '../../../components/ui/dialog';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Button } from '../../../components/ui/button';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import { Input } from '../../../components/ui/input';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { IconPackages } from '@tabler/icons-react';

const StockIndex = () => {
    const [stocks, setStocks] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('product_name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const initialFormState = {
        product_id: '',
        location_id: '',
        quantity: '1', // Represents 'Add X Stock' by default
    };
    
    const [formData, setFormData] = useState(initialFormState);

    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [stockRes, prodRes, locRes] = await Promise.all([
                fetch('/api/inventory/stocks', { headers: { 'Accept': 'application/json' }, credentials: 'include' }),
                fetch('/api/inventory/products', { headers: { 'Accept': 'application/json' }, credentials: 'include' }),
                fetch('/api/inventory/locations', { headers: { 'Accept': 'application/json' }, credentials: 'include' })
            ]);

            if (stockRes.status === 401) { window.location.href = 'auth/login'; return; }

            const [s, p, l] = await Promise.all([stockRes.json(), prodRes.json(), locRes.json()]);

            setStocks(Array.isArray(s) ? s : []);
            setProducts(Array.isArray(p) ? p : []);
            setLocations(Array.isArray(l) ? l : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleStockAdjustment = () => { setFormData(initialFormState); setModalOpen(true); };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSelectChange = (value: string, name: string) => setFormData(prev => ({ ...prev, [name]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await fetch('/sanctum/csrf-cookie');
            const response = await fetch('/api/inventory/stocks', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' }, credentials: 'include',
                body: JSON.stringify(formData),
            });
            if (response.ok) { toast.success(`Stock operations tracked correctly!`); setModalOpen(false); fetchData(); } else {
                const data = await response.json(); toast.error(data.message || 'Failed to update ledger records');
            }
        } catch (error) { console.error(error); toast.error('An error occurred'); } finally { setIsSaving(false); }
    };

    const filteredAndSorted = useMemo(() => {
        let result = [...stocks];
        if (search) { const q = search.toLowerCase(); result = result.filter(d => d.product?.name?.toLowerCase().includes(q) || d.product?.code?.toLowerCase().includes(q) || d.location?.name?.toLowerCase().includes(q)); }
        result.sort((a, b) => {
            let valA = sortBy === 'product_name' ? (a.product?.name || '') : sortBy === 'location_name' ? (a.location?.name || '') : (a[sortBy] || '');
            let valB = sortBy === 'product_name' ? (b.product?.name || '') : sortBy === 'location_name' ? (b.location?.name || '') : (b[sortBy] || '');
            if (typeof valA === 'string') valA = valA.toLowerCase(); if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return sortDirection === 'asc' ? -1 : 1; if (valA > valB) return sortDirection === 'asc' ? 1 : -1; return 0;
        });
        return result; // Add actual Date formatting component via `last_updated`
    }, [stocks, search, sortBy, sortDirection]);

    const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
    const paginated = filteredAndSorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div>
            <FilterBar icon={<IconPackages className="w-6 h-6 text-primary" />} title="Stock Valuations & Adjustments" description="Live audit counts mapped physically" search={search} setSearch={setSearch} itemsPerPage={itemsPerPage} setItemsPerPage={setItemsPerPage} onAdd={handleStockAdjustment} addLabel="System Adjust Stock" onRefresh={fetchData} hasActiveFilters={sortBy !== 'product_name' || sortDirection !== 'asc'} onClearFilters={() => { setSortBy('product_name'); setSortDirection('asc'); }} />
{loading ? (
  <TableSkeleton columns={5} rows={5} />
) : stocks.length === 0 ? (
  <EmptyState
    title="No Physical Stock Listed"
    description="Your logistics modules are barren. Commence procurement."
    actionLabel="Audit / Receive Items"
    onAction={handleStockAdjustment}
  />
) : filteredAndSorted.length === 0 ? (
  <EmptyState
    isSearch
    searchTerm={search}
    onClearFilter={() => {
      setSearch('');
      setSortBy('name'); // default sort
      setSortDirection('asc');
    }}
  />
) : (

                <div className="table-responsive bg-white dark:bg-black rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
                    <table className="table-hover table-striped w-full table">
                        <thead>
                            <tr>
                                <SortableHeader label="Referenced Item Code" value="product_code" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Product Name" value="product_name" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Physical Location" value="location_name" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Stored Quantity" value="quantity" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Last Update Check" value="last_updated" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map((row: any) => (
                                <tr key={row.id}>
                                    <td className="font-mono text-xs text-gray-400">{row.product?.code}</td>
                                    <td className="whitespace-nowrap font-medium text-primary">{row.product?.name}</td>
                                    <td className="text-sm font-semibold">{row.location?.name}</td>
                                    <td className="text-sm font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg px-2 text-center">{parseFloat(row.quantity).toFixed(2)}</td>
                                    <td className="text-xs text-slate-500">{new Date(row.last_updated).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="border-t border-gray-100 dark:border-gray-800"><Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredAndSorted.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} /></div>
                </div>
            )}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[700px] w-[95vw] flex flex-col p-0 border-0 shadow-2xl rounded-2xl overflow-hidden">
                    <div className="shrink-0 bg-gradient-to-r from-emerald-500/10 to-transparent px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
                        <div className="bg-emerald-500/20 p-3 rounded-2xl shadow-sm"><IconPackages className="text-emerald-600 w-7 h-7" /></div>
                        <div><DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">Warehouse System Alignment</DialogTitle><p className="form-description text-sm opacity-50">Transacting modifications mathematically applies automatically against the specific item location profile without deleting existing datasets.</p></div>
                    </div>
                    <ScrollArea className="flex-1 min-h-0">
                        <form id="stock-form" onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-1"><label className="text-sm font-medium">Select Product Node <span className="text-red-500">*</span></label>
                                    <SearchableSelect options={products.map((p: any) => ({ value: String(p.id), label: `${p.code} - ${p.name}` }))} value={String(formData.product_id)} onChange={(val) => handleSelectChange(val, 'product_id')} placeholder="Search Product DB..." />
                                </div>
                                <div className="space-y-1"><label className="text-sm font-medium">Target Physical Grid Repository <span className="text-red-500">*</span></label>
                                    <SearchableSelect options={locations.map((l: any) => ({ value: String(l.id), label: l.name }))} value={String(formData.location_id)} onChange={(val) => handleSelectChange(val, 'location_id')} placeholder="Select Logistics Warehouse..." />
                                </div>
                                <div className="space-y-1"><label className="text-sm font-medium text-emerald-600">Differential Quantity Modification (Negative drops stock) <span className="text-red-500">*</span></label>
                                    <Input name="quantity" type="number" step="0.01" value={formData.quantity} onChange={handleChange} required className="text-lg font-bold" />
                                </div>
                            </div>
                        </form>
                    </ScrollArea>
                    <div className="shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-background">
                        <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Abort Modification</Button>
                        <Button type="submit" form="stock-form" disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20">{isSaving ? 'Processing Compute...' : 'Perform Database Append'}</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
export default StockIndex;
