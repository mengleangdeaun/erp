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

const JobPartIndex: React.FC = () => {
    const { t } = useTranslation();
    const [parts, setParts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPart, setSelectedPart] = useState<any>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    
    // Search and Pagination state
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);

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

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this part?')) return;

        try {
            const response = await fetch(`/api/services/parts/${id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
            });

            if (response.ok) {
                toast.success('Part deleted successfully');
                fetchParts();
            } else {
                const data = await response.json();
                toast.error(data.message || 'Failed to delete part');
            }
        } catch (error) {
            toast.error('Failed to delete part');
        }
    };

    // Derived data
    const filteredParts = useMemo(() => {
        if (!search) return parts;
        return parts.filter(p => 
            p.name.toLowerCase().includes(search.toLowerCase()) || 
            p.type.toLowerCase().includes(search.toLowerCase())
        );
    }, [parts, search]);

    const totalPages = Math.ceil(filteredParts.length / itemsPerPage);
    const paginatedParts = filteredParts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="space-y-6">
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
            />

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, index) => (
                        <div key={index} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 animate-pulse h-32"></div>
                    ))}
                </div>
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
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {paginatedParts.map((part) => (
                            <div 
                                key={part.id} 
                                className="group relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
                            >
                                <div className="p-5">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-200">
                                                <IconTools size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                                    {part.name}
                                                </h3>
                                                <Badge variant="outline" className="mt-1 font-medium text-[10px] uppercase tracking-wider">
                                                    {part.type}
                                                </Badge>
                                            </div>
                                        </div>
                                        <ActionButtons 
                                            onEdit={() => handleEdit(part)}
                                            onDelete={() => handleDelete(part.id)}
                                            skipDeleteConfirm
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                        />
                                    </div>
                                    
                                    <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <IconInfoCircle size={12} />
                                            ID: {part.id}
                                        </span>
                                        <span className={part.is_active ? 'text-green-500' : 'text-red-400'}>
                                            {part.is_active ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="mt-8">
                            <Pagination 
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={filteredParts.length}
                                itemsPerPage={itemsPerPage}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </>
            )}

            <JobPartDialog 
                isOpen={dialogOpen} 
                setIsOpen={setDialogOpen} 
                part={selectedPart} 
                onSave={fetchParts} 
            />
        </div>
    );
};

export default JobPartIndex;
