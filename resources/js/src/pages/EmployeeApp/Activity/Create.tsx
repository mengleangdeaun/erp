import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    IconCamera, IconMapPin, IconNotes, IconLoader2,
    IconActivity, IconX, IconCheck, IconCurrentLocation
} from '@tabler/icons-react';
import PageHeader from '@/components/ui/PageHeader';
import { cn } from '@/lib/utils';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { useTranslation } from 'react-i18next';

type Step = 'photo' | 'location' | 'comment';

export default function EmployeePwaActivityCreate() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const fileRef = useRef<HTMLInputElement>(null);
    const token = localStorage.getItem('employee_auth_token');

    const [step, setStep] = useState<Step>('photo');
    const [photo, setPhoto] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [comment, setComment] = useState('');
    const [location, setLocation] = useState<{ lat: number; lng: number; name?: string } | null>(null);
    const [locLoading, setLocLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle(t('new_activity', 'New Activity')));
    }, [dispatch, t]);

    // Auto-request GPS on mount
    useEffect(() => {
        requestLocation();
    }, []);

    const requestLocation = () => {
        if (!navigator.geolocation) return;
        setLocLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                let name: string | undefined;
                // Reverse geocode via nominatim (free, no key needed)
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
                    if (res.ok) {
                        const data = await res.json();
                        const parts = [data.address?.road, data.address?.suburb, data.address?.city].filter(Boolean);
                        name = parts.slice(0, 2).join(', ');
                    }
                } catch { /* silent */ }
                setLocation({ lat, lng, name });
                setLocLoading(false);
            },
            () => {
                setLocLoading(false);
                toast.error('Could not get location. You can still submit without it.');
            },
            { timeout: 10000 }
        );
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPhoto(file);
        setPreview(URL.createObjectURL(file));
        setStep('location');
    };

    const handleSubmit = async () => {
        if (!photo) { toast.error('Please take a photo first'); return; }
        if (!token) { navigate('/attendance/login'); return; }

        setSubmitting(true);
        const form = new FormData();
        form.append('photo', photo);
        if (comment) form.append('comment', comment);
        if (location) {
            form.append('latitude', String(location.lat));
            form.append('longitude', String(location.lng));
            if (location.name) form.append('location_name', location.name);
        }

        try {
            const res = await fetch('/api/employee-app/activities', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: form,
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Activity submitted!');
                navigate('/employee/activity');
            } else {
                toast.error(data.message || 'Submission failed');
            }
        } catch { toast.error('Network error'); }
        finally { setSubmitting(false); }
    };

    const STEPS: { id: Step; label: string; icon: React.ReactNode }[] = [
        { id: 'photo', label: 'Photo', icon: <IconCamera className="w-4 h-4" /> },
        { id: 'location', label: 'Location', icon: <IconMapPin className="w-4 h-4" /> },
        { id: 'comment', label: 'Comment', icon: <IconNotes className="w-4 h-4" /> },
    ];

    return (
        <div className="flex flex-col min-h-[100dvh] bg-gray-50 dark:bg-[#060818]">
            <PageHeader title="New Activity" icon={<IconActivity className="w-4 h-4" />} />

            <div className="flex-1 p-5 space-y-5 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-400">

                {/* Step Progress */}
                <div className="flex items-center gap-0">
                    {STEPS.map((s, idx) => {
                        const done = STEPS.indexOf(STEPS.find(x => x.id === step)!) > idx;
                        const active = s.id === step;
                        return (
                            <div key={s.id} className="flex items-center flex-1 last:flex-none">
                                <button
                                    onClick={() => { if (preview || s.id === 'photo') setStep(s.id); }}
                                    className={cn(
                                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black transition-all',
                                        active ? 'bg-primary text-white shadow-md shadow-primary/30' :
                                            done ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                                    )}
                                >
                                    {done ? <IconCheck className="w-3.5 h-3.5" /> : s.icon}
                                    {s.label}
                                </button>
                                {idx < STEPS.length - 1 && (
                                    <div className={cn('flex-1 h-0.5 mx-1 rounded-full', done ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-700')} />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* ── STEP 1: PHOTO ───────────────────────────────── */}
                {step === 'photo' && (
                    <div className="space-y-4">
                        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />

                        {preview ? (
                            <div className="relative rounded-3xl overflow-hidden shadow-xl border-4 border-white dark:border-gray-700">
                                <img src={preview} alt="Preview" className="w-full aspect-[4/3] object-cover" />
                                <button
                                    onClick={() => { setPhoto(null); setPreview(null); setStep('photo'); }}
                                    className="absolute top-3 right-3 w-9 h-9 bg-black/60 backdrop-blur-sm text-white rounded-full flex items-center justify-center active:scale-90"
                                >
                                    <IconX className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => fileRef.current?.click()}
                                className="w-full aspect-[4/3] rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 flex flex-col items-center justify-center gap-4 active:scale-[0.98] transition-all"
                            >
                                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                                    <IconCamera className="w-10 h-10 text-primary" />
                                </div>
                                <div className="text-center">
                                    <p className="font-black text-gray-900 dark:text-white text-lg">Take a Photo</p>
                                    <p className="text-sm text-gray-400 mt-1">Tap to open camera or gallery</p>
                                </div>
                            </button>
                        )}

                        {preview && (
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => { setPhoto(null); setPreview(null); fileRef.current?.click(); }}
                                    className="py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                                >
                                    <IconCamera className="w-4 h-4" /> Retake
                                </button>
                                <button
                                    onClick={() => setStep('location')}
                                    className="py-3 rounded-2xl bg-primary text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-primary/30 active:scale-95 transition-all"
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ── STEP 2: LOCATION ────────────────────────────── */}
                {step === 'location' && (
                    <div className="space-y-4">
                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <IconMapPin className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-black text-gray-900 dark:text-white text-sm">GPS Location</p>
                                    <p className="text-xs text-gray-400">Captured with your activity</p>
                                </div>
                            </div>

                            {locLoading ? (
                                <div className="flex items-center gap-3 py-4">
                                    <IconLoader2 className="w-5 h-5 text-primary animate-spin" />
                                    <span className="text-sm text-gray-500 font-medium">Getting your location…</span>
                                </div>
                            ) : location ? (
                                <div className="space-y-2">
                                    {location.name && (
                                        <p className="font-bold text-gray-900 dark:text-white text-sm">{location.name}</p>
                                    )}
                                    <p className="text-xs text-gray-400 font-mono">
                                        {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                                    </p>
                                    <a
                                        href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-xs text-primary font-bold mt-1"
                                    >
                                        View on Maps →
                                    </a>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-sm text-gray-400">Location not available — you can continue without it.</p>
                                    <button onClick={requestLocation} className="flex items-center gap-2 text-sm text-primary font-bold">
                                        <IconCurrentLocation className="w-4 h-4" /> Try again
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setStep('photo')} className="py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-bold text-sm active:scale-95 transition-all">
                                ← Back
                            </button>
                            <button onClick={() => setStep('comment')} className="py-3 rounded-2xl bg-primary text-white font-bold text-sm shadow-md shadow-primary/30 active:scale-95 transition-all">
                                Next →
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STEP 3: COMMENT ─────────────────────────────── */}
                {step === 'comment' && (
                    <div className="space-y-4">
                        {/* Photo Thumbnail */}
                        {preview && (
                            <div className="rounded-2xl overflow-hidden h-40">
                                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                        )}

                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                                Activity Note
                            </label>
                            <textarea
                                rows={5}
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                placeholder="What are you doing? Where are you visiting? Any notes to share with your manager…"
                                className="w-full bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 resize-none outline-none leading-relaxed font-medium"
                                maxLength={1000}
                            />
                            <p className="text-right text-[10px] text-gray-300 mt-2">{comment.length}/1000</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setStep('location')} className="py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-bold text-sm active:scale-95 transition-all">
                                ← Back
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="py-3 rounded-2xl bg-primary text-white font-black text-sm shadow-md shadow-primary/30 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {submitting ? <IconLoader2 className="w-4 h-4 animate-spin" /> : <IconCheck className="w-4 h-4" />}
                                {submitting ? 'Submitting…' : 'Submit'}
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
