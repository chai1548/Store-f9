"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Loader2, AlertCircle, Users } from "lucide-react"

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const demoAccounts = [
  {
    email: "admin@socialapp.com",
    password: "admin123",
    displayName: "Admin User",
    role: "admin" as const,
  },
  {
    email: "user@socialapp.com",
    password: "user123",
    displayName: "Demo User",
    role: "user" as const,
  },
]

export default function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [loading, setLoading] = useState(false)
  const [loginData, setLoginData] = useState({ email: "", password: "" })
  const [registerData, setRegisterData] = useState({ email: "", password: "", displayName: "" })
  const [error, setError] = useState<string | null>(null)
  const { login, register } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setError(null)
    }
  }, [open])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await login(loginData.email, loginData.password)
      onOpenChange(false)
      toast({ title: "Success!", description: "Logged in successfully" })
    } catch (error: any) {
      setError("Login failed. Please check your credentials.")
      toast({
        title: "Login Failed",
        description: "Please check your email and password.",
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!registerData.displayName.trim()) {
      setError("Please enter your display name")
      setLoading(false)
      return
    }

    if (registerData.password.length < 6) {
      setError("Password must be at least 6 characters long")
      setLoading(false)
      return
    }

    try {
      await register(registerData.email, registerData.password, registerData.displayName)
      onOpenChange(false)
      toast({ title: "Success!", description: "Account created successfully" })
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        setError("An account with this email already exists.")
      } else {
        setError("Registration failed. Please try again.")
      }
      toast({
        title: "Registration Failed",
        description: "Please try again with different details.",
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  const handleDemoLogin = async (email: string, password: string) => {
    setLoading(true)
    setError(null)

    try {
      await login(email, password)
      onOpenChange(false)
      toast({
        title: "Demo Login Successful!",
        description: `Logged in as ${email}`,
      })
    } catch (error: any) {
      setError("Demo login failed. Please try again.")
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to SocialApp</DialogTitle>
          <DialogDescription>Login or create an account to continue</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Demo Accounts Section */}
        <div className="border rounded-lg p-4 bg-muted/50">
          <div className="flex items-center space-x-2 mb-3">
            <Users className="h-4 w-4" />
            <h4 className="font-semibold text-sm">Quick Demo Login</h4>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {demoAccounts.map((account) => (
              <Button
                key={account.email}
                variant="outline"
                size="sm"
                onClick={() => handleDemoLogin(account.email, account.password)}
                disabled={loading}
                className="justify-start"
              >
                <div className="text-left">
                  <div className="font-medium">{account.displayName}</div>
                  <div className="text-xs text-muted-foreground">{account.email}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div>
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  placeholder="Enter your password"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Login
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <Label htmlFor="register-name">Display Name</Label>
                <Input
                  id="register-name"
                  value={registerData.displayName}
                  onChange={(e) => setRegisterData({ ...registerData, displayName: e.target.value })}
                  placeholder="Enter your name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div>
                <Label htmlFor="register-password">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  placeholder="Enter your password (min 6 characters)"
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
