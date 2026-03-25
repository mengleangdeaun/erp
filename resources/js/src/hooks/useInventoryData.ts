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

const fetchInventoryDashboard = async (branchId?: string | number | null) => {
    const { data } = await axios.get('/api/inventory/dashboard', {
        params: { branch_id: branchId }
    });
    return data;
};

const fetchStockBalance = async (params: any = {}) => {
    const { data } = await axios.get('/api/inventory/stock-balance', { params });
    return data;
};

const fetchStocks = async () => {
    const { data } = await axios.get('/api/inventory/stocks');
    return Array.isArray(data) ? data : [];
};

const fetchStockMovements = async (params: any = {}) => {
    const { data } = await axios.get('/api/inventory/stock-movements', { params });
    return Array.isArray(data) ? data : [];
};

const fetchSerialMovements = async (params: any = {}) => {
    const { data } = await axios.get('/api/inventory/serial-movements', { params });
    return Array.isArray(data) ? data : [];
};

const fetchStockAdjustments = async (params: any = {}) => {
    const { data } = await axios.get('/api/inventory/stock-adjustments', { params });
    return data;
};

const fetchStockTransfers = async (params: any = {}) => {
    const { data } = await axios.get('/api/inventory/stock-transfers', { params });
    return data;
};

// --- Custom Hooks for Fetching ---

export const useInventoryDashboard = (branchId?: string | number | null) => {
    return useQuery({
        queryKey: ['inventory-dashboard', branchId],
        queryFn: () => fetchInventoryDashboard(branchId),
    });
};

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

export const useStockBalance = (params: any = {}) => {
    return useQuery({
        queryKey: ['inventory-stock-balance', params],
        queryFn: () => fetchStockBalance(params),
    });
};

export const useInventoryStocks = () => {
    return useQuery({
        queryKey: ['inventory-stocks'],
        queryFn: fetchStocks,
    });
};

export const useStockMovements = (params: any = {}) => {
    return useQuery({
        queryKey: ['inventory-stock-movements', params],
        queryFn: () => fetchStockMovements(params),
    });
};

export const useSerialMovements = (params: any = {}) => {
    return useQuery({
        queryKey: ['inventory-serial-movements', params],
        queryFn: () => fetchSerialMovements(params),
    });
};

export const useStockAdjustments = (params: any = {}) => {
    return useQuery({
        queryKey: ['inventory-stock-adjustments', params],
        queryFn: () => fetchStockAdjustments(params),
    });
};

export const useStockTransfers = (params: any = {}) => {
    return useQuery({
        queryKey: ['inventory-stock-transfers', params],
        queryFn: () => fetchStockTransfers(params),
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
        mutationFn: async ({ branchId, products }: { branchId: string | number; products: Array<{ id: number; reorder_level: number }> }) => {
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

// --- Stock Mutations ---

export const useAdjustStock = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: any) => {
            const { data } = await axios.post('/api/inventory/stocks', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-stocks'] });
            toast.success('Stock operations tracked correctly!');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update ledger records');
        },
    });
};

// --- Stock Adjustment Mutations ---

export const useDeleteStockAdjustment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await axios.delete(`/api/inventory/stock-adjustments/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-stock-adjustments'] });
            toast.success('Adjustment deleted');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete adjustment');
        },
    });
};

export const useApproveStockAdjustment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await axios.post(`/api/inventory/stock-adjustments/${id}/approve`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-stock-adjustments'] });
            toast.success('Adjustment approved');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to approve adjustment');
        },
    });
};

export const useRejectStockAdjustment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
            const { data } = await axios.post(`/api/inventory/stock-adjustments/${id}/reject`, { reason });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-stock-adjustments'] });
            toast.success('Adjustment rejected');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to reject adjustment');
        },
    });
};

// --- Stock Transfer Mutations ---

export const useDeleteStockTransfer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await axios.delete(`/api/inventory/stock-transfers/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-stock-transfers'] });
            toast.success('Transfer deleted');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete transfer');
        },
    });
};

export const useApproveStockTransfer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await axios.post(`/api/inventory/stock-transfers/${id}/approve`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-stock-transfers'] });
            toast.success('Transfer approved successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to approve transfer');
        },
    });
};

export const useRejectStockTransfer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
            const { data } = await axios.post(`/api/inventory/stock-transfers/${id}/reject`, { reason });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-stock-transfers'] });
            toast.success('Transfer rejected');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to reject transfer');
        },
    });
};
