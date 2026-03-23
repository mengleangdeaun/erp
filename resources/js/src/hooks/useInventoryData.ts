import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';

// --- Fetchers ---

const fetchProducts = async () => {
    const { data } = await axios.get('/api/inventory/products?all=true');
    return Array.isArray(data) ? data : (data.data || []);
};

const fetchCategories = async () => {
    const { data } = await axios.get('/api/inventory/categories');
    return Array.isArray(data) ? data : (data.data || []);
};

const fetchUoms = async () => {
    const { data } = await axios.get('/api/inventory/uoms');
    return Array.isArray(data) ? data : (data.data || []);
};

const fetchTags = async () => {
    const { data } = await axios.get('/api/inventory/tags');
    return Array.isArray(data) ? data : (data.data || []);
};

const fetchBranches = async () => {
    const { data } = await axios.get('/api/hr/branches');
    return Array.isArray(data) ? data : (data.data || []);
};

const fetchBranchProducts = async (branchId: string | number) => {
    const { data } = await axios.get(`/api/hr/branches/${branchId}/products`);
    return Array.isArray(data) ? data : (data.data || []);
};

const fetchBranchServices = async (branchId: string | number) => {
    const { data } = await axios.get(`/api/hr/branches/${branchId}/services`);
    return Array.isArray(data) ? data : (data.data || []);
};

const fetchServices = async () => {
    const { data } = await axios.get('/api/services/list');
    return Array.isArray(data) ? data : (data.data || []);
};

const fetchSuppliers = async () => {
    const { data } = await axios.get('/api/inventory/suppliers');
    return Array.isArray(data) ? data : (data.data || []);
};

const fetchLocations = async () => {
    const { data } = await axios.get('/api/inventory/locations');
    return Array.isArray(data) ? data : (data.data || []);
};

const fetchPurchaseOrders = async (params: any = {}) => {
    const { data } = await axios.get('/api/inventory/purchase-orders', { params });
    return data;
};

const fetchPurchaseOrderPendingItems = async (poId: number | string) => {
    const { data } = await axios.get(`/api/inventory/purchase-orders/${poId}/pending-items`);
    return data;
};

const fetchPurchaseReceives = async (params: any = {}) => {
    const { data } = await axios.get('/api/inventory/purchase-receives', { params });
    return data;
};

// --- Custom Hooks for Fetching ---

export const useInventoryProducts = () => {
    return useQuery({
        queryKey: ['inventory-products'],
        queryFn: fetchProducts,
    });
};

export const useInventoryCategories = () => {
    return useQuery({
        queryKey: ['inventory-categories'],
        queryFn: fetchCategories,
    });
};

export const useInventoryUoms = () => {
    return useQuery({
        queryKey: ['inventory-uoms'],
        queryFn: fetchUoms,
    });
};

export const useInventoryTags = () => {
    return useQuery({
        queryKey: ['inventory-tags'],
        queryFn: fetchTags,
    });
};

export const useBranches = () => {
    return useQuery({
        queryKey: ['hr-branches'],
        queryFn: fetchBranches,
    });
};

export const useBranchProducts = (branchId: string | number | null) => {
    return useQuery({
        queryKey: ['branch-products', branchId],
        queryFn: () => branchId ? fetchBranchProducts(branchId) : Promise.resolve([]),
        enabled: !!branchId,
    });
};

export const useBranchServices = (branchId: string | number | null) => {
    return useQuery({
        queryKey: ['branch-services', branchId],
        queryFn: () => branchId ? fetchBranchServices(branchId) : Promise.resolve([]),
        enabled: !!branchId,
    });
};

export const useInventoryServices = () => {
    return useQuery({
        queryKey: ['inventory-services'],
        queryFn: fetchServices,
    });
};

export const useInventorySuppliers = () => {
    return useQuery({
        queryKey: ['inventory-suppliers'],
        queryFn: fetchSuppliers,
    });
};

export const useInventoryLocations = () => {
    return useQuery({
        queryKey: ['inventory-locations'],
        queryFn: fetchLocations,
    });
};

export const usePurchaseOrders = (params: any = {}) => {
    return useQuery({
        queryKey: ['purchase-orders', params],
        queryFn: () => fetchPurchaseOrders(params),
    });
};

export const usePurchaseOrderPendingItems = (poId: number | string | null) => {
    return useQuery({
        queryKey: ['purchase-order-pending-items', poId],
        queryFn: () => poId ? fetchPurchaseOrderPendingItems(poId) : Promise.resolve([]),
        enabled: !!poId,
    });
};

