import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// Basic Fetchers
const fetchCustomers = async () => {
    const { data } = await axios.get('/api/crm/customers?all=true');
    return Array.isArray(data) ? data : (data.data || []);
};

const fetchServices = async (branchId: number | null) => {
    const url = `/api/services/list?all=true${branchId ? `&branch_id=${branchId}` : ''}`;
    const { data } = await axios.get(url);
    return Array.isArray(data) ? data : (data.data || []);
};

const fetchProducts = async (branchId: number | null) => {
    const url = `/api/inventory/products?all=true${branchId ? `&branch_id=${branchId}` : ''}`;
    const { data } = await axios.get(url);
    return Array.isArray(data) ? data : (data.data || []);
};

const fetchBranches = async () => {
    const { data } = await axios.get('/api/hr/branches');
    return Array.isArray(data) ? data : (data.data || []);
};

const fetchBrands = async () => {
    const { data } = await axios.get('/api/services/vehicle-brands');
    return data;
};

const fetchCategories = async () => {
    const { data } = await axios.get('/api/inventory/categories');
    return data;
};

const fetchPaymentAccounts = async () => {
    const { data } = await axios.get('/api/finance/payment-accounts?all=true');
    return data;
};

const fetchCustomerVehicles = async (customerId: number | null) => {
    if (!customerId) return [];
    const { data } = await axios.get(`/api/crm/customer-vehicles?customer_id=${customerId}`);
    return data;
};

// Custom Hooks
export const useCustomers = () => {
    return useQuery({
        queryKey: ['customers'],
        queryFn: fetchCustomers,
    });
};

export const useServices = (branchId: number | null) => {
    return useQuery({
        queryKey: ['services', branchId],
        queryFn: () => fetchServices(branchId),
    });
};

export const useProducts = (branchId: number | null) => {
    return useQuery({
        queryKey: ['products', branchId],
        queryFn: () => fetchProducts(branchId),
    });
};

export const useBranches = () => {
    return useQuery({
        queryKey: ['branches'],
        queryFn: fetchBranches,
    });
};

export const useBrands = () => {
    return useQuery({
        queryKey: ['brands'],
        queryFn: fetchBrands,
    });
};

export const useCategories = () => {
    return useQuery({
        queryKey: ['categories'],
        queryFn: fetchCategories,
    });
};

export const usePaymentAccounts = () => {
    return useQuery({
        queryKey: ['paymentAccounts'],
        queryFn: fetchPaymentAccounts,
    });
};

export const useCustomerVehicles = (customerId: number | null) => {
    return useQuery({
        queryKey: ['customerVehicles', customerId],
        queryFn: () => fetchCustomerVehicles(customerId),
        enabled: !!customerId,
    });
};
