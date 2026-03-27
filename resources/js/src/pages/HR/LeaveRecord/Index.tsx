import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { IconClock, IconClockRecord } from '@tabler/icons-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import Pagination from '../../../components/ui/Pagination';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
import FilterBar from '../../../components/ui/FilterBar';
import SortableHeader from '../../../components/ui/SortableHeader';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import ActionButtons from '../../../components/ui/ActionButtons';
import ConfirmationModal from '../../../components/ConfirmationModal';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { DateRangePicker } from '../../../components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import { Button } from '../../../components/ui/button';
import DeleteModal from '../../../components/DeleteModal';
import { useLeaveRecords, useApproveLeave, useRejectLeave, useDeleteLeaveRecord, useHRFilterEmployees } from '@/hooks/useHRData';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useQueryClient } from '@tanstack/react-query';

export default function LeaveRecordIndex() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    
    // Filtering & Pagination
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL_STATUSES');
    const [employeeFilter, setEmployeeFilter] = useState('');
    const [dateFilter, setDateFilter] = useState<DateRange | undefined>();
    const [sortBy, setSortBy] = useState('created_at');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortDirection('asc');
        }
    };

    // Hooks
    const { data: requests = [], isLoading: loadingRecords } = useLeaveRecords();
    const { data: employees = [], isLoading: loadingEmployees } = useHRFilterEmployees();
    
    const approveMutation = useApproveLeave();
    const rejectMutation = useRejectLeave();
    const deleteMutation = useDeleteLeaveRecord();

    const isProcessing = approveMutation.isPending || rejectMutation.isPending || deleteMutation.isPending;
    const rawLoading = loadingRecords || loadingEmployees;
    const loading = useDelayedLoading(rawLoading, 500);

    // Modals
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [activeRequest, setActiveRequest] = useState<any>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);

    const [approveModalOpen, setApproveModalOpen] = useState(false);
    const [itemToApprove, setItemToApprove] = useState<number | null>(null);

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['hr-leave-records'] });
        queryClient.invalidateQueries({ queryKey: ['hr-employees-filter'] });
    };

    const handleApprove = (id: number) => {
        setItemToApprove(id);
        setApproveModalOpen(true);
    };

    const executeApprove = async () => {
        if (!itemToApprove) return;
        approveMutation.mutate(itemToApprove, {
            onSuccess: () => {
                toast.success(t('leave_approved_success'));
                setApproveModalOpen(false);
                setItemToApprove(null);
            },
            onError: (err: any) => {
                toast.error(err.response?.data?.message || t('error_approving_request'));
            }
        });
    };

    const openRejectModal = (request: any) => {
        setActiveRequest(request);
        setRejectionReason('');
        setRejectModalOpen(true);
    };

    const handleReject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeRequest) return;
        rejectMutation.mutate({ id: activeRequest.id, reason: rejectionReason }, {
            onSuccess: () => {
                toast.success(t('leave_request_rejected'));
                setRejectModalOpen(false);
            },
            onError: (err: any) => {
                const data = err.response?.data;
                if (data?.errors?.rejection_reason) {
                    toast.error(data.errors.rejection_reason[0]);
                } else {
                    toast.error(data?.message || t('error_rejecting_request'));
                }
            }
        });
    };

    const executeDelete = async () => {
        if (!itemToDelete) return;

        const request = requests.find(r => r.id === itemToDelete);
        if (request?.status === 'approved') {
            toast.error(t('cannot_delete_approved_request'));
            setDeleteModalOpen(false);
            return;
        }

        deleteMutation.mutate(itemToDelete, {
            onSuccess: () => {
                toast.success(t('record_deleted_success'));
                setDeleteModalOpen(false);
            },
            onError: (err: any) => {
                toast.error(err.response?.data?.message || t('failed_delete_record'));
            }
        });
    };

    // Derived standard table state
    const filteredRequests = useMemo(() => {
        let result = [...requests];

        if (statusFilter && statusFilter !== 'ALL_STATUSES') {
            result = result.filter(r => r.status === statusFilter);
        }

        if (employeeFilter) {
            result = result.filter(r => r.employee_id === Number(employeeFilter));
        }

        if (dateFilter?.from) {
            const startRange = dayjs(dateFilter.from).startOf('day');
            const endRange = dayjs(dateFilter.to || dateFilter.from).endOf('day');

            result = result.filter(r => {
                const leaveStart = dayjs(r.start_date).startOf('day');
                const leaveEnd = dayjs(r.end_date).endOf('day');

                return leaveStart.isSameOrBefore(endRange) && leaveEnd.isSameOrAfter(startRange);
            });
        }

        if (search) {
            const q = search.toLowerCase();
            result = result.filter(r =>
                r.employee?.full_name?.toLowerCase().includes(q) ||
                r.leave_type?.name?.toLowerCase().includes(q) ||
                r.reason?.toLowerCase().includes(q)
            );
        }

        result.sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];

            if (sortBy === 'employee') {
                aValue = a.employee?.full_name?.toLowerCase() || '';
                bValue = b.employee?.full_name?.toLowerCase() || '';
            } else if (sortBy === 'leave_type') {
                aValue = a.leave_type?.name?.toLowerCase() || '';
                bValue = b.leave_type?.name?.toLowerCase() || '';
            }

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [requests, search, statusFilter, employeeFilter, dateFilter, sortBy, sortDirection]);

    const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

    const paginatedItems = useMemo(() => filteredRequests.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    ), [filteredRequests, currentPage, itemsPerPage]);
    
    const hasActiveFilters = !!(statusFilter !== 'ALL_STATUSES' || employeeFilter || dateFilter?.from || search);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, statusFilter, employeeFilter, dateFilter]);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-warning/10 text-warning border border-warning/20';
            case 'approved': return 'bg-success/10 text-success border border-success/20';
            case 'rejected': return 'bg-danger/10 text-danger border border-danger/20';
            case 'cancelled': return 'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
            default: return 'bg-dark/10 text-dark border border-dark/20';
        }
    };

    const employeeOptions = useMemo(() => 
        employees.map((emp: any) => ({
            value: String(emp.id),
            label: emp.full_name,
            description: emp.employee_id
        }))
    , [employees]);

    return (
        <div>
            <FilterBar
                icon={<IconClockRecord className="w-6 h-6 text-primary" />}
                title={t('leave_records_title')}
                description={t('leave_records_desc')}
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={() => {
                    setSearch('');
                    setStatusFilter('ALL_STATUSES');
                    setEmployeeFilter('');
                    setDateFilter(undefined);
                }}
                onRefresh={handleRefresh}
            >
                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('date_range_label')}</span>
                    <DateRangePicker
                        value={dateFilter}
                        onChange={setDateFilter}
                        placeholder={t('filter_by_date_range_placeholder')}
                    />
                </div>

                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('employee_label')}</span>
                    <SearchableSelect
                        options={employeeOptions}
                        value={employeeFilter}
                        onChange={(val) => setEmployeeFilter(String(val))}
                        placeholder={t('all_employees_placeholder')}
                        searchPlaceholder={t('search_employees_placeholder')}
                        loading={loadingEmployees}
                    />
                </div>

                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('status_label')}</span>
                    <Select
                        value={statusFilter}
                        onValueChange={setStatusFilter}
                    >
                        <SelectTrigger className="h-10 w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm transition-all focus:ring-primary text-gray-800 dark:text-gray-200">
                            <SelectValue placeholder={t('all_statuses_placeholder')} />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
                            <SelectItem value="ALL_STATUSES" className="font-medium">{t('all_statuses_label')}</SelectItem>
                            <SelectItem value="pending" className="font-medium">{t('pending_label')}</SelectItem>
                            <SelectItem value="approved" className="font-medium">{t('approved_label')}</SelectItem>
                            <SelectItem value="rejected" className="font-medium">{t('rejected_label')}</SelectItem>
                            <SelectItem value="cancelled" className="font-medium">{t('cancelled_label')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </FilterBar>

            {loading ? (
                <TableSkeleton columns={7} rows={5} />
            ) : filteredRequests.length === 0 ? (
                <EmptyState
                    isSearch={hasActiveFilters}
                    searchTerm={search}
                    onClearFilter={() => { setSearch(''); setStatusFilter('ALL_STATUSES'); setDateFilter(undefined); setEmployeeFilter(''); }}
                />
            ) : (
                <div className="rounded-lg border border-gray-100 dark:border-gray-800 overflow-hidden mb-5 bg-white dark:bg-black shadow-sm">
                    <div className="table-responsive">
                        <table className="w-full text-sm">
                            <thead className="border-b dark:border-gray-600 text-gray-500 uppercase font-bold text-[11px] tracking-wider">
                                <tr>
                                    <SortableHeader label={t('requested_label')} value="created_at" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} className="px-4 py-3 whitespace-nowrap" />
                                    <SortableHeader label={t('employee_label')} value="employee" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} className="px-4 py-3" />
                                    <SortableHeader label={t('leave_type_label')} value="leave_type" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} className="px-4 py-3" />
                                    <th className="px-4 py-3 text-left whitespace-nowrap">{t('duration_detail_label')}</th>
                                    <th className="px-4 py-3 text-left">{t('reason_label')}</th>
                                    <SortableHeader label={t('status_label')} value="status" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} className="px-4 py-3 text-center" />
                                    <th className="px-4 py-3 text-right pr-4">{t('actions_label')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {paginatedItems.map((req) => (
                                    <tr key={req.id} className="hover:bg-gray-50/30 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                            {dayjs(req.created_at).format('MMM D, YYYY')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary/20 to-primary/5 flex items-center justify-center font-bold text-primary shrink-0 border border-primary/10">
                                                    {req.employee?.full_name?.charAt(0) || 'U'}
                                                </div>
                                                <div className="min-w-[120px]">
                                                    <p className="font-bold text-gray-900 dark:text-gray-100 truncate">
                                                        {req.employee?.full_name || 'Unknown'}
                                                    </p>
                                                    <p className="text-[11px] text-gray-400 uppercase tracking-tighter truncate">{req.employee?.employee_id || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                                                {req.leave_type?.name}
                                            </span>
                                            <div className="text-[11px] text-gray-500 uppercase font-bold tracking-wide mt-1">
                                                {req.duration_type.replace('_', ' ')}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="font-medium text-gray-800 dark:text-gray-200">
                                                {req.start_date !== req.end_date ? (
                                                    <>{dayjs(req.start_date).format('MMM D')} - {dayjs(req.end_date).format('MMM D, YYYY')}</>
                                                ) : (
                                                    <>{dayjs(req.start_date).format('MMM D, YYYY')}</>
                                                )}
                                            </div>
                                            <div className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full inline-block mt-1">
                                                {req.total_days} {req.total_days == 1 ? t('day') : t('days')}
                                            </div>
                                            {req.start_time && (
                                                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                    <IconClock className="w-3 h-3" />
                                                    {dayjs(`2000-01-01 ${req.start_time}`).format('h:mm A')} - {dayjs(`2000-01-01 ${req.end_time}`).format('h:mm A')}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 max-w-[200px]">
                                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2" title={req.reason}>
                                                {req.reason}
                                            </p>
                                            {req.rejection_reason && (
                                                <p className="text-xs text-danger mt-1 line-clamp-1" title={req.rejection_reason}>
                                                    <span className="font-semibold italic">Note:</span> {req.rejection_reason}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full uppercase tracking-widest font-bold text-[11px] ${getStatusStyle(req.status)}`}>
                                                {t(req.status + '_label')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right pr-4">
                                            <div className="flex gap-2 items-center justify-end">
                                                <ActionButtons
                                                    variant="rounded"
                                                    showApproveReject={req.status === 'pending'}
                                                    skipRejectConfirm={true}
                                                    skipDeleteConfirm={true}
                                                    onApprove={() => handleApprove(req.id)}
                                                    onReject={() => openRejectModal(req)}
                                                    onDelete={req.status !== 'approved' ? () => { setItemToDelete(req.id); setDeleteModalOpen(true); } : undefined}
                                                    disabled={isProcessing}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        currentPage={currentPage}
                        totalItems={filteredRequests.length}
                        itemsPerPage={itemsPerPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            {/* Reject Modal */}
            <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
                <DialogContent className="sm:max-w-[500px] bg-white dark:bg-black border-slate-200 dark:border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="text-gray-900 dark:text-gray-100">{t('reject_leave_request_title')}</DialogTitle>
                        <DialogDescription className="text-gray-500 dark:text-gray-400">
                            {t('reject_leave_request_desc', { name: activeRequest?.employee?.full_name })}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleReject} className="space-y-4 mt-4">
                        <div>
                            <label className="text-sm font-semibold mb-2 block text-gray-800 dark:text-gray-200">{t('rejection_reason_label')} <span className="text-red-500">*</span></label>
                            <Textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="w-full rounded-lg resize-none h-32 bg-white dark:bg-black border-gray-200 dark:border-gray-800"
                                placeholder={t('rejection_reason_placeholder')}
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                onClick={() => setRejectModalOpen(false)}
                                variant="outline"
                                className="border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300"
                            >
                                {t('cancel_btn_label')}
                            </Button>
                            <Button
                                type="submit"
                                disabled={isProcessing || !rejectionReason.trim()}
                                variant="destructive"
                                className="bg-rose-600 hover:bg-rose-700 text-white"
                            >
                                {isProcessing ? t('processing_dots') : t('confirm_rejection_btn')}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <DeleteModal
                isOpen={deleteModalOpen}
                setIsOpen={setDeleteModalOpen}
                title={t('delete_leave_record_title')}
                message={t('delete_leave_record_confirm')}
                onConfirm={executeDelete}
                isLoading={deleteMutation.isPending}
            />

            <ConfirmationModal
                isOpen={approveModalOpen}
                setIsOpen={setApproveModalOpen}
                title={t('approve_leave_request_title')}
                description={t('approve_leave_request_desc')}
                confirmText={t('approve_btn_label')}
                confirmVariant="success"
                onConfirm={executeApprove}
                loading={approveMutation.isPending}
            />
        </div>
    );
}
