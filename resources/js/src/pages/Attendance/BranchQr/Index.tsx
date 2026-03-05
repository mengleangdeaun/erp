import { useState, useEffect, useMemo } from 'react';
import QRCode from 'react-qr-code';
import { toast } from 'sonner';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { IconMapPin, IconQrcode } from '@tabler/icons-react';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';

export default function BranchQrSetup() {
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    // Filters and Sorting
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // QR State
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [qrData, setQrData] = useState<any>(null);
    const [qrLoading, setQrLoading] = useState(false);

    // Config State
    const [configModalOpen, setConfigModalOpen] = useState(false);
    const [branchToConfig, setBranchToConfig] = useState<any>(null);
    const [formData, setFormData] = useState({ lat: '', lng: '', allowed_radius: 50 });
    const [saving, setSaving] = useState(false);

    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const fetchBranches = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/hr/branches', {
                headers: { 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' },
                credentials: 'include',
            });
            const data = await res.json();
            if (res.ok) {
                setBranches(data);
            } else {
                toast.error('Failed to load branches');
            }
        } catch (e) {
            toast.error('Network Error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBranches();
    }, []);

    const handleSort = (column: string) => {
        if (sortBy === column) setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        else { setSortBy(column); setSortDirection('asc'); }
    };

    const filteredItem = useMemo(() => {
        if (!search) return branches;
        const lowerSearch = search.toLowerCase();
        return branches.filter(item =>
            item.name?.toLowerCase().includes(lowerSearch) ||
            item.code?.toLowerCase().includes(lowerSearch)
        );
    }, [branches, search]);

    const sortedItems = useMemo(() => {
        return [...filteredItem].sort((a, b) => {
            let aVal = a[sortBy]; let bVal = b[sortBy];
            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();
            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredItem, sortBy, sortDirection]);

    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return sortedItems.slice(start, start + itemsPerPage);
    }, [sortedItems, currentPage, itemsPerPage]);

    const handleGenerateQr = async (branchId: string) => {
        setQrModalOpen(true);
        setQrLoading(true);
        setQrData(null);
        try {
            const res = await fetch(`/api/attendance/branch-qr/${branchId}`, {
                headers: { 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' },
                credentials: 'include',
            });
            const data = await res.json();
            if (res.ok) setQrData(data);
            else toast.error(data.message || 'Error generating QR');
        } catch (e) {
            toast.error('Network Error');
        } finally {
            setQrLoading(false);
        }
    };

    const handleOpenConfig = (branch: any) => {
        setBranchToConfig(branch);
        setFormData({
            lat: branch.lat || '',
            lng: branch.lng || '',
            allowed_radius: branch.allowed_radius || 50
        });
        setConfigModalOpen(true);
    };

    const handleSaveConfig = async () => {
        if (!branchToConfig) return;
        setSaving(true);
        try {
            const payload = { ...branchToConfig, ...formData };

            const res = await fetch(`/api/hr/branches/${branchToConfig.id}`, {
                method: 'PUT',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || ''
                },
                credentials: 'include',
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Branch GPS Configured successfully');
                setConfigModalOpen(false);
                fetchBranches(); // refresh list
            } else {
                toast.error(data.message || 'Failed to update branch');
            }
        } catch (e) {
            toast.error('Network Error');
        } finally {
            setSaving(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            <div className="print:hidden">
                <FilterBar
                    title="Printable Branch QR Setup"
                    description="Configure Branch GPS coordinates and generate Geo-Fenced QR Codes for Wall mounting."
                    search={search}
                    setSearch={setSearch}
                    itemsPerPage={itemsPerPage}
                    setItemsPerPage={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
                    onRefresh={fetchBranches}
                />
            </div>

            <div className="rounded-xl  border overflow-hidden print:hidden">
                <div className="table-responsive">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50/50 dark:bg-black/20 border-b border-gray-100 dark:border-gray-800 text-gray-500 uppercase font-bold text-[11px] tracking-wider">
                            <tr>
                                <SortableHeader label="Branch Name" value="name" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} className="px-6 py-4" />
                                <SortableHeader label="Code" value="code" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} className="px-6 py-4" />
                                <th className="px-6 py-3 text-left">Latitude</th>
                                <th className="px-6 py-3 text-left">Longitude</th>
                                <th className="px-6 py-3 text-left">Radius (m)</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                <TableSkeleton columns={6} rows={5} rowsOnly />
                            ) : sortedItems.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-0">
                                        <EmptyState
                                            isSearch={!!search}
                                            searchTerm={search}
                                            onClearFilter={() => setSearch('')}
                                            title="No Branches found"
                                            description="No branches are currently available."
                                        />
                                    </td>
                                </tr>
                            ) : (
                                paginatedItems.map(branch => (
                                    <tr key={branch.id} className="hover:bg-gray-50/30 dark:hover:bg-black/10 transition-colors group">
                                        <td className="px-6 py-2 font-bold text-gray-900 dark:text-white">{branch.name}</td>
                                        <td className="px-6 py-2 text-gray-500 font-medium">{branch.code}</td>
                                        <td className="px-6 py-2 text-gray-500">
                                            {branch.lat ? branch.lat : <span className="badge bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-400 dark:border-red-800 text-[10px]">MISSING</span>}
                                        </td>
                                        <td className="px-6 py-2 text-gray-500">
                                            {branch.lng ? branch.lng : <span className="badge bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-400 dark:border-red-800 text-[10px]">MISSING</span>}
                                        </td>
                                        <td className="px-6 py-2">
                                            <span className="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-bold text-xs border border-gray-200 dark:border-gray-700">
                                                {branch.allowed_radius || 50}m
                                            </span>
                                        </td>
                                        <td className="px-6 py-2">
                                            <div className="flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="sm" variant="outline" className="rounded-lg h-9" onClick={() => handleOpenConfig(branch)}>
                                                    <IconMapPin className="w-4 h-4 mr-1.5" /> GPS
                                                </Button>
                                                <Button size="sm" className="rounded-lg h-9 bg-primary" onClick={() => handleGenerateQr(branch.id)}>
                                                    <IconQrcode className="w-4 h-4 mr-1.5" /> QR Code
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {!loading && sortedItems.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(sortedItems.length / itemsPerPage)}
                        totalItems={sortedItems.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                )}
            </div>

            <Dialog open={configModalOpen} onOpenChange={setConfigModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Configure GPS: {branchToConfig?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Latitude</Label>
                            <Input
                                placeholder="e.g. 40.7128"
                                value={formData.lat}
                                onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Longitude</Label>
                            <Input
                                placeholder="e.g. -74.0060"
                                value={formData.lng}
                                onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Allowed Radius (meters)</Label>
                            <Input
                                type="number"
                                placeholder="e.g. 50"
                                value={formData.allowed_radius}
                                onChange={(e) => setFormData({ ...formData, allowed_radius: parseInt(e.target.value) || 50 })}
                            />
                            <p className="text-xs text-muted-foreground">Maximum distance an employee can be from these coordinates and still clock in to {branchToConfig?.name}.</p>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setConfigModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveConfig} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Configuration'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
                <DialogContent className="max-w-2xl sm:max-w-2xl w-full">
                    <DialogHeader>
                        <DialogTitle className="print:hidden">Branch QR Code</DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-col items-center justify-center p-6 space-y-6">
                        {qrLoading && <div className="animate-pulse">Generating Secure Payload...</div>}

                        {qrData && !qrLoading && (
                            <div className="bg-white dark:bg-white border rounded-2xl shadow p-12 flex flex-col items-center justify-center space-y-8 max-w-2xl mx-auto print:shadow-none print:border-none print:m-0 print:p-0">
                                <div className="text-center space-y-2 text-black print:text-black">
                                    <h1 className="text-4xl font-extrabold uppercase tracking-widest">{qrData.branch}</h1>
                                    <p className="text-xl text-gray-500 font-medium tracking-wide">ATTENDANCE SCAN POINT</p>
                                </div>

                                <div className="p-4 bg-white rounded-xl border-4 border-black inline-block">
                                    <QRCode
                                        value={qrData.url}
                                        size={380}
                                        level="H"
                                        bgColor="#ffffff"
                                        fgColor="#000000"
                                    />
                                </div>

                                <div className="text-center space-y-1 text-black print:text-black max-w-md">
                                    <p className="text-base font-bold">1. Open Camera | 2. Scan QR | 3. Auto-Clock In</p>
                                    <p className="text-sm text-gray-500">Ensure your GPS Location Services are turned ON. You must be physically present at this branch to scan.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 flex justify-end gap-2 print:hidden">
                        <Button variant="outline" onClick={() => setQrModalOpen(false)}>Close</Button>
                        {qrData && !qrLoading && (
                            <Button onClick={handlePrint} className="bg-primary text-white">
                                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                Print Document
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}
