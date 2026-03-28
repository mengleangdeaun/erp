import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Hook to fetch all job cards
 */
export const useJobCards = (params?: { status?: string; search?: string; type?: string; branch_id?: number | null; from_date?: string | null; to_date?: string | null }) => {
    return useQuery({
        queryKey: ['job-cards', params],
        queryFn: async () => {
            const queryParams = new URLSearchParams();
            if (params?.status) queryParams.append('status', params.status);
            if (params?.search) queryParams.append('search', params.search);
            if (params?.type) queryParams.append('type', params.type);
            if (params?.branch_id) queryParams.append('branch_id', params.branch_id.toString());
            if (params?.from_date) queryParams.append('from_date', params.from_date);
            if (params?.to_date) queryParams.append('to_date', params.to_date);
            
            const response = await fetch(`/api/services/job-cards?${queryParams.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch job cards');
            return response.json();
        }
    });
};

/**
 * Hook to fetch a single job card detail
 */
export const useJobCard = (id: number | null) => {
    return useQuery({
        queryKey: ['job-card', id],
        queryFn: async () => {
            if (!id) return null;
            const response = await fetch(`/api/services/job-cards/${id}`);
            if (!response.ok) throw new Error('Failed to fetch job card details');
            return response.json();
        },
        enabled: !!id
    });
};

/**
 * Hook to update top-level job card details
 */
export const useUpdateJobCard = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
            const response = await fetch(`/api/services/job-cards/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
                body: JSON.stringify(updates),
            });
            if (!response.ok) throw new Error('Failed to update job card');
            return response.json();
        },
        onMutate: async ({ id, updates }) => {
            await queryClient.cancelQueries({ queryKey: ['job-card', id] });
            await queryClient.cancelQueries({ queryKey: ['job-cards'] });
            
            const previousJob = queryClient.getQueryData(['job-card', id]);
            
            queryClient.setQueryData(['job-card', id], (old: any) => ({
                ...old,
                ...updates
            }));

            return { previousJob };
        },
        onSuccess: () => {
            toast.success('Job Card updated successfully');
        },
        onError: (err: any, variables, context: any) => {
            if (context?.previousJob) {
                queryClient.setQueryData(['job-card', variables.id], context.previousJob);
            }
            toast.error(err.message || 'Failed to update job card');
        },
        onSettled: (data, error, variables) => {
            queryClient.invalidateQueries({ queryKey: ['job-cards'] });
            queryClient.invalidateQueries({ queryKey: ['job-card', variables.id] });
        },
    });
};

/**
 * Hook to update an item within a job card
 */
export const useUpdateJobCardItem = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ itemId, updates }: { itemId: number; updates: any }) => {
            const response = await fetch(`/api/services/job-cards/items/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
                body: JSON.stringify(updates),
            });
            if (!response.ok) throw new Error('Failed to update job card item');
            return response.json();
        },
        onMutate: async ({ itemId, updates }) => {
            // No specific job id here, so we invalidate and let the local state handle it in the component
            // But we can optimistically update the individual job card if we know which one it belongs to.
            // For now, invalidating is safest since components have their own local state.
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['job-card'] });
            queryClient.invalidateQueries({ queryKey: ['job-cards'] });
        },
        onError: () => {
            toast.error('Failed to update part status');
        }
    });
};

/**
 * Hook to add a material usage record
 */
export const useAddMaterialUsage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: {
            job_card_id: number;
            product_id: number;
            job_card_item_id?: number;
            spent_qty: number;
            is_damage?: boolean;
        }) => {
            const response = await fetch('/api/services/job-cards/material-usage', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Failed to add material usage');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['job-card'] });
            toast.success('Material added successfully');
        },
        onError: () => {
            toast.error('Failed to add material');
        }
    });
};

/**
 * Hook to update existing material usage
 */
export const useUpdateMaterialUsage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ usageId, ...updates }: { 
            usageId: number; 
            serial_id?: number | null;
            width_on_car?: number;
            height_on_car?: number;
            width_cut?: number;
            height_cut?: number;
            actual_qty?: number | string;
            is_damage?: boolean;
        }) => {
            const response = await fetch(`/api/services/job-cards/material-usage/${usageId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
                body: JSON.stringify(updates),
            });
            if (!response.ok) throw new Error('Failed to update material usage');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['job-card'] });
            toast.success('Material updated successfully');
        },
        onError: () => {
            toast.error('Failed to update material tracking');
        }
    });
};

/**
 * Hook to finalize a job card
 */
export const useCompleteJobCard = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const response = await fetch(`/api/services/job-cards/${id}/complete`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
            });
            if (!response.ok) throw new Error('Failed to complete job card');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['job-cards'] });
            queryClient.invalidateQueries({ queryKey: ['job-card'] });
            toast.success('Job Card finalized successfully');
        },
        onError: () => {
            toast.error('Failed to finalize job card');
        }
    });
};

