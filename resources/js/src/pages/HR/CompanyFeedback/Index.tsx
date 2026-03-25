import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import HighlightText from '@/components/ui/HighlightText';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import DeleteModal from '../../../components/DeleteModal';
import ActionButtons from '../../../components/ui/ActionButtons';
import { Badge } from '../../../components/ui/badge';
import { IconMessageHeart, IconMessageChatbot  } from '@tabler/icons-react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';

const CompanyFeedbackIndex = () => {
    const { t } = useTranslation();
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
                toast.error(t('failed_fetch_feedbacks_msg'));
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
                toast.success(t('feedback_deleted_msg'));
                fetchData(currentPage);
            } else {
                toast.error(t('failed_delete_feedback_msg'));
            }
        } catch (error) {
            toast.error(t('failed_save_msg'));
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
                title={t('company_feedback_title')}
                description={t('company_feedback_desc')}
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
                onRefresh={() => fetchData(1)}
                hasActiveFilters={!!type}
                onClearFilters={() => setType('')}
            >
                <div className="space-y-1.5 flex flex-col w-full">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('feedback_type_label')}</span>
                    <Select value={type} onValueChange={setType}>
                        <SelectTrigger className="h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm transition-all focus:ring-primary">
                            <SelectValue placeholder={t('all_types_label')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="font-medium">{t('all_types_label')}</SelectItem>
                            <SelectItem value="positive" className="font-medium">{t('positive_label')}</SelectItem>
                            <SelectItem value="negative" className="font-medium">{t('negative_label')}</SelectItem>
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
                            title={t('no_feedbacks_found_title')}
                            description={t('no_feedbacks_found_desc')}
                        />
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 dark:bg-gray-800 border-y border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4">{t('date_label')}</th>
                                    <th className="px-6 py-4">{t('type_label')}</th>
                                    <th className="px-6 py-4">{t('feedback_message_label')}</th>
                                    <th className="px-6 py-4">{t('recommendation_label')}</th>
                                    <th className="px-6 py-4 text-right">{t('actions_label')}</th>
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
                                                {t(item.type + '_label')}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300 max-w-md">
                                            <div className="line-clamp-3" title={item.message}>
                                                <HighlightText text={item.message} highlight={search} />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400 max-w-md">
                                            <div className="line-clamp-3" title={item.recommendation}>
                                                <HighlightText text={item.recommendation} highlight={search} />
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
                title={t('delete_feedback_title')}
                message={t('delete_feedback_confirm')}
            />
        </div>
    );
};

export default CompanyFeedbackIndex;
