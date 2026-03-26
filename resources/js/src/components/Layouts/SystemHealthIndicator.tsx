import React, { useEffect, useState, useCallback } from 'react';
import api from '@/utils/api';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
    Activity, 
    Globe, 
    Database, 
    Wifi, 
    WifiOff, 
    AlertTriangle,
    Zap,
    Network
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HealthCheck {
    name: string;
    label: string;
    status: 'ok' | 'warning' | 'failed' | 'crashed';
    shortSummary: string;
    notificationMessage: string;
}

interface HealthResponse {
    finishedAt: number;
    checkResults: HealthCheck[];
}

const SystemHealthIndicator = () => {
    const [status, setStatus] = useState<'loading' | 'online' | 'warning' | 'error' | 'offline'>('loading');
    const [healthData, setHealthData] = useState<HealthResponse | null>(null);
    const [latency, setLatency] = useState<number | null>(null);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    const checkHealth = useCallback(async () => {
        const start = performance.now();
        try {
            // @ts-ignore
            const response = await api.get<HealthResponse>('/health', {
                timeout: 5000,
                headers: { 'Cache-Control': 'no-cache' },
                showProgress: false
            });
            const end = performance.now();
            const currentLatency = Math.round(end - start);
            setLatency(currentLatency);
            setHealthData(response.data);

            const allOk = response.data.checkResults.every(r => r.status === 'ok');
            const anyFailed = response.data.checkResults.some(r => r.status === 'failed' || r.status === 'crashed');

            if (anyFailed) {
                setStatus('error');
            } else if (!allOk || (currentLatency > 800)) {
                setStatus('warning');
            } else {
                setStatus('online');
            }
        } catch (err) {
            setStatus('error');
            setLatency(null);
        }
    }, []);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        const interval = setInterval(() => {
            if (navigator.onLine) {
                checkHealth();
            } else {
                setStatus('offline');
            }
        }, 30000); // Every 30 seconds

        checkHealth();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, [checkHealth]);

    if (!isOnline) {
        return (
            <Badge variant="destructive" dot className="animate-pulse">
                <WifiOff className="w-3 h-3 mr-1" />
                Offline
            </Badge>
        );
    }

    const getStatusColor = () => {
        switch (status) {
            case 'online': return 'success';
            case 'warning': return 'warning';
            case 'error': return 'destructive';
            default: return 'secondary';
        }
    };

    const getStatusIcon = () => {
        switch (status) {
            case 'online': return <Activity className="w-3 h-3 mr-1" />;
            case 'warning': return <AlertTriangle className="w-3 h-3 mr-1" />;
            case 'error': return <Zap className="w-3 h-3 mr-1" />;
            default: return <Activity className="w-3 h-3 mr-1" />;
        }
    };

    return (
        <TooltipProvider delayDuration={100}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="cursor-help transition-all hover:opacity-80">
                        <Badge 
                            variant={getStatusColor()} 
                            dot 
                            className={cn(
                                "font-mono text-[10px] tracking-tight transition-all duration-500",
                                status === 'online' && "hover:shadow-[0_0_8px_rgba(16,185,129,0.4)]",
                                status === 'warning' && "hover:shadow-[0_0_8px_rgba(245,158,11,0.4)]",
                                status === 'error' && "hover:shadow-[0_0_8px_rgba(239,68,68,0.4)] shadow-[0_0_4px_rgba(239,68,68,0.2)]"
                            )}
                        >
                            {getStatusIcon()}
                            {latency !== null ? `${latency}ms` : 'Checking...'}
                        </Badge>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="top" align='end' className="p-3 w-64  bg-background/95 backdrop-blur-sm border shadow-xl">
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between border-b pb-1.5 mb-1.5">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">System Health</span>
                            <span className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase",
                                status === 'online' ? "bg-emerald-500/20 text-emerald-600" : 
                                status === 'warning' ? "bg-amber-500/20 text-amber-600" : "bg-red-500/20 text-red-600"
                            )}>
                                {status.toUpperCase()}
                            </span>
                        </div>
                        
                        <div className="space-y-2 text-xs font-google_sans">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Globe className="w-3.5 h-3.5 text-sky-500" />
                                    <span className='text-muted-foreground'>Latency</span>
                                </div>
                                <span className={cn(
                                    "font-mono font-bold",
                                    latency && latency < 300 ? "text-emerald-500" : 
                                    latency && latency < 800 ? "text-amber-500" : "text-red-500"
                                )}>
                                    {latency} ms
                                </span>
                            </div>

                            {healthData?.checkResults.map((check, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {check.name === 'Database' ? <Database className="w-3.5 h-3.5 text-violet-500" /> : <Network className="w-3.5 h-3.5 text-blue-500" />}
                                        <span className='text-muted-foreground'>{check.label}</span>
                                    </div>
                                    <span className={cn(
                                        "font-bold uppercase text-[10px]",
                                        check.status === 'ok' ? "text-emerald-500" : "text-red-500"
                                    )}>
                                        {check.shortSummary}
                                    </span>
                                </div>
                            ))}
                        </div>
                        
                        <div className="pt-1 text-[9px] text-muted-foreground italic border-t mt-1 flex justify-between">
                            <span>Last checked: {new Date().toLocaleTimeString()}</span>
                        </div>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default SystemHealthIndicator;
