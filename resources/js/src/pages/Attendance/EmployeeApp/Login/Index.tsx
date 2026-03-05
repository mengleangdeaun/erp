import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { IconCheck, IconX, IconLoader2, IconQrcode } from '@tabler/icons-react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';

export default function MobileEmployeeLogin() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const payload = searchParams.get('payload');

    const [status, setStatus] = useState<'scan' | 'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Authenticating your device...');
    const [employeeName, setEmployeeName] = useState('');
    const [scanError, setScanError] = useState('');

    const authenticate = async (authPayload: string) => {
        setStatus('loading');
        setMessage('Authenticating your device...');
        try {
            const res = await fetch('/api/attendance/employee-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ payload: authPayload })
            });

            const data = await res.json();

            if (res.ok) {
                // Store the raw token requested from the server for future GPS clock-ins
                localStorage.setItem('employee_auth_token', data.auth_token);
                localStorage.setItem('employee_name', data.employee.name);
                localStorage.setItem('employee_code', data.employee.code);

                setEmployeeName(data.employee.name);
                setStatus('success');
                setMessage('Device Authenticated successfully.');
                toast.success('Login Successful');

                // Auto-redirect to the new PWA Dashboard
                setTimeout(() => {
                    navigate('/employee/dashboard');
                }, 2000);
            } else {
                setStatus('error');
                setMessage(data.message || 'Authentication failed. Please request a new QR code.');
                toast.error('Login Failed');
            }
        } catch (err) {
            setStatus('error');
            setMessage('Network error occurred while trying to authenticate.');
        }
    };

    useEffect(() => {
        if (!payload) {
            setStatus('scan');
            setMessage('Scan your Personal QR code to login.');
            return;
        }

        authenticate(payload);
    }, [payload]);

    useEffect(() => {
        if (status !== 'scan') return;

        const scannerId = "reader";
        const config = {
            fps: 10,
            qrbox: function (viewfinderWidth: number, viewfinderHeight: number) {
                const minEdgePercentage = 0.7; // 70% of the smallest edge
                const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
                const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
                return {
                    width: qrboxSize,
                    height: qrboxSize
                };
            },
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
        };

        const html5QrcodeScanner = new Html5QrcodeScanner(scannerId, config, false);

        const onScanSuccess = (decodedText: string) => {
            try {
                let scannedPayload = '';

                // Show a brief toast of raw output so the user knows scanning worked
                toast.info(`QR Detected: ${decodedText.substring(0, 20)}...`);

                // The backend generates URLs like: "http://domain.com/attendance/login?payload=BASE64_STRING"
                if (decodedText.includes('payload=')) {
                    // Method 1: URLSearchParams
                    try {
                        const urlParams = new URLSearchParams(decodedText.split('?')[1] || '');
                        scannedPayload = urlParams.get('payload') || '';
                    } catch (e) { }

                    // Method 2: String split fallback
                    if (!scannedPayload) {
                        const searchPart = decodedText.split('payload=')[1];
                        scannedPayload = searchPart?.split('&')[0] || '';
                    }
                } else {
                    scannedPayload = decodedText; // Raw Base64 string directly
                }

                if (scannedPayload) {
                    html5QrcodeScanner.clear();
                    authenticate(scannedPayload);
                } else {
                    toast.error("Invalid QR Code FORMAT");
                    setScanError(`QR format not recognized. Debug Info: ${decodedText}`);
                }
            } catch (err) {
                console.error(err);
                toast.error("Invalid QR Code Extract Error");
                setScanError("Failed to parse the QR Code data.");
            }
        };

        html5QrcodeScanner.render(onScanSuccess, (error) => { });

        return () => {
            html5QrcodeScanner.clear().catch(error => {
                console.error("Failed to clear scanner: ", error);
            });
        };
    }, [status]);


    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center space-y-6 border border-gray-100 dark:border-gray-700">

                {status === 'scan' && (
                    <div className="flex flex-col items-center w-full">
                        <div className="bg-primary/10 rounded-full p-4 mb-4">
                            <IconQrcode size={48} className="text-primary" />
                        </div>
                        <h2 className="text-xl font-bold dark:text-white mb-2">PWA Login</h2>
                        <p className="text-gray-500 font-medium text-sm mb-6">{message}</p>

                        <div className="w-full bg-black rounded-lg overflow-hidden flex items-center justify-center min-h-[300px]">
                            <div id="reader" className="w-full h-full text-white"></div>
                        </div>

                        {/* Global CSS overrides for the ugly html5-qrcode injected elements */}
                        <style>{`
                            #reader__dashboard_section_csr span { color: #fff !important; font-family: 'Inter', sans-serif !important; }
                            #reader__dashboard_section_csr button { background: #4361ee !important; color: white !important; border: none !important; border-radius: 8px !important; padding: 6px 16px !important; font-weight: bold !important; margin-top: 10px !important; cursor: pointer; transition: 0.2s;}
                            #reader__dashboard_section_csr select { background: #1f2937 !important; color: white !important; border: 1px solid #374151 !important; border-radius: 8px !important; padding: 6px !important; font-family: 'Inter', sans-serif !important; outline: none; margin-bottom: 5px;}
                            #reader__dashboard_section_swaplink { color: #4361ee !important; text-decoration: none !important; margin-top: 10px !important; display: inline-block !important; font-weight: 600 !important; }
                            #reader a { color: #4361ee !important; }
                        `}</style>

                        {scanError && (
                            <p className="mt-4 text-red-500 text-sm font-medium">{scanError}</p>
                        )}
                        <p className="mt-6 text-xs text-gray-400">Please allow camera access when prompted.</p>
                    </div>
                )}

                {status === 'loading' && (
                    <div className="flex flex-col items-center text-primary">
                        <IconLoader2 size={64} className="animate-spin mb-4" />
                        <h2 className="text-xl font-bold">Verifying Target Device</h2>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center text-green-600 animate-in fade-in zoom-in duration-500">
                        <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center mb-4 shadow-inner">
                            <IconCheck size={48} className="animate-bounce" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome, {employeeName}!</h2>
                        <p className="text-gray-500 font-medium mt-2">{message}</p>

                        <div className="mt-8 flex flex-col items-center justify-center space-y-4 w-full">
                            <IconLoader2 size={32} className="animate-spin text-primary" />
                            <p className="text-sm font-bold text-primary animate-pulse">Entering Employee App...</p>

                            <button
                                onClick={() => navigate('/employee/dashboard')}
                                className="mt-4 px-6 py-2 bg-primary text-white rounded-full font-bold shadow-md hover:shadow-lg transition-all active:scale-95 text-sm"
                            >
                                Continue to Dashboard now
                            </button>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center text-red-600">
                        <div className="h-24 w-24 rounded-full bg-red-100 flex items-center justify-center mb-4">
                            <IconX size={48} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h2>
                        <p className="text-gray-500 font-medium mt-2">{message}</p>
                        <button
                            onClick={() => {
                                setStatus('scan');
                                setMessage('Scan your Personal QR code to login.');
                            }}
                            className="mt-6 px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-full font-bold shadow-md hover:shadow-lg transition-all active:scale-95 text-sm"
                        >
                            Try Again
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}
