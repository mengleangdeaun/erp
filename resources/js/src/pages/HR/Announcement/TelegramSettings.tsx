import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
    IconBrandTelegram, IconDeviceFloppy, IconPlugConnected,
    IconPlugConnectedX, IconEye, IconEyeOff, IconSettings,
    IconInfoCircle, IconLoader2, IconShieldCheck, IconMessage
} from '@tabler/icons-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Switch } from '../../../components/ui/switch';

const SectionCard = ({
    icon, iconColor, title, description, children, badge
}: {
    icon: React.ReactNode;
    iconColor: string;
    title: string;
    description?: string;
    children: React.ReactNode;
    badge?: string;
}) => (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden flex flex-col h-full">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconColor}`}>
                    {icon}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
                        {badge && <span className="text-[10px] px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">{badge}</span>}
                    </div>
                    {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
                </div>
            </div>
        </div>
        <div className="px-6 py-5 flex-1 space-y-6">
            {children}
        </div>
    </div>
);

export default function TelegramSettings() {
    const { t } = useTranslation();
    const [form, setForm] = useState({
        bot_token: '',
        global_chat_id: '',
        global_topic_id: '',
        is_active: false,
    });
    const [loading, setLoading] = useState(true);
    const [hasExistingToken, setHasExistingToken] = useState(false);
    const [showToken, setShowToken] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; message: string } | null>(null);
    const [botUsername, setBotUsername] = useState<string | null>(null);

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

    useEffect(() => {
        // Simulating artificial delay to show off beautiful skeleton
        Promise.all([
            fetch('/api/hr/telegram-settings', { headers, credentials: 'include' }).then(r => r.json()),
            new Promise(resolve => setTimeout(resolve, 600))
        ])
            .then(([data]) => {
                if (data) {
                    setForm(f => ({
                        ...f,
                        global_chat_id: data.global_chat_id || '',
                        global_topic_id: data.global_topic_id || '',
                        is_active: data.is_active,
                    }));
                    setHasExistingToken(data.has_token);
                    setBotUsername(data.bot_username);
                }
            })
            .catch(() => toast.error(t('failed_load_settings_msg')))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch('/sanctum/csrf-cookie');
            const payload: any = { ...form };
            if (!form.bot_token) delete payload.bot_token;

            const res = await fetch('/api/hr/telegram-settings', {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                toast.success(t('telegram_settings_saved_successfully'));
                setHasExistingToken(true);
                setForm(f => ({ ...f, bot_token: '' }));
            } else {
                toast.error(t('failed_to_save_settings'));
            }
        } catch {
            toast.error('An network error occurred');
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        setTesting(true);
        setConnectionStatus(null);
        try {
            await fetch('/sanctum/csrf-cookie');
            const res = await fetch('/api/hr/telegram-settings/test', {
                method: 'POST',
                headers,
                credentials: 'include',
            });
            const data = await res.json();
            setConnectionStatus(data);
            if (data.success) {
                setBotUsername(data.bot?.username || null);
                toast.success(t('success_label'), { description: t('test_message_sent_msg') });
            } else {
                toast.error(t('error_label'), { description: data.message || t('failed_send_test_msg') });
            }
        } catch {
            toast.error(t('error_label'), { description: t('failed_send_test_msg') });
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className="mx-auto space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2.5 rounded-xl shadow-sm">
                        <IconBrandTelegram className="text-primary w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                            {t('telegram_settings_title')}
                        </h1>
                        <p className="text-sm text-gray-500">
                            {t('telegram_settings_desc')}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Button 
                        variant="outline" 
                        onClick={handleTest} 
                        disabled={testing || (!hasExistingToken && !form.bot_token)} 
                        className="gap-2 h-10 w-full sm:w-auto bg-white dark:bg-gray-900 transition-all font-bold"
                    >
                        {testing ? <IconLoader2 size={16} className="animate-spin" /> : <IconPlugConnected size={16} />}
                        {testing ? t('testing_label') : t('test_connection_btn')}
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="gap-2 h-10 w-full sm:w-auto font-bold"
                    >
                        {saving ? <IconLoader2 size={16} className="animate-spin" /> : <IconDeviceFloppy size={16} />}
                        {saving ? t('saving_label') : t('save_changes_btn')}
                    </Button>
                </div>
            </div>

            {loading ? (
                /* Skeleton Loader */
                <div className="animate-pulse">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2].map((i) => (
                            <div key={i} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm h-[320px]">
                                <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-gray-200 dark:bg-gray-800 rounded-xl" />
                                        <div className="space-y-2">
                                            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-32" />
                                            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-48" />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="space-y-2">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24" />
                                        <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-lg w-full" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24" />
                                        <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-lg w-full" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    {/* Connection Status Banner */}
                    {connectionStatus && (
                        <div className={`flex items-center gap-3 p-4 rounded-xl border shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${connectionStatus?.success ? 'bg-green-50/50 border-green-200 text-green-800 dark:bg-green-900/10 dark:border-green-900/30' : 'bg-red-50/50 border-red-200 text-red-800 dark:bg-red-900/10 dark:border-red-900/30'}`}>
                            {connectionStatus?.success
                                ? <IconPlugConnected className="w-5 h-5 shrink-0" />
                                : <IconPlugConnectedX className="w-5 h-5 shrink-0" />
                            }
                            <span className="text-sm font-semibold">{connectionStatus?.success ? t('connection_successful_msg') : t('connection_failed_msg')}</span>
                        </div>
                    )}

                    {botUsername && (
                        <div className="flex items-center gap-3 mb-6 px-5 py-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30 shadow-sm animate-in fade-in">
                            <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg">
                                <IconBrandTelegram className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="text-sm text-blue-800 dark:text-blue-300">
                                {t('successfully_authenticated_as')} <span className="font-bold text-blue-900 dark:text-blue-200">@{botUsername}</span>
                            </span>
                        </div>
                    )}

                    {/* Main Settings Form - 2 Columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* ── Bot Configuration ── */}
                        <SectionCard
                            icon={<IconShieldCheck size={18} className="text-purple-600 dark:text-purple-400" />}
                            iconColor="bg-purple-100 dark:bg-purple-900/40"
                            title={t('bot_configuration_title')}
                            description={t('bot_configuration_desc')}
                        >
                            <div className="space-y-6">
                                <div className="flex items-center justify-between group">
                                    <div className="space-y-1 pr-6">
                                        <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100 !mb-0">
                                            {t('enable_notifications_label')}
                                        </Label>
                                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                                            {t('activate_telegram_alerts_desc')}
                                        </p>
                                    </div>
                                    <Switch 
                                        checked={form.is_active} 
                                        onCheckedChange={(checked) => setForm(f => ({ ...f, is_active: checked }))} 
                                        className="data-[state=checked]:bg-primary"
                                    />
                                </div>

                                <div className="h-px bg-gray-100 dark:bg-gray-800/60" />

                                <div className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <Label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                            {t('bot_api_token_label')}
                                        </Label>
                                        {hasExistingToken && (
                                            <span className="text-[10px] font-bold tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 flex items-center py-0.5 rounded border border-emerald-100 dark:border-emerald-500/20">
                                                {t('token_configured_badge')}
                                            </span>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <Input
                                            type={showToken ? 'text' : 'password'}
                                            value={form.bot_token}
                                            onChange={e => setForm(f => ({ ...f, bot_token: e.target.value }))}
                                            placeholder={hasExistingToken ? '••••••••••••••••••••' : t('bot_token_placeholder')}
                                            className="font-mono pr-12 h-10 bg-gray-50/50 dark:bg-gray-950/50 focus-visible:ring-primary"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setShowToken(s => !s)} 
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-1 rounded-md transition-colors"
                                        >
                                            {showToken ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1.5 flex gap-1.5 items-center">
                                        <IconInfoCircle className="w-3.5 h-3.5 shrink-0" />
                                        {t('obtain_token_desc')}
                                    </p>
                                </div>
                            </div>
                        </SectionCard>

                        {/* ── Global Settings ── */}
                        <SectionCard
                            icon={<IconMessage size={18} className="text-sky-600 dark:text-sky-400" />}
                            iconColor="bg-sky-100 dark:bg-sky-900/40"
                            title={t('global_chat_target_title')}
                            description={t('global_chat_target_desc')}
                        >
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                        {t('global_chat_id_label')}
                                    </Label>
                                    <Input
                                        value={form.global_chat_id}
                                        onChange={e => setForm(f => ({ ...f, global_chat_id: e.target.value }))}
                                        placeholder="-100123456789"
                                        className="font-mono h-10 bg-gray-50/50 dark:bg-gray-950/50 focus-visible:ring-primary"
                                    />
                                    <p className="text-xs text-gray-500 mt-1.5">
                                        {t('global_chat_id_desc')}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                        {t('global_topic_id_label')} <span className="text-gray-400 font-normal">({t('global_topic_id_optional')})</span>
                                    </Label>
                                    <Input
                                        value={form.global_topic_id}
                                        onChange={e => setForm(f => ({ ...f, global_topic_id: e.target.value }))}
                                        placeholder="123"
                                        className="font-mono h-10 bg-gray-50/50 dark:bg-gray-950/50 focus-visible:ring-primary"
                                    />
                                    <p className="text-xs text-gray-500 mt-1.5">
                                        {t('global_topic_id_desc')}
                                    </p>
                                </div>
                            </div>
                        </SectionCard>

                    </div>

                    {/* Help Tips */}
                    <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/60 dark:border-amber-900/40 rounded-2xl p-6 shadow-sm">
                        <div className="flex gap-4">
                            <div className="mt-1 bg-amber-100 dark:bg-amber-900/50 p-2 rounded-xl h-max">
                                <IconSettings className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="space-y-3">
                                <h3 className="font-semibold text-amber-800 dark:text-amber-300">{t('targeted_setup_title')}</h3>
                                <p className="text-sm text-amber-700/80 dark:text-amber-500 text-pretty">
                                    You can also set up granular Telegram notifications that go exclusively to specific branches or departments.
                                </p>
                                <ol className="text-sm text-amber-700/80 dark:text-amber-500 space-y-2 list-decimal list-outside ml-4">
                                    <li className="pl-1">Add your configured bot to the specific Telegram group or channel.</li>
                                    <li className="pl-1">Navigate to <strong>HR &rarr; Branches</strong> or <strong>HR &rarr; Departments</strong> in the sidebar.</li>
                                    <li className="pl-1">Edit the branch/department and insert its specific Chat ID and Topic ID.</li>
                                    <li className="pl-1">When composing a new announcement, select the target audience, and the message will automatically reach the correct group.</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
