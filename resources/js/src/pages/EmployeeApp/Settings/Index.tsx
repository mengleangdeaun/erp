import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
    IconSettings, IconPalette, IconBell, IconTextSize,
    IconArrowLeft, IconChevronRight
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import PageHeader from '@/components/ui/PageHeader';
import { applyEmployeePreferences, storePreferences } from '@/utils/employeePreferences';

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ icon, title }: { icon: React.ReactNode, title: string }) => (
    <div className="flex items-center gap-2 px-1 mb-2">
        <span className="text-primary">{icon}</span>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{title}</h3>
    </div>
);

export default function EmployeePwaSettings() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [prefs, setPrefs] = useState<any>(null);
    const [savingPrefs, setSavingPrefs] = useState(false);
    const token = localStorage.getItem('employee_auth_token');

    const fetchData = async () => {
        if (!token) { navigate('/attendance/login'); return; }
        try {
            const res = await fetch('/api/employee-app/preferences', { 
                headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` } 
            });
            if (res.status === 401) {
                localStorage.removeItem('employee_auth_token');
                navigate('/attendance/login');
                return;
            }
            if (res.ok) {
                const p = await res.json();
                setPrefs(p);
                applyEmployeePreferences(p);
                storePreferences(p);
            }
        } catch {
            toast.error('Network error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const updatePref = async (key: string, value: any) => {
        const newPrefs = { ...prefs, [key]: value };
        setPrefs(newPrefs);
        applyEmployeePreferences(newPrefs);
        storePreferences(newPrefs);

        setSavingPrefs(true);
        try {
            await fetch('/api/employee-app/preferences', {
                method: 'PUT',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ [key]: value }),
            });
        } catch { 
            toast.error('Failed to save preferences'); 
        } finally { 
            setSavingPrefs(false); 
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[60vh] bg-gray-50 dark:bg-[#060818]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            </div>
        );
    }

    const fontFamilyOptions = ['Inter', 'Roboto', 'Outfit', 'Poppins', 'System Default'];
    const fontSizeOptions = [{ id: 'small', label: 'Small' }, { id: 'medium', label: 'Medium' }, { id: 'large', label: 'Large' }];
    const themeOptions = [
        { id: 'default', label: 'Blue', color: '#4361ee' },
        { id: 'green', label: 'Green', color: '#06b6d4' },
        { id: 'rose', label: 'Rose', color: '#f43f5e' },
        { id: 'amber', label: 'Amber', color: '#f59e0b' },
        { id: 'violet', label: 'Violet', color: '#8b5cf6' },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-[#060818]">
            <PageHeader
                title="Settings"
                icon={<IconSettings className="w-4.5 h-4.5" />}
            />

            <div className="p-4 space-y-6 pb-28 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {prefs && (
                    <div className="space-y-6">
                        {/* ── Visual Preferences ─────────────────────────────── */}
                        <div>
                            <SectionHeader icon={<IconPalette className="w-4 h-4" />} title={`Visual${savingPrefs ? ' · Saving…' : ''}`} />
                            <div className="space-y-3">
                                {/* Font Family */}
                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Font Family</p>
                                    <div className="flex flex-wrap gap-2">
                                        {fontFamilyOptions.map(f => (
                                            <button
                                                key={f}
                                                onClick={() => updatePref('font_family', f)}
                                                className={cn(
                                                    'px-3 py-1.5 rounded-lg text-xs font-bold border transition-all',
                                                    prefs.font_family === f
                                                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                                        : 'bg-gray-50 dark:bg-gray-900 text-gray-500 border-gray-100 dark:border-gray-700'
                                                )}
                                            >{f}</button>
                                        ))}
                                    </div>
                                </div>

                                {/* Font Size */}
                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-2 mb-3">
                                        <IconTextSize className="w-4 h-4 text-gray-400" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Font Size</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {fontSizeOptions.map(s => (
                                            <button
                                                key={s.id}
                                                onClick={() => updatePref('font_size', s.id)}
                                                className={cn(
                                                    'flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all',
                                                    prefs.font_size === s.id
                                                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                                        : 'bg-gray-50 dark:bg-gray-900 text-gray-500 border-gray-100 dark:border-gray-700'
                                                )}
                                            >{s.label}</button>
                                        ))}
                                    </div>
                                </div>

                                {/* Color Theme */}
                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Color Theme</p>
                                    <div className="flex justify-between px-2">
                                        {themeOptions.map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => updatePref('color_theme', t.id)}
                                                title={t.label}
                                                className={cn(
                                                    'w-10 h-10 rounded-full transition-all active:scale-90 relative flex items-center justify-center',
                                                    prefs.color_theme === t.id && 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 scale-110 shadow-lg'
                                                )}
                                                style={{ backgroundColor: t.color }}
                                            >
                                                {prefs.color_theme === t.id && <div className="w-2 h-2 rounded-full bg-white shadow-sm" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Toggles */}
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                                    {[
                                        { key: 'dark_mode', label: 'Dark Mode', icon: <IconPalette className="w-4 h-4" /> },
                                        { key: 'notifications_enabled', label: 'Notifications', icon: <IconBell className="w-4 h-4" /> },
                                    ].map(({ key, label, icon }, idx, arr) => (
                                        <div key={key} className={cn('flex items-center gap-4 px-4 py-4', idx < arr.length - 1 && 'border-b border-gray-100 dark:border-gray-700/50')}>
                                            <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400">{icon}</div>
                                            <p className="flex-1 font-bold text-sm text-gray-900 dark:text-white">{label}</p>
                                            <button
                                                onClick={() => updatePref(key, !prefs[key])}
                                                className={cn(
                                                    'relative w-12 h-6.5 rounded-full transition-all duration-300',
                                                    prefs[key] ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                                                )}
                                            >
                                                <span className={cn('absolute top-1 left-1 w-4.5 h-4.5 bg-white rounded-full shadow-md transition-transform duration-300', prefs[key] && 'translate-x-5.5')} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ── About Section ─────────────────────────────────── */}
                        <div>
                            <SectionHeader icon={<IconSettings className="w-4 h-4" />} title="About App" />
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                                <div className="px-4 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-700/50">
                                    <p className="font-bold text-sm text-gray-900 dark:text-white">Version</p>
                                    <p className="text-xs font-black text-gray-400">1.2.0 (Stable)</p>
                                </div>
                                <button className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <p className="font-bold text-sm text-gray-900 dark:text-white">Privacy Policy</p>
                                    <IconChevronRight size={16} className="text-gray-300" />
                                </button>
                                <button className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <p className="font-bold text-sm text-gray-900 dark:text-white">Terms of Service</p>
                                    <IconChevronRight size={16} className="text-gray-300" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
