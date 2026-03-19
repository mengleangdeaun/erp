import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { IconSettings, IconEdit, IconLoader2, IconHash, IconCalendar, IconCalendarMonth } from '@tabler/icons-react';
import { Button } from '../../../components/ui/button';
import { format } from 'date-fns';
import SettingDialog from './SettingDialog';

export default function PrefixSuffixSettings() {
    const [settings, setSettings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSetting, setSelectedSetting] = useState<any>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

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
        try {
            const res = await fetch('/api/settings/document-numbers', { headers, credentials: 'include' });
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
    }, []);

    const handleEdit = (setting: any) => {
        setSelectedSetting(setting);
        setDialogOpen(true);
    };

    const renderCardPreview = (setting: any) => {
        const segments = [];
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

    return (
        <div className="mx-auto space-y-6 pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                        <IconHash size={22} className="text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">Document Numbering</h1>
                        <p className="text-sm text-gray-500">Manage prefixes, suffixes, and numbering rules for your documents.</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                    <IconLoader2 className="w-8 h-8 animate-spin text-primary/50 mb-3" />
                    <p className="text-gray-500 text-sm font-medium">Loading settings...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {settings.map((setting) => (
                        <div key={setting.id} className="group relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden flex flex-col">
                            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                        <IconSettings size={18} />
                                    </div>
                                    <h3 className="font-bold text-gray-900 dark:text-gray-100">{setting.label}</h3>
                                </div>
                                <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    onClick={() => handleEdit(setting)}
                                    className="rounded-full h-8 w-8 hover:bg-primary/10 hover:text-primary"
                                >
                                    <IconEdit size={16} />
                                </Button>
                            </div>
                            <div className="p-5 space-y-4 flex-1">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Current / Sample Number</p>
                                    <p className="text-lg font-mono font-bold tracking-tighter text-gray-900 dark:text-gray-100 break-all">
                                        {renderCardPreview(setting)}
                                    </p>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col gap-1">
                                        <p className="text-[10px] font-bold uppercase text-gray-400">Rules</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {setting.is_yearly_reset && (
                                                <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30">
                                                    <IconCalendar size={10} /> Yearly Reset
                                                </span>
                                            )}
                                            {setting.is_monthly_reset && (
                                                <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
                                                    <IconCalendarMonth size={10} /> Monthly Reset
                                                </span>
                                            )}
                                            {!setting.is_yearly_reset && !setting.is_monthly_reset && (
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-100 dark:border-gray-800">
                                                    Continuous
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
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
