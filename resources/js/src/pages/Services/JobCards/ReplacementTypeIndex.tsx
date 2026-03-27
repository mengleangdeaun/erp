import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { IconSettings, IconPlus, IconPencil, IconTrash, IconCircleCheck, IconCircleX, IconLoader2, IconRefresh } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import FilterBar from '@/components/ui/FilterBar';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import HighlightText from '@/components/ui/HighlightText';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useReplacementTypes } from '@/hooks/useJobCardData';
import ReplacementTypeDialog from '@/pages/Services/JobCards/ReplacementTypeDialog';
import ActionButtons from '@/components/ui/ActionButtons';
import DeleteModal from '@/components/DeleteModal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import TableSkeleton from '@/components/ui/TableSkeleton';

const ReplacementTypeIndex: React.FC = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    
    // Pagination & Filters
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(15);

    // Replacement types query
    const { data: replacementData, isLoading, refetch } = useReplacementTypes({
        page: currentPage,
        per_page: perPage,
        search,
    });

    const types = replacementData?.data || [];
    const totalItems = replacementData?.total || 0;
    const totalPages = replacementData?.last_page || 1;

    const [selectedType, setSelectedType] = useState<any>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const response = await fetch(`/api/services/replacement-types/${id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
            });
            if (!response.ok) throw new Error('Failed to delete');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['replacement-types'] });
            toast.success('Deleted successfully');
            setDeleteModalOpen(false);
        }
    });

    return (
        <div className="space-y-6 pb-12">
            <FilterBar 
                icon={<IconSettings className="w-6 h-6 text-primary" />}
                title="Replacement Categories"
                description="Define common reasons for warranty and maintenance returns."
                search={search}
                setSearch={setSearch}
                onAdd={() => { setSelectedType(null); setDialogOpen(true); }}
                addLabel="Add Category"
                onRefresh={() => { queryClient.invalidateQueries({ queryKey: ['replacement-types'] }); }}
                itemsPerPage={perPage}
                setItemsPerPage={setPerPage}
            />

            {isLoading ? (
                <TableSkeleton columns={4} rows={5} />
            ) : types.length === 0 ? (
                <EmptyState 
                    isSearch={!!search}
                    searchTerm={search}
                    title={search ? 'No results found' : 'No categories defined'}
                    description={search ? "We couldn't find any categories matching your search." : "Start by adding common installation issues or maintenance types."}
                    onAction={() => { setSelectedType(null); setDialogOpen(true); }}
                    actionLabel="Add Category"
                    onClearFilter={() => setSearch('')}
                />
            ) : (
                <div className="panel bg-white dark:bg-gray-900 border-none shadow-sm overflow-hidden p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm font-medium">
                            <thead className="bg-gray-50 dark:bg-white-dark/5 text-gray-500 uppercase text-[10px] font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 text-left">Category Name</th>
                                    <th className="px-6 py-4 text-left">Description</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {types.map((type: any) => (
                                    <tr key={type.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 transition-colors group">
                                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-gray-100 uppercase tracking-tight">
                                            <HighlightText text={type.name} highlight={search} />
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            <HighlightText text={type.description || '-'} highlight={search} />
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge 
                                                variant={type.status === 'active' ? 'success' : 'destructive'} 
                                                className="uppercase text-[10px] font-black tracking-widest px-2.5"
                                            >
                                                {type.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <ActionButtons 
                                                onEdit={() => { setSelectedType(type); setDialogOpen(true); }}
                                                onDelete={() => { setSelectedType(type); setDeleteModalOpen(true); }}
                                                skipDeleteConfirm={true}
                                                size="sm"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!isLoading && totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={perPage}
                    onPageChange={setCurrentPage}
                />
            )}

            <ReplacementTypeDialog 
                isOpen={dialogOpen} 
                setIsOpen={setDialogOpen} 
                type={selectedType} 
                onSave={() => queryClient.invalidateQueries({ queryKey: ['replacement-types'] })} 
            />

            <DeleteModal 
                isOpen={deleteModalOpen}
                setIsOpen={setDeleteModalOpen}
                title="Delete Category"
                message={`Are you sure you want to delete "${selectedType?.name}"? This action cannot be undone.`}
                onConfirm={() => deleteMutation.mutate(selectedType?.id)}
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
};

export default ReplacementTypeIndex;
