import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { IconSettings, IconEdit, IconLoader2, IconHash, IconCalendar, IconCalendarMonth, IconBuildingCommunity } from '@tabler/icons-react';
import { Button } from '../../../components/ui/button';
import { format } from 'date-fns';
import SettingDialog from './SettingDialog';
import { useBranches } from '../../../hooks/usePOSData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Skeleton } from '../../../components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';

export default function PrefixSuffixSettings() {
    const [settings, setSettings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSetting, setSelectedSetting] = useState<any>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedBranchId, setSelectedBranchId] = useState<string>('global');

    const { data: branches } = useBranches();

    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
    };

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const branchParam = selectedBranchId === 'global' ? '' : `?branch_id=${selectedBranchId}`;
            const res = await fetch(`/api/settings/document-numbers${branchParam}`, { headers, credentials: 'include' });
            const data = await res.json();
            setSettings(data);
        } catch {
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, [selectedBranchId]);

    const handleEdit = (setting: any) => {
        setSelectedSetting(setting);
        setDialogOpen(true);
    };

    const renderCardPreview = (setting: any) => {
        const segments = [];
        
        // Branch Code Logic
        if (setting.include_branch_code && selectedBranchId !== 'global') {
            const branch = branches?.find((b: any) => b.id.toString() === selectedBranchId);
            if (branch?.code) segments.push(branch.code);
        }

        if (setting.prefix) segments.push(setting.prefix);
        if (setting.date_format) {
            try {
                const dateFnsFormat = setting.date_format
                    .replace(/YYYY/g, 'yyyy')
                    .replace(/YY/g, 'yy')
                    .replace(/DD/g, 'dd')
                    .replace(/D/g, 'd');
                segments.push(format(new Date(), dateFnsFormat));
            } catch {
                segments.push(setting.date_format);
            }
        }
        segments.push(String(setting.next_number).padStart(setting.number_padding, '0'));
        if (setting.suffix) segments.push(setting.suffix);
        
        return segments.join(setting.separator || '');
    };

    // Skeleton loading cards
    const SkeletonCard = () => (
        <Card className="overflow-hidden">
            <CardHeader className="p-5 border-b">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-lg" />
                        <Skeleton className="h-5 w-32" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-full" />
                </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
                <div className="space-y-1">
                    <Skeleton className="h-3 mb-2 w-24" />
                    <Skeleton className="h-6 w-full" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="mx-auto space-y-6 pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <IconHash size={22} className="text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            Document Numbering
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Manage prefixes, suffixes, and numbering rules for your documents.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 min-w-[240px]">
                    <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                        <IconBuildingCommunity size={22} />
                    </div>
                    <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                        <SelectTrigger className="h-10 font-medium">
                            <SelectValue placeholder="Select Branch Context" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="global" className="font-medium text-primary italic">
                                Global Defaults (System)
                            </SelectItem>
                            {Array.isArray(branches) && branches.map((b: any) => (
                                <SelectItem key={b.id} value={b.id.toString()}>
                                    {b.name} ({b.code})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.isArray(settings) && settings.map((setting) => (
                        <Card key={setting.id} className="group overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                            <CardHeader className="p-5 border-b flex flex-row items-center justify-between space-y-0">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                        <IconSettings size={18} />
                                    </div>
                                    <CardTitle className="text-base font-semibold">
                                        {setting.label}
                                    </CardTitle>
                                </div>
                                <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    onClick={() => handleEdit(setting)}
                                    className="rounded-full h-8 w-8 hover:bg-primary/10 hover:text-primary"
                                >
                                    <IconEdit size={16} />
                                </Button>
                            </CardHeader>
                            <CardContent className="p-5 space-y-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-medium uppercase text-muted-foreground tracking-wider">
                                        Current / Sample Number
                                    </p>
                                    <p className="text-lg font-mono font-semibold tracking-tighter break-all">
                                        {renderCardPreview(setting)}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {setting.is_yearly_reset && (
                                        <span className="flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30">
                                            <IconCalendar size={10} /> Yearly Reset
                                        </span>
                                    )}
                                    {setting.is_monthly_reset && (
                                        <span className="flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
                                            <IconCalendarMonth size={10} /> Monthly Reset
                                        </span>
                                    )}
                                    {!setting.is_yearly_reset && !setting.is_monthly_reset && (
                                        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                                            Continuous
                                        </span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <SettingDialog 
                isOpen={dialogOpen} 
                setIsOpen={setDialogOpen} 
                setting={selectedSetting} 
                onSave={fetchSettings} 
            />
        </div>
    );
}