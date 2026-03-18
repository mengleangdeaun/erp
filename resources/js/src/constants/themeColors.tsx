export interface ThemeColor {
    label: string;
    value: string;
    hex: string;
    primary: string;
    secondary: string;
    accent: string;
    ring: string;
    darkPrimary: string;
    darkSecondary: string;
    darkAccent: string;
    darkRing: string;
}

export const THEME_COLORS: ThemeColor[] = [
    { label: 'Blue', value: 'blue', hex: '#0284c7', primary: '198 100% 39%', secondary: '198 40% 94%', accent: '198 50% 90%', ring: '198 100% 39%', darkPrimary: '198 100% 45%', darkSecondary: '198 30% 18%', darkAccent: '198 35% 20%', darkRing: '198 100% 45%' },
    { label: 'Sky', value: 'sky', hex: '#0ea5e9', primary: '199 89% 48%', secondary: '199 40% 94%', accent: '199 50% 90%', ring: '199 89% 48%', darkPrimary: '199 89% 52%', darkSecondary: '199 30% 18%', darkAccent: '199 35% 20%', darkRing: '199 89% 52%' },
    { label: 'Indigo', value: 'indigo', hex: '#6366f1', primary: '239 84% 67%', secondary: '239 40% 94%', accent: '239 50% 92%', ring: '239 84% 67%', darkPrimary: '239 84% 67%', darkSecondary: '239 30% 18%', darkAccent: '239 35% 20%', darkRing: '239 84% 67%' },
    { label: 'Violet', value: 'violet', hex: '#8b5cf6', primary: '263 70% 66%', secondary: '263 40% 94%', accent: '263 50% 92%', ring: '263 70% 66%', darkPrimary: '263 70% 66%', darkSecondary: '263 30% 18%', darkAccent: '263 35% 20%', darkRing: '263 70% 66%' },
    { label: 'Fuchsia', value: 'fuchsia', hex: '#d946ef', primary: '292 84% 61%', secondary: '292 40% 94%', accent: '292 50% 92%', ring: '292 84% 61%', darkPrimary: '292 84% 61%', darkSecondary: '292 30% 18%', darkAccent: '292 35% 20%', darkRing: '292 84% 61%' },
    { label: 'Pink', value: 'pink', hex: '#ec4899', primary: '330 81% 60%', secondary: '330 40% 94%', accent: '330 50% 92%', ring: '330 81% 60%', darkPrimary: '330 81% 60%', darkSecondary: '330 30% 18%', darkAccent: '330 35% 20%', darkRing: '330 81% 60%' },
    { label: 'Rose', value: 'rose', hex: '#f43f5e', primary: '347 77% 60%', secondary: '347 40% 94%', accent: '347 50% 92%', ring: '347 77% 60%', darkPrimary: '347 77% 60%', darkSecondary: '347 30% 18%', darkAccent: '347 35% 20%', darkRing: '347 77% 60%' },
    { label: 'Red', value: 'red', hex: '#ef4444', primary: '0 72% 51%', secondary: '0 40% 94%', accent: '0 50% 92%', ring: '0 72% 51%', darkPrimary: '0 72% 55%', darkSecondary: '0 30% 18%', darkAccent: '0 35% 20%', darkRing: '0 72% 55%' },
    { label: 'Orange', value: 'orange', hex: '#f97316', primary: '25 95% 53%', secondary: '25 40% 94%', accent: '25 50% 90%', ring: '25 95% 53%', darkPrimary: '25 95% 53%', darkSecondary: '25 30% 18%', darkAccent: '25 35% 20%', darkRing: '25 95% 53%' },
    { label: 'Amber', value: 'amber', hex: '#f59e0b', primary: '38 92% 50%', secondary: '38 40% 94%', accent: '38 50% 90%', ring: '38 92% 50%', darkPrimary: '38 92% 50%', darkSecondary: '38 30% 18%', darkAccent: '38 35% 20%', darkRing: '38 92% 50%' },
    { label: 'Lime', value: 'lime', hex: '#84cc16', primary: '84 81% 44%', secondary: '84 40% 94%', accent: '84 50% 90%', ring: '84 81% 44%', darkPrimary: '84 81% 50%', darkSecondary: '84 30% 18%', darkAccent: '84 35% 20%', darkRing: '84 81% 50%' },
    { label: 'Emerald', value: 'emerald', hex: '#10b981', primary: '160 84% 39%', secondary: '160 40% 94%', accent: '160 50% 90%', ring: '160 84% 39%', darkPrimary: '160 84% 45%', darkSecondary: '160 30% 18%', darkAccent: '160 35% 20%', darkRing: '160 84% 45%' },
    { label: 'Teal', value: 'teal', hex: '#14b8a6', primary: '174 72% 40%', secondary: '174 40% 94%', accent: '174 50% 90%', ring: '174 72% 40%', darkPrimary: '174 72% 46%', darkSecondary: '174 30% 18%', darkAccent: '174 35% 20%', darkRing: '174 72% 46%' },
    { label: 'Cyan', value: 'cyan', hex: '#06b6d4', primary: '189 94% 43%', secondary: '189 40% 94%', accent: '189 50% 90%', ring: '189 94% 43%', darkPrimary: '189 94% 48%', darkSecondary: '189 30% 18%', darkAccent: '189 35% 20%', darkRing: '189 94% 48%' },
    { label: 'Slate', value: 'slate', hex: '#64748b', primary: '215 16% 47%', secondary: '215 20% 94%', accent: '215 25% 90%', ring: '215 16% 47%', darkPrimary: '215 20% 55%', darkSecondary: '215 15% 18%', darkAccent: '215 18% 20%', darkRing: '215 20% 55%' },
    { label: 'Gray', value: 'gray', hex: '#6B7280', primary: '220 9% 46%', secondary: '220 15% 94%', accent: '220 20% 90%', ring: '220 9% 46%', darkPrimary: '220 12% 52%', darkSecondary: '220 10% 18%', darkAccent: '220 12% 20%', darkRing: '220 12% 52%' },
    { label: 'Zinc', value: 'zinc', hex: '#71717A', primary: '240 5% 46%', secondary: '240 12% 94%', accent: '240 18% 90%', ring: '240 5% 46%', darkPrimary: '240 8% 52%', darkSecondary: '240 7% 18%', darkAccent: '240 9% 20%', darkRing: '240 8% 52%' },
    { label: 'Neutral', value: 'neutral', hex: '#737373', primary: '0 0% 45%', secondary: '0 0% 94%', accent: '0 0% 90%', ring: '0 0% 45%', darkPrimary: '0 0% 51%', darkSecondary: '0 0% 18%', darkAccent: '0 0% 20%', darkRing: '0 0% 51%' },
    { label: 'Stone', value: 'stone', hex: '#78716C', primary: '30 6% 45%', secondary: '30 12% 94%', accent: '30 18% 90%', ring: '30 6% 45%', darkPrimary: '30 9% 51%', darkSecondary: '30 7% 18%', darkAccent: '30 9% 20%', darkRing: '30 9% 51%' },
    { label: 'Yellow', value: 'yellow', hex: '#EAB308', primary: '50 98% 48%', secondary: '50 40% 94%', accent: '50 50% 90%', ring: '50 98% 48%', darkPrimary: '50 98% 54%', darkSecondary: '50 30% 18%', darkAccent: '50 35% 20%', darkRing: '50 98% 54%' },
    { label: 'Green', value: 'green', hex: '#22C55E', primary: '142 71% 45%', secondary: '142 40% 94%', accent: '142 50% 90%', ring: '142 71% 45%', darkPrimary: '142 71% 51%', darkSecondary: '142 30% 18%', darkAccent: '142 35% 20%', darkRing: '142 71% 51%' },
    { label: 'Purple', value: 'purple', hex: '#A855F7', primary: '270 91% 65%', secondary: '270 40% 94%', accent: '270 50% 92%', ring: '270 91% 65%', darkPrimary: '270 91% 65%', darkSecondary: '270 30% 18%', darkAccent: '270 35% 20%', darkRing: '270 91% 65%' },
];