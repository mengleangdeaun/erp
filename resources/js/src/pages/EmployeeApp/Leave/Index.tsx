import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { IconCalendarEvent, IconPlus, IconClock, IconCheck, IconX, IconAlertCircle } from '@tabler/icons-react';
import dayjs from 'dayjs';
import PageHeader from '@/components/ui/PageHeader';

export default function LeaveIndex() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<any[]>([]);
    const [balances, setBalances] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'history'>('all');

    const fetchData = async () => {
        const token = localStorage.getItem('employee_auth_token');
        if (!token) {
            navigate('/attendance/login');
            return;
        }

        try {
            const [reqRes, balRes] = await Promise.all([
                fetch('/api/employee-app/leave-requests', { headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` } }),
                fetch('/api/employee-app/my-leave-balances', { headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` } })
            ]);

            if (reqRes.status === 401) {
                localStorage.removeItem('employee_auth_token');
                navigate('/attendance/login');
                return;
            }

            if (reqRes.ok) {
                const reqData = await reqRes.json();
                setRequests(Array.isArray(reqData) ? reqData : []);
            }
            if (balRes.ok) {
                const balData = await balRes.json();
                setBalances(Array.isArray(balData) ? balData : []);
            }
        } catch (e) {
            toast.error('Network error loading leave data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCancel = async (id: number) => {
        const token = localStorage.getItem('employee_auth_token');
        if (!confirm('Are you sure you want to cancel this leave request?')) return;

        try {
            const res = await fetch(`/api/employee-app/leave-requests/${id}/cancel`, {
                method: 'PUT',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                toast.success('Leave request cancelled');
                fetchData();
            } else {
                const data = await res.json();
                toast.error(data.message || 'Failed to cancel request');
            }
        } catch (e) {
            toast.error('An error occurred');
        }
    };

    const filteredRequests = requests.filter(req => {
        if (activeTab === 'all') return true;
        if (activeTab === 'pending') return req.status === 'pending';
        if (activeTab === 'history') return req.status === 'approved' || req.status === 'rejected' || req.status === 'cancelled';
        return true;
    });

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'pending': return { icon: <IconClock className="w-4 h-4" />, color: 'text-warning bg-warning/10 border-warning/20', label: 'Pending' };
            case 'approved': return { icon: <IconCheck className="w-4 h-4" />, color: 'text-success bg-success/10 border-success/20', label: 'Approved' };
            case 'rejected': return { icon: <IconX className="w-4 h-4" />, color: 'text-danger bg-danger/10 border-danger/20', label: 'Rejected' };
            case 'cancelled': return { icon: <IconAlertCircle className="w-4 h-4" />, color: 'text-gray-500 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700', label: 'Cancelled' };
            default: return { icon: <IconClock className="w-4 h-4" />, color: 'text-gray-500 bg-gray-100', label: status };
        }
    };

    const getDurationLabel = (type: string, days: number) => {
        const typeLabels: any = {
            'full_day': 'Full Day',
            'first_half': 'Morning (First Half)',
            'second_half': 'Afternoon (Second Half)',
            'multi_day': 'Multiple Days',
            'custom_time': 'Custom Time'
        };
        return `${typeLabels[type] || type} (${days} days)`;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[60vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-[#060818] pb-24">
            <PageHeader
                title="Leave Requests"
                icon={<IconCalendarEvent className="w-4 h-4" />}
                rightAction={
                    <button
                        onClick={() => navigate('/employee/leave/create')}
                        className="w-9 h-9 bg-primary text-white rounded-xl flex items-center justify-center shadow-md shadow-primary/30 active:scale-90 transition-all"
                        aria-label="New Request"
                    >
                        <IconPlus className="w-4 h-4" />
                    </button>
                }
            />

            <div className="p-4 space-y-6">

                {/* Horizontal Balance Scroll */}
                <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">Balances</h3>
                    <div className="flex gap-3 overflow-x-auto pb-2 snap-x hide-scrollbars">
                        {balances.map((b, i) => (
                            <div key={i} className="snap-start shrink-0 w-32 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden flex flex-col items-center justify-center">
                                <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: b.leave_type?.color || '#3b82f6' }}></div>
                                <span className="text-xs font-semibold text-gray-500 text-center uppercase tracking-wide mb-1 leading-tight line-clamp-1" title={b.leave_type?.name}>
                                    {b.leave_type?.name}
                                </span>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-2xl font-black text-gray-900 dark:text-white">{parseFloat(b.balance)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-gray-200 dark:bg-gray-800 rounded-xl">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'all' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'pending' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        Pending
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'history' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        History
                    </button>
                </div>

                {/* Request List */}
                <div className="space-y-3">
                    {filteredRequests.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center text-gray-500 shadow-sm border border-gray-100 dark:border-gray-700">
                            No leave requests found in this tab.
                        </div>
                    ) : (
                        filteredRequests.map(req => {
                            const status = getStatusConfig(req.status);
                            const isMulti = req.start_date !== req.end_date;
                            const isCustomTime = req.duration_type === 'custom_time' && req.start_time;

                            return (
                                <div key={req.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: req.leave_type?.color || '#3b82f6' }}></div>
                                    <div className="pl-2">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-bold text-gray-900 dark:text-white text-base">
                                                    {req.leave_type?.name || 'Leave'}
                                                </h4>
                                                <span className="text-xs text-gray-500 font-medium">{getDurationLabel(req.duration_type, req.total_days)}</span>
                                            </div>
                                            <div className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 border ${status.color}`}>
                                                {status.icon}
                                                {status.label}
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3 mb-3 border border-gray-100 dark:border-gray-800/50">
                                            <div className="flex items-center gap-3 text-sm font-medium text-gray-800 dark:text-gray-200">
                                                {isMulti ? (
                                                    <>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-gray-400 uppercase tracking-wide">From</span>
                                                            <span>{dayjs(req.start_date).format('MMM D, YYYY')}</span>
                                                        </div>
                                                        <div className="flex-1 border-t-2 border-dashed border-gray-200 dark:border-gray-700 relative">
                                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-50 dark:bg-gray-900 px-1 text-gray-400 text-xs shadow-sm">to</div>
                                                        </div>
                                                        <div className="flex flex-col text-right">
                                                            <span className="text-[10px] text-gray-400 uppercase tracking-wide">To</span>
                                                            <span>{dayjs(req.end_date).format('MMM D, YYYY')}</span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="flex items-center justify-between w-full">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-gray-400 uppercase tracking-wide">Date</span>
                                                            <span>{dayjs(req.start_date).format('MMM D, YYYY')}</span>
                                                        </div>
                                                        {isCustomTime && (
                                                            <div className="flex flex-col text-right">
                                                                <span className="text-[10px] text-gray-400 uppercase tracking-wide">Time</span>
                                                                <span>{dayjs(`2000-01-01 ${req.start_time}`).format('h:mm A')} - {dayjs(`2000-01-01 ${req.end_time}`).format('h:mm A')}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                            <span className="font-semibold text-gray-700 dark:text-gray-300">Reason:</span> {req.reason}
                                        </p>

                                        {req.status === 'rejected' && req.rejection_reason && (
                                            <div className="mt-2 text-xs text-danger bg-danger/5 p-2 rounded-lg border border-danger/10">
                                                <span className="font-bold">Rejection Note:</span> {req.rejection_reason}
                                            </div>
                                        )}

                                        {req.status === 'pending' && (
                                            <div className="mt-3 flex justify-end">
                                                <button
                                                    onClick={() => handleCancel(req.id)}
                                                    className="text-xs text-danger font-semibold hover:bg-danger/10 px-3 py-1.5 rounded-lg transition-colors"
                                                >
                                                    Cancel Request
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <style>{`
                .hide-scrollbars::-webkit-scrollbar { display: none; }
                .hide-scrollbars { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
