import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import ActionButtons from '../../../components/ui/ActionButtons';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import { DateRangePicker } from '../../../components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import dayjs from 'dayjs';

const LeaveBalanceIndex = () => {
    const [balances, setBalances] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter & Sort & Pagination state
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('employee');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [dateFilter, setDateFilter] = useState<DateRange | undefined>({
        from: dayjs().startOf('year').toDate(),
        to: dayjs().endOf('year').toDate()
    });
    const [leaveTypeFilter, setLeaveTypeFilter] = useState('');

    // Manual Adjust Modal (future automation placeholder)
    const [modalOpen, setModalOpen] = useState(false);
    const [editingBalance, setEditingBalance] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    const initialFormState = {
        employee_id: '',
        leave_type_id: '',
        total_accrued: 0,
        total_taken: 0,
        balance: 0,
        year: dayjs().year(),
    };

    const [formData, setFormData] = useState(initialFormState);

    // Helper to get cookie
    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const fetchBalances = () => {
        setLoading(true);
        let url = '/api/hr/leave-balances';
        if (dateFilter?.from && dateFilter?.to) {
            url += `?start_date=${dayjs(dateFilter.from).format('YYYY-MM-DD')}&end_date=${dayjs(dateFilter.to).format('YYYY-MM-DD')}`;
        }
        if (leaveTypeFilter) {
            url += (url.includes('?') ? '&' : '?') + `leave_type_id=${leaveTypeFilter}`;
        }

        fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
            },
            credentials: 'include',
        })
            .then(res => {
                if (res.status === 401) {
                    window.location.href = 'auth/login';
                    return null;
                }
                return res.json();
            })
            .then(data => {
                if (!data) return;
                if (Array.isArray(data)) {
                    setBalances(data);
                } else if (data.data && Array.isArray(data.data)) {
                    setBalances(data.data);
                } else {
                    setBalances([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setBalances([]);
                setLoading(false);
            });
    };

    const fetchEmployees = () => {
        fetch('/api/hr/employees', {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
            },
            credentials: 'include',
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setEmployees(data);
                else if (data.data && Array.isArray(data.data)) setEmployees(data.data);
            })
            .catch(err => console.error(err));
    };

    const fetchLeaveTypes = () => {
        fetch('/api/hr/leave-types', {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
            },
            credentials: 'include',
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setLeaveTypes(data);
            })
            .catch(err => console.error(err));
    };

    useEffect(() => {
        fetchBalances();
    }, [dateFilter, leaveTypeFilter]);

    useEffect(() => {
        fetchEmployees();
        fetchLeaveTypes();
    }, []);

    const handleCreate = () => {
        setEditingBalance(null);
        setFormData({ ...initialFormState, year: dayjs().year() });
        setModalOpen(true);
    };

    const handleEdit = (balance: any) => {
        setEditingBalance(balance);
        setFormData({
            employee_id: String(balance.employee_id),
            leave_type_id: String(balance.leave_type_id),
            total_accrued: balance.total_accrued,
            total_taken: balance.total_taken,
            balance: balance.balance,
            year: balance.year,
        });
        setModalOpen(true);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        let val: any = value;
        if (type === 'number') val = parseFloat(value) || 0;

        let newFormData = { ...formData, [name]: val };

        // Auto-calculate balance
        if (name === 'total_accrued' || name === 'total_taken') {
            const accrued = name === 'total_accrued' ? val : formData.total_accrued;
            const taken = name === 'total_taken' ? val : formData.total_taken;
            newFormData.balance = accrued - taken;
        }

        setFormData(newFormData);
    };

    const handleSelectChange = (value: string, name: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: value,
            // If leave item type or employee changes in create mode, maybe we need extra logic,
            // but for now just updating basic form data.
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const url = editingBalance ? `/api/hr/leave-balances/${editingBalance.id}` : '/api/hr/leave-balances';
        const method = editingBalance ? 'PUT' : 'POST';

        try {
            await fetch('/sanctum/csrf-cookie');
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
                },
                credentials: 'include',
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(`Leave Balance ${editingBalance ? 'updated' : 'created'} successfully`);
                setModalOpen(false);
                fetchBalances();
            } else {
                if (response.status === 401) {
                    window.location.href = '/login';
                }
                toast.error(data.message || 'Failed to save balance');
                if (data.errors) {
                    Object.values(data.errors).forEach((errArray: any) => {
                        toast.error(errArray[0]);
                    });
                }
            }
        } catch (error) {
            console.error(error);
            toast.error('An error occurred');
        } finally {
            setIsSaving(false);
        }
    };

    // Derived state for table
    const filteredAndSortedBalances = useMemo(() => {
        let result = [...balances];

        // Search
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(b =>
                b.employee?.full_name?.toLowerCase().includes(q) ||
                b.employee?.employee_id?.toLowerCase().includes(q) ||
                b.leave_type?.name?.toLowerCase().includes(q)
            );
        }

        // Sort
        result.sort((a, b) => {
            let valA, valB;

            if (sortBy === 'employee') {
                valA = a.employee?.full_name || '';
                valB = b.employee?.full_name || '';
            } else if (sortBy === 'leave_type') {
                valA = a.leave_type?.name || '';
                valB = b.leave_type?.name || '';
            } else {
                valA = a[sortBy] || 0;
                valB = b[sortBy] || 0;
            }

            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [balances, search, sortBy, sortDirection]);

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedBalances.length / itemsPerPage);
    const paginatedBalances = filteredAndSortedBalances.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset page if search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    // Generate year options
    const yearOptions = [];
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 2; y <= currentYear + 1; y++) {
        yearOptions.push(
            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
        );
    }

    return (
        <div>

            <FilterBar
                title="Leave Balances"
                description="Manage and calculate employee leave balances"
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onAdd={handleCreate}
                addLabel="Manual Adjust Balance"
                onRefresh={fetchBalances}
                hasActiveFilters={!!search || !!dateFilter?.from || !!leaveTypeFilter}
                onClearFilters={() => {
                    setSearch('');
                    setDateFilter({
                        from: dayjs().startOf('year').toDate(),
                        to: dayjs().endOf('year').toDate()
                    });
                    setSortBy('employee');
                    setSortDirection('asc');
                    setLeaveTypeFilter('');
                }}
            >
                <div className="w-full sm:w-[220px]">
                    <SearchableSelect
                        options={leaveTypes.map((type: any) => ({
                            value: String(type.id),
                            label: type.name,
                            description: `Allowance: ${type.allowance} days`
                        }))}
                        value={leaveTypeFilter}
                        onChange={(val) => setLeaveTypeFilter(String(val))}
                        placeholder="All Leave Types"
                        searchPlaceholder="Search leave types..."
                    />
                </div>
                <div className="w-full sm:w-[260px]">
                    <DateRangePicker
                        value={dateFilter}
                        onChange={setDateFilter}
                        placeholder="Filter by date range..."
                    />
                </div>
            </FilterBar>

            {loading ? (
                <TableSkeleton columns={6} rows={5} />
            ) : balances.length === 0 ? (
                <EmptyState
                    title="No Balances Found"
                    description={`No leave balances recorded for the selected period.`}
                    actionLabel="Add Manual Balance"
                    onAction={handleCreate}
                />
            ) : filteredAndSortedBalances.length === 0 ? (
                <EmptyState
                    isSearch
                    searchTerm={search}
                    onClearFilter={() => {
                        setSearch('');
                        setSortBy('employee');
                        setSortDirection('asc');
                    }}
                />
            ) : (
                <div className="table-responsive bg-white dark:bg-black rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
                    <table className="table-hover table-striped w-full table">
                        <thead>
                            <tr>
                                <SortableHeader label="Employee" value="employee" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Leave Type" value="leave_type" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Total Accrued" value="total_accrued" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Total Taken" value="total_taken" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Remaining Balance" value="balance" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <th className="text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedBalances.map((balance: any) => (
                                <tr key={balance.id}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            {balance.employee?.profile_image_url ? (
                                                <img src={balance.employee.profile_image_url} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-500">
                                                    {balance.employee?.full_name?.charAt(0) || '?'}
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-semibold text-gray-800 dark:text-gray-200">{balance.employee?.full_name}</div>
                                                <div className="text-xs text-gray-500">{balance.employee?.employee_id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            {balance.leave_type && (
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: balance.leave_type?.color || '#000000' }}></div>
                                            )}
                                            {balance.leave_type?.name || 'N/A'}
                                        </div>
                                    </td>
                                    <td><span className="font-semibold text-emerald-600 dark:text-emerald-400">{parseFloat(balance.total_accrued)}</span> <span className="text-xs text-gray-400">days</span></td>
                                    <td><span className="font-semibold text-rose-600 dark:text-rose-400">{parseFloat(balance.total_taken)}</span> <span className="text-xs text-gray-400">days</span></td>
                                    <td>
                                        <div className="flex items-center gap-1">
                                            <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-sm font-bold shadow-sm ${parseFloat(balance.balance) < 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                parseFloat(balance.balance) === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                }`}>
                                                {parseFloat(balance.balance)}
                                            </span>
                                            <span className="text-xs text-gray-500 font-medium">days</span>
                                        </div>
                                    </td>
                                    <td>
                                        <ActionButtons
                                            variant="rounded"
                                            onEdit={() => handleEdit(balance)}
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
                            totalItems={filteredAndSortedBalances.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </div>
            )}

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{editingBalance ? 'Edit Balance' : 'Manual Initial Balance'}</DialogTitle>
                    </DialogHeader>
                    <DialogDescription className="hidden">Manual adjustment of leave balances.</DialogDescription>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-semibold mb-1 block">Employee <span className="text-red-500">*</span></label>
                                <SearchableSelect
                                    options={employees.map((emp: any) => ({
                                        value: String(emp.id),
                                        label: emp.full_name,
                                        description: emp.employee_id
                                    }))}
                                    value={formData.employee_id}
                                    onChange={(val) => handleSelectChange(String(val), 'employee_id')}
                                    placeholder="Select Employee"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold mb-1 block">Leave Type <span className="text-red-500">*</span></label>
                                <SearchableSelect
                                    options={leaveTypes.map((type: any) => ({
                                        value: String(type.id),
                                        label: type.name,
                                        color: type.color || '#000000'
                                    }))}
                                    value={formData.leave_type_id}
                                    onChange={(val) => handleSelectChange(String(val), 'leave_type_id')}
                                    placeholder="Select Leave Type"
                                    searchPlaceholder="Search leave types..."
                                    disabled={!!editingBalance}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded bg-gray-50 dark:bg-dark dark:border-gray-800">
                            <div>
                                <label htmlFor="total_accrued">Total Accrued</label>
                                <input id="total_accrued" name="total_accrued" type="number" step="0.5" className="form-input" value={formData.total_accrued} onChange={handleChange} required min="0" />
                            </div>
                            <div>
                                <label htmlFor="total_taken">Total Taken</label>
                                <input id="total_taken" name="total_taken" type="number" step="0.5" className="form-input" value={formData.total_taken} onChange={handleChange} required min="0" />
                            </div>
                            <div>
                                <label htmlFor="balance">Balance</label>
                                <input id="balance" name="balance" type="number" step="0.5" className="form-input font-bold bg-white-light/50" value={formData.balance} readOnly />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="year">Year <span className="text-red-500">*</span></label>
                            <input id="year" name="year" type="number" className="form-input bg-white-light/50" value={formData.year} readOnly required />
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-outline-danger">Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save Balance'}
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default LeaveBalanceIndex;
