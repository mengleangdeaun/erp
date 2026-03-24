import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import DeleteModal from '../../../components/DeleteModal';
import ActionButtons from '../../../components/ui/ActionButtons';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import QRCode from 'react-qr-code';
import { IconUser } from '@tabler/icons-react';
import { Badge } from '../../../components/ui/badge';
import { useHREmployees, useHREmployeeQr, useHRDeleteEmployee } from '@/hooks/useHRData';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useQueryClient } from '@tanstack/react-query';

const EmployeeIndex = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Filter & Sort & Pagination state
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('full_name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);

    // QR Modal State
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [qrData, setQrData] = useState<any>(null);

    // TanStack Query
    const { data: rawEmployees = [], isLoading: rawLoading } = useHREmployees();
    const loading = useDelayedLoading(rawLoading, 500);
    
    const qrMutation = useHREmployeeQr();
    const deleteMutation = useHRDeleteEmployee();

    const employees = Array.isArray(rawEmployees) ? rawEmployees : (rawEmployees.data || []);

    const confirmDelete = (id: number) => {
        setItemToDelete(id);
        setDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!itemToDelete) return;
        deleteMutation.mutate(itemToDelete, {
            onSuccess: () => {
                toast.success('Employee deleted successfully');
                setDeleteModalOpen(false);
                setItemToDelete(null);
            },
            onError: () => {
                toast.error('Failed to delete employee');
            }
        });
    };

    const handleGenerateQr = async (employeeId: number) => {
        setQrModalOpen(true);
        setQrData(null);
        qrMutation.mutate(employeeId, {
            onSuccess: (data) => {
                setQrData(data);
            },
            onError: (err: any) => {
                toast.error(err.response?.data?.message || 'Error generating QR');
            }
        });
    };

    // Derived state for table
    const filteredAndSortedEmployees = useMemo(() => {
        let result = [...employees];

        // Search
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(e =>
                e.full_name?.toLowerCase().includes(q) ||
                e.employee_id?.toLowerCase().includes(q) ||
                e.branch?.name?.toLowerCase().includes(q) ||
                e.department?.name?.toLowerCase().includes(q) ||
                e.designation?.name?.toLowerCase().includes(q)
            );
        }

        // Sort
        result.sort((a, b) => {
            let valA = '';
            let valB = '';

            if (sortBy === 'branch') {
                valA = a.branch?.name || '';
                valB = b.branch?.name || '';
            } else if (sortBy === 'department') {
                valA = a.department?.name || '';
                valB = b.department?.name || '';
            } else if (sortBy === 'designation') {
                valA = a.designation?.name || '';
                valB = b.designation?.name || '';
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
    }, [employees, search, sortBy, sortDirection]);

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedEmployees.length / itemsPerPage);
    const paginatedEmployees = filteredAndSortedEmployees.slice(
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
                icon={<IconUser className="w-6 h-6 text-primary" />}
                title="Employees"
                description="Manage your employees"
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onAdd={() => navigate('/hr/employees/create')}
                addLabel="Add Employee"
                onRefresh={() => queryClient.invalidateQueries({ queryKey: ['hr-employees'] })}
                hasActiveFilters={sortBy !== 'full_name' || sortDirection !== 'asc'}
                onClearFilters={() => {
                    setSortBy('full_name');
                    setSortDirection('asc');
                }}
            />
    <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
                            {loading ? (
                <TableSkeleton columns={8} rows={itemsPerPage} />
            ) : employees.length === 0 ? (
                <EmptyState
                    title="No Employees Found"
                    description="Get started by adding your first employee."
                    actionLabel="Add Employee"
                    onAction={() => navigate('/hr/employees/create')}
                />
            ) : filteredAndSortedEmployees.length === 0 ? (
                <EmptyState
                    isSearch
                    searchTerm={search}
                    onClearFilter={() => {
                        setSearch('');
                        setSortBy('full_name');
                        setSortDirection('asc');
                    }}
                />
            ) : (
                <div className="table-responsive">
                    <table className="table-hover table-striped w-full table">
                        <thead>
                            <tr>
                                <th>Photo</th>
                                <SortableHeader label="Full Name" value="full_name" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Employee ID" value="employee_id" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Branch" value="branch" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Department" value="department" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Designation" value="designation" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Active" value="is_active" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
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
                                                className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                                            />
                                        ) : (
                                            <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500 border border-gray-200 dark:border-gray-700">
                                                {emp.full_name?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </td>
                                    <td className="whitespace-nowrap font-medium">{emp.full_name}</td>
                                    <td className="text-xs text-gray-500">{emp.employee_id}</td>
                                    <td>{emp.branch?.name || '—'}</td>
                                    <td>{emp.department?.name || '—'}</td>
                                    <td>{emp.designation?.name || '—'}</td>
                                    <td>
                                        <Badge 
                                        size='sm'
                                        dot={true}
                                        variant={emp.is_active ? 'success' : 'destructive'}>
                                            {emp.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </td>
                                    <td>
                                        <ActionButtons skipDeleteConfirm={true}
                                            onQr={() => handleGenerateQr(emp.id)}
                                            onEdit={() => navigate(`/hr/employees/${emp.id}/edit`)}
                                            onDelete={() => confirmDelete(emp.id)}
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


            <DeleteModal
                isOpen={deleteModalOpen}
                setIsOpen={setDeleteModalOpen}
                onConfirm={executeDelete}
                isLoading={deleteMutation.isPending}
                title="Delete Employee"
                message="Are you sure you want to delete this employee? This action cannot be undone."
            />

            <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Employee Login QR Code</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center p-6 space-y-6">
                        {qrMutation.isPending && <div className="animate-pulse">Generating Secure Login Token...</div>}
                        {qrData && !qrMutation.isPending && (
                            <>
                                <div className="text-center">
                                    <h3 className="text-lg font-bold">{qrData.employee}</h3>
                                    <p className="text-sm text-gray-500">Scan this QR to login to the Employee Scanner App</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl border-4 border-black">
                                    <QRCode value={qrData.url} size={256} level="H" />
                                </div>
                                <div className="text-xs text-center text-red-500 font-medium">
                                    WARNING: This QR code contains sensitive login credentials. Do not share it.
                                </div>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default EmployeeIndex;
