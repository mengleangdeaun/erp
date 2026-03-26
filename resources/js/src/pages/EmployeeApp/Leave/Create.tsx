import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    IconCalendarEvent,
    IconClock,
    IconNotes,
    IconCalendarPlus,
    IconCheck
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import PageHeader from '@/components/ui/PageHeader';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { useTranslation } from 'react-i18next';

export default function LeaveCreate() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [leaveTypes, setLeaveTypes] = useState<any[]>([]);

    const [form, setForm] = useState({
        leave_type_id: '',
        duration_type: 'full_day',
        start_date: dayjs().format('YYYY-MM-DD'),
        end_date: dayjs().format('YYYY-MM-DD'),
        start_time: '09:00',
        end_time: '18:00',
        reason: ''
    });

    useEffect(() => {
        dispatch(setPageTitle(t('new_leave', 'New Leave')));
    }, [dispatch, t]);

    useEffect(() => {
        const token = localStorage.getItem('employee_auth_token');
        if (!token) return navigate('/attendance/login');

        fetch('/api/employee-app/my-leave-balances', {
            headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const map = new Map();
                    data.forEach((d: any) => {
                        if (d.leave_type) map.set(d.leave_type.id, d.leave_type);
                    });
                    setLeaveTypes(Array.from(map.values()));
                }
            });
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.leave_type_id) {
            toast.error('Please select a leave type');
            return;
        }

        setSubmitting(true);
        const token = localStorage.getItem('employee_auth_token');

        const payload = { ...form };

        if (payload.duration_type !== 'multi_day') {
            payload.end_date = payload.start_date;
        }
        if (payload.duration_type !== 'custom_time') {
            delete (payload as any).start_time;
            delete (payload as any).end_time;
        }

        try {
            const res = await fetch('/api/employee-app/leave-requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                toast.success('Leave request submitted successfully');
                navigate('/employee/calendar');
            } else {
                if (data.errors) {
                    Object.values(data.errors).forEach((err: any) => toast.error(err[0]));
                } else {
                    toast.error(data.message || 'Error submitting request');
                }
            }
        } catch (e) {
            toast.error('Network error');
        } finally {
            setSubmitting(false);
        }
    };

    const isMulti = form.duration_type === 'multi_day';
    const isTime = form.duration_type === 'custom_time';

    const durationOptions = [
        { id: 'full_day', label: 'Full Day' },
        { id: 'first_half', label: 'Morning (1st Half)' },
        { id: 'second_half', label: 'Afternoon (2nd Half)' },
        { id: 'multi_day', label: 'Multiple Days' },
        { id: 'custom_time', label: 'Specific Hours' },
    ];

    return (
        <div className="flex flex-col min-h-[100dvh] bg-white dark:bg-[#060818] pb-10">
            <PageHeader title="New Leave" icon={<IconCalendarPlus className="w-4 h-4" />} />

            <form onSubmit={handleSubmit} className="px-5 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">

                {/* 1. Leave Type Selection */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-pink-50 dark:bg-pink-900/20 rounded-lg text-pink-500">
                            <IconCalendarPlus className="w-5 h-5" />
                        </div>
                        <h4 className="font-black text-[10px] uppercase tracking-widest text-gray-400">Leave Type</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                        {leaveTypes.map(type => (
                            <button
                                key={type.id}
                                type="button"
                                onClick={() => setForm({ ...form, leave_type_id: type.id })}
                                className={cn(
                                    "relative p-4 rounded-xl border text-[13px] font-bold transition-all text-left overflow-hidden",
                                    form.leave_type_id == type.id
                                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/10"
                                        : "bg-gray-50 dark:bg-gray-900/50 border-gray-50 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-200"
                                )}
                            >
                                <span className="relative z-10">{type.name}</span>
                                {form.leave_type_id == type.id && (
                                    <IconCheck className="absolute top-1 right-1 w-3 h-3 text-white/50" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. Duration Details */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 space-y-5">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-500">
                            <IconClock className="w-5 h-5" />
                        </div>
                        <h4 className="font-black text-[10px] uppercase tracking-widest text-gray-400">Duration</h4>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Type</label>
                            <select
                                value={form.duration_type}
                                onChange={e => setForm({ ...form, duration_type: e.target.value })}
                                className="w-full h-12 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm font-bold focus:ring-primary focus:border-primary transition-all dark:text-white"
                            >
                                {durationOptions.map(opt => (
                                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className={cn(
                            "grid gap-4 p-4 bg-gray-50/50 dark:bg-gray-900/40 rounded-2xl border border-gray-100 dark:border-gray-800/50",
                            isMulti ? "grid-cols-2" : "grid-cols-1"
                        )}>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">{isMulti ? 'Start' : 'Date'}</label>
                                <input
                                    type="date"
                                    value={form.start_date}
                                    onChange={e => setForm({ ...form, start_date: e.target.value, end_date: !isMulti ? e.target.value : form.end_date })}
                                    className="w-full h-11 bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 rounded-xl px-3 text-sm font-bold dark:text-white"
                                    required
                                />
                            </div>

                            {isMulti && (
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">End</label>
                                    <input
                                        type="date"
                                        value={form.end_date}
                                        onChange={e => setForm({ ...form, end_date: e.target.value })}
                                        min={form.start_date}
                                        className="w-full h-11 bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 rounded-xl px-3 text-sm font-bold dark:text-white"
                                        required
                                    />
                                </div>
                            )}
                        </div>

                        {isTime && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">In</label>
                                    <input
                                        type="time"
                                        value={form.start_time}
                                        onChange={e => setForm({ ...form, start_time: e.target.value })}
                                        className="w-full h-11 bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-700 rounded-xl px-3 text-sm font-bold dark:text-white"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Out</label>
                                    <input
                                        type="time"
                                        value={form.end_time}
                                        onChange={e => setForm({ ...form, end_time: e.target.value })}
                                        className="w-full h-11 bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-700 rounded-xl px-3 text-sm font-bold dark:text-white"
                                        required
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Reason */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-500">
                            <IconNotes className="w-5 h-5" />
                        </div>
                        <h4 className="font-black text-[10px] uppercase tracking-widest text-gray-400">Reason</h4>
                    </div>

                    <textarea
                        value={form.reason}
                        onChange={e => setForm({ ...form, reason: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-700 rounded-xl p-4 text-[13px] font-medium focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none min-h-[100px] dark:text-white"
                        placeholder="Why are you requesting this leave?"
                        required
                    />
                </div>

                {/* Submit Action */}
                <div className="pt-2 pb-12">
                    <button
                        type="submit"
                        disabled={submitting || !form.leave_type_id}
                        className={cn(
                            "w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2.5",
                            submitting || !form.leave_type_id
                                ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                                : "bg-primary text-white shadow-primary/20 hover:shadow-primary/30"
                        )}
                    >
                        {submitting ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Submitting...</span>
                            </div>
                        ) : (
                            <>
                                <span>Request Leave</span>
                                <IconCalendarEvent className="w-5 h-5 opacity-60" />
                            </>
                        )}
                    </button>
                    {!form.leave_type_id && (
                        <p className="text-center text-red-500 text-[9px] mt-4 font-black uppercase tracking-[0.2em] opacity-80">
                            Please pick a leave type
                        </p>
                    )}
                </div>
            </form>
        </div>
    );
}
