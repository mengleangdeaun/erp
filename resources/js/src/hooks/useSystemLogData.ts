import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';

export interface SystemActivityLog {
    id: number;
    log_name: string;
    description: string;
    subject_type: string;
    subject_id: number;
    event: string;
    causer_type: string;
    causer_id: number;
    properties: any;
    created_at: string;
    updated_at: string;
    subject?: any;
    causer?: any;
}

export interface SystemLogsResponse {
    data: SystemActivityLog[];
    total: number;
    current_page: number;
    per_page: number;
    last_page: number;
}

export const useSystemLogs = (page: number, limit: number, filters: any = {}) => {
    return useQuery<SystemLogsResponse>({
        queryKey: ['system_logs', page, limit, filters],
        queryFn: async () => {
            const { data } = await api.get('/settings/system-logs', {
                params: {
                    page,
                    limit,
                    ...filters,
                },
            });
            return data;
        },
    });
};

export const useSystemLogsDelete = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (ids: number[]) => {
            const { data } = await api.delete('/settings/system-logs', { data: { ids } });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['system_logs'] });
        },
    });
};

export const useSystemLogsClear = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const { data } = await api.delete('/settings/system-logs', { data: { clear_all: true } });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['system_logs'] });
        },
    });
};
