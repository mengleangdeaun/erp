import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';

/* ── CUSTOMERS ── */

export const useCRMCustomers = (params: any) => {
    return useQuery({
        queryKey: ['crm_customers', params],
        queryFn: async () => {
            const { data } = await api.get('/crm/customers', { params });
            return data;
        },
    });
};

export const useCRMCustomersMinimal = () => {
    return useQuery({
        queryKey: ['crm_customers_minimal'],
        queryFn: async () => {
            const { data } = await api.get('/crm/customers?all=true');
            return data;
        },
    });
};

export const useCRMCustomerTypes = () => {
    return useQuery({
        queryKey: ['crm_customer_types'],
        queryFn: async () => {
            const { data } = await api.get('/crm/customer-types');
            return data;
        },
    });
};

export const useCRMCustomerNextCode = () => {
    return useQuery({
        queryKey: ['crm_customer_next_code'],
        queryFn: async () => {
            const { data } = await api.get('/crm/customers/next-code');
            return data;
        },
        enabled: false,
        staleTime: 0,
        gcTime: 0,
    });
};

export const useCRMCreateCustomer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (customerData: any) => {
            const { data } = await api.post('/crm/customers', customerData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['crm_customers'] });
        },
    });
};

export const useCRMUpdateCustomer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data: customerData }: { id: number; data: any }) => {
            const { data } = await api.put(`/crm/customers/${id}`, customerData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['crm_customers'] });
        },
    });
};

export const useCRMDeleteCustomer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await api.delete(`/crm/customers/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['crm_customers'] });
        },
    });
};

/* ── CUSTOMER TYPES ── */

export const useCRMCustomerTypeCreate = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (typeData: any) => {
            const { data } = await api.post('/crm/customer-types', typeData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['crm_customer_types'] });
        },
    });
};

export const useCRMCustomerTypeUpdate = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data: typeData }: { id: number; data: any }) => {
            const { data } = await api.put(`/crm/customer-types/${id}`, typeData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['crm_customer_types'] });
        },
    });
};

export const useCRMCustomerTypeDelete = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await api.delete(`/crm/customer-types/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['crm_customer_types'] });
        },
    });
};

/* ── CUSTOMER VEHICLES ── */

export const useCRMCustomerVehicles = (params: any) => {
    return useQuery({
        queryKey: ['crm_customer_vehicles', params],
        queryFn: async () => {
            const { data } = await api.get('/crm/customer-vehicles', { params });
            return data;
        },
    });
};

export const useCRMVehicleBrands = () => {
    return useQuery({
        queryKey: ['crm_vehicle_brands'],
        queryFn: async () => {
            const { data } = await api.get('/services/vehicle-brands');
            return data;
        },
    });
};

export const useCRMVehicleModels = (brandId: number | null) => {
    return useQuery({
        queryKey: ['crm_vehicle_models', brandId],
        queryFn: async () => {
            const { data } = await api.get(`/services/vehicle-models?brand_id=${brandId}`);
            return data;
        },
        enabled: !!brandId,
    });
};

export const useCRMCreateVehicle = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (vehicleData: any) => {
            const { data } = await api.post('/crm/customer-vehicles', vehicleData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['crm_customer_vehicles'] });
        },
    });
};

export const useCRMUpdateVehicle = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data: vehicleData }: { id: number; data: any }) => {
            const { data } = await api.put(`/crm/customer-vehicles/${id}`, vehicleData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['crm_customer_vehicles'] });
        },
    });
};

export const useCRMDeleteVehicle = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await api.delete(`/crm/customer-vehicles/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['crm_customer_vehicles'] });
        },
    });
};
