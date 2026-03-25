import { THEME_COLORS } from '@/constants/themeColors';

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
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

export function hslToString(h: number, s: number, l: number): string {
    return `${h} ${s}% ${l}%`;
}

export const applyAccentColor = (colorValue: string, customHsl?: { h: number; s: number; l: number }) => {
    let primaryHsl: string;
    let secondaryHsl: string, accentHsl: string, ringHsl: string;
    const isDark = document.body.classList.contains('dark') || document.documentElement.classList.contains('dark');

    if (colorValue === 'custom' && customHsl) {
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
};
