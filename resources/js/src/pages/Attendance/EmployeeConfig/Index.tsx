import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import ActionButtons from '../../../components/ui/ActionButtons';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import {
    IconCalendarStats,
    IconSettings,
    IconQrcode,
    IconUser,
    IconBrandTelegram,
    IconCopy,
    IconDownload,
    IconFileTypePdf,
    IconCheck,
    IconUserCog,
    IconAlertTriangle,
} from '@tabler/icons-react';
import QRCode from 'react-qr-code';
import { toPng } from 'html-to-image';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import { 
    useHREmployeeConfigs, 
    useHRAttendanceWorkingShifts, 
    useHRAttendancePolicies, 
    useHRAttendanceUpdateEmployeeConfig, 
    useHRAttendanceEmployeeQr 
} from '@/hooks/useHRData';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';

const EmployeeConfigIndex = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    // Filter & Sort & Pagination state
    const [search, setSearch] = useState('');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | number | null>(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('full_name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Edit Modal States
    const [activeEmployee, setActiveEmployee] = useState<any>(null);
    const [editModalType, setEditModalType] = useState<'shift' | 'policy' | 'status' | 'telegram' | null>(null);
    const [inputValue, setInputValue] = useState('');

    // QR Modal State
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [qrData, setQrData] = useState<any>(null);
    const [isCopying, setIsCopying] = useState(false);
    const [isDownloadingPng, setIsDownloadingPng] = useState(false);
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
    const qrRef = useRef<HTMLDivElement>(null);

    // TanStack Query Hooks
    const { data: employeeConfigs = [], isLoading: loadingConfigs } = useHREmployeeConfigs();
    const { data: workingShifts = [], isLoading: loadingShifts } = useHRAttendanceWorkingShifts();
    const { data: attendancePolicies = [], isLoading: loadingPolicies } = useHRAttendancePolicies();
    
    const updateConfigMutation = useHRAttendanceUpdateEmployeeConfig();
    const generateQrMutation = useHRAttendanceEmployeeQr();

    const isUpdating = updateConfigMutation.isPending;
    const loadingQr = generateQrMutation.isPending;
    
    const rawLoading = loadingConfigs || loadingShifts || loadingPolicies;
    const loading = useDelayedLoading(rawLoading, 500);

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['attendance-employee-configs'] });
        queryClient.invalidateQueries({ queryKey: ['attendance-working-shifts'] });
        queryClient.invalidateQueries({ queryKey: ['attendance-policies'] });
    };

    const handleUpdate = async () => {
        if (!activeEmployee || !editModalType) return;

        const payload: any = {};
        if (editModalType === 'shift') payload.working_shift_id = inputValue;
        if (editModalType === 'policy') payload.attendance_policy_id = inputValue;
        if (editModalType === 'status') payload.is_active = inputValue;
        if (editModalType === 'telegram') payload.telegram_user_id = inputValue;

        updateConfigMutation.mutate({ id: activeEmployee.id, ...payload }, {
            onSuccess: () => {
                toast.success('Updated successfully');
                setEditModalType(null);
            },
            onError: (err: any) => {
                toast.error(err.response?.data?.message || 'Update failed');
            }
        });
    };

    const handleGenerateQr = async (employeeId: number) => {
        setQrModalOpen(true);
        setQrData(null);
        
        generateQrMutation.mutate(employeeId, {
            onSuccess: (data) => {
                setQrData(data);
            },
            onError: (err: any) => {
                toast.error(err.response?.data?.message || 'Error generating QR');
                setQrModalOpen(false);
            }
        });
    };

    const handleCopyLink = async () => {
        if (!qrData?.url) return;
        setIsCopying(true);
        try {
            await navigator.clipboard.writeText(qrData.url);
            toast.success('Login link copied to clipboard');
            setTimeout(() => setIsCopying(false), 2000);
        } catch (err) {
            toast.error('Failed to copy link');
            setIsCopying(false);
        }
    };

    const handleDownloadPng = async () => {
        if (!qrRef.current || !qrData) return;

        setIsDownloadingPng(true);
        try {
            const dataUrl = await toPng(qrRef.current, {
                quality: 1.0,
                pixelRatio: 4,
                backgroundColor: '#ffffff',
                cacheBust: true,
                width: qrRef.current.offsetWidth,
                height: qrRef.current.offsetHeight,
                style: {
                    transform: 'none',
                    margin: '0',
                    padding: '24px',
                    left: '0',
                    top: '0',
                }
            });

            const fileName = `QR_${qrData.employee.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
            saveAs(dataUrl, fileName);
            toast.success('PNG downloaded successfully');
        } catch (err) {
            console.error('PNG Export Error:', err);
            toast.error('Failed to download PNG');
        } finally {
            setIsDownloadingPng(false);
        }
    };

    const handleDownloadPdf = async () => {
        if (!qrRef.current || !qrData) return;

        setIsDownloadingPdf(true);
        try {
            const dataUrl = await toPng(qrRef.current, {
                quality: 1.0,
                pixelRatio: 4,
                backgroundColor: '#ffffff',
                cacheBust: true,
                width: qrRef.current.offsetWidth,
                height: qrRef.current.offsetHeight,
                style: {
                    transform: 'none',
                    margin: '0',
                    padding: '24px',
                    left: '0',
                    top: '0',
                }
            });

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();

            // Header
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(22);
            pdf.setTextColor(40, 40, 40);
            pdf.text('Employee Login QR', pdfWidth / 2, 40, { align: 'center' });

            // Employee Name
            pdf.setFontSize(18);
            pdf.setTextColor(79, 70, 229);
            pdf.text(qrData.employee, pdfWidth / 2, 52, { align: 'center' });

            // QR Code
            const qrSize = 120;
            const xPos = (pdfWidth - qrSize) / 2;
            pdf.addImage(dataUrl, 'PNG', xPos, 70, qrSize, qrSize, undefined, 'FAST');

            // Instructions
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(12);
            pdf.setTextColor(100, 100, 100);
            pdf.text('Scan this secure QR code to log into the application', pdfWidth / 2, 210, { align: 'center' });

            // Security Note
            pdf.setFontSize(10);
            pdf.setTextColor(180, 180, 180);
            pdf.text('This QR code contains sensitive credentials. Keep it safe.', pdfWidth / 2, 220, { align: 'center' });

            // Footer
            pdf.setFontSize(9);
            pdf.text(`Generated on ${new Date().toLocaleString()} • ${qrData.employee}`, pdfWidth / 2, 280, { align: 'center' });

            const fileName = `QR_${qrData.employee.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
            pdf.save(fileName);
            toast.success('PDF downloaded successfully');
        } catch (err) {
            console.error('PDF Export Error:', err);
            toast.error('Failed to download PDF');
        } finally {
            setIsDownloadingPdf(false);
        }
    };

    const openEditModal = (employee: any, type: 'shift' | 'policy' | 'status' | 'telegram') => {
        setActiveEmployee(employee);
        setEditModalType(type);
        if (type === 'shift') setInputValue(employee.working_shift_id?.toString() || '');
        else if (type === 'policy') setInputValue(employee.attendance_policy_id?.toString() || '');
        else if (type === 'status') setInputValue(employee.is_active ? '1' : '0');
        else if (type === 'telegram') setInputValue(employee.telegram_user_id || '');
    };

    const filteredAndSortedEmployees = useMemo(() => {
        let result = [...employeeConfigs];

        if (selectedEmployeeId) {
            result = result.filter(e => e.id === Number(selectedEmployeeId));
        } else if (search) {
            const q = search.toLowerCase();
            result = result.filter(e =>
                e.full_name?.toLowerCase().includes(q) ||
                e.employee_id?.toLowerCase().includes(q)
            );
        }

        if (statusFilter !== 'all') {
            result = result.filter(e => (e.is_active ? 'active' : 'inactive') === statusFilter);
        }

        result.sort((a, b) => {
            let valA = a[sortBy] || '';
            let valB = b[sortBy] || '';
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [employeeConfigs, search, selectedEmployeeId, statusFilter, sortBy, sortDirection]);

    const totalPages = Math.ceil(filteredAndSortedEmployees.length / itemsPerPage);
    const paginatedEmployees = filteredAndSortedEmployees.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        dispatch(setPageTitle(t('employee_config', 'Employee Config')));
    }, [dispatch, t]);

    useEffect(() => { setCurrentPage(1); }, [search, selectedEmployeeId, statusFilter]);

    const employeeOptions = useMemo(() => {
        return employeeConfigs.map(emp => ({
            value: emp.id,
            label: `${emp.full_name} (${emp.employee_id})`,
            description: emp.designation?.name
        }));
    }, [employeeConfigs]);

    return (
        <div>
            <FilterBar
                icon={<IconUserCog className="w-6 h-6 text-primary" />}
                title="Employee Config"
                description="Configure attendance settings for your employees"
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onRefresh={handleRefresh}
                hasActiveFilters={statusFilter !== 'all' || selectedEmployeeId !== null || !!search}
                onClearFilters={() => {
                    setStatusFilter('all');
                    setSelectedEmployeeId(null);
                    setSearch('');
                }}
            >
                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Employee</span>
                    <SearchableSelect
                        options={employeeOptions}
                        value={selectedEmployeeId}
                        onChange={(val) => setSelectedEmployeeId(val)}
                        placeholder="Employee Filter"
                        searchPlaceholder="Search employee..."
                    />
                </div>
                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Status</span>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                            <SelectValue placeholder="Status Filter" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="font-medium">All Status</SelectItem>
                            <SelectItem value="active" className="font-medium">Active</SelectItem>
                            <SelectItem value="inactive" className="font-medium">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </FilterBar>

            <div>
                <div className="overflow-x-auto">
                    {loading ? (
                        <TableSkeleton columns={8} rows={itemsPerPage} />
                    ) : (employeeConfigs.length === 0 && !loadingConfigs) ? (
                        <EmptyState title="No Employees Found" description="Start by adding employees in HR module." />
                    ) : filteredAndSortedEmployees.length === 0 ? (
                        <EmptyState isSearch searchTerm={search} onClearFilter={() => { setSearch(''); setStatusFilter('all'); setSelectedEmployeeId(null); }} />
                    ) : (
                        <div className="table-responsive rounded-lg border overflow-hidden">
                            <table className="table-hover table-striped w-full table">
                                <thead>
                                    <tr>
                                        <th>Photo</th>
                                        <SortableHeader label="Employee" value="full_name" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                        <th>Line Manager</th>
                                        <th>Branch</th>
                                        <th>Department / Designation</th>
                                        <th>Working Shift</th>
                                        <th>Attendance Policy</th>
                                        <th className="text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedEmployees.map((emp: any) => (
                                        <tr key={emp.id}>
                                            <td>
                                                {emp.profile_image ? (
                                                    <img
                                                        src={emp.profile_image?.startsWith('http') ? emp.profile_image : `/storage/${emp.profile_image}`}
                                                        alt={emp.full_name}
                                                        className="w-10 h-10 rounded-full object-cover border-2 border-primary/10 shadow-sm"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-xs font-bold text-primary border-2 border-primary/10">
                                                        {emp.full_name?.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <div className="font-bold text-sm text-gray-900 dark:text-gray-100">{emp.full_name}</div>
                                                <div className="text-xs text-primary font-medium">{emp.employee_id}</div>
                                            </td>
                                            <td>
                                                <div className="font-bold text-sm text-gray-900 dark:text-gray-100">{emp.line_manager?.full_name}</div>
                                                <div className="text-xs text-primary font-medium">{emp.line_manager?.employee_id}</div>
                                            </td>
                                            <td className="text-sm">{emp.branch?.name || '—'}</td>
                                            <td>
                                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{emp.department?.name || '—'}</div>
                                                <div className="text-xs text-gray-500">{emp.designation?.name || '—'}</div>
                                            </td>

                                            <td>
                                                <div
                                                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200 border border-blue-100 dark:border-blue-800 cursor-pointer hover:bg-blue-100 transition-colors"
                                                    onClick={() => openEditModal(emp, 'shift')}
                                                >
                                                    <IconCalendarStats size={14} className="mr-1" />
                                                    {emp.working_shift?.name || 'Unassigned'}
                                                </div>
                                            </td>
                                            <td>
                                                <div
                                                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200 border border-emerald-100 dark:border-emerald-800 cursor-pointer hover:bg-emerald-100 transition-colors"
                                                    onClick={() => openEditModal(emp, 'policy')}
                                                >
                                                    <IconSettings size={14} className="mr-1" />
                                                    {emp.attendance_policy?.name || 'Unassigned'}
                                                </div>
                                            </td>
                                            <td>
                                                <ActionButtons
                                                    onQr={() => handleGenerateQr(emp.id)}
                                                    onStatus={() => openEditModal(emp, 'status')}
                                                    onTelegram={() => openEditModal(emp, 'telegram')}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={filteredAndSortedEmployees.length}
                                itemsPerPage={itemsPerPage}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modals */}
            <Dialog open={editModalType !== null} onOpenChange={(open) => !open && setEditModalType(null)}>
                <DialogContent className="max-w-md ">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {editModalType === 'shift' && <><IconCalendarStats className="text-blue-500" /> Edit Working Shift</>}
                            {editModalType === 'policy' && <><IconSettings className="text-emerald-500" /> Edit Attendance Policy</>}
                            {editModalType === 'status' && <><IconUser className="text-amber-500" /> Edit Staff Status</>}
                            {editModalType === 'telegram' && <><IconBrandTelegram className="text-sky-500" /> Edit Telegram User ID</>}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-6 space-y-6">
                        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                            {activeEmployee?.profile_image ? (
                                <img src={activeEmployee.profile_image?.startsWith('http') ? activeEmployee.profile_image : `/storage/${activeEmployee.profile_image}`} className="w-12 h-12 rounded-full object-cover" alt={activeEmployee?.full_name} />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">{activeEmployee?.full_name?.charAt(0)}</div>
                            )}
                            <div>
                                <div className="font-bold text-gray-900 dark:text-gray-100">{activeEmployee?.full_name}</div>
                                <div className="text-sm text-gray-500">{activeEmployee?.employee_id} • {activeEmployee?.designation?.name}</div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-semibold">
                                {editModalType === 'shift' && 'Select Working Shift'}
                                {editModalType === 'policy' && 'Select Attendance Policy'}
                                {editModalType === 'status' && 'Staff Employment Status'}
                                {editModalType === 'telegram' && 'Telegram User ID (Integration)'}
                            </Label>

                            {editModalType === 'shift' && (
                                <Select value={inputValue} onValueChange={setInputValue}>
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder="Choose shift..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {workingShifts.map((s: any) => (
                                            <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            {editModalType === 'policy' && (
                                <Select value={inputValue} onValueChange={setInputValue}>
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder="Choose policy..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {attendancePolicies.map((p: any) => (
                                            <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            {editModalType === 'status' && (
                                <Select value={inputValue} onValueChange={setInputValue}>
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder="Choose status..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Active</SelectItem>
                                        <SelectItem value="0">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                            {editModalType === 'telegram' && (
                                <div>
                                    <Input
                                        placeholder="Enter Telegram User ID..."
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                    />
                                    <p className="text-[10px] text-gray-400 mt-2 px-1 text-start italic">Used for automated attendance notifications via Telegram Bot.</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setEditModalType(null)} className="flex-1 sm:flex-none">Cancel</Button>
                        <Button onClick={handleUpdate} isLoading={isUpdating} className="flex-1 sm:flex-none">Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* QR Modal */}
            <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] h-auto p-0 border-0 shadow-2xl rounded-2xl overflow-hidden">
                    <div className="shrink-0 bg-gradient-to-r from-primary/10 to-transparent px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4 print:hidden">
                        <div className="bg-primary/20 p-3 rounded-2xl shadow-sm">
                            <IconQrcode className="text-primary w-6 h-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                                Employee Login QR
                            </DialogTitle>
                            <p className="text-sm text-gray-500 mt-1">
                                Scan this code with the mobile app to log in securely.
                            </p>
                        </div>
                    </div>

                    <PerfectScrollbar options={{ suppressScrollX: true }} className="flex-1 min-h-0">
                        {loadingQr ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative w-36 h-36">
                                        <div className="absolute top-0 left-0 w-8 h-8 border-2 border-primary rounded-sm opacity-50" />
                                        <div className="absolute top-0 left-0 w-4 h-4 m-2 bg-primary rounded-[2px] animate-pulse" />
                                        <div className="absolute top-0 right-0 w-8 h-8 border-2 border-primary rounded-sm opacity-50" />
                                        <div className="absolute top-0 right-0 w-4 h-4 m-2 bg-primary rounded-[2px] animate-pulse" />
                                        <div className="absolute bottom-0 left-0 w-8 h-8 border-2 border-primary rounded-sm opacity-50" />
                                        <div className="absolute bottom-0 left-0 w-4 h-4 m-2 bg-primary rounded-[2px] animate-pulse" />
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
                                        <p className="text-xs text-muted-foreground">Building your QR code...</p>
                                    </div>
                                </div>
                            </div>
                        ) : qrData ? (
                            <div ref={qrRef} className="p-6 space-y-6 bg-white dark:bg-black">
                                <div className="text-center">
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {qrData.employee}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">Scan to log in to the mobile app</p>
                                </div>

                                <div className="flex justify-center">
                                    <div className="bg-white p-4 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 inline-block">
                                        <QRCode value={qrData.url} size={220} level="H" />
                                    </div>
                                </div>

                                <div className="space-y-2 print:hidden">
                                    <Label htmlFor="qr-url" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Login Link
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
                                            onClick={handleCopyLink}
                                            className="shrink-0 h-10 w-10 border-gray-200 dark:border-gray-700"
                                            title="Copy link"
                                            disabled={isCopying}
                                        >
                                            {isCopying ? <IconCheck size={18} className="text-green-500" /> : <IconCopy size={18} />}
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full print:hidden">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 border-gray-200 dark:border-gray-700"
                                        onClick={handleDownloadPng}
                                        disabled={isDownloadingPng}
                                    >
                                        <IconDownload size={16} />
                                        {isDownloadingPng ? 'Downloading...' : 'PNG (HD)'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 border-gray-200 dark:border-gray-700"
                                        onClick={handleDownloadPdf}
                                        disabled={isDownloadingPdf}
                                    >
                                        <IconFileTypePdf size={16} />
                                        {isDownloadingPdf ? 'Downloading...' : 'PDF'}
                                    </Button>
                                </div>

                                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
                                    <div className="flex gap-2 items-start">
                                        <IconAlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                        <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed font-medium">
                                            SECURITY WARNING: This QR code contains sensitive session credentials. Do not share or leave it unattended.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </PerfectScrollbar>

                    <div className="shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-background print:hidden">
                        <Button variant="ghost" onClick={() => setQrModalOpen(false)} className="h-9 px-4 rounded-lg">
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default EmployeeConfigIndex;
