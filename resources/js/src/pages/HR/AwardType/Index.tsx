import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { IconAward } from '@tabler/icons-react';
import HighlightText from '@/components/ui/HighlightText';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import DeleteModal from '../../../components/DeleteModal';
import ActionButtons from '../../../components/ui/ActionButtons';
import { Badge } from '../../../components/ui/badge';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';

const AwardTypeIndex = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const [awardTypes, setAwardTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const initialFormState = {
        name: '',
        status: 'active',
        description: '',
    };
    const [formData, setFormData] = useState(initialFormState);

    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    useEffect(() => {
        dispatch(setPageTitle(t('award_types_title')));
    }, [dispatch, t]);

    const fetchAwardTypes = () => {
        setLoading(true);
        fetch('/api/hr/award-types', {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
            },
            credentials: 'include',
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setAwardTypes(data);
                else setAwardTypes([]);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setAwardTypes([]);
                setLoading(false);
            });
    };

    useEffect(() => { fetchAwardTypes(); }, []);

    const handleCreate = () => {
        setEditingItem(null);
        setFormData(initialFormState);
        setModalOpen(true);
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            status: item.status,
            description: item.description || '',
        });
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
            const response = await fetch(`/api/hr/award-types/${itemToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
                },
                credentials: 'include',
            });
            if (response.ok) {
                toast.success(t('award_type_deleted_msg'));
                fetchAwardTypes();
            } else {
                toast.error(t('failed_delete_award_type_msg'));
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setIsDeleting(false);
            setDeleteModalOpen(false);
            setItemToDelete(null);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSelectChange = (value: string, name: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const url = editingItem ? `/api/hr/award-types/${editingItem.id}` : '/api/hr/award-types';
        const method = editingItem ? 'PUT' : 'POST';

        try {
            await fetch('/sanctum/csrf-cookie');
            const response = await fetch(url, {
                method,
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
                toast.success(`${t('award_types_title')} ${editingItem ? t('update') : t('create')}`);
                setModalOpen(false);
                fetchAwardTypes();
            } else {
                toast.error(data.message || t('failed_save_award_type_msg'));
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSort = (column: string) => {
        if (sortBy === column) setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        else { setSortBy(column); setSortDirection('asc'); }
    };

    const filteredItem = useMemo(() => {
        if (!search) return awardTypes;
        const lowerSearch = search.toLowerCase();
        return awardTypes.filter(item =>
            item.name.toLowerCase().includes(lowerSearch) ||
            (item.description && item.description.toLowerCase().includes(lowerSearch))
        );
    }, [awardTypes, search]);

    const sortedItems = useMemo(() => {
        return [...filteredItem].sort((a, b) => {
            let aVal = a[sortBy]; let bVal = b[sortBy];
            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();
            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredItem, sortBy, sortDirection]);

    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return sortedItems.slice(start, start + itemsPerPage);
    }, [sortedItems, currentPage, itemsPerPage]);

    return (
        <div>
            <FilterBar
                icon={<IconAward className="w-6 h-6 text-primary" />}
                title={t('award_types_title')}
                description={t('award_types_desc')}
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
                onAdd={handleCreate}
                addLabel={t('award_types_add')}
                onRefresh={fetchAwardTypes}
            />

                    {loading ? (
                        <TableSkeleton columns={4} rows={5} />
                    ) : sortedItems.length === 0 ? (
                        <EmptyState
                            isSearch={!!search}
                            searchTerm={search}
                            onClearFilter={() => setSearch('')}
                            title={t('no_award_types_found_title')}
                            description={t('create_award_type_desc')}
                            actionLabel={t('award_types_add')}
                            onAction={handleCreate}
                        />
                    ) : (
            <div className="rounded-lg shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs bg-gray-50 dark:bg-gray-950 text-gray-500 uppercase border-y">
                                <tr>
                                    <SortableHeader label={t('name_label')} value="name" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <th className="px-6 py-4">{t('status_label')}</th>
                                    <th className="px-6 py-4">{t('description_label')}</th>
                                    <th className="px-6 py-4 text-right">{t('actions_label')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {paginatedItems.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            <HighlightText text={item.name} highlight={search} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge 
                                            size='sm'
                                            variant={item.status === 'active' ? 'success' : 'destructive'}>
                                                {item.status === 'active' ? t('active') : t('inactive')}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{item.description || '-'}</td>
                                        <td className="px-6 py-4">
                                            <ActionButtons skipDeleteConfirm={true} onEdit={() => handleEdit(item)} onDelete={() => confirmDelete(item.id)} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    
                </div>
                {!loading && sortedItems.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(sortedItems.length / itemsPerPage)}
                        totalItems={sortedItems.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                )}
            </div>
            )}

<Dialog open={modalOpen} onOpenChange={setModalOpen}>
  <DialogContent className="sm:max-w-[700px] w-[95vw] max-h-[90vh] h-auto flex flex-col p-0 border-0 shadow-2xl rounded-2xl overflow-hidden">
    {/* Header */}
    <div className="shrink-0 bg-gradient-to-r from-primary/10 to-transparent px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
      <div className="bg-primary/20 p-3 rounded-2xl shadow-sm">
        <IconAward className="text-primary w-7 h-7" />
      </div>
      <div>
        <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
          {editingItem ? t('edit_award_type_title') : t('create_award_type_title')}
        </DialogTitle>
        <p className="text-sm text-gray-500 mt-1">
          {editingItem 
            ? t('update_award_type_detail_desc') 
            : t('fill_award_type_detail_desc')}
        </p>
      </div>
    </div>

    <PerfectScrollbar options={{ suppressScrollX: true }} className="flex-1 min-h-0">
      <form id="award-type-form" onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            {t('basic_info_title')}
          </h3>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('award_type_name_label')} <span className="text-red-500">*</span>
            </label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Employee of the Month, Excellence Award"
              required
            />
          </div>
        </div>

        {/* Additional Details */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            {t('additional_details_title')}
          </h3>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('description_label')}
            </label>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder={t('award_type_desc_placeholder')}
              rows={4}
              className="bg-gray-50 dark:bg-gray-800/50 resize-none"
            />
          </div>
        </div>

        {/* Status */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            {t('status_label')}
          </h3>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('status_label')}
            </label>
            <Select
              onValueChange={(val) => handleSelectChange(val, 'status')}
              value={formData.status}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('select_status_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t('active')}</SelectItem>
                <SelectItem value="inactive">{t('inactive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </form>
    </PerfectScrollbar>

    {/* Sticky Footer */}
    <div className="shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-background">
      <Button
        type="button"
        variant="ghost"
        className="px-5"
        onClick={() => setModalOpen(false)}
      >
        {t('cancel_btn_label')}
      </Button>
      <Button
        type="submit"
        form="award-type-form"
        disabled={isSaving}
        className="px-7 bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
      >
        {isSaving ? t('saving_label') : (editingItem ? t('save_changes_btn_label') : t('create_award_type_btn'))}
      </Button>
    </div>
  </DialogContent>
</Dialog>

            <DeleteModal
                isOpen={deleteModalOpen}
                setIsOpen={setDeleteModalOpen}
                onConfirm={executeDelete}
                isLoading={isDeleting}
                title={t('delete_award_type_title')}
                message={t('delete_award_type_confirm')}
            />
        </div>
    );
};

export default AwardTypeIndex;
