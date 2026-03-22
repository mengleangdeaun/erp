import { useState, useEffect } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { IconLoader2, IconCheck, IconEye, IconEyeOff, IconArrowRight } from "@tabler/icons-react"

export default function ResetPassword() {
    const [email, setEmail] = useState("")
    const [token, setToken] = useState("")
    const [password, setPassword] = useState("")
    const [passwordConfirmation, setPasswordConfirmation] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)


    const navigate = useNavigate()
    const location = useLocation()


    useEffect(() => {
        const query = new URLSearchParams(location.search)
        const tokenParam = query.get("token")
        const emailParam = query.get("email")
        if (tokenParam) setToken(tokenParam)
        if (emailParam) setEmail(emailParam)
    }, [location])

    // Password strength
    const getStrength = (p: string) => {
        if (!p) return 0
        let score = 0
        if (p.length >= 8) score++
        if (/[A-Z]/.test(p)) score++
        if (/[0-9]/.test(p)) score++
        if (/[^A-Za-z0-9]/.test(p)) score++
        return score
    }
    const strength = getStrength(password)
    const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength]
    const strengthColor = ["", "bg-red-500", "bg-amber-400", "bg-emerald-400", "bg-emerald-500"][strength]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        if (password !== passwordConfirmation) {
            setError("Passwords do not match.")
            return
        }
        if (password.length < 8) {
            setError("Password must be at least 8 characters.")
            return
        }
        setLoading(true)
        try {
            await fetch('/sanctum/csrf-cookie')
            const getCookie = (name: string) => {
                const value = `; ${document.cookie}`
                const parts = value.split(`; ${name}=`)
                if (parts.length === 2) return parts.pop()?.split(';').shift()
            }
            const response = await fetch('/api/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': decodeURIComponent(getCookie('XSRF-TOKEN') || ''),
                },
                credentials: 'include',
                body: JSON.stringify({
                    token,
                    email,
                    password,
                    password_confirmation: passwordConfirmation,
                }),
            })
            const data = await response.json()
            if (response.ok) {
                setSuccess(true)
            } else {
                setError(data.message || 'Failed to reset password.')
            }
        } catch (err) {
            console.error(err)
            setError('An error occurred during password reset.')
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
                    <div className="flex items-center justify-center w-32 overflow-hidden">
                        <img 
                            src="/assets/images/logo.png" 
                            alt="Logo" 
                            className="w-full h-full object-contain"
                        />
                    </div>
                </div>

                {/* Form */}
                <div className="flex flex-col gap-6">

                    {!success ? (
                        <>
                            {/* Heading */}
                            <div>
                                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary mb-2">
                                    New password
                                </p>
                                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                                    Create a strong password.
                                </h1>
                                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                    Your new password must be at least 8 characters and hard to guess.
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

                                {/* New Password */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-semibold tracking-widest uppercase text-slate-500 dark:text-slate-400">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                                        </svg>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            autoComplete="new-password"
                                            className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                        >
                                            {showPassword
                                                ? <IconEyeOff className="w-4 h-4" />
                                                : <IconEye className="w-4 h-4" />}
                                        </button>
                                    </div>

                                    {/* Strength meter */}
                                    {password.length > 0 && (
                                        <div className="flex flex-col gap-1.5 mt-1">
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4].map((i) => (
                                                    <div
                                                        key={i}
                                                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColor : "bg-slate-200 dark:bg-slate-700"}`}
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                                Strength: <span className="font-medium text-slate-600 dark:text-slate-300">{strengthLabel}</span>
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-semibold tracking-widest uppercase text-slate-500 dark:text-slate-400">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                                        </svg>
                                        <input
                                            type={showConfirm ? "text" : "password"}
                                            placeholder="••••••••••"
                                            value={passwordConfirmation}
                                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                                            required
                                            autoComplete="new-password"
                                            className={`w-full h-11 pl-10 pr-10 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition ${
                                                passwordConfirmation && password !== passwordConfirmation
                                                    ? "border-red-300 dark:border-red-500/50"
                                                    : passwordConfirmation && password === passwordConfirmation
                                                    ? "border-emerald-300 dark:border-emerald-500/50"
                                                    : "border-slate-200 dark:border-slate-700"
                                            }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm(!showConfirm)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                        >
                                            {showConfirm
                                                ? <IconEyeOff className="w-4 h-4" />
                                                : <IconEye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {passwordConfirmation && password === passwordConfirmation && (
                                        <p className="text-[11px] text-emerald-500 flex items-center gap-1">
                                            <IconCheck className="w-3 h-3" strokeWidth={3} /> Passwords match
                                        </p>
                                    )}
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
                                            Reset password
                                            <IconArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    ) : (
                        /* ── Success State ── */
                        <>
                            <div>
                                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary mb-2">
                                    All done
                                </p>
                                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                                    Password updated.
                                </h1>
                                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                    Your password has been reset successfully. You can now sign in.
                                </p>
                            </div>

                            {/* Success card */}
                            <div className="flex flex-col items-center gap-5 px-6 py-8 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 text-center">
                                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary">
                                    <IconCheck className="w-7 h-7" strokeWidth={2.5} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Your account is secure and ready.
                                    </p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500">
                                        Use your new password to sign in.
                                    </p>
                                </div>
                            </div>

                            <Link
                                to="/auth/login"
                                className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold tracking-wide shadow-lg shadow-primary/30 transition-all duration-150"
                            >
                                Go to sign in
                                <IconArrowRight className="w-4 h-4" />
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
                            Password Security
                        </span>
                    </div>

                    <div className="flex flex-col gap-4">
                        <h2 className="text-5xl xl:text-6xl font-bold tracking-tight text-white leading-[1.05]">
                            A stronger<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                                password,
                            </span><br />
                            a safer you.
                        </h2>
                        <p className="text-base text-slate-400 leading-relaxed max-w-sm">
                            Your new password protects access to your entire enterprise workspace. Make it count.
                        </p>
                    </div>

                    {/* Password tips */}
                    <div className="flex flex-col gap-3 pt-8 border-t border-slate-700/50">
                        {[
                            { icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z", text: "Use 8+ characters with mixed case" },
                            { icon: "M7 20l4-16m2 16l4-16M6 9h14M4 15h14", text: "Include numbers and symbols" },
                            { icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636", text: "Never reuse a previous password" },
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