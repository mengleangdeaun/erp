import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { IconMapPin, IconLoader2, IconCheck, IconX, IconArrowLeft } from '@tabler/icons-react';
import { Button } from '../../../../components/ui/button';

export default function MobileEmployeeScan() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const branchCode = searchParams.get('b');
    const signature = searchParams.get('s');

    const [status, setStatus] = useState<'idle' | 'locating' | 'verifying' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('Initializing scan...');
    const [distance, setDistance] = useState<number | null>(null);

    // Grab cached token from local storage
    const authToken = localStorage.getItem('employee_auth_token');
    const employeeName = localStorage.getItem('employee_name');

    useEffect(() => {
        if (!authToken) {
            setStatus('error');
            setMessage('Session expired. Please log in again.');
            return;
        }

        if (!branchCode || !signature) {
            setStatus('error');
            setMessage('Invalid verification data.');
            return;
        }

        startAttendanceScan();
    }, [branchCode, signature, authToken]);

    const startAttendanceScan = () => {
        setStatus('locating');
        setMessage('Detecting your location...');

        if (!navigator.geolocation) {
            setStatus('error');
            setMessage('GPS is not supported on this device.');
            return;
        }

        const handleSuccess = (position: GeolocationPosition) => {
            const { latitude, longitude } = position.coords;
            verifyAndClockIn(latitude, longitude);
        };

        const handleError = (error: GeolocationPositionError) => {
            if (error.code === error.PERMISSION_DENIED) {
                setStatus('error');
                setMessage('Location permission required to clock in.');
            } else {
                // Try one more time with lower accuracy if it was a timeout/unavailable
                navigator.geolocation.getCurrentPosition(handleSuccess, () => {
                    setStatus('error');
                    setMessage('Unable to determine location. Please ensure GPS is enabled.');
                }, { enableHighAccuracy: false, timeout: 10000 });
            }
        };

        navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
            enableHighAccuracy: true,
            timeout: 6000,
            maximumAge: 30000
        });
    };

    const verifyAndClockIn = async (user_lat: number, user_lng: number) => {
        setStatus('verifying');
        setMessage('Verifying your placement...');

        try {
            const res = await fetch('/api/attendance/scan/clock', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    auth_token: authToken,
                    branch_code: branchCode,
                    signature: signature,
                    user_lat,
                    user_lng
                })
            });

            const data = await res.json();

            if (res.ok) {
                setStatus('success');
                setMessage(data.message);
                toast.success('Attendance Recorded');
            } else {
                setStatus('error');
                setMessage(data.message || 'Verification failed');
                if (data.distance) setDistance(data.distance);
                toast.error('Placement Invalid');
            }
        } catch (err) {
            setStatus('error');
            setMessage('Network connection lost.');
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col items-center justify-between p-8 font-sans transition-colors duration-500">
            
            {/* Top Navigation / Status Header */}
            <div className="w-full flex items-center justify-between">
                <button 
                    onClick={() => navigate('/employee/dashboard')}
                    className="p-2 -ml-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    <IconArrowLeft size={24} />
                </button>
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 dark:text-gray-600">
                    S-COOL CRM AUTH
                </div>
                <div className="w-8" /> {/* Spacer */}
            </div>

            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm space-y-12">
                
                {(status === 'locating' || status === 'verifying') && (
                    <div className="flex flex-col items-center space-y-8 animate-in fade-in zoom-in duration-500">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                            <div className="w-24 h-24 rounded-[2.5rem] bg-primary/5 flex items-center justify-center border border-primary/20 relative z-10">
                                <IconLoader2 size={40} className="text-primary animate-spin" />
                            </div>
                        </div>
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Authenticating</h2>
                            <p className="text-gray-400 font-bold text-sm uppercase tracking-widest animate-pulse">{message}</p>
                        </div>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="relative">
                            <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full scale-150" />
                            <div className="w-32 h-32 rounded-[3rem] bg-green-50 dark:bg-green-900/20 flex items-center justify-center shadow-2xl shadow-green-500/20 relative z-10 border border-green-100 dark:border-green-800">
                                <IconCheck size={64} className="text-green-500 animate-in zoom-in spin-in-90 duration-500" />
                            </div>
                        </div>
                        <div className="text-center space-y-3">
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Success!</h2>
                            <p className="text-gray-500 dark:text-gray-400 font-bold text-lg leading-tight px-6">{message}</p>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="relative">
                            <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full scale-150" />
                            <div className="w-32 h-32 rounded-[3rem] bg-red-50 dark:bg-red-900/20 flex items-center justify-center shadow-2xl shadow-red-500/20 relative z-10 border border-red-100 dark:border-red-800">
                                <IconX size={64} className="text-red-500" />
                            </div>
                        </div>
                        <div className="text-center space-y-3">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Access Denied</h2>
                            <p className="text-gray-500 dark:text-red-400 font-bold text-sm leading-tight px-8">{message}</p>
                            
                            {distance && (
                                <div className="mt-6 flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-3xl text-xs font-black uppercase tracking-wider mx-auto w-fit">
                                    <IconMapPin size={16} />
                                    {distance}m away
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Actions */}
            <div className="w-full max-w-sm flex flex-col items-center space-y-4 pb-4">
                {status === 'success' ? (
                    <Button 
                        onClick={() => navigate('/employee/dashboard')}
                        className="w-full h-16 rounded-[2rem] bg-slate-900 hover:bg-black text-white font-black text-lg shadow-2xl shadow-slate-900/20 transition-all active:scale-95"
                    >
                        GO TO DASHBOARD
                    </Button>
                ) : status === 'error' ? (
                    <div className="w-full space-y-3">
                        <Button 
                            onClick={() => startAttendanceScan()}
                            className="w-full h-16 rounded-[2rem] bg-primary text-white font-black text-lg shadow-2xl shadow-primary/20 transition-all active:scale-95"
                        >
                            TRY AGAIN
                        </Button>
                        <Button 
                            variant="outline"
                            onClick={() => navigate('/employee/dashboard')}
                            className="w-full h-16 rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 text-gray-500 font-black"
                        >
                            CANCEL
                        </Button>
                    </div>
                ) : (
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300 dark:text-gray-700">
                        {status === 'locating' ? 'Locating Coordinate...' : 'Validating Token...'}
                    </p>
                )}
            </div>

        </div>
    );
}
