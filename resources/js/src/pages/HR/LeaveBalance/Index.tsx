import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Checkbox } from '../../../components/ui/checkbox';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Label } from '../../../components/ui/label';
import { IconBatteryVertical3 } from '@tabler/icons-react';
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
import { IconScale } from '@tabler/icons-react';
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
                icon={<IconBatteryVertical3 className=" h-6 w-6 text-primary" />}
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
                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Date Range</span>
                    <DateRangePicker
                        value={dateFilter}
                        onChange={setDateFilter}
                        placeholder="Filter by date range..."
                    />
                </div>

                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Leave Type</span>
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
  <DialogContent className="sm:max-w-[700px] w-[95vw] flex flex-col p-0 border-0 shadow-2xl rounded-2xl overflow-hidden">
    {/* Header */}
    <div className="shrink-0 bg-gradient-to-r from-primary/10 to-transparent px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
      <div className="bg-primary/20 p-3 rounded-2xl shadow-sm">
        <IconScale className="text-primary w-7 h-7" />
      </div>
      <div>
        <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
          {editingBalance ? 'Edit Leave Balance' : 'Manual Initial Balance'}
        </DialogTitle>
        <p className="text-sm text-gray-500 mt-1">
          {editingBalance
            ? 'Update the leave balance details below.'
            : 'Set initial balance for an employee’s leave type.'}
        </p>
      </div>
    </div>

    <ScrollArea className="flex-1 min-h-0">
      <form id="balance-form" onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Employee & Leave Type */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Employee & Leave Type
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <Label htmlFor="employee_id" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Employee <span className="text-red-500">*</span>
              </Label>
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
            <div className="space-y-1">
              <Label htmlFor="leave_type_id" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Leave Type <span className="text-red-500">*</span>
              </Label>
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
        </div>

        {/* Balance Details */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Balance Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="space-y-1.5">
              <Label htmlFor="total_accrued" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Total Accrued <span className="text-red-500">*</span>
              </Label>
              <Input
                id="total_accrued"
                name="total_accrued"
                type="number"
                step="0.5"
                value={formData.total_accrued}
                onChange={handleChange}
                required
                min="0"
                placeholder="0.0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="total_taken" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Total Taken <span className="text-red-500">*</span>
              </Label>
              <Input
                id="total_taken"
                name="total_taken"
                type="number"
                step="0.5"
                value={formData.total_taken}
                onChange={handleChange}
                required
                min="0"
                placeholder="0.0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="balance" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Balance
              </Label>
              <Input
                id="balance"
                name="balance"
                type="number"
                step="0.5"
                value={formData.balance}
                readOnly
                className="bg-gray-100 dark:bg-gray-800 font-semibold text-primary border-primary/20"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Balance is automatically calculated as Accrued - Taken.
          </p>
        </div>

        {/* Period */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Period
          </h3>
          <div className="space-y-1.5">
            <Label htmlFor="year" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Year <span className="text-red-500">*</span>
            </Label>
            <Input
              id="year"
              name="year"
              type="number"
              value={formData.year}
              readOnly
              className="bg-gray-100 dark:bg-gray-800"
              required
            />
          </div>
        </div>
      </form>
    </ScrollArea>

    {/* Sticky Footer */}
    <div className="shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-background">
      <Button
        type="button"
        variant="ghost"
        className="px-5"
        onClick={() => setModalOpen(false)}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        form="balance-form"
        disabled={isSaving}
        className="px-7 bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
      >
        {isSaving ? 'Saving...' : (editingBalance ? 'Save Changes' : 'Create Balance')}
      </Button>
    </div>
  </DialogContent>
</Dialog>
        </div>
    );
};

export default LeaveBalanceIndex;
