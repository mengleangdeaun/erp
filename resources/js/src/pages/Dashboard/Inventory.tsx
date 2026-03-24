import React, { useState, useMemo, useEffect } from 'react';
import { useInventoryDashboard, useBranches } from '@/hooks/useInventoryData';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { 
    IconPackage, 
    IconAlertTriangle, 
    IconArrowsLeftRight, 
    IconCurrencyDollar,
    IconChartBar,
    IconChartPie,
    IconPlus,
    IconHistory,
    IconLayoutDashboard,
    IconArrowRight,
    IconBuildingStore,
    IconClipboardList
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFormatDate } from '@/hooks/useFormatDate';
import { useTranslation } from 'react-i18next';
import { cn } from '@/components/utils';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { IconRefresh } from '@tabler/icons-react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';

const InventoryDashboard = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const queryClient = useQueryClient();
    const [selectedBranchId, setSelectedBranchId] = useState<string | number | ''>('');
    const { data: branches = [] } = useBranches();
    const { data, isLoading } = useInventoryDashboard(selectedBranchId || null);
    const { formatDate, formatTime } = useFormatDate();
    
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        dispatch(setPageTitle('Inventory Dashboard'));
    }, [dispatch]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await queryClient.invalidateQueries({ queryKey: ['inventory-dashboard', selectedBranchId] });
        } finally {
            setTimeout(() => setIsRefreshing(false), 300);
        }
    };
    

    const branchOptions = useMemo(() => [
        { value: '', label: 'All Branches', description: 'Overall inventory view' },
        ...branches.filter((b: any) => b.status === 'active').map((b: any) => ({ value: b.id, label: b.name, description: b.code }))
    ], [branches]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-10 w-48" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-xl" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-[400px] lg:col-span-2 rounded-xl" />
                    <Skeleton className="h-[400px] rounded-xl" />
                </div>
            </div>
        );
    }

    const { overview, distribution, category_distribution, recent_movements, serial_stats } = data || {};

    return (
        <div className="space-y-6 animate__animated animate__fadeIn">
            {/* Simplified Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20 shadow-sm shrink-0">
                        <IconLayoutDashboard className="text-primary w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                            {t('inventory_dashboard')}
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Real-time overview of your warehouse and stock performance
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                        Update: <span className="text-primary tabular-nums">{formatTime(currentTime)}</span>
                    </div>
                    <div className="w-64">
                        <SearchableSelect
                            options={branchOptions}
                            value={selectedBranchId}
                            onChange={(val) => setSelectedBranchId(val)}
                            placeholder="All Branches"
                        />
                    </div>
                    <Button
                        variant="outline"
                        onClick={handleRefresh}
                        className="h-10 shadow-sm border-gray-200 dark:border-gray-800"
                        title="Refresh Data"
                        disabled={isRefreshing}
                    >
                        <IconRefresh size={20} className={isRefreshing ? 'animate-spin' : ''} /> Refresh
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    title={t('total_products')} 
                    value={overview?.total_products || 0}
                    subValue={`${overview?.active_products || 0} active`}
                    icon={<IconPackage className="text-blue-500" />}
                    color="blue"
                />
                <StatCard 
                    title={t('total_stock_value')} 
                    value={`$${(overview?.total_stock_value || 0).toLocaleString()}`}
                    subValue="Warehouse valuation"
                    icon={<IconCurrencyDollar className="text-green-500" />}
                    color="green"
                />
                <StatCard 
                    title={t('low_stock_alerts')} 
                    value={overview?.low_stock_count || 0}
                    subValue="Items to reorder"
                    icon={<IconAlertTriangle className="text-amber-500" />}
                    color="amber"
                    alert={overview?.low_stock_count > 0}
                />
                <StatCard 
                    title={t('monthly_consumption')} 
                    value={serial_stats?.monthly_consumption || 0}
                    subValue="Units used last 30d"
                    icon={<IconArrowsLeftRight className="text-purple-500" />}
                    color="purple"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Distribution Chart (CSS-based) */}
                <Card className="lg:col-span-8 shadow-sm border-none bg-white dark:bg-black p-0 overflow-hidden">
                    <CardHeader className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <IconBuildingStore size={20} className="text-blue-500" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold">
                                        {distribution?.title || 'Inventory Distribution'}
                                    </CardTitle>
                                    <CardDescription>
                                        {selectedBranchId ? 'Quantities across local warehouse spots' : 'Quantities across all active branches'}
                                    </CardDescription>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-6">
                            {distribution?.data?.map((item: any, idx: number) => {
                                const maxQty = Math.max(...distribution.data.map((i: any) => i.quantity), 1);
                                const percentage = (item.quantity / maxQty) * 100;
                                return (
                                    <div key={idx} className="space-y-2 group">
                                        <div className="flex justify-between items-end">
                                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                {item.name}
                                            </span>
                                            <span className="text-sm font-bold text-primary">
                                                {item.quantity.toLocaleString()} units
                                            </span>
                                        </div>
                                        <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex shadow-inner">
                                            <div 
                                                className="bg-primary/80 group-hover:bg-primary transition-all duration-1000 ease-out rounded-full"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                            {!distribution?.data?.length && <div className="text-center py-10 text-gray-400 italic">No distribution data available</div>}
                        </div>
                    </CardContent>
                </Card>

                {/* Serial Stats (Rolls) */}
                <Card className="lg:col-span-4 shadow-sm border-none bg-white dark:bg-black p-0 overflow-hidden">
                    <CardHeader className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                <IconClipboardList size={20} className="text-purple-500" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold">Film Inventory</CardTitle>
                                <CardDescription>Consumable roll status</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="flex flex-col items-center justify-center space-y-8 h-full">
                            {/* Simple Doughnut Alternative using SVG */}
                            <div className="relative w-48 h-48">
                                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                    <circle cx="18" cy="18" r="16" fill="none" className="stroke-gray-100 dark:stroke-gray-800" strokeWidth="3" />
                                    {(() => {
                                        const total = serial_stats?.total_rolls || 1;
                                        const availablePercent = (serial_stats?.available_rolls / total) * 100;
                                        const consumedPercent = (serial_stats?.consumed_rolls / total) * 100;
                                        return (
                                            <>
                                                <circle 
                                                    cx="18" cy="18" r="16" fill="none" 
                                                    className="stroke-green-500 transition-all duration-1000" 
                                                    strokeWidth="3" 
                                                    strokeDasharray={`${availablePercent} 100`} 
                                                />
                                                <circle 
                                                    cx="18" cy="18" r="16" fill="none" 
                                                    className="stroke-amber-500 transition-all duration-1000" 
                                                    strokeWidth="3" 
                                                    strokeDasharray={`${consumedPercent} 100`} 
                                                    strokeDashoffset={`-${availablePercent}`}
                                                />
                                            </>
                                        );
                                    })()}
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                    <span className="text-3xl font-black text-gray-900 dark:text-white">
                                        {serial_stats?.total_rolls || 0}
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rolls Total</span>
                                </div>
                            </div>

                            <div className="w-full grid grid-cols-2 gap-4">
                                <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/30">
                                    <div className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-1">Available</div>
                                    <div className="text-xl font-bold">{serial_stats?.available_rolls || 0}</div>
                                </div>
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/30">
                                    <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Consumed</div>
                                    <div className="text-xl font-bold">{serial_stats?.consumed_rolls || 0}</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Recent Movements Feed */}
                <Card className="lg:col-span-12 shadow-sm border-none bg-white dark:bg-black p-0 overflow-hidden">
                    <CardHeader className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <IconHistory size={20} className="text-gray-500" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold">Latest Stock Movements</CardTitle>
                                    <CardDescription>Real-time audit trail of all inventory changes</CardDescription>
                                </div>
                            </div>
                            <Link to="/inventory/stock-movements" className="text-xs font-bold text-primary hover:underline flex items-center gap-1 uppercase tracking-wider">
                                View All <IconArrowRight size={14} />
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {recent_movements?.map((move: any, idx: number) => (
                                <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between p-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                                            move.movement_type === 'in' ? "bg-green-100/50 text-green-600" : "bg-red-100/50 text-red-600"
                                        )}>
                                            {move.movement_type === 'in' ? <IconPlus size={20} /> : <IconArrowRight size={20} />}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white-light line-clamp-1">
                                                {move.product?.name}
                                            </h4>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <span className="font-medium text-gray-700 dark:text-gray-400">{move.location?.branch?.name} ({move.location?.name})</span>
                                                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                                <span>{move.user?.full_name}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between md:justify-end gap-12 mt-4 md:mt-0">
                                        <div className="text-right">
                                            <div className={cn(
                                                "text-lg font-black",
                                                move.movement_type === 'in' ? "text-green-600" : "text-red-600"
                                            )}>
                                                {move.movement_type === 'in' ? '+' : '-'}{move.quantity}
                                            </div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{move.movement_type === 'in' ? 'Received' : 'Dispatched'}</p>
                                        </div>
                                        <div className="text-right min-w-[100px]">
                                            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{formatDate(move.created_at)}</p>
                                            <p className="text-xs text-gray-400">{formatTime(move.created_at)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, subValue, icon, color, alert }: any) => {
    const colorClasses: any = {
        blue: "text-blue-500 bg-blue-50 dark:bg-blue-900/20",
        green: "text-green-500 bg-green-50 dark:bg-green-900/20",
        amber: "text-amber-500 bg-amber-50 dark:bg-amber-900/20",
        purple: "text-purple-500 bg-purple-50 dark:bg-purple-900/20",
    };

    return (
        <Card className={cn(
            "p-6 shadow-sm border-none bg-white dark:bg-black transition-all hover:scale-[1.02] cursor-default relative overflow-hidden",
            alert && "border-l-4 border-l-amber-500"
        )}>
            <div className="flex items-start justify-between relative z-10">
                <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</p>
                    <div className="text-3xl font-black text-gray-900 dark:text-white-light tracking-tight">
                        {value}
                    </div>
                    <p className="text-xs font-medium text-gray-400">{subValue}</p>
                </div>
                <div className={cn("p-3 rounded-2xl shadow-sm", colorClasses[color])}>
                    {React.cloneElement(icon, { size: 24 })}
                </div>
            </div>
            {/* Background Decoration */}
            <div className={cn("absolute -bottom-6 -right-6 w-24 h-24 opacity-5 rounded-full", colorClasses[color])} />
        </Card>
    );
};

export default InventoryDashboard;
