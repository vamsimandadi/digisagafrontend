'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { z } from 'zod'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Loader2, UserPlus, Eye, EyeOff, CheckCircle, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// --- Zod Schema ---
const signUpSchema = z.object({
  name: z.string().trim().min(1, "Full name is required"),
  email: z.string().trim().min(1, "Email is required").email("Email address is invalid"),
  mobileNumber: z.string().trim()
    .min(8, "Please enter a valid mobile number.")
    .regex(/^\+?[\d\s-]{8,}$/, "Please enter a valid mobile number."),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password."),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// --- Types ---
type SignUpFormData = z.infer<typeof signUpSchema>;
type FormErrors = z.inferFlattenedErrors<typeof signUpSchema>['fieldErrors'];

// --- Initial State ---
const initialState: SignUpFormData = {
  name: '',
  email: '',
  mobileNumber: '',
  password: '',
  confirmPassword: '',
};

export default function SignUpPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<SignUpFormData>(initialState)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [success, setSuccess] = useState(false)
  
  // API Base URL
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

  // Check API configuration
  const isApiConfigured = useMemo(() => {
    if (!API_BASE_URL) {
      console.error("Configuration Error: NEXT_PUBLIC_API_URL is not set.")
      return false
    }
    return true
  }, [API_BASE_URL])
  
  // Form validation state
  const isFormValid = useMemo(() => {
    // Check if all fields are filled and no errors exist
    const allFieldsFilled = Object.values(formData).every(value => value.trim() !== '')
    const noErrors = Object.keys(formErrors).length === 0
    
    return allFieldsFilled && noErrors
  }, [formData, formErrors])

  // Handle input changes
  const handleChange = useCallback((field: keyof SignUpFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear specific field error
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
    
    // Clear password mismatch error when editing either password field
    if ((field === 'password' || field === 'confirmPassword') && 
        formErrors.confirmPassword?.[0] === "Passwords do not match") {
      setFormErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.confirmPassword
        return newErrors
      })
    }
    
    // Clear error message
    if (error) setError(null)
  }, [formErrors, error])

  // Form submission handler
  const handleSignUp = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setFormErrors({})
    
    // Validate with Zod
    const validationResult = signUpSchema.safeParse(formData)
    
    if (!validationResult.success) {
      const flattenedErrors = validationResult.error.flatten().fieldErrors
      setFormErrors(flattenedErrors)
      toast.error("Please fix the errors marked below.")
      
      // Focus first error field
      const firstErrorField = Object.keys(flattenedErrors)[0] as keyof FormErrors | undefined
      if (firstErrorField) {
        document.getElementById(firstErrorField)?.focus({ preventScroll: true })
      }
      return
    }
    
    if (!isApiConfigured) {
      setError("Configuration error. Cannot proceed with signup.")
      toast.error("Configuration Error")
      return
    }

    setLoading(true)
    const toastId = toast.loading("Creating your account...")

    try {
      // Prepare payload
      const { confirmPassword, ...payload } = validationResult.data
      
      // Clean mobile number
      payload.mobileNumber = payload.mobileNumber.trim().replace(/\s+/g, '')

      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      let responseData
      try {
        responseData = await response.json()
      } catch (e) {
        responseData = { error: "Could not parse server response" }
      }

      if (!response.ok) {
        throw new Error(responseData.error || `Signup failed (status ${response.status})`)
      }

      // Success
      toast.success("Account Created!", {
        id: toastId,
        description: "Please check your email to verify your account."
      })
      
      // Show success screen instead of redirecting
      setSuccess(true)
      
    } catch (err: any) {
      console.error("Signup Error:", err)
      const errorMessage = err.message || "An unexpected error occurred"
      
      toast.error("Signup Failed", { 
        id: toastId, 
        description: errorMessage 
      })
      
      setError(errorMessage)
      
      // Email already registered handling
      if (errorMessage.toLowerCase().includes("already registered") || 
          errorMessage.toLowerCase().includes("email_1")) {
        setFormErrors(prev => ({ 
          ...prev, 
          email: ["This email is already registered."] 
        }))
        document.getElementById("email")?.focus({ preventScroll: true })
      }
    } finally {
      setLoading(false)
    }
  }, [formData, isApiConfigured, API_BASE_URL])

  // Error message display helper
  const getErrorMessage = (field: keyof SignUpFormData): string | null => {
    return formErrors[field]?.[0] || null
  }

  // Go to login handler
  const handleGoToLogin = () => {
    router.push('/login')
  }

  // Success screen
  if (success) {
    return (
      <div className="h-screen w-screen fixed inset-0 bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center overflow-hidden">
        <Card className="shadow-xl border-0 w-full max-w-lg h-auto rounded-2xl overflow-hidden">
          <div className="p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Created Successfully!</h1>
            <div className="w-full max-w-md space-y-4 my-6">
              <div className="flex items-center justify-center w-full">
                <div className="h-px bg-gray-200 w-full" />
                <div className="px-4 text-gray-500 whitespace-nowrap">Verify Your Email</div>
                <div className="h-px bg-gray-200 w-full" />
              </div>
              
              <div className="p-6 rounded-xl bg-blue-50 border border-blue-100 text-center">
                <Mail className="h-10 w-10 text-blue-500 mx-auto mb-3" />
                <p className="text-gray-700 font-medium mb-2">
                  We've sent a verification email to:
                </p>
                <p className="text-blue-600 font-bold mb-4">
                  {formData.email}
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  Please check your inbox and click on the verification link to complete your registration.
                </p>
                <p className="text-xs text-gray-500">
                  If you don't see the email, check your spam folder or promotions tab.
                </p>
              </div>
            </div>
            
            <Button 
              type="button" 
              onClick={handleGoToLogin} 
              className="w-full h-12 text-sm font-semibold rounded-lg bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-lg transition-all duration-200 hover:shadow-xl"
            >
              Go to Login Page
            </Button>
            
            <p className="text-sm text-gray-500 mt-4">
              Need help? <Link href="#" className="text-indigo-600 hover:text-indigo-800 font-medium">Contact Support</Link>
            </p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen fixed inset-0 bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center overflow-hidden">
      <Card className="shadow-xl border-0 w-full max-w-5xl h-auto rounded-2xl overflow-hidden">
        <div className="flex flex-col md:flex-row h-full">
          {/* Left side - Brand */}
          <div className="py-6 px-6 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 md:w-2/5 flex flex-col justify-center text-white">
            <div className="mb-4">
              {/* Placeholder for your logo - replace with your own */}
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white text-xl font-bold">
                LOGO
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">Create Account</h1>
            <p className="text-white/80 text-base">Join our community today</p>
          </div>
          
          {/* Right side - Form */}
          <div className="py-5 px-6 bg-white md:w-3/5 border-t md:border-t-0 md:border-l border-gray-100">
            <form onSubmit={handleSignUp} className="space-y-4" noValidate>
              {error && (
                <div className="p-2 rounded-md bg-red-50 border border-red-200 text-xs text-red-700">
                  {error}
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700" htmlFor="name">Full Name</label>
                  <Input 
                    id="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className={cn(
                      "h-12 text-sm font-medium rounded-lg shadow-sm",
                      "focus:border-indigo-500 focus:ring-indigo-500",
                      getErrorMessage('name') ? "border-red-500" : "border-gray-300"
                    )}
                    aria-invalid={!!getErrorMessage('name')}
                    aria-describedby={getErrorMessage('name') ? "name-error" : undefined}
                    autoFocus
                  />
                  {getErrorMessage('name') && (
                    <p id="name-error" className="text-xs text-red-600 mt-1">
                      {getErrorMessage('name')}
                    </p>
                  )}
                </div>
                
                {/* Mobile Number */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700" htmlFor="mobileNumber">Mobile Number</label>
                  <Input 
                    id="mobileNumber"
                    placeholder="Enter your mobile number"
                    type="tel"
                    value={formData.mobileNumber}
                    onChange={(e) => handleChange('mobileNumber', e.target.value)}
                    className={cn(
                      "h-12 text-sm font-medium rounded-lg shadow-sm",
                      "focus:border-indigo-500 focus:ring-indigo-500",
                      getErrorMessage('mobileNumber') ? "border-red-500" : "border-gray-300" 
                    )}
                    aria-invalid={!!getErrorMessage('mobileNumber')}
                    aria-describedby={getErrorMessage('mobileNumber') ? "mobile-error" : undefined}
                  />
                  {getErrorMessage('mobileNumber') && (
                    <p id="mobile-error" className="text-xs text-red-600 mt-1">
                      {getErrorMessage('mobileNumber')}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Email */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700" htmlFor="email">Email</label>
                <Input 
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={cn(
                    "h-12 text-sm font-medium rounded-lg shadow-sm",
                    "focus:border-indigo-500 focus:ring-indigo-500",
                    getErrorMessage('email') ? "border-red-500" : "border-gray-300"
                  )}
                  aria-invalid={!!getErrorMessage('email')}
                  aria-describedby={getErrorMessage('email') ? "email-error" : undefined}
                />
                {getErrorMessage('email') && (
                  <p id="email-error" className="text-xs text-red-600 mt-1">
                    {getErrorMessage('email')}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Password */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700" htmlFor="password">Password</label>
                  <div className="relative">
                    <Input 
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      className={cn(
                        "h-12 text-sm font-medium rounded-lg shadow-sm pr-10",
                        "focus:border-indigo-500 focus:ring-indigo-500",
                        getErrorMessage('password') ? "border-red-500" : "border-gray-300"
                      )}
                      aria-invalid={!!getErrorMessage('password')}
                      aria-describedby={getErrorMessage('password') ? "password-error" : undefined}
                    />
                    <button 
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {getErrorMessage('password') && (
                    <p id="password-error" className="text-xs text-red-600 mt-1">
                      {getErrorMessage('password')}
                    </p>
                  )}
                </div>
                
                {/* Confirm Password */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700" htmlFor="confirmPassword">Confirm Password</label>
                  <Input 
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    className={cn(
                      "h-12 text-sm font-medium rounded-lg shadow-sm",
                      "focus:border-indigo-500 focus:ring-indigo-500",
                      getErrorMessage('confirmPassword') ? "border-red-500" : "border-gray-300"
                    )}
                    aria-invalid={!!getErrorMessage('confirmPassword')}
                    aria-describedby={getErrorMessage('confirmPassword') ? "confirm-error" : undefined}
                  />
                  {getErrorMessage('confirmPassword') && (
                    <p id="confirm-error" className="text-xs text-red-600 mt-1">
                      {getErrorMessage('confirmPassword')}
                    </p>
                  )}
                </div>
              </div>
              
              <p className="text-xs text-gray-500">
                Use 6 or more characters with a mix of letters, numbers & symbols
              </p>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={loading || !isApiConfigured}
                  className={cn(
                    "w-full h-12 text-sm font-semibold rounded-lg",
                    "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white",
                    "disabled:opacity-70 disabled:cursor-not-allowed shadow-lg transition-all duration-200 hover:shadow-xl"
                  )}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating Account...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create Account
                    </span>
                  )}
                </Button>
              </div>
              
              <div className="text-center pt-1">
                <span className="text-gray-600 text-sm">Already have an account?</span>{" "}
                <Link 
                  href="/login" 
                  className="font-semibold text-indigo-600 hover:text-indigo-800 text-sm"
                >
                  Sign In
                </Link>
              </div>
            </form>
          </div>
        </div>
      </Card>
      
      {/* Footer */}
      <div className="fixed bottom-2 right-4 flex justify-end text-xs text-gray-600">
        <div className="flex gap-4">
          <Link href="#" className="hover:text-gray-800">Help</Link>
          <Link href="#" className="hover:text-gray-800">Privacy</Link>
          <Link href="#" className="hover:text-gray-800">Terms</Link>
        </div>
      </div>
    </div>
  )
} 