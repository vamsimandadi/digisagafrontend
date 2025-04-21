'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { toast } from 'sonner'
import { Loader2, LogIn, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // API Base URL from environment
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error("Please enter your email and password")
      return
    }

    if (!API_BASE_URL) {
      toast.error("Configuration error: Cannot connect to services")
      return
    }

    setError(null)
    setLoading(true)
    const toastId = toast.loading("Signing you in...")

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      })

      if (res.ok) {
        toast.success('Login successful', { id: toastId })
        router.push('/')
      } else {
        const errorData = await res.json().catch(() => ({}))
        const errorMessage = errorData.error || "Invalid credentials"
        toast.error("Login Failed", { id: toastId, description: errorMessage })
        setError(errorMessage)
      }
    } catch (error) {
      toast.error('Connection error', { id: toastId })
      setError('Please check your connection and try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4">
      <Card className="shadow-xl border-0 w-full max-w-4xl overflow-hidden rounded-2xl">
        <div className="flex flex-col md:flex-row">
          {/* Left side - Brand */}
          <div className="p-8 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 md:w-1/2 flex flex-col justify-center text-white">
            <div className="mb-6">
              {/* Placeholder for your logo - replace with your own */}
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white text-xl font-bold">
                LOGO
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4">Welcome Back</h1>
            <p className="text-white/80 text-lg">Sign in to your account</p>
          </div>
          
          {/* Right side - Form */}
          <div className="p-10 bg-white md:w-1/2 border-t md:border-t-0 md:border-l border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <Input 
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 text-lg font-medium rounded-xl border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 text-lg font-medium rounded-xl border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm pr-10"
                  />
                  <button 
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <div className="flex justify-end">
                  <Link 
                    href="/forgot-password" 
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    Forgot Password?
                  </Link>
                </div>
              </div>

              <div className="pt-6">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className={cn(
                    "w-full h-14 text-base font-semibold rounded-xl",
                    "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white",
                    "disabled:opacity-70 disabled:cursor-not-allowed shadow-lg transition-all duration-200 hover:shadow-xl"
                  )}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Signing In...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <LogIn className="h-5 w-5 mr-2" />
                      Sign In
                    </span>
                  )}
                </Button>
              </div>
              
              <div className="text-center pt-4">
                <span className="text-gray-600">Don't have an account?</span>{" "}
                <Link 
                  href="/signup" 
                  className="font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Create Account
                </Link>
              </div>
            </form>
          </div>
        </div>
      </Card>
      
      {/* Footer */}
      <div className="absolute bottom-4 w-full max-w-4xl flex justify-between text-xs text-gray-600 px-4">
        <div className="flex gap-4">
          <select className="bg-transparent border-0 text-gray-600 text-xs focus:outline-none focus:ring-0">
            <option>English (United States)</option>
            <option>Español</option>
            <option>Français</option>
          </select>
        </div>
        <div className="flex gap-4">
          <Link href="#" className="hover:text-gray-800">Help</Link>
          <Link href="#" className="hover:text-gray-800">Privacy</Link>
          <Link href="#" className="hover:text-gray-800">Terms</Link>
        </div>
      </div>
    </div>
  )
}