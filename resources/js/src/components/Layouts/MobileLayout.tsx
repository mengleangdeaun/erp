import { useEffect } from 'react';
import App from '../../App';
import BottomNav from '../ui/BottomNav';
import { applyEmployeePreferences, loadStoredPreferences } from '../../utils/employeePreferences';

const MobileLayout = ({ children }: { children?: React.ReactNode }) => {
    // Apply saved preferences on every mount
    useEffect(() => {
        applyEmployeePreferences(loadStoredPreferences());
    }, []);

    return (
        <App>
            {/* Limit max width to simulate phone layout on desktop */}
            <div className="text-black dark:text-white-dark h-[100dvh] flex flex-col bg-gray-50 dark:bg-[#060818] relative w-full max-w-md mx-auto shadow-2xl overflow-hidden">

                {/* Content Area */}
                <main className="flex-1 w-full overflow-y-auto">
                    {children}
                </main>

                {/* Fixed Bottom Navigation */}
                <BottomNav />
            </div>
        </App>
    );
};

export default MobileLayout;
