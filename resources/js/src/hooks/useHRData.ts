import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// --- Fetchers ---

// Attendance
const fetchAttendanceRecords = async (filters: { start_date?: string; end_date?: string; employee_id?: string }) => {
    const { data } = await axios.get('/api/attendance/records', { params: filters });
    return Array.isArray(data) ? data : (data.data || []);
};

// Employees
const fetchEmployees = async (params?: any) => {
    const { data } = await axios.get('/api/hr/employees', { params });
    return data;
};

// Activities
const fetchActivities = async (params?: any) => {
    const { data } = await axios.get('/api/hr/activities', { params });
    return data;
};

// Announcements
const fetchAnnouncements = async () => {
    const { data } = await axios.get('/api/hr/announcements');
    return Array.isArray(data) ? data : (data.data || []);
};

// Leave Records
const fetchLeaveRecords = async () => {
    const { data } = await axios.get('/api/hr/leave-requests');
    return Array.isArray(data) ? data : (data.data || []);
};

// Leave Balances
const fetchLeaveBalances = async (params?: any) => {
    const { data } = await axios.get('/api/hr/leave-balances', { params });
    return Array.isArray(data) ? data : (data.data || []);
};

// Leave Allocations
const fetchLeaveAllocations = async () => {
    const { data } = await axios.get('/api/hr/leave-allocations');
    return Array.isArray(data) ? data : (data.data || []);
};

// Supporting Data
const fetchLeaveTypes = async () => {
    const { data } = await axios.get('/api/hr/leave-types');
    return Array.isArray(data) ? data : (data.data || []);
};

const fetchLeavePolicies = async () => {
    const { data } = await axios.get('/api/hr/leave-policies');
    return Array.isArray(data) ? data : (data.data || []);
};

const fetchDepartments = async () => {
    const { data } = await axios.get('/api/hr/departments');
    return Array.isArray(data) ? data : (data.data || []);
};

const fetchBranches = async () => {
    const { data } = await axios.get('/api/hr/branches');
    return Array.isArray(data) ? data : (data.data || []);
};

// --- Hooks ---

// Attendance
export const useAttendanceRecords = (filters: { start_date?: string; end_date?: string; employee_id?: string }) => {
    return useQuery({
        queryKey: ['attendance-records', filters],
        queryFn: () => fetchAttendanceRecords(filters),
        placeholderData: (previousData) => previousData,
    });
};

// Employees
export const useHREmployees = (params?: any) => {
    return useQuery({
        queryKey: ['hr-employees', params],
        queryFn: () => fetchEmployees(params),
        placeholderData: (previousData) => previousData,
    });
};

export const useHRFilterEmployees = (compact = false) => {
    return useQuery({
        queryKey: ['hr-employees-filter', compact],
        queryFn: () => fetchEmployees(compact ? { compact: true } : {}),
        staleTime: 5 * 60 * 1000,
    });
};

// Activities
export const useHRActivities = (params?: any) => {
    return useQuery({
        queryKey: ['hr-activities', params],
        queryFn: () => fetchActivities(params),
        placeholderData: (previousData) => previousData,
    });
};

// Announcements
export const useHRAnnouncements = () => {
    return useQuery({
        queryKey: ['hr-announcements'],
        queryFn: fetchAnnouncements,
    });
};

// Leave Records
export const useLeaveRecords = () => {
    return useQuery({
        queryKey: ['hr-leave-records'],
        queryFn: fetchLeaveRecords,
    });
};

// Leave Balances
export const useHRLeaveBalances = (params?: any) => {
    return useQuery({
        queryKey: ['hr-leave-balances', params],
        queryFn: () => fetchLeaveBalances(params),
        placeholderData: (previousData) => previousData,
    });
};

// Leave Allocations
export const useHRLeaveAllocations = () => {
    return useQuery({
        queryKey: ['hr-leave-allocations'],
        queryFn: fetchLeaveAllocations,
    });
};

// Supporting Data
export const useHRLeaveTypes = () => {
    return useQuery({
        queryKey: ['hr-leave-types'],
        queryFn: fetchLeaveTypes,
    });
};

export const useHRLeavePolicies = () => {
    return useQuery({
        queryKey: ['hr-leave-policies'],
        queryFn: fetchLeavePolicies,
    });
};

export const useHRDepartments = () => {
    return useQuery({
        queryKey: ['hr-departments'],
        queryFn: fetchDepartments,
    });
};

export const useHRBranches = () => {
    return useQuery({
        queryKey: ['hr-branches'],
        queryFn: fetchBranches,
    });
};

// --- Mutations ---

// Employees
export const useHREmployeeQr = () => {
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await axios.get(`/api/attendance/employee-qr/${id}`);
            return data;
        },
    });
};

export const useHRDeleteEmployee = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await axios.delete(`/api/hr/employees/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hr-employees'] });
            queryClient.invalidateQueries({ queryKey: ['hr-employees-filter'] });
        },
    });
};

// Activities
export const useHRUpdateActivityStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status, admin_note }: { id: number; status: string; admin_note: string }) => {
            const { data } = await axios.put(`/api/hr/activities/${id}/status`, { status, admin_note });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hr-activities'] });
        },
    });
};

export const useHRDeleteActivity = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await axios.delete(`/api/hr/activities/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hr-activities'] });
        },
    });
};

// Announcements
export const useHRUpdateAnnouncementStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, is_published }: { id: number; is_published: boolean }) => {
            const { data } = await axios.put(`/api/hr/announcements/${id}`, { is_published });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hr-announcements'] });
        },
    });
};

export const useHRDeleteAnnouncement = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await axios.delete(`/api/hr/announcements/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hr-announcements'] });
        },
    });
};

// Leave Records (Existing)
export const useApproveLeave = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await axios.post(`/api/hr/leave-requests/${id}/approve`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hr-leave-records'] });
        },
    });
};

export const useRejectLeave = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
            const { data } = await axios.post(`/api/hr/leave-requests/${id}/reject`, { rejection_reason: reason });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hr-leave-records'] });
        },
    });
};

export const useDeleteLeaveRecord = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await axios.delete(`/api/hr/leave-requests/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hr-leave-records'] });
        },
    });
};

// Leave Balances
export const useHROpsLeaveBalance = (isEditing: boolean) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...payload }: any) => {
            const url = isEditing ? `/api/hr/leave-balances/${id}` : '/api/hr/leave-balances';
            const method = isEditing ? 'put' : 'post';
            const { data } = await axios[method](url, payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hr-leave-balances'] });
        },
    });
};

// Leave Allocations
export const useHRDeleteLeaveAllocation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await axios.delete(`/api/hr/leave-allocations/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hr-leave-allocations'] });
        },
    });
};

export const useHROpsLeaveAllocation = (isEditing: boolean) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...payload }: any) => {
            const url = isEditing ? `/api/hr/leave-allocations/${id}` : '/api/hr/leave-allocations';
            const method = isEditing ? 'put' : 'post';
            const { data } = await axios[method](url, payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hr-leave-allocations'] });
        },
    });
};
