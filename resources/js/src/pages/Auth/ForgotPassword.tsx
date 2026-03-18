import { useState } from "react"
import { Link } from "react-router-dom"
import { IconLoader2, IconArrowLeft, IconCheck, IconMail } from "@tabler/icons-react"

export default function ForgotPassword() {
    const [email, setEmail] = useState("")
    const [status, setStatus] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setStatus(null)
        setLoading(true)
        try {
            await fetch('/sanctum/csrf-cookie')
            const getCookie = (name: string) => {
                const value = `; ${document.cookie}`
                const parts = value.split(`; ${name}=`)
                if (parts.length === 2) return parts.pop()?.split(';').shift()
            }
            const response = await fetch('/api/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': decodeURIComponent(getCookie('XSRF-TOKEN') || ''),
                },
                credentials: 'include',
                body: JSON.stringify({ email }),
            })
            const data = await response.json()
            if (response.ok) {
                setSuccess(true)
                setStatus(data.message || 'Password reset link sent!')
            } else {
                setError(data.message || 'Failed to send reset link.')
            }
        } catch (err) {
            console.error(err)
            setError('An error occurred while sending the reset link.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen bg-slate-950">

            {/* ── Left: Form Panel ── */}
            <div className="relative flex flex-col justify-between w-full lg:max-w-[480px] px-10 py-12 bg-white dark:bg-slate-900 z-10 shadow-2xl shadow-black/40">

                {/* Logo */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                    </div>
                    <span className="text-[13px] font-semibold tracking-widest uppercase text-slate-400 dark:text-slate-500">
                        S-Cool ERP
                    </span>
                </div>

                {/* Form */}
                <div className="flex flex-col gap-6">

                    {!success ? (
                        <>
                            {/* Heading */}
                            <div>
                                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary mb-2">
                                    Account recovery
                                </p>
                                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                                    Reset your password.
                                </h1>
                                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                    Enter your email and we'll send you a secure reset link.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                                {error && (
                                    <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                                      <svg className="w-4 h-4 mt-0.5 shrink-0" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle opacity="0.5" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
                                    <path d="M12 17V11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                                    <circle cx="1" cy="1" r="1" transform="matrix(1 0 0 -1 11 9)" fill="currentColor"/>
                                </svg>
                                        {error}
                                    </div>
                                )}

                                {/* Email */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-semibold tracking-widest uppercase text-slate-500 dark:text-slate-400">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                                        </svg>
                                        <input
                                            type="email"
                                            placeholder="name@company.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            autoComplete="email"
                                            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                                        />
                                    </div>
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center justify-center gap-2 w-full h-11 mt-1 rounded-xl bg-primary hover:bg-primary/90 active:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground text-sm font-semibold tracking-wide shadow-lg shadow-primary/30 transition-all duration-150"
                                >
                                    {loading ? (
                                        <IconLoader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            Send reset link
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Divider */}
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                                <span className="text-[11px] text-slate-400 tracking-widest uppercase">or</span>
                                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                            </div>

                            {/* Back to login */}
                            <Link
                                to="/auth/login"
                                className="flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium transition-all duration-150"
                            >
                                <IconArrowLeft className="w-4 h-4" />
                                Back to sign in
                            </Link>
                        </>
                    ) : (
                        /* ── Success State ── */
                        <>
                            <div>
                                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary mb-2">
                                    Email sent
                                </p>
                                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                                    Check your inbox.
                                </h1>
                                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                    We've sent a reset link to <span className="font-medium text-slate-700 dark:text-slate-300">{email}</span>.
                                </p>
                            </div>

                            {/* Success card */}
                            <div className="flex flex-col items-center gap-5 px-6 py-8 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 text-center">
                                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary">
                                    <IconCheck className="w-7 h-7" strokeWidth={2.5} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {status}
                                    </p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500">
                                        Didn't receive it? Check your spam folder.
                                    </p>
                                </div>
                            </div>

                            <Link
                                to="/auth/login"
                                className="flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium transition-all duration-150"
                            >
                                <IconArrowLeft className="w-4 h-4" />
                                Return to sign in
                            </Link>
                        </>
                    )}
                </div>

                {/* Footer */}
                <p className="text-[11px] text-slate-400 dark:text-slate-600 text-center">
                    © {new Date().getFullYear()} SCC Group. All rights reserved.
                </p>
            </div>

            {/* ── Right: Decorative Panel ── */}
            <div className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center">

                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="xMidYMid slice"
                >
                    <defs>
                        {/* Dense Dot Matrix with pulse */}
                        <pattern id="dense-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                            <circle cx="12" cy="12" r="1.5" fill="hsl(var(--primary))" fillOpacity="0.15">
                                <animate attributeName="fill-opacity" values="0.05;0.35;0.05" dur="3s" repeatCount="indefinite" />
                            </circle>
                            <circle cx="24" cy="24" r="1" fill="hsl(var(--primary))" fillOpacity="0.1">
                                <animate attributeName="fill-opacity" values="0.1;0.4;0.1" dur="4s" repeatCount="indefinite" />
                            </circle>
                        </pattern>

                        
                        <radialGradient id="vignette-heavy" cx="50%" cy="50%" r="70%">
                            <stop offset="0%" stopColor="transparent" />
                            <stop offset="100%" stopColor="#020617" stopOpacity="0.95" />
                        </radialGradient>
                    </defs>

                    <rect width="100%" height="100%" fill="#020617" />
                    
                    {/* The Matrix Base */}
                    <rect width="100%" height="100%" fill="url(#dense-dots)" />

                    {/* Sweeping Beam */}
                    <rect width="200%" height="200%" fill="url(#beam)" transform="translate(-50%, -50%)">
                        <animateTransform attributeName="transform" type="translate" values="-1000 -1000; 1000 1000" dur="8s" repeatCount="indefinite" />
                    </rect>

                    {/* Deep Vignette */}
                    <rect width="100%" height="100%" fill="url(#vignette-heavy)" />



                </svg>

                {/* Floating content */}
                <div className="relative z-10 flex flex-col gap-10 max-w-lg px-12">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-px bg-primary opacity-60" />
                        <span className="text-[11px] font-semibold tracking-[0.25em] uppercase text-primary">
                            Account Security
                        </span>
                    </div>

                    <div className="flex flex-col gap-4">
                        <h2 className="text-5xl xl:text-6xl font-bold tracking-tight text-white leading-[1.05]">
                            Secure your<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                                workspace,
                            </span><br />
                            always.
                        </h2>
                        <p className="text-base text-slate-400 leading-relaxed max-w-sm">
                            Your enterprise data stays protected. Regain access quickly with a secure, time-limited reset link sent directly to your inbox.
                        </p>
                    </div>

                    {/* Feature list */}
                    <div className="flex flex-col gap-3 pt-8 border-t border-slate-700/50">
                        {[
                            { icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", text: "End-to-end encrypted reset flow" },
                            { icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", text: "Link expires in 60 minutes" },
                            { icon: "M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3", text: "Instant delivery to your inbox" },
                        ].map((f) => (
                            <div key={f.text} className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/15 text-primary shrink-0">
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d={f.icon}/>
                                    </svg>
                                </div>
                                <span className="text-sm text-slate-400">{f.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}