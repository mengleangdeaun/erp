import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { IconWallet, IconBuilding } from '@tabler/icons-react';
import FilterBar from '@/components/ui/FilterBar';
import TableSkeleton from '@/components/ui/TableSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import SortableHeader from '@/components/ui/SortableHeader';
import DeleteModal from '@/components/DeleteModal';
import ActionButtons from '@/components/ui/ActionButtons';
import { Badge } from '@/components/ui/badge';
import AccountDialog from './AccountDialog';

const PaymentAccountIndex = () => {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<any>(null);

    // Filter & Sort & Pagination state
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchAccounts = () => {
        setLoading(true);
        fetch('/api/finance/payment-accounts', {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        })
            .then(res => res.json())
            .then(data => {
                setAccounts(Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []));
                setLoading(false);
            })
            .catch(err => {
                console.error('Fetch error:', err);
                setAccounts([]);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const handleCreate = () => {
        setEditingAccount(null);
        setModalOpen(true);
    };

    const handleEdit = (account: any) => {
        setEditingAccount(account);
        setModalOpen(true);
    };

    const confirmDelete = (id: number) => {
        setItemToDelete(id);
        setDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);

        try {
            const response = await fetch(`/api/finance/payment-accounts/${itemToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
            });

            if (response.ok) {
                toast.success('Account deleted successfully');
                fetchAccounts();
            } else {
                toast.error('Failed to delete account');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setIsDeleting(false);
            setDeleteModalOpen(false);
            setItemToDelete(null);
        }
    };

    const filteredAndSortedAccounts = useMemo(() => {
        let result = [...accounts];

        if (search) {
            const q = search.toLowerCase();
            result = result.filter(a =>
                a.name?.toLowerCase().includes(q) ||
                a.account_no?.toLowerCase().includes(q) ||
                a.branch?.name?.toLowerCase().includes(q)
            );
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
    }, [accounts, search, sortBy, sortDirection]);

    const totalPages = Math.ceil(filteredAndSortedAccounts.length / itemsPerPage);
    const paginatedAccounts = filteredAndSortedAccounts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    return (
        <div>
            <FilterBar
                icon={<IconWallet className="w-6 h-6 text-primary" />}
                title="Payment Accounts"
                description="Manage bank accounts and cash boxes for your branches"
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onAdd={handleCreate}
                addLabel="Add Account"
                onRefresh={fetchAccounts}
                hasActiveFilters={sortBy !== 'name' || sortDirection !== 'asc'}
                onClearFilters={() => {
                    setSortBy('name');
                    setSortDirection('asc');
                }}
            />

            {loading ? (
                <TableSkeleton columns={5} rows={5} />
            ) : accounts.length === 0 ? (
                <EmptyState
                    title="No Accounts Found"
                    description="Get started by adding your first payment account."
                    actionLabel="Add Account"
                    onAction={handleCreate}
                />
            ) : filteredAndSortedAccounts.length === 0 ? (
                <EmptyState isSearch searchTerm={search} onClearFilter={() => setSearch('')} />
            ) : (
                <div className="table-responsive bg-white dark:bg-black rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm">
                    <table className="table-hover table-striped w-full table">
                        <thead>
                            <tr>
                                <SortableHeader label="Account Name" value="name" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Account No" value="account_no" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Branch" value="branch_id" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Balance" value="balance" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label="Status" value="status" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <th className="text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedAccounts.map((account: any) => (
                                <tr key={account.id}>
                                    <td className="whitespace-nowrap font-medium">{account.name}</td>
                                    <td>{account.account_no || 'N/A'}</td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <IconBuilding size={14} className="text-gray-400" />
                                            {account.branch?.name}
                                        </div>
                                    </td>
                                    <td className="font-bold text-primary">${parseFloat(account.balance || 0).toLocaleString()}</td>
                                    <td>
                                        <Badge variant={account.is_active ? 'success' : 'destructive'} size="sm" dot>
                                            {account.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </td>
                                    <td>
                                        <ActionButtons 
                                            skipDeleteConfirm={true}
                                            onEdit={() => handleEdit(account)}
                                            onDelete={() => confirmDelete(account.id)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredAndSortedAccounts.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            <AccountDialog 
                isOpen={modalOpen} 
                setIsOpen={setModalOpen} 
                editingAccount={editingAccount} 
                onSave={fetchAccounts} 
            />

            <DeleteModal
                isOpen={deleteModalOpen}
                setIsOpen={setDeleteModalOpen}
                onConfirm={executeDelete}
                isLoading={isDeleting}
                title="Delete Account"
                message="Are you sure you want to delete this payment account? This action cannot be undone."
            />
        </div>
    );
};

export default PaymentAccountIndex;
