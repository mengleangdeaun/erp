import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { IconLoader2, IconArrowRight } from "@tabler/icons-react"

export default function Login() {
    // --- Auth State ---
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    // --- Mouse Tracking State ---
    const [mousePos, setMousePos] = useState({ x: 50, y: 50 })

    

    const navigate = useNavigate()

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return "Good morning"
        if (hour < 18) return "Good afternoon"
        return "Good evening"
    }

    // --- Mouse Tracking Effect ---
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // Calculate percentage based on the viewport to move the gradient
            const x = (e.clientX / window.innerWidth) * 100
            const y = (e.clientY / window.innerHeight) * 100
            setMousePos({ x, y })
        }

        window.addEventListener("mousemove", handleMouseMove)
        return () => window.removeEventListener("mousemove", handleMouseMove)
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)
        try {
            await fetch('/sanctum/csrf-cookie')
            const getCookie = (name: string) => {
                const value = `; ${document.cookie}`
                const parts = value.split(`; ${name}=`)
                if (parts.length === 2) return parts.pop()?.split(';').shift()
            }
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': decodeURIComponent(getCookie('XSRF-TOKEN') || ''),
                },
                credentials: 'include',
                body: JSON.stringify({ email, password }),
            })
            const data = await response.json()
            if (response.ok) {
                if (data.token) localStorage.setItem('auth_token', data.token)
                if (data.user) localStorage.setItem('user_info', JSON.stringify(data.user))
                navigate('/')
            } else {
                setError(data.message || 'Login failed')
            }
        } catch (err) {
            console.error(err)
            setError('An error occurred during login')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen bg-slate-950 ">
            
            {/* ── Left: Login Form ── */}
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
                    {/* Heading */}
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                            {getGreeting()}.
                        </h1>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            Sign in to access your workspace.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        {error && (
                            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                                <svg className="w-4 h-4 mt-0.5 shrink-0" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle opacity="0.5" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                                    <path d="M12 17V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    <circle cx="1" cy="1" r="1" transform="matrix(1 0 0 -1 11 9)" fill="currentColor" />
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
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
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

                        {/* Password */}
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-[11px] font-semibold tracking-widest uppercase text-slate-500 dark:text-slate-400">
                                    Password
                                </label>
                                <Link
                                    to="/auth/forgot-password"
                                    className="text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                                </svg>
                                <input
                                    type="password"
                                    placeholder="••••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                                />
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center justify-center gap-2 w-full h-11 mt-1 rounded-xl bg-primary hover:bg-primary/90 active:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold tracking-wide shadow-lg shadow-primary/30 transition-all duration-150"
                        >
                            {loading ? (
                                <IconLoader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    Sign in
                                    <IconArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                        <span className="text-[11px] text-slate-400 tracking-widest uppercase">Secured</span>
                        <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                    </div>

                    {/* Trust badges */}
                    <div className="flex items-center justify-center gap-6">
                        {[
                            { icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", label: "256-bit SSL" },
                            { icon: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z", label: "Private" },
                            { icon: "M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3", label: "Verified" },
                        ].map((b) => (
                            <div key={b.label} className="flex items-center gap-1.5 text-slate-400">
                                <svg className="w-3.5 h-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                    <path d={b.icon} />
                                </svg>
                                <span className="text-[10px] font-medium tracking-wide">{b.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <p className="text-[11px] text-slate-400 dark:text-slate-600 text-center">
                    © {new Date().getFullYear()} SCC Group. All rights reserved.
                </p>
            </div>

            {/* ── Right: Decorative Panel (Neural Data Matrix) ── */}
            <div className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center bg-slate-950">
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

{/* Bottom horizontal glow */}
<div
  className="absolute bottom-0 left-0 w-full h-64
  bg-gradient-to-t from-primary/25 via-primary/10 to-transparent
  pointer-events-none z-0 
  animate-[floatLineBottom_8s_ease-in-out_infinite]"
></div>

{/* Top horizontal glow */}
<div
  className="absolute top-0 left-0 w-full h-64
  bg-gradient-to-b from-primary/25 via-primary/10 to-transparent
  pointer-events-none z-0 
  animate-[floatLineTop_10s_ease-in-out_infinite]"
></div>


      {/* Bottom horizontal glow */}
      <div
        className="absolute bottom-0 left-0 w-full h-64
        bg-gradient-to-t from-primary/25 via-primary/10 to-transparent
        pointer-events-none z-0 animate-[floatLineBottom_8s_ease-in-out_infinite]"
        style={{
          transform: `translateX(${(mousePos.x - 50) * 0.5}px) translateY(${10 - mousePos.y * 0.05}px)`,
        }}
      ></div>

      {/* Top horizontal glow */}
      <div
        className="absolute top-0 left-0 w-full h-64
        bg-gradient-to-b from-primary/25 via-primary/10 to-transparent
        pointer-events-none z-0 animate-[floatLineTop_10s_ease-in-out_infinite]"
        style={{
          transform: `translateX(${-(mousePos.x - 50) * 0.5}px) translateY(${-10 + mousePos.y * 0.05}px)`,
        }}
      ></div>



{/* <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-primary/20 via-primary/10 to-transparent pointer-events-none z-0 "></div> */}

                {/* Enhanced sunrise glow with animation */}
                {/* <div 
                    className="absolute bottom-[-60%] left-1/2 -translate-x-1/2 
                        w-full h-full max-w-[1800px] max-h-[1800px]
                        bg-[radial-gradient(circle,_hsl(var(--primary)/0.45)_0%,_hsl(var(--primary)/0.25)_35%,_hsl(var(--primary)/0.12)_55%,_transparent_70%)]
                        rounded-full blur-3xl pointer-events-none z-0 animate-glow-pulse"
                /> */}

                {/* Floating content */}
                <div className="relative z-10 flex flex-col gap-10 max-w-lg px-12 pointer-events-none">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-px bg-primary opacity-60" />
                        <span className="text-[11px] font-semibold tracking-[0.25em] uppercase text-primary">
                            Enterprise Platform
                        </span>
                    </div>
                    <div className="flex flex-col gap-4">
                        <h2 className="text-5xl xl:text-6xl font-bold tracking-tight text-white leading-[1.05]">
                            Manage your<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                                enterprise,
                            </span><br />
                            effortlessly.
                        </h2>
                        <p className="text-base text-slate-400 leading-relaxed max-w-sm">
                            A unified workspace for operations, analytics, and team management — built for clarity at every scale.
                        </p>
                    </div>
                    <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-700/50">
                        {[
                            { value: "99.9%", label: "Uptime SLA" },
                            { value: "256-bit", label: "Encryption" },
                            { value: "24 / 7", label: "Support" },
                        ].map((s) => (
                            <div key={s.label}>
                                <p className="text-2xl font-bold text-white tracking-tight">{s.value}</p>
                                <p className="text-[11px] font-medium tracking-widest uppercase text-slate-500 mt-1">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}