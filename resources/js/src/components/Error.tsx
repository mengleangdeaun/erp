import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../store/themeConfigSlice';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Error404 = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [mounted, setMounted] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        dispatch(setPageTitle(t('error404.pageTitle')));
        const timer = setTimeout(() => setMounted(true), 50);
        return () => clearTimeout(timer);
    }, [dispatch, t]);

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950">

            {/* ── Vertical column lines ── */}
            <div className="absolute inset-0 flex pointer-events-none animate-pulse" aria-hidden="true">
                <div className="flex-1 border-r border-primary/[0.77]" />
                <div className="w-10 border-r border-primary/[0.75]" />
                <div className="w-10 border-r border-primary/[0.65]" />
                <div className="w-10 border-r border-primary/[0.55]" />
                <div className="w-10 border-r border-primary/[0.5]" />
                <div className="w-10 border-r border-primary/[0.5]" />
                <div className="w-10 border-r border-primary/[0.25]" />
                <div className="w-10 border-r border-primary/[0.15]" />
                <div className="w-10 border-r border-primary/[0.15]" />

                <div className="flex-1 border-r border-primary/[0.01]" />
                <div className="flex-1 border-r border-primary/[0.01]" />
                
                <div className="flex-1 border-r border-primary/[0.15]" />
                <div className="w-10 border-r border-primary/[0.15]" />
                <div className="w-10 border-r border-primary/[0.25]" />
                 <div className="w-10 border-r border-primary/[0.35]" />
                <div className="w-10 border-r border-primary/[0.50]" />
                <div className="w-10 border-r border-primary/[0.55]" />
                <div className="w-10 border-r border-primary/[0.65]" />
                <div className="w-10 border-r border-primary/[0.75]" />
                <div className="w-10 border-r border-primary/[0.77]" />
                <div className="flex-1" />
            </div>

            {/* ── Horizontal row lines — top band ── */}
            <div className="absolute inset-x-0 top-0 flex flex-col pointer-events-none animate-pulse" aria-hidden="true">
                {/* Top border of first row */}
                <div className="h-16 border-b border-primary/[0.5]" />
                <div className="h-10 border-b border-primary/[0.25]" />
                <div className="h-10 border-b border-primary/[0.15]" />
                 <div className="h-10 border-b border-primary/[0.10]" />
            </div>

            {/* ── Horizontal row lines — bottom band ── */}
            <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end pointer-events-none animate-pulse" aria-hidden="true">
                <div className="h-10 border-t border-primary/[0.10]" />
                <div className="h-10 border-t border-primary/[0.15]" />
                <div className="h-10 border-t border-primary/[0.25]" />
                <div className="h-16 border-t border-primary/[0.5]" />
            </div>

            {/* Animated SVG dot grid background */}
            <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid slice"
            >
                <defs>
                    <pattern id="dot-grid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
                        <circle cx="16" cy="16" r="1.2" fill="hsl(var(--primary))" fillOpacity="0.15">
                            <animate attributeName="fill-opacity" values="0.06;0.28;0.06" dur="3s" repeatCount="indefinite" />
                        </circle>
                        <circle cx="0" cy="0" r="0.8" fill="hsl(var(--primary))" fillOpacity="0.08">
                            <animate attributeName="fill-opacity" values="0.08;0.22;0.08" dur="4.5s" repeatCount="indefinite" />
                        </circle>
                    </pattern>
                    <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
                        <stop offset="0%" stopColor="transparent" />
                        <stop offset="100%" stopColor="#020617" stopOpacity="0.92" />
                    </radialGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#dot-grid)" />
                <rect width="100%" height="100%" fill="url(#vignette)" />
            </svg>

            {/* Top edge accent */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--primary)/0.5)] to-transparent" />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center text-center px-8 py-20 max-w-xl w-full">

                {/* Badge */}
                <div
                    className={`
                        mb-10 flex items-center gap-2 rounded-full border border-[hsl(var(--primary)/0.25)]
                        bg-[hsl(var(--primary)/0.07)] px-4 py-1.5 transition-all duration-700
                        ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                    `}
                >
                    <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))] animate-pulse" />
                    <span className="text-[11px] font-medium tracking-widest text-[hsl(var(--primary))] uppercase">
                        {t('error404.badge')}
                    </span>
                </div>

                {/* Large 404 number */}
                <div
                    className={`
                        relative select-none transition-all duration-700 delay-100
                        ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
                    `}
                >
                    <span className="text-[clamp(7rem,20vw,11rem)] font-black tracking-tighter text-white/[0.06] leading-none">
                        404
                    </span>
                    <span className="absolute inset-0 flex items-center justify-center text-[clamp(7rem,20vw,11rem)] font-black tracking-tighter leading-none bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
                        404
                    </span>
                </div>

                {/* Divider */}
                <div
                    className={`
                        my-8 flex items-center gap-4 w-full max-w-xs
                        transition-all duration-700 delay-200
                        ${mounted ? 'opacity-100' : 'opacity-0'}
                    `}
                >
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[hsl(var(--primary)/0.3)]" />
                    <div className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary)/0.5)]" />
                    <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[hsl(var(--primary)/0.3)]" />
                </div>

                {/* Heading */}
                <h1
                    className={`
                        text-2xl font-semibold tracking-tight text-zinc-100 mb-3
                        transition-all duration-700 delay-300
                        ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                    `}
                >
                    {t('error404.heading')}
                </h1>

                {/* Description */}
                <p
                    className={`
                        text-sm text-zinc-500 leading-relaxed max-w-sm mb-10
                        transition-all duration-700 delay-[400ms]
                        ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                    `}
                >
                    {t('error404.description')}
                </p>

                {/* Actions */}
                <div
                    className={`
                        flex flex-col sm:flex-row items-center gap-3
                        transition-all duration-700 delay-500
                        ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                    `}
                >
                    <button
                        onClick={() => navigate('/auth/login')}
                        className="
                            group inline-flex items-center gap-2
                            rounded-lg bg-[hsl(var(--primary))] px-6 py-2.5
                            text-sm font-medium text-primary-foreground
                            shadow-lg shadow-[hsl(var(--primary)/0.25)]
                            transition-all duration-200
                            hover:opacity-90 hover:-translate-y-px
                            active:translate-y-0 active:shadow-none
                        "
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5"
                            fill="none" viewBox="0 0 24 24"
                            stroke="currentColor" strokeWidth={2}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        {t('error404.returnToLogin')}
                    </button>

                    <button
                        onClick={() => navigate(-1)}
                        className="
                            inline-flex items-center gap-2 rounded-lg
                            border border-[hsl(var(--primary)/0.2)]
                            px-6 py-2.5 text-sm font-medium text-zinc-400
                            transition-all duration-200
                            hover:border-[hsl(var(--primary)/0.5)] hover:text-zinc-200 hover:-translate-y-px
                            active:translate-y-0
                        "
                    >
                        {t('error404.goBack')}
                    </button>
                </div>

                {/* Footer note */}
                <p
                    className={`
                        mt-16 text-[11px] text-zinc-700 tracking-wide
                        transition-all duration-700 delay-700
                        ${mounted ? 'opacity-100' : 'opacity-0'}
                    `}
                >
                    {t('error404.footerNote')}
                </p>
            </div>

            {/* Bottom edge accent */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--primary)/0.2)] to-transparent" />
        </div>
    );
};

export default Error404;