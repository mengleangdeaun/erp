import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { IconSettings, IconPlus, IconPencil, IconTrash, IconCircleCheck, IconCircleX } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import FilterBar from '@/components/ui/FilterBar';
import EmptyState from '@/components/ui/EmptyState';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useReplacementTypes } from '@/hooks/useJobCardData';
import ReplacementTypeDialog from '@/pages/Services/JobCards/ReplacementTypeDialog';
import ActionButtons from '@/components/ui/ActionButtons';
import DeleteModal from '@/components/DeleteModal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const ReplacementTypeIndex: React.FC = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { data: types = [], isLoading, refetch } = useReplacementTypes();
    const [selectedType, setSelectedType] = useState<any>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [search, setSearch] = useState('');

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

    const filteredTypes = types.filter((type: any) => 
        type.name.toLowerCase().includes(search.toLowerCase()) ||
        type.description?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <FilterBar 
                icon={<IconSettings className="w-6 h-6 text-primary" />}
                title="Replacement Categories"
                description="Define common reasons for warranty and maintenance returns."
                search={search}
                setSearch={setSearch}
                onAdd={() => { setSelectedType(null); setDialogOpen(true); }}
                addLabel="Add Category"
                onRefresh={() => { refetch(); }}
                itemsPerPage={10}
                setItemsPerPage={() => {}}
            />

            {isLoading ? (
                <div className="p-8 text-center">Loading...</div>
            ) : filteredTypes.length === 0 ? (
                <EmptyState 
                    isSearch={!!search}
                    searchTerm={search}
                    title="No Categories Defined"
                    description="Start by adding common installation issues or maintenance types."
                />
            ) : (
                <div className="bg-white dark:bg-dark rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest">Name</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest">Description</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTypes.map((type: any) => (
                                <TableRow key={type.id} className="group">
                                    <TableCell className="font-bold text-gray-900 dark:text-white">{type.name}</TableCell>
                                    <TableCell className="text-gray-500 dark:text-gray-400">{type.description || '-'}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={type.status === 'active' ? 'success' : 'secondary'} className="uppercase text-[9px] font-black">
                                            {type.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <ActionButtons 
                                            onEdit={() => { setSelectedType(type); setDialogOpen(true); }}
                                            onDelete={() => { setSelectedType(type); setDeleteModalOpen(true); }}
                                            skipDeleteConfirm={true}
                                            size="sm"
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <ReplacementTypeDialog 
                isOpen={dialogOpen} 
                setIsOpen={setDialogOpen} 
                type={selectedType} 
                onSave={refetch} 
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
