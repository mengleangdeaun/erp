import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface PageHeaderProps {
    title: string;
    icon?: ReactNode;
    rightAction?: ReactNode;
}

// Pages that are top-level tabs — no back button needed
const ROOT_PATHS = [
    '/employee/dashboard',
    '/employee/calendar',
    '/employee/scan',
    '/employee/notifications',
    '/employee/profile',
];

/**
 * Reusable sticky page header for the Employee PWA.
 * Automatically shows a back button on sub-pages (non bottom-nav routes).
 */
const PageHeader = ({ title, icon, rightAction }: PageHeaderProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const showBack = !ROOT_PATHS.includes(location.pathname);

    return (
        <div className="bg-white dark:bg-gray-800 px-4 py-3.5 sticky top-0 z-40 shadow-sm border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            {/* Left: Back Button or Spacer */}
            <div className="w-10 shrink-0 flex items-center">
                {showBack ? (
                    <button
                        onClick={() => navigate(-1)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 active:scale-90 transition-all"
                        aria-label="Go back"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                    </button>
                ) : null}
            </div>

            {/* Centered Title */}
            <h1 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2 truncate">
                {icon && <span className="text-primary shrink-0">{icon}</span>}
                {title}
            </h1>

            {/* Right Action Slot */}
            <div className="w-10 shrink-0 flex justify-end">
                {rightAction ?? null}
            </div>
        </div>
    );
};

export default PageHeader;

