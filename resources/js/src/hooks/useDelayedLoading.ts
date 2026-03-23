import { useState, useEffect, useRef } from 'react';

/**
 * Ensures that a loading state lasts for at least a minimum amount of time
 * to prevent flickering for very fast data loads.
 */
export const useDelayedLoading = (loading: boolean, minTime: number = 500): boolean => {
    const [displayLoading, setDisplayLoading] = useState(loading);
    const startTimeRef = useRef<number | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (loading) {
            // Loading started
            setDisplayLoading(true);
            startTimeRef.current = Date.now();
            
            // Clear any pending exit timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        } else {
            // Loading finished
            if (startTimeRef.current) {
                const elapsed = Date.now() - startTimeRef.current;
                const remaining = Math.max(0, minTime - elapsed);

                if (remaining > 0) {
                    timeoutRef.current = setTimeout(() => {
                        setDisplayLoading(false);
                        startTimeRef.current = null;
                        timeoutRef.current = null;
                    }, remaining);
                } else {
                    setDisplayLoading(false);
                    startTimeRef.current = null;
                }
            } else {
                setDisplayLoading(false);
            }
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [loading, minTime]);

    return displayLoading;
};
