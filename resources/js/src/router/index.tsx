import { createBrowserRouter } from 'react-router-dom';
import BlankLayout from '../components/Layouts/BlankLayout';
import DefaultLayout from '../components/Layouts/DefaultLayout';
import MobileLayout from '../components/Layouts/MobileLayout';
import { routes } from './routes';

const finalRoutes = routes.map((route) => {
    return {
        ...route,
        element: route.layout === 'blank' ? (
            <BlankLayout>{route.element}</BlankLayout>
        ) : route.layout === 'mobile' ? (
            <MobileLayout>{route.element}</MobileLayout>
        ) : (
            <DefaultLayout>{route.element}</DefaultLayout>
        ),
    };
});

const router = createBrowserRouter(finalRoutes);

export default router;