export const usePurchaseReceives = (params: any = {}) => {
    return useQuery({
        queryKey: ['purchase-receives', params],
        queryFn: () => fetchPurchaseReceives(params),
    });
};

// --- Custom Hooks for Mutations ---

export const useCreateProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (formData: FormData) => {
            const { data } = await axios.post('/api/inventory/products', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
            toast.success('Product created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create product');
        },
    });
};

export const useUpdateProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, formData }: { id: number; formData: FormData }) => {
            // Laravel requires _method=PUT for multipart/form-data POST requests to simulate PUT
            formData.append('_method', 'PUT');
            const { data } = await axios.post(`/api/inventory/products/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
            toast.success('Product updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update product');
        },
    });
};

export const useDeleteProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await axios.delete(`/api/inventory/products/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
            toast.success('Product deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete product');
        },
    });
};

// --- Categories Mutations ---

export const useCreateCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: any) => {
            const { data } = await axios.post('/api/inventory/categories', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-categories'] });
            toast.success('Category created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create category');
        },
    });
};

export const useUpdateCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
            const { data } = await axios.put(`/api/inventory/categories/${id}`, payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-categories'] });
            toast.success('Category updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update category');
        },
    });
};

export const useDeleteCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await axios.delete(`/api/inventory/categories/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-categories'] });
            toast.success('Category deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete category');
        },
    });
};

// --- UOM Mutations ---

export const useCreateUom = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: any) => {
            const { data } = await axios.post('/api/inventory/uoms', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-uoms'] });
            toast.success('UOM created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create UOM');
        },
    });
};

export const useUpdateUom = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
            const { data } = await axios.put(`/api/inventory/uoms/${id}`, payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-uoms'] });
            toast.success('UOM updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update UOM');
        },
    });
};

export const useDeleteUom = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await axios.delete(`/api/inventory/uoms/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-uoms'] });
            toast.success('UOM deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete UOM');
        },
    });
};

// --- Tag Mutations ---

export const useCreateTag = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: any) => {
            const { data } = await axios.post('/api/inventory/tags', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-tags'] });
            toast.success('Tag created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create tag');
        },
    });
};

export const useUpdateTag = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
            const { data } = await axios.put(`/api/inventory/tags/${id}`, payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-tags'] });
            toast.success('Tag updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update tag');
        },
    });
};

export const useDeleteTag = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await axios.delete(`/api/inventory/tags/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-tags'] });
            toast.success('Tag deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete tag');
        },
    });
};

// --- Branch Assignment Mutations ---

export const useSyncBranchProducts = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ branchId, products }: { branchId: string | number; products: number[] }) => {
            const { data } = await axios.post(`/api/hr/branches/${branchId}/products/sync`, { products });
            return data;
        },
        onSuccess: (_, { branchId }) => {
            queryClient.invalidateQueries({ queryKey: ['branch-products', branchId] });
            toast.success('Branch products updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update branch products');
        },
    });
};

export const useSyncBranchServices = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ branchId, services }: { branchId: string | number; services: number[] }) => {
            const { data } = await axios.post(`/api/hr/branches/${branchId}/services/sync`, { services });
            return data;
        },
        onSuccess: (_, { branchId }) => {
            queryClient.invalidateQueries({ queryKey: ['branch-services', branchId] });
            toast.success('Branch services updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update branch services');
        },
    });
};

// --- Purchase Order Mutations ---

export const useCreatePurchaseOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: any) => {
            const { data } = await axios.post('/api/inventory/purchase-orders', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            toast.success('Purchase Order created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create Purchase Order');
        },
    });
};

export const useUpdatePurchaseOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
            const { data } = await axios.put(`/api/inventory/purchase-orders/${id}`, payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            toast.success('Purchase Order updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update Purchase Order');
        },
    });
};

export const useDeletePurchaseOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await axios.delete(`/api/inventory/purchase-orders/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            toast.success('Purchase Order deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete Purchase Order');
        },
    });
};

// --- Purchase Receive Mutation ---

export const useCreatePurchaseReceive = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: any) => {
            const { data } = await axios.post('/api/inventory/purchase-receives', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase-receives'] });
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            toast.success('Items received successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to receive items');
        },
    });
};
