import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import ActionButtons from '../../../components/ui/ActionButtons';
import { DateRangePicker } from '../../../components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import dayjs from 'dayjs';
import { IconClockRecord } from '@tabler/icons-react';

const AttendanceRecordIndex = () => {
    const [records, setRecords] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter & Sort & Pagination state
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [dateFilter, setDateFilter] = useState<DateRange | undefined>({
        from: dayjs().startOf('month').toDate(),
        to: dayjs().endOf('month').toDate()
    });
    const [employeeFilter, setEmployeeFilter] = useState('');

    // Helper to get cookie
    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const fetchRecords = () => {
        setLoading(true);
        let url = '/api/attendance/records';
        if (dateFilter?.from && dateFilter?.to) {
            url += `?start_date=${dayjs(dateFilter.from).format('YYYY-MM-DD')}&end_date=${dayjs(dateFilter.to).format('YYYY-MM-DD')}`;
        }
        if (employeeFilter) {
            url += (url.includes('?') ? '&' : '?') + `employee_id=${employeeFilter}`;
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
                    setRecords(data);
                } else if (data.data && Array.isArray(data.data)) {
                    setRecords(data.data);
                } else {
                    setRecords([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setRecords([]);
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

    useEffect(() => {
        fetchRecords();
    }, [dateFilter, employeeFilter]);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const handleEdit = (record: any) => {
        // Implement Edit specific for Attendance records
        toast.info('Edit functionality not yet implemented.');
    };

    const handleDelete = async (record: any) => {
        // Implement Delete
        toast.info('Delete functionality not yet implemented.');
    };

    // Derived state for table
    const filteredAndSortedRecords = useMemo(() => {
        let result = [...records];

        // Search
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(r =>
                r.employee?.full_name?.toLowerCase().includes(q) ||
                r.employee?.employee_id?.toLowerCase().includes(q) ||
                r.status?.toLowerCase().includes(q)
            );
        }

        // Sort
        result.sort((a, b) => {
            let valA, valB;

            if (sortBy === 'employee') {
                valA = a.employee?.full_name || '';
                valB = b.employee?.full_name || '';
            } else {
                valA = a[sortBy] || '';
                valB = b[sortBy] || '';
            }

            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [records, search, sortBy, sortDirection]);

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedRecords.length / itemsPerPage);
    const paginatedRecords = filteredAndSortedRecords.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset page if search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    return (
        <div>
            <FilterBar
                icon={<IconClockRecord className="w-6 h-6 text-primary" />}
                title="Attendance Records"
                description="Manage and view employee attendance logs"
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onRefresh={fetchRecords}
                hasActiveFilters={!!search || !!dateFilter?.from || !!employeeFilter}
                onClearFilters={() => {
                    setSearch('');
                    setDateFilter({
                        from: dayjs().startOf('month').toDate(),
                        to: dayjs().endOf('month').toDate()
                    });
                    setSortBy('date');
                    setSortDirection('desc');
                    setEmployeeFilter('');
                }}
            >
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
                <div className="w-full sm:w-[260px]">
                    <DateRangePicker
                        value={dateFilter}
                        onChange={setDateFilter}
                        placeholder="Filter by date range..."
                    />
                </div>
            </FilterBar>

            {loading ? (
                <TableSkeleton columns={7} rows={5} />
            ) : records.length === 0 ? (
                <EmptyState
                    title="No Attendance Records"
                    description="No attendance data found for the selected period."
                />
            ) : filteredAndSortedRecords.length === 0 ? (
                <EmptyState
                    isSearch
                    searchTerm={search}
                    onClearFilter={() => {
                        setSearch('');
                        setSortBy('date');
                        setSortDirection('desc');
                    }}
                />
            ) : (
                <div className="table-responsive bg-white dark:bg-black rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
                    <table className="table-hover table-striped w-full table">
                        <thead>
                            <tr>
                                <SortableHeader label="Employee" value="employee" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Date" value="date" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Check In" value="check_in" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Check Out" value="check_out" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Status" value="status" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Total Hours" value="total_hours" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <th className="text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedRecords.map((record: any) => (
                                <tr key={record.id}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            {record.employee?.profile_image_url ? (
                                                <img src={record.employee.profile_image_url} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-500">
                                                    {record.employee?.full_name?.charAt(0) || '?'}
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-semibold text-gray-800 dark:text-gray-200">{record.employee?.full_name}</div>
                                                <div className="text-xs text-gray-500">{record.employee?.employee_id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{dayjs(record.date).format('MMM DD, YYYY')}</td>
                                    <td>{record.check_in ? dayjs(record.check_in).format('hh:mm A') : '-'}</td>
                                    <td>{record.check_out ? dayjs(record.check_out).format('hh:mm A') : '-'}</td>
                                    <td>
                                        <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-sm ${record.status === 'Present' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                record.status === 'Absent' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                                                    record.status === 'Late' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                        record.status === 'Half Day' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                                            'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                            }`}>
                                            {record.status || 'Unknown'}
                                        </span>
                                    </td>
                                    <td>{record.total_hours || '-'} hrs</td>
                                    <td>
                                        <ActionButtons
                                            variant='rounded'
                                            onEdit={() => handleEdit(record)}
                                            onDelete={() => handleDelete(record)}
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
                            totalItems={filteredAndSortedRecords.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceRecordIndex;
