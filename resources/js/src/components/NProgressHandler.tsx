import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import nprogress from 'nprogress';

/**
 * NProgressHandler handles the progress bar for route transitions.
 * It uses the `useLocation` hook to detect when the URL changes
 * and provides immediate feedback.
 */
const NProgressHandler = () => {
    const location = useLocation();

    useEffect(() => {
        nprogress.start();
        
        // We call done() after a minimal delay. 
        // If the new page makes API calls (via our unified api utility), 
        // the Axios interceptors will keep the progress bar active 
        // until the data is loaded.
        const timer = setTimeout(() => {
            nprogress.done();
        }, 200);

        return () => clearTimeout(timer);
    }, [location.pathname]);

    return null;
};

export default NProgressHandler;
