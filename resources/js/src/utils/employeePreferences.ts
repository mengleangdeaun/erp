/**
 * Employee PWA Preference Applicator
 * Reads preferences and applies them to the DOM immediately.
 * Call this on app boot (MobileLayout) and whenever preferences change (Profile page).
 */

// HSL values for the --primary CSS variable defined in tailwind.css :root
const THEME_MAP: Record<string, string> = {
    default: '198 100% 39%',   // Cyan-blue (app default)
    green: '187 100% 32%',   // Teal
    rose: '347 97% 60%',    // Rose-pink  (f43f5e)
    amber: '38 92% 50%',     // Amber      (f59e0b)
    violet: '263 70% 58%',    // Violet     (8b5cf6)
};

const DARK_THEME_MAP: Record<string, string> = {
    default: '198 100% 45%',
    green: '187 100% 38%',
    rose: '347 97% 66%',
    amber: '38 92% 56%',
    violet: '263 70% 64%',
};

// Font size map — applies to root font-size so rem scales everything
const FONT_SIZE_MAP: Record<string, string> = {
    small: '14px',
    medium: '16px',
    large: '18px',
};

export interface EmpPrefs {
    dark_mode?: boolean;
    color_theme?: string;
    font_family?: string;
    font_size?: string;
}

export function applyEmployeePreferences(prefs: EmpPrefs) {
    const html = document.documentElement;

    // 1 ── Dark Mode ──────────────────────────────────────────────────────────
    if (prefs.dark_mode) {
        html.classList.add('dark');
    } else {
        html.classList.remove('dark');
    }

    // 2 ── Color Theme (--primary CSS variable) ───────────────────────────────
    const theme = prefs.color_theme ?? 'default';
    const isDark = !!prefs.dark_mode;
    const primaryHsl = isDark
        ? (DARK_THEME_MAP[theme] ?? DARK_THEME_MAP.default)
        : (THEME_MAP[theme] ?? THEME_MAP.default);

    html.style.setProperty('--primary', primaryHsl);

    // 3 ── Font Family ────────────────────────────────────────────────────────
    if (prefs.font_family && prefs.font_family !== 'System Default') {
        html.style.setProperty('--font-family', `'${prefs.font_family}', sans-serif`);
        document.body.style.fontFamily = `'${prefs.font_family}', sans-serif`;
    } else {
        document.body.style.fontFamily = '';
    }

    // 4 ── Font Size ──────────────────────────────────────────────────────────
    const fontSize = prefs.font_size ?? 'medium';
    html.style.fontSize = FONT_SIZE_MAP[fontSize] ?? '16px';
}

/** Load from localStorage (for instant boot, before API responds) */
export function loadStoredPreferences(): EmpPrefs {
    try {
        const stored = localStorage.getItem('emp_prefs');
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
}

/** Persist to localStorage for instant next-boot application */
export function storePreferences(prefs: EmpPrefs) {
    localStorage.setItem('emp_prefs', JSON.stringify(prefs));
}
