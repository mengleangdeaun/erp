import { useState, useEffect } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { IconLock, IconLoader2, IconCheck, IconEye, IconEyeOff } from "@tabler/icons-react"
import { toast } from "sonner"

export default function ResetPassword() {
    const [email, setEmail] = useState("")
    const [token, setToken] = useState("")
    const [password, setPassword] = useState("")
    const [passwordConfirmation, setPasswordConfirmation] = useState("")
    
    const [showPassword, setShowPassword] = useState(false)
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
            await fetch('/sanctum/csrf-cookie');
            const getCookie = (name: string) => {
                const value = `; ${document.cookie}`;
                const parts = value.split(`; ${name}=`);
                if (parts.length === 2) return parts.pop()?.split(';').shift();
            };

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
                    password_confirmation: passwordConfirmation 
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(true)
            } else {
                setError(data.message || 'Failed to reset password.');
            }
        } catch (err) {
            console.error(err);
            setError('An error occurred during password reset.');
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen bg-white dark:bg-black font-sans">
            <div className="flex flex-col justify-center w-full lg:w-1/2 px-6 sm:px-12 md:px-24">
                <div className="w-full max-w-sm mx-auto space-y-8 mt-12">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Create new password</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Your new password must be securely formed to protect your enterprise account.
                        </p>
                    </div>

                    {!success ? (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2 relative">
                                <Label htmlFor="password" className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">New Password</Label>
                                <div className="relative">
                                    <IconLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="pl-10 pr-10 h-12 bg-gray-50/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 rounded-xl focus-visible:ring-primary shadow-sm"
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 relative">
                                <Label htmlFor="password_confirmation" className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Confirm Password</Label>
                                <div className="relative">
                                    <IconLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                                    <Input
                                        id="password_confirmation"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={passwordConfirmation}
                                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                                        required
                                        className="pl-10 h-12 bg-gray-50/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 rounded-xl focus-visible:ring-primary shadow-sm"
                                    />
                                </div>
                            </div>

                            <Button className="w-full h-12 rounded-xl text-base font-medium shadow-md shadow-primary/20 bg-primary hover:bg-primary/90 transition-all" type="submit" disabled={loading}>
                                {loading ? (
                                    <IconLoader2 className="animate-spin w-5 h-5" />
                                ) : (
                                    "Reset password"
                                )}
                            </Button>
                        </form>
                    ) : (
                        <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-2xl p-6 text-center space-y-4">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto">
                                <IconCheck className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">Password Reset Successful</h3>
                            <p className="text-sm text-green-700 dark:text-green-400">
                                You can now log in using your new password.
                            </p>
                            <Link to="/auth/login" className="block w-full">
                                <Button className="w-full mt-2 h-10 bg-green-600 hover:bg-green-700 text-white shadow-sm transition-all border-none">
                                    Go to login
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Side - Brand / Visuals */}
            <div className="hidden lg:flex flex-col justify-center w-1/2 bg-gray-50 dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 relative overflow-hidden p-12 lg:p-24">
                <div className="relative z-10 space-y-6 max-w-lg">
                    <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-white !leading-snug">
                        Secure your <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">Workspace</span>
                    </h2>
                    <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed">
                        Regain access to your account quickly and securely. Your enterprise data remains protected.
                    </p>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-30 dark:opacity-20 pointer-events-none blur-3xl z-0">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/40 rounded-full mix-blend-multiply filter animate-pulse delay-75" />
                    <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-400/30 rounded-full mix-blend-multiply filter animate-pulse delay-150" />
                    <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-400/30 rounded-full mix-blend-multiply filter animate-pulse" />
                </div>
                
                {/* Micro pattern overlay */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMCwwLDAsMC4wNSkiLz48L3N2Zz4=')] dark:opacity-[0.1] opacity-[0.4] z-0" />
            </div>
        </div>
    )
}
