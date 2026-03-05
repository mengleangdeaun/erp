import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { IconSearch, IconX, IconCheck, IconTrash, IconClock } from '@tabler/icons-react';
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

export default function LeaveRecordIndex() {
    const [requests, setRequests] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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

    // Modals & Actions
    const [isProcessing, setIsProcessing] = useState(false);

    // Reject
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [activeRequest, setActiveRequest] = useState<any>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    // Delete
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);

    // Approve
    const [approveModalOpen, setApproveModalOpen] = useState(false);
    const [itemToApprove, setItemToApprove] = useState<number | null>(null);

    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const fetchRequests = () => {
        setLoading(true);
        fetch('/api/hr/leave-requests', {
            headers: {
                'Accept': 'application/json',
                'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
            },
            credentials: 'include',
        })
            .then(res => {
                if (res.status === 401) window.location.href = '/auth/login';
                return res.json();
            })
            .then(data => {
                setRequests(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                toast.error('Failed to load leave records');
                setLoading(false);
            });
    };

    const fetchEmployees = () => {
        fetch('/api/hr/employees', {
            headers: {
                'Accept': 'application/json',
                'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
            },
            credentials: 'include',
        })
            .then(res => res.json())
            .then(data => {
                setEmployees(Array.isArray(data) ? data : (data.data || []));
            })
            .catch(err => console.error('Error fetching employees:', err));
    };

    useEffect(() => {
        fetchRequests();
        fetchEmployees();
    }, []);

    const handleApprove = (id: number) => {
        setItemToApprove(id);
        setApproveModalOpen(true);
    };

    const executeApprove = async () => {
        if (!itemToApprove) return;

        setIsProcessing(true);
        try {
            await fetch('/sanctum/csrf-cookie');
            const res = await fetch(`/api/hr/leave-requests/${itemToApprove}/approve`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
                },
                credentials: 'include'
            });

            const data = await res.json();
            if (res.ok) {
                toast.success('Leave approved successfully!');
                fetchRequests();
            } else {
                toast.error(data.message || 'Error approving request');
            }
        } catch (e) {
            toast.error('An error occurred');
        } finally {
            setIsProcessing(false);
            setApproveModalOpen(false);
            setItemToApprove(null);
        }
    };

    const openRejectModal = (request: any) => {
        setActiveRequest(request);
        setRejectionReason('');
        setRejectModalOpen(true);
    };

    const handleReject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeRequest) return;

        setIsProcessing(true);
        try {
            await fetch('/sanctum/csrf-cookie');
            const res = await fetch(`/api/hr/leave-requests/${activeRequest.id}/reject`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
                },
                credentials: 'include',
                body: JSON.stringify({ rejection_reason: rejectionReason })
            });

            const data = await res.json();
            if (res.ok) {
                toast.success('Leave request rejected');
                setRejectModalOpen(false);
                fetchRequests();
            } else {
                if (data.errors?.rejection_reason) {
                    toast.error(data.errors.rejection_reason[0]);
                } else {
                    toast.error(data.message || 'Error rejecting request');
                }
            }
        } catch (e) {
            toast.error('An error occurred');
        } finally {
            setIsProcessing(false);
        }
    };

    const executeDelete = async () => {
        if (!itemToDelete) return;
        setIsProcessing(true);
        try {
            await fetch('/sanctum/csrf-cookie');
            const res = await fetch(`/api/hr/leave-requests/${itemToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
                },
                credentials: 'include',
            });

            if (res.ok || res.status === 204) {
                toast.success('Record deleted successfully');
                fetchRequests();
            } else {
                const data = await res.json();
                toast.error(data.message || 'Failed to delete record');
            }
        } catch (e) {
            toast.error('An error occurred');
        } finally {
            setIsProcessing(false);
            setDeleteModalOpen(false);
        }
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

                // Check for overlap: (StartA <= EndB) and (EndA >= StartB)
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
    }, [requests, search, statusFilter, employeeFilter, dateFilter]);

    const paginatedItems = filteredRequests.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-warning/10 text-warning border border-warning/20';
            case 'approved': return 'bg-success/10 text-success border border-success/20';
            case 'rejected': return 'bg-danger/10 text-danger border border-danger/20';
            case 'cancelled': return 'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
            default: return 'bg-dark/10 text-dark border border-dark/20';
        }
    };

    return (
        <div>
            <FilterBar
                title="Leave Records"
                description="Manage and approve organization leave applications."
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                hasActiveFilters={!!statusFilter || !!employeeFilter || !!dateFilter}
                onClearFilters={() => {
                    setStatusFilter('ALL_STATUSES');
                    setEmployeeFilter('');
                    setDateFilter(undefined);
                }}
                onRefresh={fetchRequests}
            >
                {/* Employee Filter */}
                <div className="w-full sm:w-[220px]">
                    <SearchableSelect
                        options={employees.map((emp: any) => ({
                            value: String(emp.id),
                            label: emp.full_name,
                            description: emp.employee_id
                        }))}
                        value={employeeFilter}
                        onChange={(val) => setEmployeeFilter(String(val))}
                        placeholder="All Employees"
                        searchPlaceholder="Search employees..."
                    />
                </div>

                {/* Date Filter */}
                <div className="w-full sm:w-[260px]">
                    <DateRangePicker
                        value={dateFilter}
                        onChange={setDateFilter}
                        placeholder="Filter by date range..."
                    />
                </div>

                {/* Status Filter */}
                <div className="w-full sm:w-[150px]">
                    <Select
                        value={statusFilter}
                        onValueChange={setStatusFilter}
                    >
                        <SelectTrigger className="h-10 w-full bg-white dark:bg-black border-gray-200 dark:border-gray-700 shadow-sm rounded-md">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL_STATUSES">All Statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </FilterBar>

            <div className="rounded-lg border overflow-hidden mb-5">
                <div className="table-responsive">
                    <table className="w-full text-sm">
                        <thead className=" border-b border-gray-100 dark:border-gray-800 text-gray-500 uppercase font-bold text-[11px] tracking-wider">
                            <tr>
                                <SortableHeader label="Date Requested" value="created_at" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} className="px-4 py-3" />
                                <SortableHeader label="Employee" value="employee" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} className="px-4 py-3" />
                                <SortableHeader label="Leave Type" value="leave_type" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} className="px-4 py-3" />
                                <th className="px-4 py-3 text-left">Duration Detail</th>
                                <th className="px-4 py-3 text-left">Reason</th>
                                <SortableHeader label="Status" value="status" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} className="px-4 py-3 text-center" />
                                <th className="px-4 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                <TableSkeleton columns={7} rows={5} rowsOnly />
                            ) : paginatedItems.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-0">
                                        <EmptyState
                                            title="No leave records found"
                                            description="There are currently no leave requests matching your criteria."
                                        />
                                    </td>
                                </tr>
                            ) : (
                                paginatedItems.map((req) => (
                                    <tr key={req.id} className="hover:bg-gray-50/30 dark:hover:bg-black/10 transition-colors group">
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                            {dayjs(req.created_at).format('MMM D, YYYY')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary/20 to-primary/5 flex items-center justify-center font-bold text-primary shrink-0 border border-primary/10">
                                                    {req.employee?.full_name?.charAt(0) || 'U'}
                                                </div>
                                                <div className="min-w-[120px]">
                                                    <p className="font-bold text-gray-900 dark:text-white truncate">
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
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-800 dark:text-gray-200">
                                                {req.start_date !== req.end_date ? (
                                                    <>{dayjs(req.start_date).format('MMM D')} - {dayjs(req.end_date).format('MMM D, YYYY')}</>
                                                ) : (
                                                    <>{dayjs(req.start_date).format('MMM D, YYYY')}</>
                                                )}
                                            </div>
                                            <div className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full inline-block mt-1">
                                                {req.total_days} {req.total_days == 1 ? 'day' : 'days'}
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
                                            <span className={`${getStatusStyle(req.status)} text-[11px] px-2.5 py-1 rounded-full uppercase tracking-widest font-bold`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2 items-center justify-center">
                                                <ActionButtons
                                                    variant="rounded"
                                                    showApproveReject={req.status === 'pending'}
                                                    skipRejectConfirm={true}
                                                    skipDeleteConfirm={true}
                                                    onApprove={() => handleApprove(req.id)}
                                                    onReject={() => openRejectModal(req)}
                                                    onDelete={() => { setItemToDelete(req.id); setDeleteModalOpen(true); }}
                                                    disabled={isProcessing}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && filteredRequests.length > 0 && (

                    <Pagination
                        currentPage={currentPage}
                        totalItems={filteredRequests.length}
                        itemsPerPage={itemsPerPage}
                        totalPages={Math.ceil(filteredRequests.length / itemsPerPage)}
                        onPageChange={setCurrentPage}
                    />
                )}
            </div>

            {/* Reject Modal */}
            <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Reject Leave Request</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this leave request for {activeRequest?.employee?.full_name}. This note will be visible to the employee.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleReject} className="space-y-4 mt-4">
                        <div>
                            <label className="text-sm font-semibold mb-2 block text-gray-800 dark:text-gray-200">Rejection Reason <span className="text-red-500">*</span></label>
                            <Textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="w-full rounded-lg resize-none h-32"
                                placeholder="E.g., Too many staff on leave on these dates..."
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                onClick={() => setRejectModalOpen(false)}
                                variant="outline"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isProcessing || !rejectionReason.trim()}
                                variant="destructive"
                            >
                                {isProcessing ? 'Processing... ' : 'Confirm Rejection'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>


            <DeleteModal
                isOpen={deleteModalOpen}
                setIsOpen={setDeleteModalOpen}
                title="Delete Leave Record"
                message="Are you sure you want to delete this leave record? This action cannot be undone."
                onConfirm={executeDelete}
                isLoading={isProcessing}
            />


            <ConfirmationModal
                isOpen={approveModalOpen}
                setIsOpen={setApproveModalOpen}
                title="Approve Leave Request"
                description="Are you sure you want to approve this leave request? This will deduct the employee's leave balance automatically."
                confirmText="Approve"
                confirmVariant="success"
                onConfirm={executeApprove}
                loading={isProcessing}
            />
        </div>
    );
}
