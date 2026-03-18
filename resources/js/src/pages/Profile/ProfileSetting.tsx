import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { IconUser, IconMail, IconShieldCheck, IconLoader2, IconUserCircle, IconCheck, IconUpload } from "@tabler/icons-react"
import { Skeleton } from "../../components/ui/skeleton"

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
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden flex flex-col h-full">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconColor}`}>
                    {icon}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
                        {badge && <span className="text-[10px] px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">{badge}</span>}
                    </div>
                    {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
                </div>
            </div>
        </div>
        <div className="px-6 py-5 flex-1 space-y-6">
            {children}
        </div>
    </div>
);

export default function ProfileSetting() {
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [fileName, setFileName] = useState<string | null>(null)

    // Form states
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    useEffect(() => {
        fetchUser()
    }, [])

    const fetchUser = async () => {
        try {
            const token = localStorage.getItem("token")
            const response = await fetch("/api/user", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            })
            if (response.ok) {
                const data = await response.json()
                setUser(data)
                setName(data.name)
                setEmail(data.email)
            }
        } catch (error) {
            console.error("Error fetching user:", error)
            toast.error("Failed to fetch user data")
        }
    }

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const token = localStorage.getItem("token")
            const formData = new FormData()
            formData.append("name", name)
            if (fileInputRef.current?.files?.[0]) {
                formData.append("avatar", fileInputRef.current.files[0])
            }

            const response = await fetch("/api/profile/update", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
                body: formData,
            })

            const data = await response.json()
            if (response.ok) {
                setUser(data.user)
                toast.success(data.message)
                // Update local storage user if needed
                localStorage.setItem("user", JSON.stringify(data.user))
            } else {
                toast.error(data.message || "Failed to update profile")
            }
        } catch (err) {
            toast.error("An error occurred")
        } finally {
            setLoading(false)
        }
    }

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match")
            setLoading(false)
            return
        }

        try {
            const token = localStorage.getItem("token")
            const response = await fetch("/api/profile/password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    password: newPassword,
                    password_confirmation: confirmPassword,
                }),
            })

            const data = await response.json()
            if (response.ok) {
                toast.success(data.message)
                setCurrentPassword("")
                setNewPassword("")
                setConfirmPassword("")
            } else {
                toast.error(data.message || "Failed to update password")
            }
        } catch (err) {
            toast.error("An error occurred")
        } finally {
            setLoading(false)
        }
    }

    const handleEmailUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const token = localStorage.getItem("token")
            const response = await fetch("/api/profile/email", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
                body: JSON.stringify({ email }),
            })

            const data = await response.json()
            if (response.ok) {
                setUser(data.user)
                toast.success(data.message)
            } else {
                toast.error(data.message || "Failed to update email")
            }
        } catch (err) {
            toast.error("An error occurred")
        } finally {
            setLoading(false)
        }
    }

    if (!user) return (
        <div className="mx-auto space-y-6 pb-12 w-full animate-pulse">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                    <Skeleton className="w-12 h-12 rounded-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-4 w-60" />
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-[400px] w-full rounded-2xl" />
                <div className="space-y-4 flex flex-col">
                    <Skeleton className="h-[250px] w-full rounded-2xl" />
                    <Skeleton className="h-[300px] w-full rounded-2xl" />
                </div>
            </div>
        </div>
    );

    return (
        <div className="mx-auto space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                        <IconUserCircle size={22} className="text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">Profile Settings</h1>
                        <p className="text-sm text-gray-500">Manage your account details and security</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ── Profile Info ── */}
                <div className="space-y-4">
                    <SectionCard
                        icon={<IconUser size={18} className="text-purple-600 dark:text-purple-400" />}
                        iconColor="bg-purple-100 dark:bg-purple-900/40"
                        title="Profile Information"
                        description="Update your account's profile information."
                    >
                        <form onSubmit={handleProfileUpdate} className="space-y-4 flex flex-col h-full">
                            <div className="flex items-center space-x-4">
                                <div className="shrink-0 relative group">
                                    {user.avatar ? (
                                        <img
                                            className="h-16 w-16 object-cover rounded-2xl shadow-sm ring-1 ring-gray-100 dark:ring-gray-800"
                                            src={`/storage/${user.avatar}`}
                                            alt="Current profile photo"
                                        />
                                    ) : (
                                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 shadow-sm">
                                            <span className="text-2xl font-bold text-gray-400 dark:text-gray-500">{user.name.charAt(0)}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <Label htmlFor="avatar" className="text-sm font-semibold text-gray-800 dark:text-gray-200">Profile Photo</Label>
                                    <div className="flex items-center gap-3">
                                        <Button 
                                            variant="outline" 
                                            type="button" 
                                            onClick={() => fileInputRef.current?.click()} 
                                            className="h-10 border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 transition-all text-gray-600 dark:text-gray-300"
                                        >
                                            <IconUpload size={16} className="mr-2" />
                                            Choose files...
                                        </Button>
                                        <span className="text-xs text-gray-500 max-w-[150px] truncate">
                                            {fileName || "No file chosen"}
                                        </span>
                                    </div>
                                    <input
                                        id="avatar"
                                        type="file"
                                        accept="image/*"
                                        ref={fileInputRef}
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setFileName(e.target.files[0].name);
                                            } else {
                                                setFileName(null);
                                            }
                                        }}
                                        className="hidden"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-semibold text-gray-800 dark:text-gray-200">Full Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="h-10 bg-gray-50/50 dark:bg-gray-950/50 focus-visible:ring-primary"
                                    placeholder="Enter your full name"
                                />
                            </div>

                            <div className="pt-4 mt-auto">
                                <Button type="submit" disabled={loading} className="w-full sm:w-auto gap-2">
                                    {loading ? <IconLoader2 size={16} className="animate-spin" /> : <IconCheck size={16} />}
                                    Save Profile
                                </Button>
                            </div>
                        </form>
                    </SectionCard>
                </div>

                <div className="space-y-4 flex flex-col">
                    {/* ── Email Update ── */}
                    <SectionCard
                        icon={<IconMail size={18} className="text-sky-600 dark:text-sky-400" />}
                        iconColor="bg-sky-100 dark:bg-sky-900/40"
                        title="Email Address"
                        description="Update your email address. Verification required."
                    >
                        <form onSubmit={handleEmailUpdate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-semibold text-gray-800 dark:text-gray-200">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-10 bg-gray-50/50 dark:bg-gray-950/50 focus-visible:ring-primary"
                                />
                                {!user.email_verified_at && (
                                    <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-100 dark:border-yellow-500/20 rounded-xl text-sm text-yellow-800 dark:text-yellow-600">
                                        <p className="font-medium text-xs mb-1">Unverified Email Address</p>
                                        <p className="text-[11px] opacity-80 mb-2">Your email is not verified. Please check your inbox.</p>
                                        <button
                                            type="button"
                                            className="text-[11px] font-semibold text-yellow-700 dark:text-yellow-500 underline hover:text-yellow-800 dark:hover:text-yellow-400"
                                            onClick={async () => {
                                                try {
                                                    const token = localStorage.getItem("token")
                                                    const response = await fetch("/api/email/verification-notification", {
                                                        method: "POST",
                                                        headers: {
                                                            Authorization: `Bearer ${token}`,
                                                            Accept: "application/json",
                                                        },
                                                    })
                                                    const data = await response.json()
                                                    if (response.ok) {
                                                        toast.success(data.message)
                                                    } else {
                                                        toast.error(data.message || "Failed to send verification email")
                                                    }
                                                } catch (error) {
                                                    toast.error("An error occurred")
                                                }
                                            }}
                                        >
                                            Resend Verification Email
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="pt-2">
                                <Button type="submit" disabled={loading} variant="secondary" className="w-full sm:w-auto gap-2">
                                    {loading ? <IconLoader2 size={16} className="animate-spin" /> : <IconCheck size={16} />}
                                    Update Email
                                </Button>
                            </div>
                        </form>
                    </SectionCard>

                    {/* ── Password Update ── */}
                    <div className="flex-1">
                        <SectionCard
                            icon={<IconShieldCheck size={18} className="text-amber-600 dark:text-amber-400" />}
                            iconColor="bg-amber-100 dark:bg-amber-900/40"
                            title="Update Password"
                            description="Ensure your account is using a secure password."
                        >
                            <form onSubmit={handlePasswordUpdate} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="current_password" className="text-sm font-semibold text-gray-800 dark:text-gray-200">Current Password</Label>
                                    <Input
                                        id="current_password"
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        required
                                        className="h-10 bg-gray-50/50 dark:bg-gray-950/50 focus-visible:ring-primary"
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="new_password" className="text-sm font-semibold text-gray-800 dark:text-gray-200">New Password</Label>
                                        <Input
                                            id="new_password"
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                            className="h-10 bg-gray-50/50 dark:bg-gray-950/50 focus-visible:ring-primary"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirm_password" className="text-sm font-semibold text-gray-800 dark:text-gray-200">Confirm Password</Label>
                                        <Input
                                            id="confirm_password"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            className="h-10 bg-gray-50/50 dark:bg-gray-950/50 focus-visible:ring-primary"
                                        />
                                    </div>
                                </div>
                                <div className="pt-4">
                                    <Button type="submit" disabled={loading} variant="secondary" className="w-full sm:w-auto gap-2">
                                        {loading ? <IconLoader2 size={16} className="animate-spin" /> : <IconCheck size={16} />}
                                        Save Password
                                    </Button>
                                </div>
                            </form>
                        </SectionCard>
                    </div>
                </div>
            </div>
        </div>
    )
}
