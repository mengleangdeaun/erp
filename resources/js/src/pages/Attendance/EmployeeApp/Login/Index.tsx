import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { IconCheck, IconX, IconLoader2, IconQrcode, IconMail, IconLock, IconArrowLeft, IconBolt, IconBoltOff } from '@tabler/icons-react';
import { Html5Qrcode } from 'html5-qrcode';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Button } from '../../../../components/ui/button';

export default function MobileEmployeeLogin() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const payload = searchParams.get('payload');

    const [status, setStatus] = useState<'decision' | 'scan' | 'form' | 'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Checking session...');
    const [employeeName, setEmployeeName] = useState('');
    const [scanError, setScanError] = useState('');
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loggingIn, setLoggingIn] = useState(false);
    const [isFlashOn, setIsFlashOn] = useState(false);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const isScanningRef = useRef(false);

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
                    navigate('/employee/dashboard', { replace: true });
                }, 2000);
            } else {
                setStatus('error');
                setMessage(data.message || 'Authentication failed. Please request a new QR code.');
                toast.error('Login Failed');
            }
        } catch (err) {
            setStatus('error');
            setMessage('Network error occurred while trying to authenticate.');
        } finally {
            isScanningRef.current = false;
        }
    };

    const handleCredentialLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoggingIn(true);
        try {
            const res = await fetch('/api/attendance/login-credentials', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('employee_auth_token', data.auth_token);
                localStorage.setItem('employee_name', data.employee.name);
                localStorage.setItem('employee_code', data.employee.code);

                setEmployeeName(data.employee.name);
                setStatus('success');
                setMessage('Logged in successfully.');
                toast.success('Login Successful');

                setTimeout(() => {
                    navigate('/employee/dashboard', { replace: true });
                }, 1500);
            } else {
                toast.error(data.message || 'Invalid credentials');
            }
        } catch (err) {
            toast.error('Network error occurred.');
        } finally {
            setLoggingIn(false);
        }
    };

    useEffect(() => {
        // Initial Persistence Check: If token exists, go to dashboard
        const existingToken = localStorage.getItem('employee_auth_token');
        if (existingToken) {
            navigate('/employee/dashboard', { replace: true });
            return;
        }

        if (payload) {
            authenticate(payload);
        } else {
            setStatus('decision');
        }
    }, [payload]);

    useEffect(() => {
        if (status !== 'scan') return;

        let isMounted = true;
        let isStopping = false;
        const scannerId = "reader";
        const html5QrCode = new Html5Qrcode(scannerId);
        html5QrCodeRef.current = html5QrCode;

        const config = {
            fps: 20,
            qrbox: { width: 260, height: 260 },
        };

        const onScanSuccess = (decodedText: string) => {
            if (isScanningRef.current) return;

            try {
                let scannedPayload = '';
                if (decodedText.includes('payload=')) {
                    const urlParams = new URLSearchParams(decodedText.split('?')[1] || '');
                    scannedPayload = urlParams.get('payload') || '';
                    if (!scannedPayload) {
                        const searchPart = decodedText.split('payload=')[1];
                        scannedPayload = searchPart?.split('&')[0] || '';
                    }
                } else {
                    scannedPayload = decodedText;
                }

                if (scannedPayload) {
                    isScanningRef.current = true;
                    // We don't call stop here manually anymore to avoid race conditions with cleanup
                    authenticate(scannedPayload);
                }
            } catch (err) {
                console.error(err);
                isScanningRef.current = false;
            }
        };

        const timer = setTimeout(() => {
            if (!isMounted) return;
            html5QrCode.start(
                { facingMode: "environment" },
                config,
                onScanSuccess,
                () => {}
            ).then(() => {
                if (isMounted) setIsCameraReady(true);
            }).catch((err) => {
                if (isMounted) {
                    console.error("Camera start error:", err);
                    setScanError("Failed to start camera. Please check permissions.");
                }
            });
        }, 400);

        return () => {
            isMounted = false;
            clearTimeout(timer);
            if (html5QrCode.isScanning && !isStopping) {
                isStopping = true;
                html5QrCode.stop().catch(e => {
                    // Ignore already stopped errors during cleanup
                    if (!e?.includes?.('already stopped')) {
                        console.error("Scanner cleanup error:", e);
                    }
                });
            }
        };
    }, [status]);

    const toggleFlash = () => {
        if (!html5QrCodeRef.current) return;
        try {
            const newState = !isFlashOn;
            html5QrCodeRef.current.applyVideoConstraints({
                advanced: [{ torch: newState } as any]
            });
            setIsFlashOn(newState);
        } catch (e) {
            toast.error("Flash not supported");
        }
    };


    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl p-10 text-center space-y-8 border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
                {/* Decorative backgrounds */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/5 rounded-tr-full -ml-12 -mb-12 transition-transform group-hover:scale-110" />

                {status === 'decision' && (
                    <div className="flex flex-col items-center w-full space-y-8 relative z-10 animate-in fade-in zoom-in duration-300">
                        <div className="space-y-2">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" color="none" fill="currentColor" viewBox="0 0 24 24"><path opacity="0.5" fill-rule="evenodd" clip-rule="evenodd" d="M22 8.29344C22 11.7692 19.1708 14.5869 15.6807 14.5869C15.0439 14.5869 13.5939 14.4405 12.8885 13.8551L12.0067 14.7333C11.4883 15.2496 11.6283 15.4016 11.8589 15.652C11.9551 15.7565 12.0672 15.8781 12.1537 16.0505C12.1537 16.0505 12.8885 17.075 12.1537 18.0995C11.7128 18.6849 10.4783 19.5045 9.06754 18.0995L8.77362 18.3922C8.77362 18.3922 9.65538 19.4167 8.92058 20.4412C8.4797 21.0267 7.30403 21.6121 6.27531 20.5876L5.2466 21.6121C4.54119 22.3146 3.67905 21.9048 3.33616 21.6121L2.45441 20.7339C1.63143 19.9143 2.1115 19.0264 2.45441 18.6849L10.0963 11.0743C10.0963 11.0743 9.3615 9.90338 9.3615 8.29344C9.3615 4.81767 12.1907 2 15.6807 2C19.1708 2 22 4.81767 22 8.29344Z" fill="currentColor"></path><path d="M17.8853 8.29353C17.8853 9.50601 16.8984 10.4889 15.681 10.4889C14.4635 10.4889 13.4766 9.50601 13.4766 8.29353C13.4766 7.08105 14.4635 6.09814 15.681 6.09814C16.8984 6.09814 17.8853 7.08105 17.8853 8.29353Z" fill="currentColor"></path></svg>
                            </div>
                            <h2 className="text-2xl font-black dark:text-white tracking-tight">Employee Access</h2>
                            <p className="text-gray-400 text-sm font-medium">Choose your preferred login method</p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 w-full">
                            <Button 
                                onClick={() => setStatus('scan')}
                                className="h-16 rounded-2xl border-2 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 flex items-center justify-between px-6 group/btn transition-all active:scale-95"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                        <IconQrcode size={20} />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-sm text-gray-900 dark:text-white">Scan QR Code</p>
                                        <p className="text-[10px] text-gray-400 font-medium">Fast login via camera</p>
                                    </div>
                                </div>
                                <IconChevronRight size={18} className="text-gray-300 group-hover/btn:translate-x-1 transition-transform" />
                            </Button>

                            <Button 
                                onClick={() => setStatus('form')}
                                variant="outline"
                                className="h-16 rounded-2xl border-2 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 flex items-center justify-between px-6 group/btn transition-all active:scale-95"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                        <IconMail size={20} />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-sm text-gray-900 dark:text-white">Account Login</p>
                                        <p className="text-[10px] text-gray-400 font-medium">Using email & password</p>
                                    </div>
                                </div>
                                <IconChevronRight size={18} className="text-gray-300 group-hover/btn:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    </div>
                )}

                {status === 'scan' && (
                    <div className="fixed inset-0 z-[100] bg-transparent animate-in fade-in duration-300">
                        {/* The Camera View - Full Screen inside the state */}
                        <div id="reader" className="absolute inset-0 z-0 bg-transparent"></div>

                        {/* Immersive Overlay */}
                        <div className="absolute inset-0 z-10 flex flex-col pointer-events-none">
                            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                                <defs>
                                    <mask id="mask-login">
                                        <rect width="100%" height="100%" fill="white" />
                                        {/* Perfectly Centered without transform jitter */}
                                        <rect x="calc(50% - 130px)" y="calc(50% - 130px)" width="260" height="260" rx="40" fill="black" />
                                    </mask>
                                </defs>
                                <rect width="100%" height="100%" fill="rgba(0,0,0,0.4)" mask="url(#mask-login)" />
                            </svg>

                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="relative w-[260px] h-[260px]">
                                    <div className="absolute -top-1 -left-1 w-12 h-12 border-t-[5px] border-l-[5px] border-primary rounded-tl-3xl shadow-[0_0_15px_rgba(67,97,238,0.5)]"></div>
                                    <div className="absolute -top-1 -right-1 w-12 h-12 border-t-[5px] border-r-[5px] border-primary rounded-tr-3xl shadow-[0_0_15px_rgba(67,97,238,0.5)]"></div>
                                    <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-[5px] border-l-[5px] border-primary rounded-bl-3xl shadow-[0_0_15px_rgba(67,97,238,0.5)]"></div>
                                    <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-[5px] border-r-[5px] border-primary rounded-br-3xl shadow-[0_0_15px_rgba(67,97,238,0.5)]"></div>
                                    <div className="absolute top-0 left-4 right-4 h-[2px] bg-primary/80 shadow-[0_0_15px_rgba(67,97,238,1)] z-30 animate-laser"></div>
                                    
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-14 w-[300px] text-center">
                                        <p className="text-white text-lg font-black tracking-wide drop-shadow-lg">Scan Personal QR</p>
                                        <p className="text-gray-300/80 text-xs font-bold mt-2 uppercase tracking-[0.2em]">Align your unique authentication code within the frame</p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Controls - Absolute Bottom */}
                            <div className="absolute bottom-0 left-0 right-0 p-10 flex items-center justify-around w-full pointer-events-auto bg-gradient-to-t from-black/80 to-transparent">
                                <button 
                                    onClick={() => setStatus('decision')}
                                    className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 active:scale-90 transition-transform shadow-2xl"
                                >
                                    <IconArrowLeft className="w-6 h-6 text-white" />
                                </button>
                                <div className="w-1 bg-white/10 h-8 rounded-full"></div>
                                <button 
                                    onClick={toggleFlash}
                                    className={`w-14 h-14 rounded-full backdrop-blur-md flex items-center justify-center border border-white/20 active:scale-90 transition-transform shadow-2xl ${isFlashOn ? 'bg-primary text-white' : 'bg-white/10 text-white'}`}
                                >
                                    {isFlashOn ? <IconBolt className="w-6 h-6" /> : <IconBoltOff className="w-6 h-6" />}
                                </button>
                            </div>
                        </div>

                        {scanError && (
                            <div className="fixed top-20 left-6 right-6 z-[110] p-4 bg-red-600/90 backdrop-blur-xl rounded-[2rem] text-center shadow-2xl border border-red-500/50">
                                <p className="text-white text-sm font-black tracking-tight">{scanError}</p>
                            </div>
                        )}
                    </div>
                )}

                {status === 'form' && (
                    <div className="flex flex-col items-center w-full relative z-10 animate-in fade-in slide-in-from-right-4 duration-300 text-left">
                        <button 
                            onClick={() => setStatus('decision')}
                            className="absolute -top-4 -left-2 p-2 text-gray-400 hover:text-gray-900 transition-colors"
                        >
                            <IconArrowLeft size={20} />
                        </button>

                        <div className="text-center mb-8 w-full">
                            <h2 className="text-2xl font-black dark:text-white tracking-tight">Sign In</h2>
                            <p className="text-gray-400 text-xs font-medium mt-1">Access your employee dashboard</p>
                        </div>

                        <form onSubmit={handleCredentialLogin} className="w-full space-y-5">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Email Address</Label>
                                <div className="relative">
                                    <IconMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                                    <Input 
                                        type="email" 
                                        placeholder="name@company.com" 
                                        className="h-14 pl-12 rounded-2xl bg-gray-50 border-gray-100 focus:bg-white focus:ring-primary focus:border-primary transition-all font-semibold"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Secure Password</Label>
                                <div className="relative">
                                    <IconLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                                    <Input 
                                        type="password" 
                                        placeholder="••••••••" 
                                        className="h-14 pl-12 rounded-2xl bg-gray-50 border-gray-100 focus:bg-white focus:ring-primary focus:border-primary transition-all font-semibold"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    />
                                </div>
                            </div>

                            <Button 
                                type="submit" 
                                disabled={loggingIn}
                                className="w-full h-14 rounded-2xl bg-primary text-white font-black text-lg shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-95 mt-4"
                            >
                                {loggingIn ? (
                                    <div className="flex items-center gap-2">
                                        <IconLoader2 className="animate-spin w-5 h-5" />
                                        <span>SIGNING IN...</span>
                                    </div>
                                ) : 'SIGN IN'}
                            </Button>
                        </form>
                    </div>
                )}

                {status === 'loading' && (
                    <div className="flex flex-col items-center text-primary relative z-10 py-10">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 animate-pulse" />
                            <IconLoader2 size={64} className="animate-spin mb-4 relative z-10" />
                        </div>
                        <h2 className="text-xl font-black mt-4">Safe Access</h2>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Verifying Credentials...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center text-green-600 animate-in fade-in zoom-in duration-500 relative z-10 py-10">
                        <div className="h-24 w-24 rounded-[2rem] bg-green-100 flex items-center justify-center mb-6 shadow-xl shadow-green-200/50">
                            <IconCheck size={48} className="animate-bounce" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white">Welcome Back!</h2>
                        <p className="text-gray-400 text-sm font-semibold mt-1">Secure session established for {employeeName}</p>

                        <div className="mt-10 flex flex-col items-center justify-center space-y-4 w-full">
                            <IconLoader2 size={32} className="animate-spin text-primary" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">Launching Dashboard</p>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center text-red-600 relative z-10 py-10">
                        <div className="h-24 w-24 rounded-[2rem] bg-red-100 flex items-center justify-center mb-6 shadow-xl shadow-red-200/50">
                            <IconX size={48} />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white">Access Warning</h2>
                        <p className="text-gray-400 font-bold text-sm mt-1">{message}</p>
                        <Button
                            onClick={() => setStatus('decision')}
                            className="mt-10 px-10 h-14 bg-slate-900 text-white rounded-2xl font-black shadow-lg shadow-slate-900/25 hover:shadow-slate-900/40 transition-all active:scale-95"
                        >
                            TRY AGAIN
                        </Button>
                    </div>
                )}

            </div>
        </div>
    );
}

// Helper icons
function IconChevronRight({ size, className }: { size: number, className?: string }) {
    return (
        <svg 
            width={size} 
            height={size} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <path d="m9 18 6-6-6-6"/>
        </svg>
    );
}

const styles = `
@keyframes laser {
    0% { top: 5%; opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { top: 95%; opacity: 0; }
}
.animate-laser {
    animation: laser 2.5s ease-in-out infinite;
}
#reader, #reader > div {
    height: 100% !important;
    width: 100% !important;
}
video {
    object-fit: cover !important;
    width: 100% !important;
    height: 100% !important;
}
canvas {
    display: none;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
}
