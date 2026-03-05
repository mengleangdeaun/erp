import { Link, useLocation } from 'react-router-dom';
import { IconHome, IconQrcode, IconCalendarEvent, IconUser, IconBell } from '@tabler/icons-react';

const BottomNav = () => {
    const location = useLocation();

    const tabs = [
        { name: 'Home', path: '/employee/dashboard', icon: <IconHome className="w-[22px] h-[22px]" /> },
        { name: 'Calendar', path: '/employee/calendar', icon: <IconCalendarEvent className="w-[22px] h-[22px]" /> },
        { name: 'Scan', path: '/employee/scan', icon: <IconQrcode className="w-[22px] h-[22px]" /> },
        { name: 'Noti', path: '/employee/notifications', icon: <IconBell className="w-[22px] h-[22px]" />, comingSoon: true },
        { name: 'Profile', path: '/employee/profile', icon: <IconUser className="w-[22px] h-[22px]" /> },
    ];

    return (
        <div className="w-full bg-white dark:bg-[#0e1726] border-t border-gray-100 dark:border-gray-800 z-50 p-3 shrink-0 pb-safe">
            <div className="flex justify-around items-end h-16 px-2">
                {tabs.map((tab) => {
                    const isActive = location.pathname === tab.path || location.pathname.startsWith(tab.path + '/');
                    return (
                        <Link
                            key={tab.name}
                            to={tab.path}
                            className="flex flex-col items-center justify-center flex-1 h-full gap-1 relative"
                            onClick={e => tab.comingSoon && e.preventDefault()}
                        >
                            <div className={`mt-3 transition-all duration-200 ${isActive ? 'text-primary scale-110' : 'text-gray-400 dark:text-gray-500'}`}>
                                {tab.icon}
                            </div>
                            <span className={`text-[10px] font-bold tracking-wide transition-colors ${isActive ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`}>
                                {tab.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default BottomNav;

