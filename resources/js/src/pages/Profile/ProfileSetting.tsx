import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "../../components/ui/card"

export default function ProfileSetting() {
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

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

    if (!user) return <div>Loading...</div>

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Profile Settings</h1>

            {/* Profile Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Update your account's profile information and email address.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                        <div className="flex items-center space-x-4">
                            <div className="shrink-0">
                                {user.avatar ? (
                                    <img
                                        className="h-16 w-16 object-cover rounded-full"
                                        src={`/storage/${user.avatar}`}
                                        alt="Current profile photo"
                                    />
                                ) : (
                                    <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                        <span className="text-xl font-bold">{user.name.charAt(0)}</span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="avatar">Profile Photo</Label>
                                <Input
                                    id="avatar"
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    className="mt-1"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <Button type="submit" disabled={loading}>Save Profile</Button>
                    </form>
                </CardContent>
            </Card>

            {/* Email Update */}
            <Card>
                <CardHeader>
                    <CardTitle>Email Address</CardTitle>
                    <CardDescription>Update your email address. Verification required for changes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleEmailUpdate} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            {!user.email_verified_at && (
                                <div className="mt-2 text-sm text-yellow-600">
                                    <p>Your email is not verified. Check your inbox.</p>
                                    <button
                                        type="button"
                                        className="text-primary underline hover:text-primary-dark-light"
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
                        <Button type="submit" disabled={loading}>Update Email</Button>
                    </form>
                </CardContent>
            </Card>

            {/* Password Update */}
            <Card>
                <CardHeader>
                    <CardTitle>Update Password</CardTitle>
                    <CardDescription>Ensure your account is using a long, random password to stay secure.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handlePasswordUpdate} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="current_password">Current Password</Label>
                            <Input
                                id="current_password"
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new_password">New Password</Label>
                            <Input
                                id="new_password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm_password">Confirm Password</Label>
                            <Input
                                id="confirm_password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" disabled={loading}>Save Password</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
