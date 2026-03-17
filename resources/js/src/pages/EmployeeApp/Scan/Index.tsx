import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { IconQrcode, IconArrowLeft, IconBolt, IconBoltOff } from '@tabler/icons-react';
import { toast } from 'sonner';

export default function EmployeePwaScan() {
    const navigate = useNavigate();
    const [scanError, setScanError] = useState('');
    const [isFlashOn, setIsFlashOn] = useState(false);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const html5QrCodeScannerRef = useRef<Html5Qrcode | null>(null);
    const isScanningRef = useRef(false);

    useEffect(() => {
        let isMounted = true;
        let isStopping = false;
        isScanningRef.current = false; // Reset on mount
        const scannerId = "reader";
        const html5QrCode = new Html5Qrcode(scannerId);
        html5QrCodeScannerRef.current = html5QrCode;

        const config = {
            fps: 20,
            qrbox: { width: 260, height: 260 },
        };

        const onScanSuccess = (decodedText: string) => {
            if (isScanningRef.current) return; // Guard against multiple triggers
            
            try {
                let payload = '';
                if (decodedText.includes('payload=')) {
                    const searchPart = decodedText.split('payload=')[1];
                    payload = searchPart.split('&')[0] || '';
                } else if (decodedText.includes('?b=')) {
                    const url = new URL(decodedText);
                    const b = url.searchParams.get('b');
                    const s = url.searchParams.get('s');
                    if (b && s) {
                        isScanningRef.current = true;
                        // Navigation will trigger unmount and cleanup
                        navigate(`/attendance/scan?b=${b}&s=${s}`, { replace: true });
                        return;
                    }
                } else {
                    payload = decodedText;
                }

                if (payload) {
                    isScanningRef.current = true;
                    // Navigation will trigger unmount and cleanup
                    navigate(`/attendance/scan?payload=${payload}`, { replace: true });
                }
            } catch (err) {
                console.error(err);
                isScanningRef.current = false; // Reset on error to allow retry
            }
        };

        // Delay start slightly to ensure DOM is fully ready
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
                    setScanError("Camera access failed. Please ensure permissions are granted.");
                }
            });
        }, 300);

        return () => {
            isMounted = false;
            clearTimeout(timer);
            if (html5QrCode.isScanning && !isStopping) {
                isStopping = true;
                html5QrCode.stop().catch(e => {
                    if (!e?.includes?.('already stopped')) {
                        console.error("Scanner cleanup error:", e);
                    }
                });
            }
        };
    }, [navigate]);

    const toggleFlash = () => {
        if (!html5QrCodeScannerRef.current) return;
        try {
            const newState = !isFlashOn;
            html5QrCodeScannerRef.current.applyVideoConstraints({
                advanced: [{ torch: newState } as any]
            });
            setIsFlashOn(newState);
        } catch (e) {
            toast.error("Flash not supported on this device");
        }
    };

    return (
        <div className="flex flex-col h-screen bg-black relative overflow-hidden text-white font-sans">
            
            {/* The Camera View - Full Screen */}
            <div id="reader" className="absolute inset-0 z-0 bg-transparent"></div>

            {/* Immersive Overlay */}
            <div className="absolute inset-0 z-10 flex flex-col pointer-events-none">
                {/* Custom Mask - SVG for perfect scaling and transparency */}
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                    <defs>
                        <mask id="mask">
                            <rect width="100%" height="100%" fill="white" />
                            {/* The Scanning Hole - Perfectly Centered without transform jitter */}
                            <rect x="calc(50% - 130px)" y="calc(50% - 130px)" width="260" height="260" rx="40" fill="black" />
                        </mask>
                    </defs>
                    <rect width="100%" height="100%" fill="rgba(0,0,0,0.4)" mask="url(#mask)" />
                </svg>

                {/* UI Brackets & Animation - Absolutely Centered */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-[260px] h-[260px]">
                        {/* Brackets */}
                        <div className="absolute -top-1 -left-1 w-12 h-12 border-t-[5px] border-l-[5px] border-primary rounded-tl-3xl shadow-[0_0_15px_rgba(67,97,238,0.5)]"></div>
                        <div className="absolute -top-1 -right-1 w-12 h-12 border-t-[5px] border-r-[5px] border-primary rounded-tr-3xl shadow-[0_0_15px_rgba(67,97,238,0.5)]"></div>
                        <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-[5px] border-l-[5px] border-primary rounded-bl-3xl shadow-[0_0_15px_rgba(67,97,238,0.5)]"></div>
                        <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-[5px] border-r-[5px] border-primary rounded-br-3xl shadow-[0_0_15px_rgba(67,97,238,0.5)]"></div>

                        {/* Scanning Laser Line */}
                        <div className="absolute top-0 left-4 right-4 h-[2px] bg-primary/80 shadow-[0_0_15px_rgba(67,97,238,1)] z-30 animate-laser"></div>
                        
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-14 w-[300px] text-center">
                            <p className="text-white text-lg font-black tracking-wide drop-shadow-lg">
                                Ready to Scan
                            </p>
                            <p className="text-gray-300/80 text-xs font-bold mt-2 uppercase tracking-[0.2em]">
                                Align the Branch QR code within the frame
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Controls - Absolute Bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-10 flex items-center justify-around w-full pointer-events-auto bg-gradient-to-t from-black/80 to-transparent">
                    <button 
                        onClick={() => navigate(-1)}
                        className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 active:scale-90 transition-transform shadow-2xl"
                    >
                        <IconArrowLeft className="w-6 h-6" />
                    </button>

                    <div className="w-1 bg-white/10 h-8 rounded-full"></div>

                    <button 
                        onClick={toggleFlash}
                        className={`w-14 h-14 rounded-full backdrop-blur-md flex items-center justify-center border border-white/20 active:scale-90 transition-transform shadow-2xl ${isFlashOn ? 'bg-primary text-white' : 'bg-white/10'}`}
                    >
                        {isFlashOn ? <IconBolt className="w-6 h-6" /> : <IconBoltOff className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Global & Animation CSS */}
            <style>{`
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
            `}</style>

            {scanError && (
                <div className="absolute top-20 left-6 right-6 z-50 p-4 bg-red-600/90 backdrop-blur-xl rounded-[2rem] text-center shadow-2xl border border-red-500/50 animate-in fade-in slide-in-from-top-4">
                    <p className="text-white text-sm font-black tracking-tight">{scanError}</p>
                </div>
            )}
        </div>
    );
}