/**
 * Hook to fetch employees (Technicians)
 */
export const useTechnicians = () => {
    return useQuery({
        queryKey: ['employees', 'technicians'],
        queryFn: async () => {
            const response = await fetch('/api/hr/employees?is_technician=1');
            if (!response.ok) throw new Error('Failed to fetch technicians');
            return response.json();
        }
    });
};

/**
 * Hook to fetch branch employees
 */
export const useBranchEmployees = (branchId?: number) => {
    return useQuery({
        queryKey: ['branch-employees', branchId],
        queryFn: async () => {
            const url = branchId ? `/api/hr/branch-employees?branch_id=${branchId}` : '/api/hr/branch-employees';
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch branch employees');
            return response.json();
        }
    });
};

/**
 * Hook to update branch employee status/technician flag
 */
export const useUpdateBranchEmployee = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ employeeId, updates }: { employeeId: number; updates: any }) => {
            const response = await fetch(`/api/hr/branch-employees/${employeeId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
                body: JSON.stringify(updates),
            });
            if (!response.ok) throw new Error('Failed to update branch employee');
            return response.json();
        },
        onMutate: async ({ employeeId, updates }) => {
            // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({ queryKey: ['branch-employees'] });

            // Snapshot the previous value
            const previousEmployees = queryClient.getQueryData(['branch-employees']);

            // Optimistically update to the new value
            queryClient.setQueriesData({ queryKey: ['branch-employees'] }, (old: any) => {
                if (!old) return old;
                // If the data is an array
                if (Array.isArray(old)) {
                    return old.map(emp => emp.id === employeeId ? { ...emp, ...updates } : emp);
                }
                // If the data is wrapped in a 'data' property (standard Laravel response)
                if (old.data && Array.isArray(old.data)) {
                    return {
                        ...old,
                        data: old.data.map((emp: any) => emp.id === employeeId ? { ...emp, ...updates } : emp)
                    };
                }
                return old;
            });

            return { previousEmployees };
        },
        onError: (err, variables, context: any) => {
            // If the mutation fails, use the context returned from onMutate to roll back
            if (context?.previousEmployees) {
                queryClient.setQueriesData({ queryKey: ['branch-employees'] }, context.previousEmployees);
            }
            toast.error('Failed to update employee');
        },
        onSettled: () => {
            // Always refetch after error or success to keep server sync
            queryClient.invalidateQueries({ queryKey: ['branch-employees'] });
            queryClient.invalidateQueries({ queryKey: ['employees'] });
        },
        onSuccess: () => {
            toast.success('Employee updated successfully');
        },
    });
};

/**
 * Hook to fetch available serials for a product
 */
export const useAvailableSerials = (productId: number | null, branchId?: number) => {
    return useQuery({
        queryKey: ['available-serials', productId, branchId],
        queryFn: async () => {
            if (!productId) return [];
            const queryParams = new URLSearchParams();
            if (branchId) queryParams.append('branch_id', branchId.toString());
            
            const response = await fetch(`/api/services/inventory/products/${productId}/serials?${queryParams.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch available serials');
            return response.json();
        },
        enabled: !!productId
    });
};

/**
 * Hook to fetch replacement types
 */
/**
 * Hook to fetch replacement types with pagination and search
 */
