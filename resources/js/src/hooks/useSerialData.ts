import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Hook to fetch serials with filters
 */
export const useSerials = (filters: any = {}) => {
    return useQuery({
        queryKey: ['serials', filters],
        queryFn: async () => {
            // Clean up filters: remove null, undefined, or 'all' strings
            const cleanFilters = Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => v !== null && v !== undefined && v !== 'all' && v !== '')
            );
            const queryParams = new URLSearchParams(cleanFilters as any);
            const response = await fetch(`/api/services/inventory/serials?${queryParams.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch serials');
            return response.json();
        }
    });
};

/**
 * Hook to fetch a single serial's details
 */
export const useSerial = (id: number | null) => {
    return useQuery({
        queryKey: ['serial', id],
        queryFn: async () => {
            const response = await fetch(`/api/services/inventory/serials/${id}`);
            if (!response.ok) throw new Error('Failed to fetch serial details');
            return response.json();
        },
        enabled: !!id
    });
};

/**
 * Hook to fetch consumption history for a serial
 */
export const useSerialHistory = (id: number | null) => {
    return useQuery({
        queryKey: ['serial-history', id],
        queryFn: async () => {
            const response = await fetch(`/api/services/inventory/serials/${id}/history`);
            if (!response.ok) throw new Error('Failed to fetch serial history');
            return response.json();
        },
        enabled: !!id
    });
};

/**
 * Hook to register a new serial
 */
export const useCreateSerial = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const response = await fetch('/api/services/inventory/serials', {
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
                throw new Error(error.message || 'Failed to register serial');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['serials'] });
            toast.success('Roll serial registered successfully');
        },
        onError: (error: any) => {
            toast.error(error.message);
        }
    });
};

/**
 * Hook to update a serial
 */
export const useUpdateSerial = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...updates }: { id: number; [key: string]: any }) => {
            const response = await fetch(`/api/services/inventory/serials/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
                body: JSON.stringify(updates),
            });
            if (!response.ok) throw new Error('Failed to update serial');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['serials'] });
            queryClient.invalidateQueries({ queryKey: ['serial'] });
            toast.success('Serial updated successfully');
        }
    });
};
