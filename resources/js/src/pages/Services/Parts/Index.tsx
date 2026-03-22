import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { IconPlus, IconEdit, IconTrash, IconTools, IconSearch, IconLoader2, IconInfoCircle } from '@tabler/icons-react';
import { toast } from 'sonner';
import JobPartDialog from './JobPartDialog';
import { useTranslation } from 'react-i18next';
import FilterBar from '@/components/ui/FilterBar';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import ActionButtons from '@/components/ui/ActionButtons';
import { Badge } from '@/components/ui/badge';
import DeleteModal from '@/components/DeleteModal';
import TableSkeleton from '@/components/ui/TableSkeleton';

const JobPartIndex: React.FC = () => {
    const { t } = useTranslation();
    const [parts, setParts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPart, setSelectedPart] = useState<any>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    
    // Delete Modal state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [partToDelete, setPartToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // Search and Pagination state
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const fetchParts = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/services/parts');
            const data = await response.json();
            setParts(data);
        } catch (error) {
            toast.error('Failed to load parts catalog');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchParts();
    }, []);

    const handleEdit = (part: any) => {
        setSelectedPart(part);
        setDialogOpen(true);
    };

    const handleDeleteClick = (part: any) => {
        setPartToDelete(part);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!partToDelete) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/services/parts/${partToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
            });

            if (response.ok) {
                toast.success('Part deleted successfully');
                setDeleteDialogOpen(false);
                setPartToDelete(null);
                fetchParts();
            } else {
                const data = await response.json();
                toast.error(data.message || 'Failed to delete part');
            }
        } catch (error) {
            toast.error('Failed to delete part');
        } finally {
            setIsDeleting(false);
        }
    };

    // Derived data
    const filteredParts = useMemo(() => {
        if (!search) return parts;
        return parts.filter(p => 
            p.name.toLowerCase().includes(search.toLowerCase()) || 
            (p.code && p.code.toLowerCase().includes(search.toLowerCase())) ||
            (p.type && p.type.toLowerCase().includes(search.toLowerCase()))
        );
    }, [parts, search]);

    const totalPages = Math.ceil(filteredParts.length / itemsPerPage);
    const paginatedParts = filteredParts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div>
            <FilterBar 
                icon={<IconTools className="w-6 h-6 text-primary" />}
                title={t('installation_parts', 'Installation Parts')}
                description="Manage the master list of vehicle components for service attribution."
                search={search}
                setSearch={setSearch}
                onAdd={() => { setSelectedPart(null); setDialogOpen(true); }}
                addLabel="Add Part"
                onRefresh={fetchParts}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onClearFilters={() => setSearch('')}
            />

            {loading ? (
                <TableSkeleton columns={5} rows={10} />
            ) : filteredParts.length === 0 ? (
                <EmptyState 
                    isSearch={!!search}
                    searchTerm={search}
                    title="No Parts Found"
                    description={search ? "Adjust your search to find what you're looking for." : "Start by adding parts like Hood, Bumper, or Door."}
                    onAction={() => { setSelectedPart(null); setDialogOpen(true); }}
                    actionLabel="Add First Part"
                />
            ) : (
                <div className="bg-white dark:bg-black rounded-lg border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="table-hover w-full table">
                            <thead>
                                <tr>
                                    <th className="w-12 text-center">#</th>
                                    <th>{t('part_name', 'Part Name')}</th>
                                    <th>{t('code', 'Code')}</th>
                                    <th>{t('type', 'Type')}</th>
                                    <th className="text-center">{t('status', 'Status')}</th>
                                    <th className="text-right">{t('actions', 'Actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedParts.map((part, index) => (
                                    <tr key={part.id} className="group">
                                        <td className="text-center text-gray-400 text-xs font-medium">
                                            {(currentPage - 1) * itemsPerPage + index + 1}
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-200">
                                                    <IconTools size={16} />
                                                </div>
                                                <span className="font-semibold text-gray-900 dark:text-gray-100">{part.name}</span>
                                            </div>
                                        </td>
                                        <td>
                                            {part.code ? (
                                                <code className="text-[10px] bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-400 font-mono">
                                                    {part.code}
                                                </code>
                                            ) : (
                                                <span className="text-gray-300">---</span>
                                            )}
                                        </td>
                                        <td>
                                            {part.type ? (
                                                <Badge variant="outline" className="font-medium text-[10px] uppercase tracking-wider">
                                                    {part.type}
                                                </Badge>
                                            ) : (
                                                <span className="text-gray-300">---</span>
                                            )}
                                        </td>
                                        <td className="text-center">
                                            <Badge 
                                                size='sm'
                                                dot={true}
                                                variant={part.is_active ? 'success' : 'destructive'}>
                                                {part.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td className="text-right">
                                            <ActionButtons 
                                                onEdit={() => handleEdit(part)}
                                                onDelete={() => handleDeleteClick(part)}
                                                skipDeleteConfirm
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    
                        <Pagination 
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={filteredParts.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                    
                </div>
            )}

            <JobPartDialog 
                isOpen={dialogOpen} 
                setIsOpen={setDialogOpen} 
                part={selectedPart} 
                onSave={fetchParts} 
            />

            <DeleteModal 
                isOpen={deleteDialogOpen}
                setIsOpen={setDeleteDialogOpen}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
                title="Delete Part"
                message={`Are you sure you want to delete the part "${partToDelete?.name}"? This action cannot be undone.`}
            />
        </div>
    );
};

export default JobPartIndex;
