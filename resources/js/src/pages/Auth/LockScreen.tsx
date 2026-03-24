import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useNavigate, Link } from 'react-router-dom';
import { IconLockOpen, IconLoader2, IconLogout } from '@tabler/icons-react';
import { IRootState } from '../../store';

const LockScreen = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [mounted, setMounted] = useState(false);
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        dispatch(setPageTitle('Lock Screen'));
        const t = setTimeout(() => setMounted(true), 50);
        
        const storedUser = localStorage.getItem('user_info');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            // If no user info, redirect to login
            navigate('/auth/login');
        }

        return () => clearTimeout(t);
    }, [dispatch, navigate]);

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
             // Get CSRF cookie
             const getCookie = (name: string) => {
                const value = `; ${document.cookie}`;
                const parts = value.split(`; ${name}=`);
                if (parts.length === 2) return parts.pop()?.split(';').shift();
            };

            const response = await fetch('/api/access-control/unlock', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': decodeURIComponent(getCookie('XSRF-TOKEN') || ''),
                },
                body: JSON.stringify({ password }),
            });

            const data = await response.json();

            if (response.ok) {
                navigate('/');
            } else {
                setError(data.message || 'Unlock failed');
            }
        } catch (err) {
            console.error(err);
            setError('An error occurred during unlock');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_info');
        navigate('/auth/login');
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 py-12">
            
            {/* Animated SVG dot grid background (Inspired by Error.tsx) */}
            <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid slice"
            >
                <defs>
                    <pattern id="dot-grid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
                        <circle cx="16" cy="16" r="1.2" fill="hsl(var(--primary))" fillOpacity="0.15">
                            <animate attributeName="fill-opacity" values="0.06;0.28;0.06" dur="3s" repeatCount="indefinite" />
                        </circle>
                        <circle cx="0" cy="0" r="0.8" fill="hsl(var(--primary))" fillOpacity="0.08">
                            <animate attributeName="fill-opacity" values="0.08;0.22;0.08" dur="4.5s" repeatCount="indefinite" />
                        </circle>
                    </pattern>
                    <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
                        <stop offset="0%" stopColor="transparent" />
                        <stop offset="100%" stopColor="#020617" stopOpacity="0.92" />
                    </radialGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#dot-grid)" />
                <rect width="100%" height="100%" fill="url(#vignette)" />
            </svg>

            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--primary)/0.5)] to-transparent" />

            <div className={`relative z-10 w-full max-w-[400px] transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                
                {/* User Info Header */}
                <div className="mb-10 text-center">
                    <div className="relative inline-block mb-6 group">
                         <div className="absolute -inset-1.5 bg-gradient-to-tr from-primary to-primary/40 rounded-full opacity-40 group-hover:opacity-60 transition duration-500"></div>
                         <img 
                            className="relative w-24 h-24 rounded-full object-cover border-4 border-white shadow-2xl" 
                            src={user?.avatar ? `/storage/${user.avatar}` : "/assets/images/user-profile.jpeg"} 
                            alt="User Profile" 
                            onError={(e) => {
                                e.currentTarget.src = "/assets/images/user-profile.jpeg";
                            }}
                         />
                         <div className="absolute bottom-0 right-0 bg-primary rounded-full p-1.5 border-2 border-slate-900 shadow-lg">
                            <IconLockOpen size={14} className="text-white" />
                         </div>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
                        {user?.name || 'User'}
                    </h1>
                    <p className="text-sm text-zinc-500 font-medium tracking-wide">
                        Enter password to unlock your session
                    </p>
                </div>

                {/* Unlock Form */}
                <form onSubmit={handleUnlock} className="flex flex-col gap-5">
                        {error && (
                            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                                <svg className="w-4 h-4 mt-0.5 shrink-0" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle opacity="0.5" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                                    <path d="M12 17V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    <circle cx="1" cy="1" r="1" transform="matrix(1 0 0 -1 11 9)" fill="currentColor" />
                                </svg>
                                {error}
                            </div>
                        )}

                    <div className="flex flex-col gap-1.5">
                        <div className="relative">
                            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0110 0v4" />
                            </svg>
                            <input
                                type="password"
                                placeholder="••••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoFocus
                                className="w-full h-12 pl-10 pr-4 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-primary hover:bg-primary/90 active:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold tracking-wide shadow-lg shadow-primary/20 transition-all duration-200"
                    >
                        {loading ? (
                            <IconLoader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                Unlock Session
                                <IconLockOpen size={18} />
                            </>
                        )}
                    </button>
                    
                    <button 
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 text-zinc-500 hover:text-red-400 text-xs font-medium transition-colors duration-200 mt-2"
                    >
                        <IconLogout size={14} />
                        Not {user?.name}? Log out
                    </button>
                    {error && (
                        <div className="flex items-center justify-center">
                            <Link
                                to="/auth/forgot-password"
                                className="text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
                            >
                                Forgot password?
                            </Link>
                        </div>
                    )}
                </form>

                {/* Bottom Footer Note */}
                 <p className="mt-16 text-center text-[11px] text-zinc-700 tracking-wider">
                    SECURE SESSION LOCK
                </p>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--primary)/0.2)] to-transparent" />
        </div>
    );
};

export default LockScreen;
