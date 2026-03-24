import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSerial, useSerialHistory } from '@/hooks/useSerialData';
import { 
    IconHash, 
    IconRuler2, 
    IconBuildingStore, 
    IconPackage, 
    IconMapPin, 
    IconHistory,
    IconUser,
    IconCar,
    IconChevronRight,
    IconCalendar
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const SerialDetailsDrawer = ({ serialId, isOpen, onClose }: { serialId: number | null, isOpen: boolean, onClose: () => void }) => {
    const { data: serial, isLoading: loadingSerial } = useSerial(serialId);
    const { data: history = [], isLoading: loadingHistory } = useSerialHistory(serialId);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px] h-[90vh] flex flex-col gap-0 p-0 rounded-2xl overflow-hidden border-none shadow-2xl">
                {/* Header Section */}
                <div className="bg-primary/5 p-6 border-b border-primary/10">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <DialogTitle className="flex items-center gap-3 text-2xl font-black tracking-tighter">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <IconHash size={24} />
                                </div>
                                <div className="flex flex-col">
                                    <span>{serial?.serial_number || 'Loading...'}</span>
                                    <span className="text-xs font-bold text-primary uppercase tracking-[0.2em] opacity-70">Roll Serial Details</span>
                                </div>
                            </DialogTitle>
                            {serial?.status && (
                                <Badge 
                                    variant={serial.status === 'Available' ? 'success' : serial.status === 'Empty' ? 'secondary' : 'destructive'}
                                    className="h-6 px-4 text-[10px] font-black uppercase tracking-widest rounded-full"
                                >
                                    {serial.status}
                                </Badge>
                            )}
                        </div>
                    </DialogHeader>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-6 space-y-8">
                        {/* Summary Cards */}
                        {loadingSerial ? (
                            <div className="grid grid-cols-2 gap-4">
                                <Skeleton className="h-24 w-full rounded-2xl" />
                                <Skeleton className="h-24 w-full rounded-2xl" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Remaining Quantity</span>
                                    <div className="flex items-end gap-2">
                                        <span className="text-3xl font-black tracking-tighter text-primary">{parseFloat(serial?.current_quantity || 0).toFixed(2)}</span>
                                        <span className="text-sm font-bold text-gray-400 mb-1">SQM</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full mt-3 overflow-hidden">
                                        <div 
                                            className="h-full bg-primary" 
                                            style={{ width: `${Math.min(100, (parseFloat(serial?.current_quantity || 0) / parseFloat(serial?.initial_quantity || 1)) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Original Size</span>
                                    <div className="flex items-center gap-2">
                                        <IconRuler2 size={20} className="text-primary" />
                                        <span className="text-xl font-black tracking-tight">
                                            {parseFloat(serial?.width || 0).toFixed(2)}m x {parseFloat(serial?.length || 0).toFixed(1)}m
                                        </span>
                                    </div>
                                    <span className="text-xs font-bold text-gray-400 block mt-2 opacity-70">Total Area: {parseFloat(serial?.initial_quantity || 0).toFixed(2)} SQM</span>
                                </div>
                            </div>
                        )}

                        {/* Product & Location Info */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                                <IconPackage size={14} /> Basic Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-gray-950 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                            <IconPackage size={18} />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Product</span>
                                            <span className="font-bold text-gray-900 dark:text-gray-100">{serial?.product?.name || '---'}</span>
                                            <span className="text-xs font-medium text-gray-400 block">{serial?.product?.code}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-600">
                                            <IconBuildingStore size={18} />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Location</span>
                                            <span className="font-bold text-gray-900 dark:text-gray-100">{serial?.branch?.name || '---'}</span>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <IconMapPin size={10} className="text-primary" />
                                                <span className="text-[10px] font-black uppercase text-primary/70">{serial?.location?.name || 'Main Hall'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Consumption History */}
                        <div className="space-y-4 pt-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                                    <IconHistory size={14} /> Consumption History
                                </h3>
                                <Badge variant="secondary" className="h-5 text-[9px] font-black uppercase rounded-full">
                                    {history.length} Transactions
                                </Badge>
                            </div>

                            <div className="space-y-3">
                                {loadingHistory ? (
                                    Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
                                ) : history.length > 0 ? (
                                    history.map((usage: any) => (
                                        <Link 
                                            key={usage.id}
                                            to={`/services/job-cards?id=${usage.job_card?.id}`}
                                            className="group block relative bg-gray-50/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-950 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 transition-all hover:shadow-md cursor-pointer overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <IconChevronRight size={16} className="text-primary" />
                                            </div>
                                            
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                            <IconCalendar size={14} />
                                                        </div>
                                                        <span className="text-xs font-black text-gray-900 dark:text-gray-100">
                                                            {format(new Date(usage.created_at), 'PPP')}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <IconUser size={14} className="text-gray-400" />
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-0.5">Customer</span>
                                                                <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 truncate">
                                                                    {usage.job_card?.customer?.name || 'Walk-in Customer'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <IconCar size={14} className="text-gray-400" />
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-0.5">Vehicle</span>
                                                                <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 truncate">
                                                                    {usage.job_card?.vehicle?.plate_number || '---'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Spent</span>
                                                    <Badge className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-none font-black text-xs">
                                                        - {parseFloat(usage.spent_qty).toFixed(2)} SQM
                                                    </Badge>
                                                    <span className="text-[9px] font-bold text-gray-400 italic">JC-{usage.job_card?.id}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50/50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                                        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 mb-3">
                                            <IconHistory size={24} />
                                        </div>
                                        <p className="text-sm font-bold text-gray-500">No consumption history yet</p>
                                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mt-1">Ready for use in Job Cards</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};

export default SerialDetailsDrawer;
