import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '@/store';
import { setUserPreferences } from '@/store/themeConfigSlice';
import api from '@/utils/api';
import { toast } from 'sonner';
import {
    IconSettings, IconPalette, IconClock, IconBell, IconShieldCheck,
    IconDeviceFloppy, IconTypography, IconCalendar, IconClockHour4,
    IconCookie, IconLoader2, IconDroplet, IconCheck, IconSun, IconMoon,
    IconDeviceDesktop, IconBrush, IconBrandTelegram
} from '@tabler/icons-react';
import { toggleTheme } from '@/store/themeConfigSlice';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { THEME_COLORS } from '@/constants/themeColors';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';

/* ─────────────────────────────────────────────────────────
   Options
───────────────────────────────────────────────────────── */
const FONTS = [
    { label: 'Google Sans (Default)', value: 'Google Sans', preview: 'font-[Google Sans]' },
    { label: 'Kantumruy Pro', value: '"Kantumruy Pro", sans-serif', preview: 'font-[Kantumruy_Pro]' },
    { label: 'Dangrek', value: 'Dangrek, sans-serif', preview: 'font-[Dangrek]' },
    { label: 'Nunito', value: 'Nunito', preview: 'font-[Nunito]' },
    { label: 'Inter', value: 'Inter, sans-serif', preview: 'font-[Inter]' },
    { label: 'Roboto', value: 'Roboto, sans-serif', preview: 'font-[Roboto]' },
    { label: 'DM Sans', value: 'DM Sans, sans-serif', preview: 'font-[DM Sans]' },
    { label: 'Poppins', value: 'Poppins, sans-serif', preview: 'font-[Poppins]' },
    { label: 'Montserrat', value: 'Montserrat, sans-serif', preview: 'font-[Montserrat]' },
    { label: 'Ubuntu', value: 'Ubuntu, sans-serif', preview: 'font-[Ubuntu]' },
    { label: 'System UI', value: 'system-ui, sans-serif', preview: '' },
];

