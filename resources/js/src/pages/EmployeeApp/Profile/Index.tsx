import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
    IconUser, IconMail, IconPhone, IconBuildingCommunity,
    IconBriefcase, IconClockFilled, IconLogout, IconCalendarEvent,
    IconId, IconMapPin, IconGenderMale, IconGenderFemale,
    IconCamera, IconClock, IconPalette, IconBell, IconTextSize,
    IconChevronRight, IconSettings, IconInfoCircle,
    IconMessageHeart
} from '@tabler/icons-react';
import MobileConfirmationModal from '@/components/MobileConfirmationModal';
import { cn } from '@/lib/utils';
import PageHeader from '@/components/ui/PageHeader';
import { applyEmployeePreferences, storePreferences } from '@/utils/employeePreferences';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { useTranslation } from 'react-i18next';

// ─── Info Row Component ───────────────────────────────────────────────────────
const InfoRow = ({ icon, label, value, last = false }: { icon: React.ReactNode, label: string, value?: string | null, last?: boolean }) => (
    <div className={cn('flex items-center gap-4 px-4 py-3.5', !last && 'border-b border-gray-100 dark:border-gray-700/50')}>
        <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">{label}</p>
            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{value || 'N/A'}</p>
        </div>
    </div>
);

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ icon, title }: { icon: React.ReactNode, title: string }) => (
    <div className="flex items-center gap-2 px-1 mb-2">
        <span className="text-primary">{icon}</span>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{title}</h3>
    </div>
);

