import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { toast } from 'sonner';

/* ────────────────────────────────────────
   TYPES
──────────────────────────────────────── */
export interface MediaFolder {
    id: number;
    name: string;
    color: string;
    parent_id: number | null;
    children_recursive: MediaFolder[];
}

export interface MediaFile {
    id: number;
    name: string;
    extension: string;
    file_type: 'photo' | 'video' | 'audio' | 'document' | 'other';
    size_bytes: number;
    size_human: string;
    mime_type: string;
    url: string;
    folder_id: number | null;
    created_at: string;
    is_favorite: boolean;
    disk: string;
    user?: { id: number; name: string; avatar?: string };
}

export interface StorageInfo {
    used_bytes: number;
    used_human: string;
    limit_mb: number;
    limit_bytes: number;
    used_pct: number;
    unlimited: boolean;
}

/* ────────────────────────────────────────
   QUERIES
──────────────────────────────────────── */
export const useMediaFolders = () => {
    return useQuery<MediaFolder[]>({
        queryKey: ['media_folders'],
        queryFn: async () => {
            const res = await api.get('/media/folders');
            return Array.isArray(res.data) ? res.data : [];
        },
        staleTime: 5 * 60 * 1000,
    });
};

export const useMediaFiles = (params: {
    folder_id?: number | null;
    file_type?: string;
    search?: string;
    page?: number;
    per_page?: number;
    favorites?: boolean;
}) => {
    return useQuery<{
        data: MediaFile[];
        last_page: number;
        total: number;
        current_page: number;
    }>({
        queryKey: ['media_files', params],
        queryFn: async () => {
            const res = await api.get('/media/files', { params });
            return {
                data: Array.isArray(res.data?.data) ? res.data.data : [],
                last_page: res.data?.last_page || 1,
                total: res.data?.total || 0,
                current_page: res.data?.current_page || 1,
            };
        },
        staleTime: 2 * 60 * 1000,
    });
};

export const useMediaStorageInfo = () => {
    return useQuery<StorageInfo>({
        queryKey: ['media_storage_info'],
        queryFn: async () => {
            const res = await api.get('/media/storage-info');
            return res.data;
        },
    });
};

export const useMediaStorageSettings = () => {
    return useQuery<any[]>({
        queryKey: ['media_storage_settings'],
        queryFn: async () => {
            const res = await api.get('/settings/storage');
            return Array.isArray(res.data) ? res.data : [];
        },
    });
};

/* ────────────────────────────────────────
   MUTATIONS
──────────────────────────────────────── */

// Folder Mutations
export const useCreateMediaFolder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { name: string; parent_id: number | null; color: string }) =>
            api.post('/media/folders', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['media_folders'] });
        },
    });
};

export const useUpdateMediaFolder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: { id: number; name: string; color: string }) =>
            api.put(`/media/folders/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['media_folders'] });
            queryClient.invalidateQueries({ queryKey: ['media_files'] });
        },
    });
};

export const useDeleteMediaFolder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => api.delete(`/media/folders/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['media_folders'] });
            queryClient.invalidateQueries({ queryKey: ['media_files'] });
        },
    });
};

// File Mutations
export const useUploadMediaFile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: FormData) =>
            api.post('/media/files/upload', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['media_files'] });
            queryClient.invalidateQueries({ queryKey: ['media_storage_info'] });
        },
    });
};

export const useUpdateMediaFile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: { id: number; name?: string; folder_id?: number | null }) =>
            api.put(`/media/files/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['media_files'] });
            queryClient.invalidateQueries({ queryKey: ['media_folders'] });
        },
    });
};

export const useDeleteMediaFile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => api.delete(`/media/files/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['media_files'] });
            queryClient.invalidateQueries({ queryKey: ['media_storage_info'] });
        },
    });
};

export const useToggleMediaFavorite = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => api.put(`/media/files/${id}/favorite`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['media_files'] });
        },
    });
};

export const useUpdateStorageSettings = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ provider, ...data }: { provider: string; is_active: boolean; credentials?: any }) =>
            api.put(`/settings/storage/${provider}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['media_storage_settings'] });
            queryClient.invalidateQueries({ queryKey: ['media_storage_info'] });
        },
    });
};
