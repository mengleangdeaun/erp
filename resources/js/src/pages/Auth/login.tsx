import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { IconMail, IconLock, IconLoader2, IconArrowRight } from "@tabler/icons-react"
import { toast } from "sonner"

export default function Login() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return "Good morning!"
        if (hour < 18) return "Good afternoon!"
        return "Good evening!"
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            // Get CSRF cookie first
            await fetch('/sanctum/csrf-cookie');

            // Helper to get cookie
            const getCookie = (name: string) => {
                const value = `; ${document.cookie}`;
                const parts = value.split(`; ${name}=`);
                if (parts.length === 2) return parts.pop()?.split(';').shift();
            };

            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': decodeURIComponent(getCookie('XSRF-TOKEN') || ''),
                },
                credentials: 'include',
                body: JSON.stringify({ email: email, password: password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Store token in localStorage if needed (though we rely on cookies)
                if (data.token) {
                    localStorage.setItem('auth_token', data.token);
                }
                // Store user info
                if (data.user) {
                    localStorage.setItem('user_info', JSON.stringify(data.user));
                }

                // Assuming 'toast' is imported or defined elsewhere
                // toast.success('Login successful');
                navigate('/');
            } else {
                // Assuming 'toast' is imported or defined elsewhere
                // toast.error(data.message || 'Login failed');
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            console.error(err);
            // Assuming 'toast' is imported or defined elsewhere
            // toast.error('An error occurred during login');
            setError('An error occurred during login');
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen bg-white dark:bg-black font-sans">
            <div className="flex flex-col justify-center w-full lg:w-1/2 px-6 sm:px-12 md:px-24">
                <div className="w-full max-w-sm mx-auto space-y-8">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{getGreeting()}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Enter your credentials to access your account.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2 relative">
                            <Label htmlFor="email" className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Email</Label>
                            <div className="relative">
                                <IconMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="pl-10 h-12 bg-gray-50/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 rounded-xl focus-visible:ring-primary shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 relative">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Password</Label>
                                <Link to="/auth/forgot-password" className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <IconLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    placeholder="••••••••"
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="pl-10 h-12 bg-gray-50/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 rounded-xl focus-visible:ring-primary shadow-sm"
                                />
                            </div>
                        </div>

                        <Button className="w-full h-12 rounded-xl text-base font-medium shadow-md shadow-primary/20 bg-primary hover:bg-primary/90 transition-all group" type="submit" disabled={loading}>
                            {loading ? (
                                <IconLoader2 className="animate-spin w-5 h-5 mr-2" />
                            ) : (
                                "Sign in"
                            )}
                            {!loading && <IconArrowRight className="w-4 h-4 ml-2 opacity-70 group-hover:translate-x-1 transition-transform" />}
                        </Button>
                    </form>
                </div>
            </div>

            {/* Right Side - Brand / Visuals */}
            <div className="hidden lg:flex flex-col justify-center w-1/2 bg-gray-50 dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 relative overflow-hidden p-12 lg:p-24">
                <div className="relative z-10 space-y-6 max-w-lg">
                    <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white !leading-snug">
                        Welcome to <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">S-COOL ERP</span>
                    </h2>
                    <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed">
                        A modern workspace to manage your enterprise easily. Seamless integration and intelligent analytics.
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
