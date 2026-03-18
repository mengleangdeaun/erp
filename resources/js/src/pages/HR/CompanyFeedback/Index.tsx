import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import DeleteModal from '../../../components/DeleteModal';
import ActionButtons from '../../../components/ui/ActionButtons';
import { Badge } from '../../../components/ui/badge';
import { IconMessageHeart, IconMessageChatbot  } from '@tabler/icons-react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';

const CompanyFeedbackIndex = () => {
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [type, setType] = useState<string>('');
    const [search, setSearch] = useState('');

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const fetchData = (page = 1) => {
        setLoading(true);
        fetch(`/api/hr/company-feedbacks?page=${page}&per_page=${itemsPerPage}&type=${type}`, {
            headers: {
                'Accept': 'application/json',
                'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || ''
            },
            credentials: 'include'
        })
            .then(res => res.json())
            .then(data => {
                setFeedbacks(data.data || []);
                setCurrentPage(data.current_page || 1);
                setLastPage(data.last_page || 1);
                setTotalItems(data.total || 0);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                toast.error('Failed to fetch feedbacks');
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchData(currentPage);
    }, [currentPage, itemsPerPage, type]);

    const confirmDelete = (id: number) => {
        setItemToDelete(id);
        setDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/hr/company-feedbacks/${itemToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
                },
                credentials: 'include',
            });
            if (response.ok) {
                toast.success('Feedback deleted');
                fetchData(currentPage);
            } else {
                toast.error('Failed to delete feedback');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setIsDeleting(false);
            setDeleteModalOpen(false);
            setItemToDelete(null);
        }
    };

    const filteredItems = useMemo(() => {
        if (!search) return feedbacks;
        const lowerSearch = search.toLowerCase();
        return feedbacks.filter(item =>
            item.message?.toLowerCase().includes(lowerSearch) ||
            item.recommendation?.toLowerCase().includes(lowerSearch)
        );
    }, [feedbacks, search]);

    return (
        <div>
            <FilterBar
                icon={<IconMessageChatbot className="w-6 h-6 text-primary" />}
                title="Company Feedback"
                description="View anonymous feedback and recommendations from employees"
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
                onRefresh={() => fetchData(1)}
                hasActiveFilters={!!type}
                onClearFilters={() => setType('')}
            >
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 font-medium whitespace-nowrap">Type:</span>
                    <Select value={type} onValueChange={setType}>
                        <SelectTrigger className="h-10 w-[140px] shadow-sm">
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="positive">Positive</SelectItem>
                            <SelectItem value="negative">Negative</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </FilterBar>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <TableSkeleton columns={4} rows={5} />
                    ) : filteredItems.length === 0 ? (
                        <EmptyState
                            isSearch={!!search}
                            searchTerm={search}
                            onClearFilter={() => setSearch('')}
                            title="No Feedbacks found"
                            description="Feedback submitted by employees will appear here."
                        />
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 dark:bg-gray-800 border-y border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Feedback Message</th>
                                    <th className="px-6 py-4">Recommendation</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredItems.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                            {new Date(item.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge 
                                            size='sm'
                                            variant={item.type === 'positive' ? 'success' : 'destructive'}>
                                                {item.type}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300 max-w-md">
                                            <div className="line-clamp-3" title={item.message}>
                                                {item.message}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400 max-w-md">
                                            <div className="line-clamp-3" title={item.recommendation}>
                                                {item.recommendation || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <ActionButtons
                                                skipDeleteConfirm={true}
                                                onDelete={() => confirmDelete(item.id)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                {!loading && totalItems > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={lastPage}
                        totalItems={totalItems}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                )}
            </div>

            <DeleteModal
                isOpen={deleteModalOpen}
                setIsOpen={setDeleteModalOpen}
                onConfirm={executeDelete}
                isLoading={isDeleting}
                title="Delete Feedback"
                message="Are you sure you want to delete this feedback record? This action cannot be undone."
            />
        </div>
    );
};

export default CompanyFeedbackIndex;