const DATE_FORMATS = [
    { label: 'Dec 31, 2024', format: 'MMM DD, YYYY', value: 'MMM DD, YYYY' },
    { label: '31 Dec 2024', format: 'DD MMM YYYY', value: 'DD MMM YYYY' },
    { label: '2024-12-31', format: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
    { label: '12/31/2024', format: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
    { label: '31/12/2024', format: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
    { label: 'December 31, 2024', format: 'MMMM DD, YYYY', value: 'MMMM DD, YYYY' },
    { label: '31 December 2024', format: 'DD MMMM YYYY', value: 'DD MMMM YYYY' },
];

const TIME_FORMATS = [
    { label: '12-Hour', example: '1:30 PM', value: '12h' },
    { label: '24-Hour', example: '13:30', value: '24h' },
];


// Helper: convert hex to HSL object
function hexToHsl(hex: string): { h: number; s: number; l: number } {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
        r = parseInt(hex[1] + hex[2], 16);
        g = parseInt(hex[3] + hex[4], 16);
        b = parseInt(hex[5] + hex[6], 16);
    }
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// Helper: HSL to CSS string
function hslToString(h: number, s: number, l: number): string {
    return `${h} ${s}% ${l}%`;
}

/* ─────────────────────────────────────────────────────────
   Section Card
───────────────────────────────────────────────────────── */
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
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconColor}`}>
                    {icon}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
                        {badge && <Badge variant="outline" className="text-[10px] px-2 py-0">{badge}</Badge>}
                    </div>
                    {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
                </div>
            </div>
        </div>
        <div className="px-6 py-5 space-y-5">
            {children}
        </div>
    </div>
);

/* ─────────────────────────────────────────────────────────
   Setting Row
───────────────────────────────────────────────────────── */
const SettingRow = ({
    icon, label, description, children
}: {
    icon?: React.ReactNode;
    label: string;
    description?: string;
    children: React.ReactNode;
}) => (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
                {icon && <span className="text-gray-400 dark:text-gray-500">{icon}</span>}
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-200 !mb-0">{label}</Label>
            </div>
            {description && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 ml-7">{description}</p>}
        </div>
        <div className="sm:w-64 shrink-0">
            {children}
        </div>
    </div>
);

/* ─────────────────────────────────────────────────────────
   Main Page
───────────────────────────────────────────────────────── */
export default function UserPreferences() {
    const dispatch = useDispatch();
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const [saving, setSaving] = useState(false);

    // Custom color state
    const [customColor, setCustomColor] = useState<{ h: number; s: number; l: number } | null>(() => {
        const saved = localStorage.getItem('customPrimaryColor');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch { return null; }
        }
        return null;
    });
    const [isCustom, setIsCustom] = useState(() => {
        const accent = localStorage.getItem('accentColor');
        return accent === 'custom';
    });

    const [preferences, setPreferences] = useState({
        font_family: themeConfig.fontFamily || 'Google Sans',
        date_format: themeConfig.dateFormat || 'DD MMM YYYY',
        time_format: themeConfig.timeFormat || '12h',
        accent_color: isCustom ? 'custom' : (localStorage.getItem('accentColor') || 'blue'),
    });

    // Apply accent color CSS variables
    const applyAccentColor = (colorValue: string, customHsl?: { h: number; s: number; l: number }) => {
        let primaryHsl: string;
        let secondaryHsl: string, accentHsl: string, ringHsl: string;
        const isDark = document.body.classList.contains('dark');

        if (colorValue === 'custom' && customHsl) {
            // Generate derived shades using fixed saturation/lightness pattern
            const h = customHsl.h;
            primaryHsl = hslToString(h, customHsl.s, customHsl.l);
            if (isDark) {
                secondaryHsl = hslToString(h, 30, 18);
                accentHsl = hslToString(h, 35, 20);
                ringHsl = primaryHsl;
            } else {
                secondaryHsl = hslToString(h, 40, 94);
                accentHsl = hslToString(h, 50, 90);
                ringHsl = primaryHsl;
            }
        } else {
            const color = THEME_COLORS.find(c => c.value === colorValue);
            if (!color) return;
            primaryHsl = isDark ? color.darkPrimary : color.primary;
            secondaryHsl = isDark ? color.darkSecondary : color.secondary;
            accentHsl = isDark ? color.darkAccent : color.accent;
            ringHsl = isDark ? color.darkRing : color.ring;
        }

        const targets = [document.documentElement, document.body];
        targets.forEach(el => {
            el.style.setProperty('--primary', primaryHsl);
            el.style.setProperty('--primary-foreground', '0 0% 100%');
            el.style.setProperty('--secondary', secondaryHsl);
            el.style.setProperty('--accent', accentHsl);
            el.style.setProperty('--ring', ringHsl);
        });
        localStorage.setItem('accentColor', colorValue);
        if (colorValue === 'custom' && customHsl) {
            localStorage.setItem('customPrimaryColor', JSON.stringify(customHsl));
        } else {
            localStorage.removeItem('customPrimaryColor');
        }
    };

    useEffect(() => {
        if (preferences.accent_color === 'custom' && customColor) {
            applyAccentColor('custom', customColor);
        } else if (preferences.accent_color !== 'custom') {
            applyAccentColor(preferences.accent_color);
        }
    }, [preferences.accent_color, customColor, themeConfig.theme]);

    const handleChange = (key: string, value: any) => {
        setPreferences(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await api.put('/user/preferences', { preferences });
            dispatch(setUserPreferences(res.data.preferences));
            toast.success('Preferences saved successfully!');
        } catch (error) {
            console.error('Failed to save preferences:', error);
            toast.error('Could not save preferences. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleCustomColorChange = (newHsl: { h: number; s: number; l: number }) => {
        setCustomColor(newHsl);
        applyAccentColor('custom', newHsl);
    };

    const currentFont = FONTS.find(f => f.value === preferences.font_family);
    const currentDate = DATE_FORMATS.find(f => f.value === preferences.date_format);
    const currentTime = TIME_FORMATS.find(f => f.value === preferences.time_format);

    return (
        <div className="mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <IconSettings size={22} className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">User Preferences</h1>
              <p className="text-sm text-gray-500">Manage your preferences</p>
            </div>
          </div>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="gap-2 h-10"
                >
                    {saving ? <IconLoader2 size={16} className="animate-spin" /> : <IconDeviceFloppy size={16} />}
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>

            <div className="space-y-6">

                {/* ── Theme & Colors ── */}
                <SectionCard
                    icon={<IconDroplet size={18} className="text-sky-600 dark:text-sky-400" />}
                    iconColor="bg-sky-100 dark:bg-sky-900/40"
                    title="Theme & Colors"
                    description="Choose your preferred appearance mode and primary color"
                >
                    {/* Dark / Light / System */}
                    <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-200 !mb-3">Appearance</Label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { value: 'light', label: 'Light', icon: <IconSun size={18} /> },
                                { value: 'dark', label: 'Dark', icon: <IconMoon size={18} /> },
                                { value: 'system', label: 'System', icon: <IconDeviceDesktop size={18} /> },
                            ].map(mode => (
                                <button
                                    key={mode.value}
                                    onClick={() => dispatch(toggleTheme(mode.value))}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${themeConfig.theme === mode.value
                                        ? 'border-primary bg-primary/5 dark:bg-primary/10 text-primary'
                                        : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    {mode.icon}
                                    <span className="text-xs font-medium">{mode.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <Separator className="dark:bg-gray-800" />

                    {/* Primary Color Picker */}
                    <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-200 !mb-1">Primary Color</Label>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                            Sets the main color for buttons, links, and highlights
                        </p>

                        {/* Preset swatches + Custom trigger */}
                        <div className="flex flex-wrap gap-3">
                            {THEME_COLORS.map(color => (
                                <button
                                    key={color.value}
                                    onClick={() => {
                                        handleChange('accent_color', color.value);
                                        setIsCustom(false);
                                        applyAccentColor(color.value);
                                    }}
                                    className="group relative flex flex-col items-center gap-1.5"
                                    title={color.label}
                                >
                                    <div
                                        className={`w-10 h-10 rounded-xl transition-all duration-200 flex items-center justify-center ${
                                            preferences.accent_color === color.value && !isCustom
                                                ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 scale-110'
                                                : 'hover:scale-105'
                                        }`}
                                        style={{ backgroundColor: color.hex }}
                                    >
                                        {preferences.accent_color === color.value && !isCustom && (
                                            <IconCheck size={16} className="text-white drop-shadow-sm" />
                                        )}
                                    </div>
                                    <span className={`text-[10px] font-medium ${
                                        preferences.accent_color === color.value && !isCustom
                                            ? 'text-gray-900 dark:text-gray-100'
                                            : 'text-gray-400 dark:text-gray-500'
                                    }`}>{color.label}</span>
                                </button>
                            ))}

                            {/* Custom color picker */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button
                                        onClick={() => {
                                            handleChange('accent_color', 'custom');
                                            setIsCustom(true);
                                        }}
                                        className="group relative flex flex-col items-center gap-1.5"
                                        title="Custom color"
                                    >
                                        <div
                                            className={`w-10 h-10 rounded-xl transition-all duration-200 flex items-center justify-center bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 ${
                                                isCustom ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 scale-110' : 'hover:scale-105'
                                            }`}
                                        >
                                            {isCustom && <IconBrush size={16} className="text-white drop-shadow-sm" />}
                                        </div>
                                        <span className={`text-[10px] font-medium ${
                                            isCustom ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'
                                        }`}>Custom</span>
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl">
                                    <div className="space-y-4">
                                        <h4 className="font-medium text-sm">Custom primary color</h4>

                                        {/* Color preview and hex input */}
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-12 h-12 rounded-lg border border-gray-200 dark:border-gray-700"
                                                style={{ backgroundColor: customColor ? `hsl(${customColor.h}, ${customColor.s}%, ${customColor.l}%)` : '#0284c7' }}
                                            />
                                            <Input
                                                type="color"
                                                value={customColor ? `hsl(${customColor.h}, ${customColor.s}%, ${customColor.l}%)` : '#0284c7'}
                                                onChange={(e) => {
                                                    const hsl = hexToHsl(e.target.value);
                                                    setCustomColor(hsl);
                                                    applyAccentColor('custom', hsl);
                                                }}
                                                className="w-full h-10"
                                            />
                                        </div>

                                        {/* HSL sliders */}
                                        <div className="space-y-3">
                                            <div>
                                                <Label className="text-xs">Hue: {customColor?.h ?? 198}°</Label>
                                                <Slider
                                                    value={[customColor?.h ?? 198]}
                                                    min={0}
                                                    max={360}
                                                    step={1}
                                                    onValueChange={([h]) => {
                                                        if (customColor) {
                                                            handleCustomColorChange({ ...customColor, h });
                                                        } else {
                                                            handleCustomColorChange({ h, s: 100, l: 50 });
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Saturation: {customColor?.s ?? 100}%</Label>
                                                <Slider
                                                    value={[customColor?.s ?? 100]}
                                                    min={0}
                                                    max={100}
                                                    step={1}
                                                    onValueChange={([s]) => customColor && handleCustomColorChange({ ...customColor, s })}
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Lightness: {customColor?.l ?? 50}%</Label>
                                                <Slider
                                                    value={[customColor?.l ?? 50]}
                                                    min={0}
                                                    max={100}
                                                    step={1}
                                                    onValueChange={([l]) => customColor && handleCustomColorChange({ ...customColor, l })}
                                                />
                                            </div>
                                        </div>

                                        {/* Live preview button */}
                                        <div className="pt-2">
                                            <Button
                                                className="w-full gap-2"
                                                style={{
                                                    backgroundColor: customColor ? `hsl(${customColor.h}, ${customColor.s}%, ${customColor.l}%)` : '#0284c7',
                                                    color: '#fff'
                                                }}
                                            >
                                                Preview
                                            </Button>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </SectionCard>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 justify-between' >
                    {/* ── Display & Typography ── */}
                    <SectionCard
                        icon={<IconPalette size={18} className="text-purple-600 dark:text-purple-400" />}
                        iconColor="bg-purple-100 dark:bg-purple-900/40"
                        title="Display & Typography"
                        description="Control the look and feel of the interface"
                    >
                        <SettingRow
                            icon={<IconTypography size={16} />}
                            label="Interface Font"
                            description="Applied to all text across the application"
                        >
                            <Select value={preferences.font_family} onValueChange={(v) => handleChange('font_family', v)}>
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Choose font" />
                                </SelectTrigger>
                                <SelectContent>
                                    {FONTS.map(f => (
                                        <SelectItem key={f.value} value={f.value}>
                                            <span style={{ fontFamily: f.value }}>{f.label}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </SettingRow>

                        {/* Font Preview */}
                        {currentFont && (
                            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50">
                                <p className="text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 font-semibold">Preview</p>
                                <p className="text-lg text-gray-800 dark:text-gray-200" style={{ fontFamily: currentFont.value }}>
                                    The quick brown fox jumps over the lazy dog.
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1" style={{ fontFamily: currentFont.value }}>
                                    0123456789 — $1,234.56 — 98.7%
                                </p>
                            </div>
                        )}
                    </SectionCard>

                    {/* ── Localization ── */}
                    <SectionCard
                        icon={<IconClock size={18} className="text-blue-600 dark:text-blue-400" />}
                        iconColor="bg-blue-100 dark:bg-blue-900/40"
                        title="Date & Time Formats"
                        description="How dates and times appear in the system"
                    >
                        <SettingRow
                            icon={<IconCalendar size={16} />}
                            label="Date Format"
                            description="Used for dates like created at, updated at, etc."
                        >
                            <Select value={preferences.date_format} onValueChange={(v) => handleChange('date_format', v)}>
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Choose format" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DATE_FORMATS.map(f => (
                                        <SelectItem key={f.value} value={f.value}>
                                            <div className="flex items-center justify-between w-full gap-3">
                                                <span>{f.label}</span>
                                                <span className="text-[11px] text-gray-400 font-mono">{f.format}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </SettingRow>

                        <Separator className="dark:bg-gray-800" />

                        <SettingRow
                            icon={<IconClockHour4 size={16} />}
                            label="Time Format"
                            description="Choose between 12-hour and 24-hour clock"
                        >
                            <Select value={preferences.time_format} onValueChange={(v) => handleChange('time_format', v)}>
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Choose format" />
                                </SelectTrigger>
                                <SelectContent>
                                    {TIME_FORMATS.map(f => (
                                        <SelectItem key={f.value} value={f.value}>
                                            <div className="flex items-center gap-2">
                                                <span>{f.label}</span>
                                                <span className="text-[11px] text-gray-400">({f.example})</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </SettingRow>

                        {/* Inline preview */}
                        <div className="ml-7 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400 dark:text-gray-500">Preview:</span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                {currentDate?.label || '—'} {currentTime?.value === '24h' ? '13:30' : '1:30 PM'}
                            </span>
                        </div>
                    </SectionCard>
                </div>


            </div>
        </div>
    );
}