import { createBrowserRouter } from 'react-router-dom';
import BlankLayout from '../components/Layouts/BlankLayout';
import DefaultLayout from '../components/Layouts/DefaultLayout';
import MobileLayout from '../components/Layouts/MobileLayout';
import Error from '../components/Error';
import { routes } from './routes';
import NProgressHandler from '../components/NProgressHandler';

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

// A single, top-level route to provide the global error boundary
const router = createBrowserRouter([
    {
        errorElement: <BlankLayout><Error /></BlankLayout>,
        children: [
            {
                element: <NProgressHandler />,
            },
            ...finalRoutes
        ]
    }
]);

export default router;