export const useReplacementTypes = (params: any = {}) => {
    return useQuery({
        queryKey: ['replacement-types', params],
        queryFn: async () => {
            const queryParams = new URLSearchParams();
            if (params.page) queryParams.append('page', params.page.toString());
            if (params.per_page) queryParams.append('per_page', params.per_page.toString());
            if (params.search) queryParams.append('search', params.search);
            if (params.status) queryParams.append('status', params.status);
            if (params.all) queryParams.append('all', 'true');

            const response = await fetch(`/api/services/replacement-types?${queryParams.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch replacement types');
            return response.json();
        }
    });
};

/**
 * Hook to create a replacement type
 */
export const useCreateReplacementType = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const response = await fetch('/api/services/replacement-types', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Failed to create replacement type');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['replacement-types'] });
            toast.success('Replacement type created successfully');
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to create replacement type');
        }
    });
};

/**
 * Hook to update a replacement type
 */
export const useUpdateReplacementType = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: any }) => {
            const response = await fetch(`/api/services/replacement-types/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Failed to update replacement type');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['replacement-types'] });
            toast.success('Replacement type updated successfully');
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to update replacement type');
        }
    });
};

/**
 * Hook to delete a replacement type
 */
export const useDeleteReplacementType = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const response = await fetch(`/api/services/replacement-types/${id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
            });
            if (!response.ok) throw new Error('Failed to delete replacement type');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['replacement-types'] });
            toast.success('Replacement type deleted successfully');
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to delete replacement type');
        }
    });
};

/**
 * Hook to create a replacement job
 */
export const useCreateReplacementJob = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ originalId, data }: { originalId: number; data: any }) => {
            const response = await fetch(`/api/services/job-cards/${originalId}/replacement`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Failed to create replacement job');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['job-cards'] });
            toast.success('Replacement Job Card created successfully');
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to create replacement job');
        }
    });
};
/**
 * Hook to fetch QC reports with pagination and search
 */
export const useJobCardQCReports = (params: any = {}) => {
    return useQuery({
        queryKey: ['job-card-qc-reports', params],
        queryFn: async () => {
            const queryParams = new URLSearchParams();
            if (params.page) queryParams.append('page', params.page.toString());
            if (params.per_page) queryParams.append('per_page', params.per_page.toString());
            if (params.search) queryParams.append('search', params.search);
            if (params.decision) queryParams.append('decision', params.decision);
            if (params.technician_id) queryParams.append('technician_id', params.technician_id.toString());
            if (params.has_damage) queryParams.append('has_damage', params.has_damage.toString());
            if (params.branch_id) queryParams.append('branch_id', params.branch_id.toString());
            if (params.qc_person_id) queryParams.append('qc_person_id', params.qc_person_id.toString());
            if (params.start_date) queryParams.append('start_date', params.start_date);
            if (params.end_date) queryParams.append('end_date', params.end_date);
            if (params.archived !== undefined) queryParams.append('archived', params.archived.toString());

            const response = await fetch(`/api/services/job-cards/qc?${queryParams.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch QC reports');
            return response.json();
        }
    });
};

/**
 * Hook to fetch detailed damage reports
 */
export const useJobCardDamages = (params: any = {}) => {
    return useQuery({
        queryKey: ['job-card-damages', params],
        queryFn: async () => {
            const queryParams = new URLSearchParams();
            if (params.page) queryParams.append('page', params.page.toString());
            if (params.per_page) queryParams.append('per_page', params.per_page.toString());
            if (params.search) queryParams.append('search', params.search);
            if (params.mistake_staff_id) queryParams.append('mistake_staff_id', params.mistake_staff_id.toString());
            if (params.reason_id) queryParams.append('reason_id', params.reason_id.toString());
            if (params.start_date) queryParams.append('start_date', params.start_date);
            if (params.end_date) queryParams.append('end_date', params.end_date);
            
            const response = await fetch(`/api/services/job-cards/damages?${queryParams.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch damage reports');
            return response.json();
        }
    });
};

/**
 * Hook to create a new QC Audit Report
 */
export const useCreateQCReport = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const response = await fetch('/api/services/job-cards/qc', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to save QC report');
            }
            return response.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['job-card-qc-reports'] });
            queryClient.invalidateQueries({ queryKey: ['job-card-damages'] });
            queryClient.invalidateQueries({ queryKey: ['job-card', data.job_card_id] });
            queryClient.invalidateQueries({ queryKey: ['job-cards'] });
            toast.success('QC Audit Report saved successfully');
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to save QC report');
        }
    });
};

/**
 * Hook to archive a QC Report
 */
export const useArchiveQCReport = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const response = await fetch(`/api/services/job-cards/qc/${id}/archive`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
            });
            if (!response.ok) throw new Error('Failed to archive report');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['job-card-qc-reports'] });
            toast.success('Report moved to archive');
        },
        onError: () => {
            toast.error('Failed to archive report');
        }
    });
};

/**
 * Hook to unarchive (restore) a QC Report
 */
export const useUnarchiveQCReport = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const response = await fetch(`/api/services/job-cards/qc/${id}/unarchive`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
            });
            if (!response.ok) throw new Error('Failed to restore report');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['job-card-qc-reports'] });
            toast.success('Report restored from archive');
        },
        onError: () => {
            toast.error('Failed to restore report');
        }
    });
};

/**
 * Hook to bulk archive QC Reports
 */
export const useBulkArchiveQCReport = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (ids: number[]) => {
            const response = await fetch('/api/services/job-cards/qc/bulk-archive', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
                body: JSON.stringify({ ids }),
            });
            if (!response.ok) throw new Error('Failed to archive selected reports');
            return response.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['job-card-qc-reports'] });
            toast.success(data.message || 'Selected reports archived');
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to archive selected reports');
        }
    });
};

/**
 * Hook to bulk unarchive (restore) QC Reports
 */
export const useBulkUnarchiveQCReport = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (ids: number[]) => {
            const response = await fetch('/api/services/job-cards/qc/bulk-unarchive', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
                body: JSON.stringify({ ids }),
            });
            if (!response.ok) throw new Error('Failed to restore selected reports');
            return response.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['job-card-qc-reports'] });
            toast.success(data.message || 'Selected reports restored');
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to restore selected reports');
        }
    });
};
