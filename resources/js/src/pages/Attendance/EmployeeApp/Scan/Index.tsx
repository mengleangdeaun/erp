import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { IconMapPin, IconLoader2, IconCheck, IconX } from '@tabler/icons-react';
import { Button } from '../../../../components/ui/button';

export default function MobileEmployeeScan() {
    const [searchParams] = useSearchParams();
    const payload = searchParams.get('payload');

    const [status, setStatus] = useState<'idle' | 'locating' | 'verifying' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('Ready to scan');
    const [distance, setDistance] = useState<number | null>(null);

    // Grab cached token from local storage (set during the personal QR login)
    const authToken = localStorage.getItem('employee_auth_token');
    const employeeName = localStorage.getItem('employee_name');

    useEffect(() => {
        if (!authToken) {
            setStatus('error');
            setMessage('You are not logged in. Please ask HR for your Personal Login QR code first.');
            return;
        }

        if (!payload) {
            setStatus('error');
            setMessage('Invalid Branch QR Code.');
            return;
        }

        startAttendanceScan();
    }, [payload, authToken]);

    const startAttendanceScan = () => {
        setStatus('locating');
        setMessage('Acquiring GPS Location. Please allow location permissions if prompted...');

        if (!navigator.geolocation) {
            setStatus('error');
            setMessage('Geolocation is not supported by your browser.');
            return;
        }

        const getFallbackPosition = () => {
            setMessage('High accuracy timeout. Retrying with standard accuracy...');
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    verifyAndClockIn(latitude, longitude);
                },
                (error) => {
                    setStatus('error');
                    if (error.code === error.PERMISSION_DENIED) {
                        setMessage('Location Access Denied. You must allow location access to clock in.');
                    } else {
                        setMessage('Failed to get your location. Please check your GPS signal and ensure location services are enabled.');
                    }
                },
                // Fallback: 15 seconds timeout, accept location up to 60 seconds old
                { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
            );
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                verifyAndClockIn(latitude, longitude);
            },
            (error) => {
                // If it's a permission issue, don't fallback, just show error
                if (error.code === error.PERMISSION_DENIED) {
                    setStatus('error');
                    setMessage('Location Access Denied. You must allow location access to clock in.');
                } else {
                    // Timeout or Position Unavailable -> Try Fallback
                    getFallbackPosition();
                }
            },
            // High Accuracy: 5 seconds timeout (fail fast), accept location up to 60 seconds old (instant load if cached)
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
        );
    };

    const verifyAndClockIn = async (user_lat: number, user_lng: number) => {
        setStatus('verifying');
        setMessage('Verifying your location against the Branch geo-fence...');

        try {
            // First decode the branch QR we just scanned so we get the branch_code
            const decodedQr = JSON.parse(atob(payload as string));
            const branchCode = decodedQr.branch_code;

            if (!branchCode) throw new Error("Invalid Branch Payload");

            const res = await fetch('/api/attendance/scan/clock', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    auth_token: authToken,
                    branch_code: branchCode,
                    user_lat,
                    user_lng
                })
            });

            const data = await res.json();

            if (res.ok) {
                setStatus('success');
                setMessage(data.message); // e.g. "Successfully Clocked IN!"
                toast.success(data.message);
            } else {
                setStatus('error');
                setMessage(data.message || 'Verification Failed.');
                if (data.distance) setDistance(data.distance);
                toast.error('Clock-in Failed');
            }
        } catch (err) {
            setStatus('error');
            setMessage('Error reading the QR code or communicating with the server.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center space-y-6 border border-gray-100 dark:border-gray-700">

                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Attendance Scanner</h3>
                <h2 className="text-xl font-bold dark:text-white">Hi, {employeeName || 'Employee'}</h2>

                {(status === 'locating' || status === 'verifying') && (
                    <div className="flex flex-col items-center text-primary py-8">
                        <IconLoader2 size={64} className="animate-spin mb-4" />
                        <h2 className="text-xl font-bold">{status === 'locating' ? 'Locating...' : 'Verifying...'}</h2>
                        <p className="text-gray-500 mt-2 max-w-xs">{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center text-green-600 py-6">
                        <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center mb-4">
                            <IconCheck size={48} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Done!</h2>
                        <p className="text-gray-500 font-medium mt-2">{message}</p>

                        <Button
                            className="mt-8 w-full"
                            onClick={() => window.close()}
                            variant="outline"
                        >
                            Close Page
                        </Button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center text-red-600 py-6">
                        <div className="h-24 w-24 rounded-full bg-red-100 flex items-center justify-center mb-4">
                            <IconX size={48} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Failed</h2>
                        <p className="text-gray-600 dark:text-gray-300 font-medium">{message}</p>

                        {distance && (
                            <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm font-bold">
                                <IconMapPin size={18} />
                                Distance calculated: {distance} meters away
                            </div>
                        )}

                        <Button
                            className="mt-8 w-full"
                            onClick={() => startAttendanceScan()}
                        >
                            Try Again
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
