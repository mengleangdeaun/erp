import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { IconQrcode, IconDeviceMobileMessage } from '@tabler/icons-react';
import { toast } from 'sonner';

export default function EmployeePwaScan() {
    const navigate = useNavigate();
    const [scanError, setScanError] = useState('');

    useEffect(() => {
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
            // Check if the decoded text is the expected attendance URL format
            try {
                let payload = '';
                console.log("Scanned QR Data:", decodedText);

                // Safely extract payload without depending on strict URL() validation
                // which crashes if the scanner reads "127.0.0.1:8000" instead of "http://127.0.0.1:8000"
                if (decodedText.includes('payload=')) {
                    const searchPart = decodedText.split('payload=')[1];
                    payload = searchPart.split('&')[0] || '';
                } else {
                    // It might just be the raw base64 payload if scanned differently
                    payload = decodedText;
                }

                if (payload) {
                    html5QrcodeScanner.clear(); // Stop the camera
                    navigate(`/attendance/scan?payload=${payload}`);
                } else {
                    toast.error("Invalid QR Code FORMAT");
                    setScanError("This does not appear to be a valid S-Cool CRM Branch QR Code.");
                }

            } catch (err) {
                console.error(err);
                toast.error("Invalid QR Code");
                setScanError("Failed to parse the QR Code data.");
            }
        };

        html5QrcodeScanner.render(onScanSuccess, (error) => {
            // Ignoring frequent scan errors (expected while seeking QR)
        });

        // Cleanup on unmount
        return () => {
            html5QrcodeScanner.clear().catch(error => {
                console.error("Failed to clear scanner: ", error);
            });
        };
    }, [navigate]);


    return (
        <div className="flex flex-col min-h-screen bg-gray-900 dark:bg-black relative overflow-hidden">

            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-0 w-full h-64 bg-primary/20 blur-[100px] rounded-full pointer-events-none -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none translate-y-1/2 translate-x-1/2"></div>

            {/* Glassmorphism Top Header */}
            <div className="p-4 sticky top-0 z-40 bg-gray-900/60 backdrop-blur-md border-b border-white/5 flex items-center justify-center">
                <h1 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 flex items-center gap-2 tracking-wide">
                    <IconQrcode className="w-6 h-6 text-primary" />
                    Scan to Clock In
                </h1>
            </div>

            <div className="flex-1 flex flex-col items-center justify-start pt-8 p-6 z-10">

                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8 text-center max-w-sm backdrop-blur-sm shadow-xl">
                    <p className="text-gray-300 font-medium text-sm leading-relaxed">
                        Point your camera at the <span className="text-white font-bold">Branch QR Code</span> located at the entrance to clock your attendance.
                    </p>
                </div>

                {/* The camera mount container with a premium scanner frame */}
                <div className="relative w-full max-w-[320px] aspect-[4/5] mx-auto group">

                    {/* Corner accents for "Scanner" look */}
                    <div className="absolute -top-2 -left-2 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-3xl z-20"></div>
                    <div className="absolute -top-2 -right-2 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-3xl z-20"></div>
                    <div className="absolute -bottom-2 -left-2 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-3xl z-20"></div>
                    <div className="absolute -bottom-2 -right-2 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-3xl z-20"></div>

                    {/* Scanning Laser Animation */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-primary/80 shadow-[0_0_15px_rgba(var(--color-primary),1)] z-30 animate-[scan_2.5s_ease-in-out_infinite_alternate]"></div>

                    <div className="w-full h-full bg-black rounded-2xl overflow-hidden shadow-2xl relative z-10 ring-1 ring-white/10" id="reader">
                        {/* The Html5Qrcode library injects here */}
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-0">
                            <IconQrcode className="w-16 h-16 text-white/10 animate-pulse" />
                        </div>
                    </div>
                </div>

                {/* Global CSS overrides for the ugly html5-qrcode injected elements */}
                <style>{`
                    #reader__dashboard_section_csr span { color: #fff !important; font-family: 'Inter', sans-serif !important; }
                    #reader__dashboard_section_csr button { background: #4361ee !important; color: white !important; border: none !important; border-radius: 8px !important; padding: 6px 16px !important; font-weight: bold !important; margin-top: 10px !important; cursor: pointer; transition: 0.2s;}
                    #reader__dashboard_section_csr select { background: #1f2937 !important; color: white !important; border: 1px solid #374151 !important; border-radius: 8px !important; padding: 6px !important; font-family: 'Inter', sans-serif !important; outline: none; margin-bottom: 5px;}
                    #reader__dashboard_section_swaplink { color: #4361ee !important; text-decoration: none !important; margin-top: 10px !important; display: inline-block !important; font-weight: 600 !important; }
                    #reader a { color: #4361ee !important; }
                    #reader__scan_region { background: black !important; border-radius: 12px; overflow: hidden; }
                    #reader__scan_region video { object-fit: cover !important; min-height: 100% !important; border-radius: 12px;}
                    @keyframes scan {
                        0% { top: 5%; }
                        100% { top: 95%; }
                    }
                `}</style>

                {scanError && (
                    <div className="mt-8 bg-red-500/10 border border-red-500/20 backdrop-blur-md p-4 rounded-2xl text-center shadow-lg w-full max-w-sm animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center justify-center gap-2 text-red-400 font-bold mb-1">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                            Error Detected
                        </div>
                        <p className="text-sm font-medium text-red-200/80">{scanError}</p>
                    </div>
                )}
            </div>

            <div className="h-6"></div>
        </div>
    );
}