export default function EmployeePwaProfile() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const fileRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [logoutModalOpen, setLogoutModalOpen] = useState(false);

    const token = localStorage.getItem('employee_auth_token');

    const fetchData = async () => {
        if (!token) { navigate('/attendance/login'); return; }

        try {
            const [profileRes, prefsRes] = await Promise.all([
                fetch('/api/employee-app/profile', { headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` } }),
                fetch('/api/employee-app/preferences', { headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` } }),
            ]);

            if (profileRes.status === 401) {
                localStorage.removeItem('employee_auth_token');
                navigate('/attendance/login');
                return;
            }

            if (profileRes.ok) setProfile(await profileRes.json());
            
            // Still apply preferences from storage on load to ensure theme consistency
            const storedPrefs = localStorage.getItem('employee_preferences');
            if (storedPrefs) {
                applyEmployeePreferences(JSON.parse(storedPrefs));
            }
        } catch {
            toast.error('Network error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        dispatch(setPageTitle(t('profile', 'Profile')));
    }, [dispatch, t]);

    useEffect(() => { fetchData(); }, []);

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingAvatar(true);
        const form = new FormData();
        form.append('avatar', file);
        try {
            const res = await fetch('/api/employee-app/profile/avatar', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: form,
            });
            const data = await res.json();
            if (res.ok) {
                setProfile((p: any) => ({ ...p, profile_image: data.profile_image }));
                toast.success('Profile picture updated!');
            } else {
                toast.error(data.message || 'Upload failed');
            }
        } catch {
            toast.error('Upload failed');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const executeLogout = () => {
        localStorage.removeItem('employee_auth_token');
        navigate('/attendance/login');
        toast.success('Signed out of this device');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[60vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            </div>
        );
    }

    if (!profile) return null;

    const avatarSrc = profile.profile_image
        ? (profile.profile_image.startsWith('http') ? profile.profile_image : `/storage/${profile.profile_image}`)
        : null;

    const formatDate = (d: string | null) => {
        if (!d) return 'N/A';
        return new Date(d).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
    };

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
                title="My Profile"
                icon={<IconUser className="w-4.5 h-4.5" />}
                rightAction={
                    <button
                        onClick={() => navigate('/employee/settings')}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 active:scale-90 transition-all"
                        aria-label="Settings"
                    >
                        <IconSettings className="w-5 h-5" />
                    </button>
                }
            />

            <div className="p-4 space-y-6 pb-28 animate-in fade-in slide-in-from-bottom-2 duration-500">

                {/* ── Avatar Card ─────────────────────────────────────────── */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center">
                    <div className="relative mb-4">
                        <div
                            onClick={() => fileRef.current?.click()}
                            className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-50 dark:border-gray-700 shadow-md bg-gray-100 dark:bg-gray-900 flex items-center justify-center cursor-pointer"
                        >
                            {uploadingAvatar ? (
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                            ) : avatarSrc ? (
                                <img src={avatarSrc} className="w-full h-full object-cover" alt="avatar" />
                            ) : (
                                <span className="text-3xl font-black text-gray-400">
                                    {profile.full_name?.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>

                        {/* Camera overlay */}
                        <button
                            onClick={() => fileRef.current?.click()}
                            className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform border-2 border-white dark:border-gray-800"
                        >
                            <IconCamera className="w-4 h-4" />
                        </button>
                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </div>

                    <h2 className="text-xl font-black text-gray-900 dark:text-white">{profile.full_name}</h2>
                    <span className="mt-1.5 px-3 py-1 bg-primary/10 text-primary font-bold text-[11px] uppercase tracking-wider rounded-full">
                        ID: {profile.employee_id}
                    </span>
                    <p className="mt-2 text-sm font-medium text-gray-400">
                        {profile.designation} · {profile.department}
                    </p>
                </div>

                {/* ── Employment Snapshot ──────────────────────────────────── */}
                <div>
                    <SectionHeader icon={<IconCalendarEvent className="w-4 h-4" />} title="Employment Snapshot" />
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-700 overflow-hidden">
                        {[
                            { label: 'Birthday', value: profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'N/A' },
                            { label: 'Join Date', value: profile.date_of_joining ? new Date(profile.date_of_joining).toLocaleDateString([], { month: 'short', year: 'numeric' }) : 'N/A' },
                            { label: 'Tenure', value: profile.working_period ?? 'N/A' },
                        ].map(stat => (
                            <div key={stat.label} className="flex flex-col items-center py-4 px-2 text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{stat.label}</p>
                                <p className="font-black text-base text-gray-900 dark:text-white leading-tight">{stat.value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Personal Information ─────────────────────────────────── */}
                <div>
                    <SectionHeader icon={<IconId className="w-4 h-4" />} title="Personal Information" />
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <InfoRow icon={<IconId className="w-4 h-4" />} label="Employee ID" value={profile.employee_id} />
                        <InfoRow icon={<IconUser className="w-4 h-4" />} label="Full Name" value={profile.full_name} />
                        <InfoRow icon={profile.gender === 'Female' ? <IconGenderFemale className="w-4 h-4" /> : <IconGenderMale className="w-4 h-4" />} label="Gender" value={profile.gender} />
                        <InfoRow icon={<IconPhone className="w-4 h-4" />} label="Phone Number" value={profile.phone} />
                        <InfoRow icon={<IconCalendarEvent className="w-4 h-4" />} label="Birthday" value={formatDate(profile.date_of_birth)} />
                        <InfoRow icon={<IconMail className="w-4 h-4" />} label="Email Address" value={profile.email} />
                        <InfoRow icon={<IconMapPin className="w-4 h-4" />} label="Address" value={profile.address} last />
                    </div>
                </div>

                {/* ── Work Information ─────────────────────────────────────── */}
                <div>
                    <SectionHeader icon={<IconBriefcase className="w-4 h-4" />} title="Work Information" />
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <InfoRow icon={<IconCalendarEvent className="w-4 h-4" />} label="Join Date" value={formatDate(profile.date_of_joining)} />
                        <InfoRow icon={<IconBuildingCommunity className="w-4 h-4" />} label="Main Branch" value={profile.branch} />
                        <InfoRow icon={<IconBriefcase className="w-4 h-4" />} label="Position" value={profile.designation} />
                        <InfoRow icon={<IconSettings className="w-4 h-4" />} label="Department" value={profile.department} last />
                    </div>
                </div>

                {/* ── Working Shift Info ───────────────────────────────────── */}
                <div>
                    <SectionHeader icon={<IconClockFilled className="w-4 h-4" />} title="Working Shift" />
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-700/50">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Shift Name</p>
                            <p className="font-bold text-gray-900 dark:text-white text-sm">{profile.shift_name ?? 'Standard'}</p>
                        </div>
                        <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-700/50">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Type</p>
                            <p className="font-bold text-gray-900 dark:text-white text-sm capitalize">{profile.shift_type ?? 'Continuous'}</p>
                        </div>
                        {profile.shift_sessions?.length > 0 && profile.shift_sessions.map((s: any, i: number) => (
                            <div key={i} className={cn('px-4 py-3.5 flex items-center justify-between', i < profile.shift_sessions.length - 1 && 'border-b border-gray-100 dark:border-gray-700/50')}>
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-500"><IconClock className="w-4 h-4" /></div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{s.label}</p>
                                </div>
                                <p className="font-black text-sm text-gray-900 dark:text-white">
                                    {s.start?.substring(0, 5)} – {s.end?.substring(0, 5)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Preferences moved to Settings */}

                {/* ── Sign Out ─────────────────────────────────────────────── */}
                <div className="pt-2 pb-6">
                    <button
                        onClick={() => setLogoutModalOpen(true)}
                        className="w-full flex justify-between items-center bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl text-red-600 dark:text-red-400 font-bold active:scale-[0.98] transition-transform border border-red-100 dark:border-red-900/30"
                    >
                        <span className="flex items-center gap-3">
                            <IconLogout className="w-5 h-5" />
                            Sign Out of Device
                        </span>
                        <IconChevronRight className="w-4 h-4 opacity-40" />
                    </button>
                    <p className="text-center text-[10px] text-gray-400 mt-2 px-8">
                        Requires scanning your Personal QR Code again to log back in.
                    </p>

                    <button
                        onClick={() => navigate('/employee/feedback/create')}
                        className="w-full flex justify-between items-center bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl text-blue-600 dark:text-blue-400 font-bold active:scale-[0.98] transition-transform border border-blue-100 dark:border-blue-900/30 mt-4"
                    >
                        <span className="flex items-center gap-3">
                            <IconMessageHeart className="w-5 h-5 text-blue-500" />
                            Company Feedback
                        </span>
                        <IconChevronRight className="w-4 h-4 opacity-40" />
                    </button>
                </div>

            </div>

            <MobileConfirmationModal
                isOpen={logoutModalOpen}
                setIsOpen={setLogoutModalOpen}
                title="Sign Out"
                message="Are you sure you want to sign out? You'll need your Personal QR Code or Password to log back in."
                onConfirm={executeLogout}
                confirmLabel="Yes, Sign Out"
                cancelLabel="Stay Signed In"
                variant="danger"
                isLoading={false}
            />
        </div>
    );
}
