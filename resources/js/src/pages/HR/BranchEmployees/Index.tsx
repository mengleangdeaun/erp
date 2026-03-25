import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { IconUser, IconTools, IconClock, IconCheck, IconX, IconBriefcase, IconArrowRight, IconSearch, IconInfoCircle } from '@tabler/icons-react';
import { toast } from 'sonner';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import { Badge } from '../../../components/ui/badge';
import { useBranchEmployees, useUpdateBranchEmployee } from '@/hooks/useJobCardData';
import { useHRBranches } from '@/hooks/useHRData';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { IconBuildingStore, IconPackage, IconUsers } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useFormatDate } from '@/hooks/useFormatDate';
import HighlightText from '@/components/ui/HighlightText';

const BranchEmployeeIndex = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { formatDate } = useFormatDate();
    const { data: branches = [], isLoading: loadingBranches } = useHRBranches();
    const [selectedBranchId, setSelectedBranchId] = useState<string | number | null>(null);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const { data: employees = [], isLoading: loadingEmployees, refetch } = useBranchEmployees(selectedBranchId ? Number(selectedBranchId) : undefined);
    const updateMutation = useUpdateBranchEmployee();

    // Set initial branch
    useEffect(() => {
        if (branches.length > 0 && !selectedBranchId) {
            setSelectedBranchId(branches[0].id);
        }
    }, [branches, selectedBranchId]);

    const isLoading = loadingBranches || loadingEmployees;

    // Reset pagination when search or branch changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search, selectedBranchId]);

    const handleToggleTechnician = (employeeId: number, isTechnician: boolean) => {
        updateMutation.mutate({ employeeId, updates: { is_technician: isTechnician } });
    };

    const handleToggleActive = (employeeId: number, isActive: boolean) => {
        updateMutation.mutate({ employeeId, updates: { is_active: isActive } });
    };

    const filteredEmployees = useMemo(() => {
        if (!search) return employees;
        const q = search.toLowerCase();
        return employees.filter((e: any) => 
            e.full_name?.toLowerCase().includes(q) ||
            e.employee_id?.toLowerCase().includes(q) ||
            e.designation?.name?.toLowerCase().includes(q)
        );
    }, [employees, search]);

    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
    const paginatedEmployees = filteredEmployees.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const branchOptions = useMemo(() => 
        branches.map((b: any) => ({ value: b.id, label: b.name, description: b.code })),
    [branches]);

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['hr-branches'] });
        if (selectedBranchId) {
            queryClient.invalidateQueries({ queryKey: ['branch-employees', Number(selectedBranchId)] });
        }
    };

    return (
        <div className="space-y-6">
            <FilterBar
                icon={<IconBriefcase className="w-6 h-6 text-primary" />}
                title={t('branch_employees_title')}
                description={t('branch_employees_desc')}
                search={search}
                setSearch={setSearch}
                onRefresh={handleRefresh}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Branch Selection Sidebar */}
                <Card className="lg:col-span-1 rounded-xl shadow-sm border-gray-100 dark:border-gray-800 h-fit sticky top-6">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                           <IconBuildingStore size={20} className="text-primary" />
                           {t('branch_label')}
                        </CardTitle>
                        <CardDescription>{t('select_branch_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <SearchableSelect
                            options={branchOptions}
                            value={selectedBranchId}
                            onChange={(val) => setSelectedBranchId(val)}
                            placeholder={t('select_branch_placeholder')}
                            loading={loadingBranches}
                        />
                        
                        {selectedBranchId && (
                            <div className="pt-4 border-t dark:border-gray-800 flex flex-col gap-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-medium">{t('total_staff_label')}</span>
                                    <Badge variant="secondary" className="rounded-full">{employees.length}</Badge>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-medium">{t('technicians_label')}</span>
                                    <Badge variant="outline" className="rounded-full border-primary/20 text-primary bg-primary/5">
                                        {employees.filter((e: any) => e.is_technician).length}
                                    </Badge>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Employee List Main Content */}
                <div className="lg:col-span-3">
                            {isLoading ? (
                                <TableSkeleton columns={5} rows={10} />
                            ) : !selectedBranchId ? (
                                <div className="p-20 text-center">
                                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                        <IconBuildingStore size={32} />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('select_branch_first')}</h3>
                                    <p className="text-gray-500 text-sm max-w-xs mx-auto mt-2">{t('select_branch_sidebar_desc')}</p>
                                </div>
                            ) : filteredEmployees.length === 0 ? (
                                <EmptyState 
                                    isSearch={!!search} 
                                    searchTerm={search} 
                                    onClearFilter={() => setSearch('')}
                                    title={t('no_employees_found_title')}
                                    description={search ? t('adjust_search_filters') : t('no_employees_branch_desc')}
                                />
                            ) : (
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b dark:border-gray-800">
                                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('employee_details_table_header')}</th>
                                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('designation_label')}</th>
                                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">
                                                <div className="flex items-center justify-center gap-1.5 cursor-help group">
                                                    {t('role_label')}
                                                    <Popover>
                                                        <PopoverTrigger asChild title={t('about_roles_title')}>
                                                            <IconInfoCircle size={14} className="text-gray-300 group-hover:text-primary transition-colors cursor-pointer" />
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-80 p-5 rounded-xl border-gray-100 dark:border-gray-800 shadow-2xl z-[100]">
                                                            <div className="space-y-4 text-left">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                                        <IconTools size={18} />
                                                                    </div>
                                                                    <h4 className="font-black text-xs uppercase tracking-widest">{t('active_tech_role_title')}</h4>
                                                                </div>
                                                                <p className="text-[11px] leading-relaxed text-gray-500 font-medium normal-case">
                                                                    {t('active_tech_role_desc')}
                                                                </p>
                                                                <div className="pt-3 border-t dark:border-gray-800 flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">
                                                                    <IconCheck size={12} />
                                                                    {t('enables_task_assignment_label')}
                                                                </div>
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>
                                            </th>
                                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                <div className="flex items-center gap-1.5 cursor-help group">
                                                    {t('status_label')}
                                                    <Popover>
                                                        <PopoverTrigger asChild title={t('about_status_title')}>
                                                            <IconInfoCircle size={14} className="text-gray-300 group-hover:text-primary transition-colors cursor-pointer" />
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-80 p-5 rounded-xl border-gray-100 dark:border-gray-800 shadow-2xl z-[100]">
                                                            <div className="space-y-4 text-left">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                                        <IconUser size={18} />
                                                                    </div>
                                                                    <h4 className="font-black text-xs uppercase tracking-widest">{t('employee_active_status_title')}</h4>
                                                                </div>
                                                                <p className="text-[11px] leading-relaxed text-gray-500 font-medium normal-case">
                                                                    {t('employee_active_status_desc')}
                                                                </p>
                                                                <div className="pt-3 border-t dark:border-gray-800 flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">
                                                                    <IconCheck size={12} />
                                                                    {t('system_wide_visibility_control_label')}
                                                                </div>
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>
                                            </th>
                                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">{t('updated_at_label')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                                        {paginatedEmployees.map((emp: any) => (
                                            <tr key={emp.id} className="hover:bg-gray-50/30 dark:hover:bg-gray-800/20 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary font-black shadow-inner">
                                                            {emp.full_name?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-gray-900 dark:text-gray-100">
                                                                <HighlightText text={emp.full_name} highlight={search} />
                                                            </div>
                                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                                                <HighlightText text={emp.employee_id} highlight={search} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <Badge variant="outline" className="rounded-lg border-gray-100 dark:border-gray-800 text-[10px] font-bold uppercase tracking-widest px-3">
                                                        <HighlightText text={emp.designation?.name || 'Staff'} highlight={search} />
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex justify-center flex-col items-center gap-2">
                                                        <Switch 
                                                            checked={!!emp.is_technician} 
                                                            onCheckedChange={(val) => handleToggleTechnician(emp.id, val)}
                                                            disabled={updateMutation.isPending}
                                                        />
                                                        <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${emp.is_technician ? 'text-primary' : 'text-gray-300'}`}>
                                                            {emp.is_technician ? t('active_tech_badge') : t('general_badge')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <Switch 
                                                            checked={!!emp.is_active} 
                                                            onCheckedChange={(val) => handleToggleActive(emp.id, val)}
                                                            disabled={updateMutation.isPending}
                                                        />
                                                        <Badge 
                                                        size='sm'
                                                        variant={emp.is_active ? 'success' : 'destructive'}>
                                                            {emp.is_active ? t('active') : t('inactive')}
                                                        </Badge>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                                        {formatDate(emp.updated_at)}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                        </div>
                           

                        {filteredEmployees.length > itemsPerPage && (
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    totalItems={filteredEmployees.length}
                                    itemsPerPage={itemsPerPage}
                                    onPageChange={setCurrentPage}
                                />
                        )}
                    </div>
 )}
                </div>
            </div>
        </div>
    );
};

export default BranchEmployeeIndex;
