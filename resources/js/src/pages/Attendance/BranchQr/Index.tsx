import { useState, useEffect, useMemo, useRef } from 'react';
import QRCodeStyling from 'qr-code-styling';
import { toast } from 'sonner';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { ScrollArea } from '../../../components/ui/scroll-area';
import {
  IconMapPin,
  IconQrcode,
  IconCopy,
  IconCheck,
  IconPrinter,
  IconMapPins,
  IconClipboard,
  IconX,
  IconDownload, // Added import
} from '@tabler/icons-react';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { useTranslation } from 'react-i18next';

export default function BranchQrSetup() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
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
  const [combinedCoordinates, setCombinedCoordinates] = useState('');

  const qrRef = useRef<HTMLDivElement>(null);
  const [qrCode, setQrCode] = useState<QRCodeStyling | null>(null);
  const [copied, setCopied] = useState(false);

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
    dispatch(setPageTitle(t('branch_qr_setup', 'Branch QR Setup')));
  }, [dispatch, t]);

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleSort = (column: string) => {
    if (sortBy === column) setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  const filteredItem = useMemo(() => {
    if (!search) return branches;
    const lowerSearch = search.toLowerCase();
    return branches.filter(
      item =>
        item.name?.toLowerCase().includes(lowerSearch) ||
        item.code?.toLowerCase().includes(lowerSearch)
    );
  }, [branches, search]);

  const sortedItems = useMemo(() => {
    return [...filteredItem].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
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

  const handleCopy = () => {
    if (qrData?.url) {
      navigator.clipboard.writeText(qrData.url);
      setCopied(true);
      toast.success('Attendance link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (qrCode) {
      qrCode.download({
        name: `${qrData?.branch || 'branch'}-qr`,
        extension: 'png'
      });
      toast.success('QR code downloaded');
    } else {
      toast.error('QR code not ready');
    }
  };

  useEffect(() => {
    if (qrData && qrRef.current) {
      const newQrCode = new QRCodeStyling({
        width: 320,
        height: 320,
        data: qrData.url,
        dotsOptions: {
          type: 'square',
          gradient: {
            type: 'linear',
            rotation: 45,
            colorStops: [
              { offset: 0, color: '#0f172a' },
              { offset: 1, color: '#0f172a' },
            ],
          },
        },
        cornersSquareOptions: {
          type: 'extra-rounded',
          color: '#0f172a',
        },
        cornersDotOptions: {
          type: 'dot',
          color: '#0f172a',
        },
        qrOptions: {
          errorCorrectionLevel: 'H',
        },
        backgroundOptions: {
          color: '#ffffff',
        },
        imageOptions: {
          crossOrigin: 'anonymous',
          margin: 10,
        },
      });
      qrRef.current.innerHTML = '';
      newQrCode.append(qrRef.current);
      setQrCode(newQrCode);
    }
  }, [qrData]);

  const handleOpenConfig = (branch: any) => {
    setBranchToConfig(branch);
    setFormData({
      lat: branch.lat || '',
      lng: branch.lng || '',
      allowed_radius: branch.allowed_radius || 50,
    });
    setCombinedCoordinates('');
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
          'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Branch GPS configured successfully');
        setConfigModalOpen(false);
        fetchBranches();
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
      {/* Header with FilterBar */}
      <div className="print:hidden">
        <FilterBar
          icon={<IconQrcode className="w-6 h-6 text-primary" />}
          title="Printable Branch QR Setup"
          description="Configure branch GPS coordinates and generate geo-fenced QR codes for wall mounting."
          search={search}
          setSearch={setSearch}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={(val) => {
            setItemsPerPage(val);
            setCurrentPage(1);
          }}
          onRefresh={fetchBranches}
        />
      </div>

      {/* Branches List */}
      {loading ? (
        <TableSkeleton columns={6} rows={5} />
      ) : branches.length === 0 ? (
        <EmptyState
          title="No Branches Found"
          description="Get started by adding your first branch."
          // If you have an action to add a branch, uncomment:
          // actionLabel="Add Branch"
          // onAction={() => {/* navigate to branch creation */}}
        />
      ) : sortedItems.length === 0 ? (
        <EmptyState
          isSearch
          searchTerm={search}
          onClearFilter={() => setSearch('')}
        />
      ) : (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-black shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <SortableHeader
                    label="Branch Name"
                    value="name"
                    currentSortBy={sortBy}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                    className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider"
                  />
                  <SortableHeader
                    label="Code"
                    value="code"
                    currentSortBy={sortBy}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                    className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider"
                  />
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Latitude
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Longitude
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Radius (m)
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {paginatedItems.map((branch) => (
                  <tr
                    key={branch.id}
                    className="hover:bg-gray-50/30 dark:hover:bg-gray-800/30 transition-colors group"
                  >
                    <td className="px-6 py-3 font-semibold text-gray-900 dark:text-white">
                      {branch.name}
                    </td>
                    <td className="px-6 py-3 text-gray-600 dark:text-gray-400">
                      {branch.code}
                    </td>
                    <td className="px-6 py-3">
                      {branch.lat ? (
                        <span className="text-gray-600 dark:text-gray-400 font-mono">
                          {branch.lat}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 text-xs font-medium">
                          <IconX size={12} /> MISSING
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      {branch.lng ? (
                        <span className="text-gray-600 dark:text-gray-400 font-mono">
                          {branch.lng}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 text-xs font-medium">
                          <IconX size={12} /> MISSING
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold border border-gray-200 dark:border-gray-700">
                        {branch.allowed_radius || 50}m
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 text-xs gap-1.5 border-gray-200 dark:border-gray-700"
                          onClick={() => handleOpenConfig(branch)}
                        >
                          <IconMapPin size={14} /> GPS
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 px-3 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-white shadow-sm"
                          onClick={() => handleGenerateQr(branch.id)}
                        >
                          <IconQrcode size={14} /> QR
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(sortedItems.length / itemsPerPage)}
            totalItems={sortedItems.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* GPS Configuration Dialog */}
      <Dialog open={configModalOpen} onOpenChange={setConfigModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 border-0 shadow-2xl rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/10 to-transparent px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
            <div className="bg-primary/20 p-3 rounded-2xl shadow-sm">
              <IconMapPins className="text-primary w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                Configure GPS: {branchToConfig?.name}
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                Set the exact location and allowed radius for attendance.
              </p>
            </div>
          </div>

          <ScrollArea className="max-h-[60vh]">
            <form id="gps-form" className="p-6 space-y-6">
              {/* Coordinates */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  Coordinates
                </h3>

                {/* Combined Paste Field */}
                <div className="space-y-1.5">
                  <Label htmlFor="combined" className="text-sm font-medium">
                    Paste coordinates (lat, lng)
                  </Label>
                  <div className="relative">
                    <Input
                      id="combined"
                      placeholder="e.g. 40.7128, -74.0060"
                      value={combinedCoordinates}
                      onChange={(e) => setCombinedCoordinates(e.target.value)}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pastedText = e.clipboardData.getData('text');
                        setCombinedCoordinates(pastedText);

                        const parts = pastedText
                          .split(/[,\s]+/)
                          .map((s) => s.trim())
                          .filter((s) => s.length > 0 && !isNaN(parseFloat(s)));

                        if (parts.length >= 2) {
                          const lat = parts[0];
                          const lng = parts[1];
                          setFormData((prev) => ({ ...prev, lat, lng }));
                          toast.success('Coordinates parsed and filled');
                          setCombinedCoordinates('');
                        } else {
                          toast.error('Could not parse coordinates. Please enter lat and lng separately.');
                        }
                      }}
                    />
                    <IconClipboard
                      size={16}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Paste a single line with latitude and longitude (comma or space separated)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="lat" className="text-sm font-medium">
                      Latitude
                    </Label>
                    <Input
                      id="lat"
                      placeholder="e.g. 40.7128"
                      value={formData.lat}
                      onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lng" className="text-sm font-medium">
                      Longitude
                    </Label>
                    <Input
                      id="lng"
                      placeholder="e.g. -74.0060"
                      value={formData.lng}
                      onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Radius */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  Geofence
                </h3>
                <div className="space-y-1.5">
                  <Label htmlFor="radius" className="text-sm font-medium">
                    Allowed Radius (meters)
                  </Label>
                  <Input
                    id="radius"
                    type="number"
                    min="0"
                    placeholder="e.g. 50"
                    value={formData.allowed_radius}
                    onChange={(e) =>
                      setFormData({ ...formData, allowed_radius: parseInt(e.target.value) || 50 })
                    }
                  />
                  <p className="text-xs text-gray-500">
                    Maximum distance an employee can be from these coordinates and still clock in.
                  </p>
                </div>
              </div>
            </form>
          </ScrollArea>

          {/* Sticky Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-background">
            <Button variant="ghost" onClick={() => setConfigModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="gps-form"
              onClick={handleSaveConfig}
              isLoading={saving}
              className="px-6 bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
            >
              Save Configuration
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="sm:max-w-[600px] h-[90vh] p-0 border-0 shadow-2xl rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="shrink-0 bg-gradient-to-r from-primary/10 to-transparent px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4 print:hidden">
            <div className="bg-primary/20 p-3 rounded-2xl shadow-sm">
              <IconQrcode className="text-primary w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                Branch QR Code
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                Print and display at the branch for employee check‑in.
              </p>
            </div>
          </div>

          <ScrollArea className="flex-1 min-h-0">
{qrLoading ? (
  <div className="flex items-center justify-center py-16">
    <div className="flex flex-col items-center gap-4">
      {/* QR grid building up */}
      <div className="relative w-36 h-36">
        {/* Corner markers (static — these are always "known") */}
        <div className="absolute top-0 left-0 w-8 h-8 border-2 border-primary rounded-sm opacity-50" />
        <div className="absolute top-0 left-0 w-4 h-4 m-2 bg-primary rounded-[2px] animate-pulse" />

        <div className="absolute top-0 right-0 w-8 h-8 border-2 border-primary rounded-sm opacity-50" />
        <div className="absolute top-0 right-0 w-4 h-4 m-2 bg-primary rounded-[2px] animate-pulse" />

        <div className="absolute bottom-0 left-0 w-8 h-8 border-2 border-primary rounded-sm opacity-50" />
        <div className="absolute bottom-0 left-0 w-4 h-4 m-2 bg-primary rounded-[2px] animate-pulse" />

        {/* Data cells appearing randomly */}
        <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 gap-0.5 p-1">
          {Array.from({ length: 36 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[2px] bg-primary animate-[appear_0.3s_ease-out_forwards] opacity-0"
              style={{
                animationDelay: `${Math.floor(Math.random() * 900)}ms`,
                animationIterationCount: "infinite",
                animationDuration: `${900 + (i * 37) % 600}ms`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-foreground">Generating secure payload</p>
        <p className="text-xs text-muted-foreground">
          Building your QR code
          {["·", "·", "·"].map((dot, i) => (
            <span
              key={i}
              className="inline-block animate-bounce ml-0.5"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              {dot}
            </span>
          ))}
        </p>
      </div>
    </div>
  </div>    ) : qrData ? (
              <div className="p-6 space-y-6">
                {/* QR Code Card */}
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 inline-block">
                    <div ref={qrRef} className="w-[280px] h-[280px] md:w-[320px] md:h-[320px]" />
                  </div>
                </div>

                {/* Branch Info */}
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{qrData.branch}</h3>
                  <p className="text-sm text-gray-500 mt-1">Attendance Scan Point</p>
                </div>

                {/* URL Field with Copy */}
                <div className="space-y-2">
                  <Label htmlFor="qr-url" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Attendance Link
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="qr-url"
                      value={qrData.url}
                      readOnly
                      className="bg-gray-50 dark:bg-gray-800 font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopy}
                      className="shrink-0 h-10 w-10 border-gray-200 dark:border-gray-700"
                      title="Copy link"
                    >
                      {copied ? <IconCheck size={18} className="text-green-500" /> : <IconCopy size={18} />}
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </ScrollArea>

          {/* Footer Actions */}
          <div className="flex justify-between items-center gap-2 px-6 py-4 border-t border-gray-100 dark:border-gray-800 print:hidden">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQrModalOpen(false)}
                className="h-9 px-4 rounded-lg"
              >
                Close
              </Button>
            </div>
            <div className="flex gap-2">
              {qrData && !qrLoading && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="h-9 px-4 rounded-lg border-gray-200 dark:border-gray-700"
                  >
                    <IconDownload size={16} className="mr-2" />
                    Download PNG
                  </Button>
                  <Button
                    onClick={handlePrint}
                    className="h-9 px-5 rounded-lg bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
                  >
                    <IconPrinter size={16} className="mr-2" />
                    Print
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}