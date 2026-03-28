import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client'

// Perfect Scrollbar
import 'react-perfect-scrollbar/dist/css/styles.css';

// Tailwind css
import './tailwind.css';

// i18n (needs to be bundled)
import './i18n';

// Router
import { RouterProvider } from 'react-router-dom';
import router from './router/index';

import { Provider } from 'react-redux';
import store from './store/index';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 60 * 24, // 24 hours
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

// Initialize Echo for Real-time WebSockets
import '../echo';

// Global listener for Job Card updates
(window as any).Echo.channel('job-cards')
    .listen('.JobCardUpdated', (e: any) => {
        console.log('Real-time sync: Job Card Updated', e.jobCardId);
        queryClient.invalidateQueries({ queryKey: ['job-cards'] });
        queryClient.invalidateQueries({ queryKey: ['job-card', e.jobCardId] });
    });

// Global listener for Sales Order updates
(window as any).Echo.channel('sales-orders')
    .listen('.SalesOrderUpdated', (e: any) => {
        console.log('Real-time sync: Sales Order Updated', e.salesOrder?.id);
        queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
        queryClient.invalidateQueries({ queryKey: ['salesOrder', e.salesOrder?.id] });
    });

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <Suspense>
        <Provider store={store}>
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
            </QueryClientProvider>
        </Provider>
    </Suspense>
);

