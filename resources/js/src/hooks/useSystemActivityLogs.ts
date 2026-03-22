import { useState, useCallback, useEffect } from 'react';
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

export const useSystemActivityLogs = () => {
    const [data, setData] = useState<SystemActivityLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(15);

    const fetchLogs = useCallback(async (p = 1, l = 15, filters = {}) => {
        setLoading(true);
        try {
            const res = await api.get(`/settings/system-logs`, {
                params: { 
                    page: p, 
                    limit: l, 
                    ...filters 
                }
            });
            setData(res.data.data || []);
            setTotal(res.data.total || 0);
            setPage(p);
            setPerPage(l);
        } catch (error) {
            console.error('Failed to fetch system logs', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteLogs = async (ids: number[]) => {
        setLoading(true);
        try {
            await api.delete('/settings/system-logs', { data: { ids } });
            return true;
        } catch (error) {
            console.error('Failed to delete logs', error);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const clearAllLogs = async () => {
        setLoading(true);
        try {
            await api.delete('/settings/system-logs', { data: { clear_all: true } });
            return true;
        } catch (error) {
            console.error('Failed to clear logs', error);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return { data, total, loading, page, perPage, fetchLogs, deleteLogs, clearAllLogs };
};
