import { useState, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { Button } from '../../../components/ui/button';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import DeleteModal from '../../../components/DeleteModal';
import ActionButtons from '../../../components/ui/ActionButtons';
import SearchableMultiSelect from '../../../components/ui/SearchableMultiSelect';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { IconHierarchy } from '@tabler/icons-react';
import HighlightText from '@/components/ui/HighlightText';
import { useTranslation } from 'react-i18next';

const DepartmentIndex = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const [departments, setDepartments] = useState<any[]>([]);

    useEffect(() => {
        dispatch(setPageTitle(t('dept_title')));
    }, [dispatch, t]);
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Filter & Sort & Pagination state
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const initialFormState = {
        name: '',
        branch_ids: [] as string[],
        description: '',
        status: 'active',
        telegram_chat_id: '',
        telegram_topic_id: '',
    };

    const [formData, setFormData] = useState<{ name: string, branch_ids: string[], description: string, status: string, telegram_chat_id: string, telegram_topic_id: string }>(initialFormState);

    // Helper to get cookie
    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const fetchDepartments = () => {
        setLoading(true);
        fetch('/api/hr/departments', {
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
                    setDepartments(data);
                } else {
                    setDepartments([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setDepartments([]);
                setLoading(false);
            });
    };

    const fetchBranches = () => {
        fetch('/api/hr/branches', {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
            },
            credentials: 'include',
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setBranches(data);
                }
            })
            .catch(err => console.error(err));
    };

    useEffect(() => {
        fetchDepartments();
        fetchBranches();
    }, []);

    const handleCreate = () => {
        setEditingDepartment(null);
        setFormData(initialFormState);
        setModalOpen(true);
    };

    const handleEdit = (dept: any) => {
        setEditingDepartment(dept);
        setFormData({
            name: dept.name,
            branch_ids: dept.branches ? dept.branches.map((b: any) => String(b.id)) : [],
            description: dept.description || '',
            status: dept.status,
            telegram_chat_id: dept.telegram_chat_id || '',
            telegram_topic_id: dept.telegram_topic_id || '',
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
            const response = await fetch(`/api/hr/departments/${itemToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
                },
                credentials: 'include',
            });

            if (response.ok) {
                toast.success(t('success_delete_dept'));
                fetchDepartments();
            } else {
                toast.error(t('failed_delete_dept'));
            }
        } catch (error) {
            console.error(error);
            toast.error(t('error_occurred'));
        } finally {
            setIsDeleting(false);
            setDeleteModalOpen(false);
            setItemToDelete(null);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSelectChange = (value: string | string[], name: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const url = editingDepartment ? `/api/hr/departments/${editingDepartment.id}` : '/api/hr/departments';
        const method = editingDepartment ? 'PUT' : 'POST';

        try {
            // Ensure CSRF cookie is set
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
                toast.success(editingDepartment ? t('success_update_dept') : t('success_create_dept'));
                setModalOpen(false);
                fetchDepartments();
            } else {
                if (response.status === 401) {
                    window.location.href = '/login';
                }
                toast.error(data.message || (editingDepartment ? t('failed_update_dept') : t('failed_create_dept')));
            }
        } catch (error) {
            console.error(error);
            toast.error(t('error_occurred'));
        } finally {
            setIsSaving(false);
        }
    };

    // Derived state for table
    const filteredAndSortedDepartments = useMemo(() => {
        let result = [...departments];

        // Search
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(d =>
                d.name?.toLowerCase().includes(q) ||
                d.branches?.some((branch: any) => branch.name?.toLowerCase().includes(q))
            );
        }

        // Sort
        result.sort((a, b) => {
            let valA = sortBy === 'branch' ? (a.branches?.[0]?.name || '') : (a[sortBy] || '');
            let valB = sortBy === 'branch' ? (b.branches?.[0]?.name || '') : (b[sortBy] || '');
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [departments, search, sortBy, sortDirection]);

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedDepartments.length / itemsPerPage);
    const paginatedDepartments = filteredAndSortedDepartments.slice(
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
                icon={<IconHierarchy className="w-6 h-6 text-primary" />}
                title={t('dept_title')}
                description={t('dept_desc')}
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onAdd={handleCreate}
                addLabel={t('add_dept')}
                onRefresh={fetchDepartments}
                hasActiveFilters={sortBy !== 'name' || sortDirection !== 'asc'}
                onClearFilters={() => {
                    setSortBy('name');
                    setSortDirection('asc');
                }}
            />

            {loading ? (
                <TableSkeleton columns={4} rows={5} />
            ) : departments.length === 0 ? (
                <EmptyState
                    title={t('no_depts_found')}
                    description={t('start_adding_dept_desc')}
                    actionLabel={t('add_dept')}
                    onAction={handleCreate}
                />
            ) : filteredAndSortedDepartments.length === 0 ? (
                <EmptyState
                    isSearch
                    searchTerm={search}
                    onClearFilter={() => {
                        setSearch('');
                        setSortBy('name');
                        setSortDirection('asc');
                    }}
                />
            ) : (
                <div className="table-responsive bg-white dark:bg-black rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
                    <table className="table-hover table-striped w-full table">
                        <thead>
                            <tr>
                                <SortableHeader label={t('name_label')} value="name" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label={t('branch_label')} value="branch" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <SortableHeader label={t('status_label')} value="status" currentSortBy={sortBy} currentDirection={sortDirection} onSort={setSortBy} />
                                <th className="text-right">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedDepartments.map((dept: any) => (
                                <tr key={dept.id}>
                                    <td className="whitespace-nowrap font-medium">
                                        <HighlightText text={dept.name} highlight={search} />
                                    </td>
                                    <td>
                                        <div className="flex flex-wrap gap-1">
                                            {dept.branches && dept.branches.length > 0 ? (
                                                dept.branches.map((b: any) => (
                                                    <span key={`branch-${dept.id}-${b.id}`} className="text-xs text-gray-500 whitespace-nowrap">
                                                        <HighlightText text={b.name} highlight={search} />{dept.branches.length > 1 ? ',' : ''}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <Badge 
                                        dot={true}
                                        size='sm'
                                        variant={dept.status === 'active' ? 'success' : 'destructive'}>
                                            {dept.status === 'active' ? t('active') : t('inactive')}
                                        </Badge>
                                    </td>
                                    <td>
                                        <ActionButtons skipDeleteConfirm={true}
                                            onEdit={() => handleEdit(dept)}
                                            onDelete={() => confirmDelete(dept.id)}
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
                            totalItems={filteredAndSortedDepartments.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </div>
            )}

<Dialog open={modalOpen} onOpenChange={setModalOpen}>
  <DialogContent className="sm:max-w-[700px] w-[95vw] max-h-[90vh] h-auto flex flex-col p-0 border-0 shadow-2xl rounded-2xl overflow-hidden">
    {/* Header */}
    <div className="shrink-0 bg-gradient-to-r from-primary/10 to-transparent px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
      <div className="bg-primary/20 p-3 rounded-2xl shadow-sm">
        <IconHierarchy className="text-primary w-7 h-7" />
      </div>
      <div>
        <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
          {editingDepartment ? t('edit_dept_title') : t('create_dept_title')}
        </DialogTitle>
        <p className="text-sm text-gray-500 mt-1">
          {editingDepartment 
            ? t('update_dept_detail_desc') 
            : t('fill_dept_detail_desc')}
        </p>
      </div>
    </div>

    <PerfectScrollbar options={{ suppressScrollX: true }} className="flex-1 min-h-0">
      <form id="department-form" onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            {t('basic_info_title')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('dept_name_label')} <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder={t('dept_name_placeholder')}
                required
              />
            </div>
            <div className="space-y-0">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('branches_label')}
              </label>
              <SearchableMultiSelect
                options={branches.map((b: any) => ({
                  value: String(b.id),
                  label: b.name
                }))}
                value={formData.branch_ids}
                onChange={(val) => handleSelectChange(val, 'branch_ids')}
                placeholder={t('select_branches_placeholder')}
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            {t('additional_details_title')}
          </h3>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('description_label')}
            </label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder={t('dept_desc_placeholder')}
              rows={4}
              className="bg-gray-50 dark:bg-gray-800/50 resize-none"
            />
          </div>
        </div>

        {/* Telegram Notifications */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            {t('telegram_notifications_title')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('telegram_chat_id_label')} <span className="text-gray-400 text-xs">{t('optional_label')}</span>
              </label>
              <Input
                id="telegram_chat_id"
                name="telegram_chat_id"
                type="text"
                value={formData.telegram_chat_id}
                onChange={handleChange}
                placeholder="e.g. -100123456789"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('telegram_topic_id_label')} <span className="text-gray-400 text-xs">{t('optional_label')}</span>
              </label>
              <Input
                id="telegram_topic_id"
                name="telegram_topic_id"
                type="text"
                value={formData.telegram_topic_id}
                onChange={handleChange}
                placeholder="e.g. 123"
              />
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            {t('status_label')}
          </h3>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('status_label')} <span className="text-red-500">*</span>
            </label>
            <Select
              onValueChange={(value) => handleSelectChange(value, 'status')}
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
        form="department-form"
        disabled={isSaving}
        className="px-7 bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
      >
        {isSaving ? t('saving_dots') : (editingDepartment ? t('save_changes_btn_label') : t('create_dept_btn_label'))}
      </Button>
    </div>
  </DialogContent>
</Dialog>

            <DeleteModal
                isOpen={deleteModalOpen}
                setIsOpen={setDeleteModalOpen}
                onConfirm={executeDelete}
                isLoading={isDeleting}
                title={t('delete_dept_title')}
                message={t('delete_dept_message')}
            />
        </div>
    );
};

export default DepartmentIndex;
