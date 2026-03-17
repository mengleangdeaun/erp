import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
    IconBrandTelegram, IconDeviceFloppy, IconPlugConnected,
    IconPlugConnectedX, IconEye, IconEyeOff
} from '@tabler/icons-react';
import { Button } from '../../../components/ui/button';

export default function TelegramSettings() {
    const [form, setForm] = useState({
        bot_token: '',
        global_chat_id: '',
        global_topic_id: '',
        is_active: false,
    });
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
        fetch('/api/hr/telegram-settings', { headers: { 'Accept': 'application/json', 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '' }, credentials: 'include' })
            .then(r => r.json())
            .then(data => {
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
            .catch(() => {});
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
                toast.success('Telegram settings saved!');
                setHasExistingToken(true);
                setForm(f => ({ ...f, bot_token: '' }));
            } else {
                toast.error('Failed to save settings');
            }
        } catch {
            toast.error('An error occurred');
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
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        } catch {
            toast.error('Test failed');
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-6 px-4">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                    <IconBrandTelegram className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                    <h1 className="text-xl font-black">Telegram Settings</h1>
                    <p className="text-sm text-gray-500">Configure your Telegram bot for announcements and alerts.</p>
                </div>
            </div>

            {/* Connection Status Banner */}
            {connectionStatus && (
                <div className={`flex items-center gap-3 p-4 rounded-xl mb-5 border ${connectionStatus.success ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/10 dark:border-green-900/30' : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/10 dark:border-red-900/30'}`}>
                    {connectionStatus.success
                        ? <IconPlugConnected className="w-5 h-5 shrink-0" />
                        : <IconPlugConnectedX className="w-5 h-5 shrink-0" />
                    }
                    <span className="text-sm font-semibold">{connectionStatus.message}</span>
                </div>
            )}

            {botUsername && (
                <div className="flex items-center gap-2 mb-4 px-4 py-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20">
                    <IconBrandTelegram className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-blue-700 dark:text-blue-300 font-semibold">
                        Connected as <span className="font-black">@{botUsername}</span>
                    </span>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 space-y-5">
                {/* Active Toggle */}
                <label className="flex items-center justify-between cursor-pointer">
                    <div>
                        <p className="font-semibold">Enable Telegram Notifications</p>
                        <p className="text-sm text-gray-400">When off, no messages will be sent to Telegram.</p>
                    </div>
                    <div className="relative">
                        <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="sr-only" />
                        <div className={`w-12 h-6 rounded-full transition-colors ${form.is_active ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-600'}`} />
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-6' : ''}`} />
                    </div>
                </label>

                <hr className="border-gray-100 dark:border-gray-700" />

                {/* Bot Token */}
                <div>
                    <label className="text-sm font-semibold mb-1.5 block">
                        Bot Token {hasExistingToken && <span className="text-xs font-normal text-gray-400 ml-1">(currently set — leave blank to keep)</span>}
                    </label>
                    <div className="relative">
                        <input
                            type={showToken ? 'text' : 'password'}
                            value={form.bot_token}
                            onChange={e => setForm(f => ({ ...f, bot_token: e.target.value }))}
                            placeholder={hasExistingToken ? '••••••••••••••••••••' : 'Enter bot token from @BotFather'}
                            className="w-full h-10 pl-3 pr-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-mono focus:ring-2 focus:ring-blue-500/20 outline-none"
                        />
                        <button onClick={() => setShowToken(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showToken ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Get your token by messaging @BotFather on Telegram.</p>
                </div>

                {/* Global Chat */}
                <div>
                    <label className="text-sm font-semibold mb-1.5 block">Global Chat ID</label>
                    <input
                        value={form.global_chat_id}
                        onChange={e => setForm(f => ({ ...f, global_chat_id: e.target.value }))}
                        placeholder="-100123456789"
                        className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-mono focus:ring-2 focus:ring-blue-500/20 outline-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">Used for "All Employees" announcements. Add bot to the group first.</p>
                </div>

                {/* Topic ID */}
                <div>
                    <label className="text-sm font-semibold mb-1.5 block">Global Topic ID <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input
                        value={form.global_topic_id}
                        onChange={e => setForm(f => ({ ...f, global_topic_id: e.target.value }))}
                        placeholder="123"
                        className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-mono focus:ring-2 focus:ring-blue-500/20 outline-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">For supergroup topics (forum mode). Found in group link as #topic-id.</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <Button onClick={handleSave} disabled={saving} className="gap-2 flex-1">
                        <IconDeviceFloppy className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Settings'}
                    </Button>
                    <Button variant="outline" onClick={handleTest} disabled={testing || (!hasExistingToken && !form.bot_token)} className="gap-2">
                        <IconPlugConnected className="w-4 h-4" />
                        {testing ? 'Testing...' : 'Test Connection'}
                    </Button>
                </div>
            </div>

            {/* Help Card */}
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 text-sm space-y-2">
                <p className="font-semibold text-gray-700 dark:text-gray-300">How to set up per-Branch/Department Telegram:</p>
                <ol className="text-gray-500 space-y-1 list-decimal list-inside text-xs">
                    <li>Add your bot to a Telegram group or channel.</li>
                    <li>Go to <strong>HR → Branches</strong> or <strong>HR → Departments</strong>.</li>
                    <li>Edit the record and add the Chat ID (and optionally Topic ID).</li>
                    <li>When publishing a Branch-targeted announcement, it will send to that group.</li>
                </ol>
            </div>
        </div>
    );
}
