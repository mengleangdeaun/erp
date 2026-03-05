import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { DatePicker } from '../../../components/ui/date-picker';
import { ScrollArea } from '../../../components/ui/scroll-area';
import FilterBar from '../../../components/ui/FilterBar';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import DeleteModal from '../../../components/DeleteModal';
import ActionButtons from '../../../components/ui/ActionButtons';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import MediaSelector, { MediaFile } from '../../../components/MediaSelector';
import { IconTrophy, IconCertificate, IconPhoto, IconX, IconExternalLink } from '@tabler/icons-react';

const toDateStr = (d: Date | undefined) => d ? d.toISOString().split('T')[0] : '';

const AwardIndex = () => {
    const [awards, setAwards] = useState<any[]>([]);
    const [awardTypes, setAwardTypes] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Media Selector state
    const [mediaSelectorOpen, setMediaSelectorOpen] = useState(false);
    const [activeUploadField, setActiveUploadField] = useState<'certificate' | 'photo' | null>(null);

    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const initialFormState = {
        employee_id: '',
        award_type_id: '',
        date: new Date().toISOString().split('T')[0],
        gift: '',
        description: '',
        certificate: '',
        photo: '',
    };
    const [formData, setFormData] = useState<any>(initialFormState);

    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const fetchData = () => {
        setLoading(true);
        Promise.all([
            fetch('/api/hr/awards', { headers: { 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' }, credentials: 'include' }).then(res => res.json()),
            fetch('/api/hr/award-types?compact=true', { headers: { 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' }, credentials: 'include' }).then(res => res.json()),
            fetch('/api/hr/employees?compact=true', { headers: { 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' }, credentials: 'include' }).then(res => res.json())
        ]).then(([awardsData, typesData, employeesData]) => {
            if (Array.isArray(awardsData)) setAwards(awardsData);
            if (Array.isArray(typesData)) setAwardTypes(typesData);
            if (Array.isArray(employeesData)) setEmployees(employeesData);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    };

    useEffect(() => { fetchData(); }, []);

    const handleCreate = () => {
        setEditingItem(null);
        setFormData(initialFormState);
        setModalOpen(true);
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setFormData({
            employee_id: item.employee_id,
            award_type_id: item.award_type_id,
            date: item.date,
            gift: item.gift || '',
            description: item.description || '',
            certificate: item.certificate || '',
            photo: item.photo || '',
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
            const response = await fetch(`/api/hr/awards/${itemToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
                },
                credentials: 'include',
            });
            if (response.ok) {
                toast.success('Award deleted');
                fetchData();
            } else {
                toast.error('Failed to delete award');
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
        setFormData((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSelectChange = (value: string | number, name: string) => {
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const url = editingItem ? `/api/hr/awards/${editingItem.id}` : '/api/hr/awards';
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
                toast.success(`Award ${editingItem ? 'updated' : 'created'}`);
                setModalOpen(false);
                fetchData();
            } else {
                toast.error(data.message || 'Error saving award');
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
        if (!search) return awards;
        const lowerSearch = search.toLowerCase();
        return awards.filter(item =>
            item.employee?.full_name?.toLowerCase().includes(lowerSearch) ||
            item.award_type?.name?.toLowerCase().includes(lowerSearch) ||
            (item.gift && item.gift.toLowerCase().includes(lowerSearch))
        );
    }, [awards, search]);

    const sortedItems = useMemo(() => {
        return [...filteredItem].sort((a, b) => {
            let aVal = a[sortBy]; let bVal = b[sortBy];
            if (sortBy === 'employee.full_name') { aVal = a.employee?.full_name; bVal = b.employee?.full_name; }
            if (sortBy === 'award_type.name') { aVal = a.award_type?.name; bVal = b.award_type?.name; }

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

    // Format employee options for SearchableSelect
    const employeeOptions = useMemo(() => {
        return employees.map(emp => ({ value: emp.id, label: `${emp.full_name} (${emp.employee_id})` }));
    }, [employees]);

    const openMediaSelector = (field: 'certificate' | 'photo') => {
        setActiveUploadField(field);
        setMediaSelectorOpen(true);
    };

    const handleMediaSelect = (file: MediaFile) => {
        if (activeUploadField) {
            setFormData((prev: any) => ({ ...prev, [activeUploadField]: file.url }));
        }
        setMediaSelectorOpen(false);
        setActiveUploadField(null);
    };

    return (
        <div>
            <FilterBar
                title="Employee Awards"
                description="Manage awards given to employees"
                search={search}
                setSearch={setSearch}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
                onAdd={handleCreate}
                addLabel="Give Award"
                onRefresh={fetchData}
            />

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <TableSkeleton columns={6} rows={5} />
                    ) : sortedItems.length === 0 ? (
                        <EmptyState
                            isSearch={!!search}
                            searchTerm={search}
                            onClearFilter={() => setSearch('')}
                            title="No Awards found"
                            description="Assign an award to an employee to get started."
                            actionLabel="Give Award"
                            onAction={handleCreate}
                        />
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 dark:bg-gray-800 border-y border-gray-100 dark:border-gray-700">
                                <tr>
                                    <SortableHeader label="Employee" value="employee.full_name" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <SortableHeader label="Award Type" value="award_type.name" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <SortableHeader label="Date" value="date" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <SortableHeader label="Gift" value="gift" currentSortBy={sortBy} currentDirection={sortDirection} onSort={handleSort} />
                                    <th className="px-6 py-4">Media</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {paginatedItems.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            <div className="flex items-center gap-3">
                                                {item.employee?.profile_image ? (
                                                    <img src={item.employee.profile_image} alt={item.employee.full_name} className="w-8 h-8 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                        {item.employee?.full_name?.charAt(0)}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-semibold">{item.employee?.full_name}</div>
                                                    <div className="text-xs text-gray-500">{item.employee?.employee_id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                            {item.award_type?.name || 'Unknown'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {new Date(item.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 max-w-[150px] truncate">{item.gift || '-'}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {item.certificate ? (
                                                    <a href={item.certificate} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 dark:bg-blue-900/30 dark:border-blue-800" title="View Certificate">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                                    </a>
                                                ) : <span className="w-8 h-8 flex items-center justify-center text-gray-300">-</span>}
                                                {item.photo ? (
                                                    <a href={item.photo} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 dark:bg-emerald-900/30 dark:border-emerald-800" title="View Photo">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                                    </a>
                                                ) : <span className="w-8 h-8 flex items-center justify-center text-gray-300">-</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <ActionButtons skipDeleteConfirm={true} onEdit={() => handleEdit(item)} onDelete={() => confirmDelete(item.id)} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
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

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[700px] w-[95vw] h-[90vh] flex flex-col p-0 border-0 shadow-2xl rounded-2xl overflow-hidden">
                    <div className="shrink-0 bg-gradient-to-r from-primary/10 to-transparent px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
                        <div className="bg-primary/20 p-3 rounded-2xl shadow-sm">
                            <IconTrophy className="text-primary w-7 h-7" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                                {editingItem ? 'Edit Award Details' : 'Grant New Award'}
                            </DialogTitle>
                            <p className="text-sm text-gray-500 mt-1">
                                {editingItem ? 'Update the details for this employee\'s award.' : 'Fill out the information below to recognize an employee.'}
                            </p>
                        </div>
                    </div>

                    <ScrollArea className="flex-1 min-h-0">
                        <form id="award-form" onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Award Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Employee <span className="text-red-500">*</span></label>
                                        <SearchableSelect
                                            options={employeeOptions}
                                            value={formData.employee_id}
                                            onChange={(val) => handleSelectChange(val, 'employee_id')}
                                            placeholder="Search employee..."
                                            searchPlaceholder="Type name to search..."
                                            emptyMessage="No employees found"
                                        />
                                    </div>
                                    <div className="space-y-2.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Award Type <span className="text-red-500">*</span></label>
                                        <Select onValueChange={(val) => handleSelectChange(val, 'award_type_id')} value={String(formData.award_type_id)}>
                                            <SelectTrigger><SelectValue placeholder="Select Award Type" /></SelectTrigger>
                                            <SelectContent>
                                                {loading ? (
                                                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                                                ) : awardTypes.length === 0 ? (
                                                    <SelectItem value="empty" disabled>No award types available</SelectItem>
                                                ) : (
                                                    awardTypes.map(type => <SelectItem key={type.id} value={String(type.id)}>{type.name}</SelectItem>)
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date Selected <span className="text-red-500">*</span></label>
                                        <DatePicker
                                            value={formData.date}
                                            onChange={(d) => setFormData((prev: any) => ({ ...prev, date: toDateStr(d) }))}
                                            placeholder="Select award date"
                                        />
                                    </div>
                                    <div className="space-y-2.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Gift / Item</label>
                                        <Input name="gift" value={formData.gift} onChange={handleChange} placeholder="e.g., $100 Bonus, Trophy" className="bg-gray-50 dark:bg-gray-800/50" />
                                    </div>
                                </div>

                                <div className="space-y-2.5">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Citation & Description</label>
                                    <Textarea name="description" value={formData.description} onChange={handleChange} placeholder="Why is this employee receiving this award?..." rows={3} className="bg-gray-50 dark:bg-gray-800/50 resize-none" />
                                </div>
                            </div>

                            <div className="space-y-4 pt-2">
                                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Media & Attachments</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Certificate Upload Box */}
                                    <div
                                        className={`relative group border-2 border-dashed rounded-xl p-5 transition-all duration-200 cursor-pointer ${formData.certificate ? 'border-primary/50 bg-primary/5' : 'border-gray-200 dark:border-gray-700 hover:border-primary/40 hover:bg-primary/5 dark:hover:bg-primary/10'}`}
                                        onClick={() => openMediaSelector('certificate')}
                                    >
                                        <div className="flex flex-col items-center justify-center text-center gap-3">
                                            <div className={`p-3 rounded-full transition-colors ${formData.certificate ? 'bg-primary/20 text-primary dark:text-primary' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 group-hover:bg-primary/10 group-hover:text-primary dark:group-hover:bg-primary/20'}`}>
                                                <IconCertificate stroke={1.5} size={28} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">Certificate Document</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {formData.certificate ? 'Click to change document' : 'Upload or select PDF/Image'}
                                                </p>
                                            </div>
                                        </div>
                                        {formData.certificate && (
                                            <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button type="button" variant="secondary" size="icon" className="h-7 w-7 rounded-full shadow-sm" onClick={(e) => { e.stopPropagation(); window.open(formData.certificate, '_blank'); }}>
                                                    <IconExternalLink className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />
                                                </Button>
                                                <Button type="button" variant="destructive" size="icon" className="h-7 w-7 rounded-full shadow-sm bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50" onClick={(e) => { e.stopPropagation(); handleSelectChange('', 'certificate'); }}>
                                                    <IconX className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Photo Upload Box */}
                                    <div
                                        className={`relative group border-2 border-dashed rounded-xl p-5 transition-all duration-200 cursor-pointer ${formData.photo ? 'border-emerald-500/50 bg-emerald-500/5 overflow-hidden' : 'border-gray-200 dark:border-gray-700 hover:border-emerald-500/40 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10'}`}
                                        onClick={() => openMediaSelector('photo')}
                                    >
                                        {formData.photo ? (
                                            <>
                                                <div className="absolute inset-0 z-0 opacity-15 bg-cover bg-center" style={{ backgroundImage: `url(${formData.photo})` }}></div>
                                                <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 backdrop-blur-[2px] z-0"></div>
                                            </>
                                        ) : null}
                                        <div className="relative z-10 flex flex-col items-center justify-center text-center gap-3">
                                            <div className={`p-3 rounded-full transition-colors ${formData.photo ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 group-hover:bg-emerald-100 group-hover:text-emerald-500 dark:group-hover:bg-emerald-900/30'}`}>
                                                <IconPhoto stroke={1.5} size={28} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">Event Photo</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {formData.photo ? 'Click to change photo' : 'Upload or select Image'}
                                                </p>
                                            </div>
                                        </div>
                                        {formData.photo && (
                                            <div className="absolute top-3 right-3 flex gap-1.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button type="button" variant="secondary" size="icon" className="h-7 w-7 rounded-full shadow-sm" onClick={(e) => { e.stopPropagation(); window.open(formData.photo, '_blank'); }}>
                                                    <IconExternalLink className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />
                                                </Button>
                                                <Button type="button" variant="destructive" size="icon" className="h-7 w-7 rounded-full shadow-sm bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50" onClick={(e) => { e.stopPropagation(); handleSelectChange('', 'photo'); }}>
                                                    <IconX className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </form>
                    </ScrollArea>

                    {/* Sticky Footer */}
                    <div className="shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-background">
                        <Button type="button" variant="ghost" className="px-5" onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button type="submit" form="award-form" disabled={isSaving} className="px-7 bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20">
                            {isSaving ? 'Processing...' : (editingItem ? 'Save Changes' : 'Grant Award')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <DeleteModal
                isOpen={deleteModalOpen}
                setIsOpen={setDeleteModalOpen}
                onConfirm={executeDelete}
                isLoading={isDeleting}
                title="Delete Award"
                message="Are you sure you want to delete this award record? This action cannot be undone."
            />

            <MediaSelector
                open={mediaSelectorOpen}
                onOpenChange={setMediaSelectorOpen}
                onSelect={handleMediaSelect}
                acceptedType={activeUploadField === 'photo' ? 'photo' : 'all'}
            />
        </div>
    );
};

export default AwardIndex;
