'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef, Suspense } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
    Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

// Dynamically import icons
const EyeIcon = dynamic(() => import('lucide-react').then(m => m.Eye), { ssr: false })
const EyeOffIcon = dynamic(() => import('lucide-react').then(m => m.EyeOff), { ssr: false })
const LogIn = dynamic(() => import('lucide-react').then(m => m.LogIn), { ssr: false })
const Loader2 = dynamic(() => import('lucide-react').then(m => m.Loader2), { ssr: false })
const Palette = dynamic(() => import('lucide-react').then(m => m.Palette), { ssr: false })

const formSchema = z.object({
    email: z.string().email({ message: 'Invalid email address' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
})

type FormData = z.infer<typeof formSchema>

// --- Define Loading Fallback ---
function LoadingFallback() {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-br from-white via-gray-50 to-gray-100">
            <div className="flex flex-col items-center space-y-3">
                <div className="h-10 w-10 animate-spin text-indigo-600">⟳</div>
                <p className="text-gray-600 text-sm font-medium animate-pulse">Loading...</p>
            </div>
        </div>
    );
}

// --- Main Component ---
function LoginPageContent() {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({ resolver: zodResolver(formSchema) })

    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)
    const [checkingAuth, setCheckingAuth] = useState(true)
    const router = useRouter()

    // --- Get API Base URL ---
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

    useEffect(() => {
        // --- Check if API URL is configured ---
        if (!API_BASE_URL) {
            console.error("API Base URL (NEXT_PUBLIC_API_BASE_URL) is not configured.");
            toast.error("Configuration error: Cannot connect to services.");
            setCheckingAuth(false);
            return; // Don't attempt fetch if URL is missing
        }

        // --- Session Check (calls HONO backend) ---
        fetch(`${API_BASE_URL}/api/auth/session`, {
            credentials: 'include' // <-- Send cookies
        }).then(async (res) => {
            if (res.ok) {
                // Optional: check response body if backend sends user data on session check
                const data = await res.json().catch(() => null); // Gracefully handle non-JSON
                if (data?.user) {
                    console.log("Active session found, redirecting...");
                    router.push('/') // Redirect to dashboard or home
                } else {
                    setCheckingAuth(false);
                }
            } else {
                // Handle non-ok status codes if needed (e.g., 401 means not logged in - expected)
                if (res.status !== 401 && res.status !== 200) { // Log unexpected errors
                    console.warn("Session check returned status:", res.status);
                }
                setCheckingAuth(false);
            }
        }).catch(err => {
            console.error("Session check fetch failed:", err);
            toast.error("Could not check session status."); // Inform user
            setCheckingAuth(false);
        })
    }, [router, API_BASE_URL]) // Include API_BASE_URL in dependency array

    const onSubmit = async (data: FormData) => {
        // --- Check if API URL is configured ---
        if (!API_BASE_URL) {
            toast.error("Configuration error: Cannot perform login.");
            return;
        }

        setError(null); 
        setMessage(null);
        const toastId = toast.loading("Signing you in...");

        try {
            // --- Login Request (calls HONO backend) ---
            const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                credentials: 'include' // <-- Essential for receiving session cookies
            })

            if (res.ok) {
                toast.success('Login successful', { id: toastId, duration: 2500 })
                setMessage("Redirecting to your dashboard...")
                router.push('/') // Redirect after successful login
                router.refresh(); // Optional: Force refresh server components if needed
            } else {
                let errorMessage = 'Invalid credentials or server error'; // Default error
                try {
                    const errorData = await res.json();
                    // Use the specific error message from the Hono backend
                    errorMessage = errorData.error || errorData.message || `Login failed (status ${res.status})`;
                } catch (_) {
                    errorMessage = `Login failed (status ${res.status})`; // Fallback if no JSON body
                }
                toast.error("Login Failed", { id: toastId, description: "Please check your credentials." });
                setError(errorMessage);
            }
        } catch (error: any) {
            console.error("Login request fetch failed:", error);
            toast.error('Login failed. Please check your connection and try again.', { id: toastId })
            setError('Login failed. Please check your connection and try again.')
        }
    }

    // If checking authentication status, show loading screen
    if (checkingAuth) {
        return <LoadingFallback />;
    }

    return (
        <div className="flex min-h-screen h-screen w-screen items-start justify-start overflow-hidden bg-gradient-to-br from-white via-gray-50 to-blue-50">
            {/* Main Form Card */}
            <div className="h-full z-10 relative">
                <Card className="shadow-2xl rounded-none h-full w-[450px] bg-white/80 border-r border-gray-200/50 backdrop-blur-lg">
                    {/* Card Header */}
                    <CardHeader className="space-y-0 text-center px-6 pt-10 pb-0">
                        <div>
                            <div className="mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full p-3 w-16 h-16 flex items-center justify-center shadow-lg mb-3">
                                <Suspense fallback={<div className="h-8 w-8" />}>
                                    <Palette className="h-8 w-8 text-white" strokeWidth={1.5}/>
                                </Suspense>
                            </div>
                        </div>
                        <div>
                            <CardTitle className="text-3xl font-bold tracking-tight text-black">Welcome Back</CardTitle>
                        </div>
                        <div>
                            <CardDescription className="text-gray-600 text-sm">Sign in to access your account.</CardDescription>
                        </div>
                    </CardHeader>

                    {/* Card Content */}
                    <CardContent className="px-6 pt-4">
                        <form 
                            onSubmit={handleSubmit(onSubmit)} 
                            className="space-y-4"
                        >
                            {/* Messages/Errors Area */}
                            <div className="min-h-[45px] w-full">
                                {message && (
                                    <div className="flex items-center p-3 rounded-md bg-green-50 border border-green-200">
                                        <div className="h-5 w-5 text-green-600 mr-2.5 flex-shrink-0">✓</div>
                                        <p className="text-sm font-medium text-green-800">{message}</p>
                                    </div>
                                )}
                                {error && (
                                    <div className="flex items-center p-3 rounded-md bg-red-50 border border-red-200">
                                        <div className="h-5 w-5 text-red-600 mr-2.5 flex-shrink-0">!</div>
                                        <p className="text-sm font-medium text-red-800">{error}</p>
                                    </div>
                                )}
                            </div>

                            {/* Email Input */}
                            <div className="space-y-1.5 relative">
                                <Label 
                                    htmlFor="email" 
                                    className={cn(
                                        "font-semibold text-sm pl-1", 
                                        errors.email ? "text-red-600" : "text-gray-800"
                                    )}
                                >
                                    Email Address
                                </Label>
                                <Input 
                                    id="email" 
                                    type="email" 
                                    autoComplete="email" 
                                    autoFocus 
                                    placeholder="you@example.com"
                                    aria-invalid={!!errors.email} 
                                    aria-describedby={errors.email ? "email-error" : undefined}
                                    className={cn(
                                        "h-11 text-base font-medium rounded-lg",
                                        "bg-gray-50/80",
                                        "text-black placeholder:text-gray-400",
                                        "focus:bg-white",
                                        "focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-white",
                                        "pr-3",
                                        errors.email ? "border-red-500 focus-visible:ring-red-500" : "border-gray-300 focus-visible:ring-indigo-500"
                                    )}
                                    {...register('email')} 
                                />
                                {errors.email && (
                                    <p 
                                        id="email-error" 
                                        className="text-xs text-red-600 mt-1 pl-1 flex items-center gap-1"
                                    >
                                        {errors.email.message}
                                    </p>
                                )}
                            </div>

                            {/* Password Input */}
                            <div className="space-y-1.5 relative">
                                <div className="flex items-center justify-between">
                                    <Label 
                                        htmlFor="password" 
                                        className={cn(
                                            "font-semibold text-sm pl-1", 
                                            errors.password ? "text-red-600" : "text-gray-800"
                                        )}
                                    >
                                        Password
                                    </Label>
                                    <Link 
                                        href="/forgot-password" 
                                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline underline-offset-2 transition-colors" 
                                        tabIndex={isSubmitting ? -1 : 0}
                                    > 
                                        Forgot Password? 
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Input 
                                        id="password" 
                                        type={showPassword ? 'text' : 'password'} 
                                        autoComplete="current-password" 
                                        placeholder="••••••••"
                                        aria-invalid={!!errors.password} 
                                        aria-describedby={errors.password ? "password-error" : undefined}
                                        className={cn(
                                            "h-11 text-base font-medium rounded-lg",
                                            "bg-gray-50/80",
                                            "text-black placeholder:text-gray-400",
                                            "focus:bg-white",
                                            "focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-white",
                                            "pr-10",
                                            errors.password ? "border-red-500 focus-visible:ring-red-500" : "border-gray-300 focus-visible:ring-indigo-500"
                                        )}
                                        {...register('password')} 
                                    />
                                    <Button 
                                        type="button" 
                                        size="icon" 
                                        variant="ghost" 
                                        aria-label={showPassword ? "Hide password" : "Show password"} 
                                        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-gray-500 rounded-full" 
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        <Suspense fallback={<div className="h-4 w-4" />}>
                                            {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                                        </Suspense>
                                    </Button>
                                </div>
                                {errors.password && (
                                    <p 
                                        id="password-error" 
                                        className="text-xs text-red-600 mt-1 pl-1 flex items-center gap-1"
                                    >
                                        {errors.password.message}
                                    </p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <div className="pt-4">
                                <Button 
                                    type="submit" 
                                    className={cn(
                                        "w-full h-12 text-base font-semibold text-white shadow-lg hover:shadow-xl rounded-lg transition-all duration-300",
                                        "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                                        "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-600",
                                        "focus-visible:ring-indigo-500/70",
                                        "disabled:opacity-70 disabled:cursor-not-allowed",
                                        "hover:scale-[1.03] active:scale-[0.97]"
                                    )} 
                                    disabled={isSubmitting || !API_BASE_URL}
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center justify-center">
                                            <Suspense fallback={<div className="mr-2 h-5 w-5 animate-spin">⟳</div>}>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            </Suspense>
                                            Signing In...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <Suspense fallback={<div className="h-5 w-5" />}>
                                                <LogIn className="h-5 w-5" />
                                            </Suspense>
                                            Sign In
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </form>

                        {/* Sign Up Link */}
                        <div className="mt-4 text-center text-sm text-gray-600">
                            Don't have an account?{" "}
                            <Link 
                                href="/signup" 
                                className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline underline-offset-4 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 rounded-sm transition-colors"
                            >
                                Sign Up Here 
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            {/* Right side decorative area - this maintains layout balance */}
            <div className="hidden lg:block lg:flex-1"></div>
        </div>
    )
}

// --- Export component wrapped in Suspense ---
export default function LoginPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <LoginPageContent />
        </Suspense>
    );
}