"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FaGoogle } from "react-icons/fa"
import { FaFacebook, FaTwitter } from "react-icons/fa"
import { Loader2 } from "lucide-react"

interface LoginFormProps {
  disabled?: boolean
}

export default function LoginForm({ disabled = false }: LoginFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Basic validation
    if (!email || !password) {
      setError("Please enter both email and password")
      return
    }

    setIsLoading(true)

    // Simulate login process
    setTimeout(() => {
      setIsLoading(false)

      // For demo purposes, any login works
      router.push("/dashboard")

      // In a real app, you would verify credentials here
      // If login fails, you would set an error message
    }, 1000)
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Basic validation
    if (!email || !password) {
      setError("Please fill in all required fields")
      return
    }

    setIsLoading(true)

    // Simulate registration process
    setTimeout(() => {
      setIsLoading(false)

      // For demo purposes, any registration works
      router.push("/dashboard")

      // In a real app, you would create a new account here
    }, 1000)
  }

  const handleSocialLogin = (provider: string) => {
    setIsLoading(true)

    // Simulate social login process
    setTimeout(() => {
      setIsLoading(false)
      router.push("/dashboard")
    }, 1000)
  }

  return (
    <Tabs defaultValue="login" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="login">Login</TabsTrigger>
        <TabsTrigger value="register">Register</TabsTrigger>
      </TabsList>

      {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4">{error}</div>}

      <TabsContent value="login">
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="outline"
              type="button"
              className="flex items-center justify-center"
              onClick={() => handleSocialLogin("google")}
              disabled={isLoading}
            >
              <FaGoogle className="mr-2" />
              Google
            </Button>
            <Button
              variant="outline"
              type="button"
              className="flex items-center justify-center"
              onClick={() => handleSocialLogin("facebook")}
              disabled={isLoading}
            >
              <FaFacebook className="mr-2" />
              Facebook
            </Button>
            <Button
              variant="outline"
              type="button"
              className="flex items-center justify-center"
              onClick={() => handleSocialLogin("twitter")}
              disabled={isLoading}
            >
              <FaTwitter className="mr-2" />
              Twitter
            </Button>
          </div>
        </form>
      </TabsContent>

      <TabsContent value="register">
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first-name">First name</Label>
              <Input id="first-name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last-name">Last name</Label>
              <Input id="last-name" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-register">Email</Label>
            <Input
              id="email-register"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password-register">Password</Label>
            <Input
              id="password-register"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input id="confirm-password" type="password" required />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="outline"
              type="button"
              className="flex items-center justify-center"
              onClick={() => handleSocialLogin("google")}
              disabled={isLoading}
            >
              <FaGoogle className="mr-2" />
              Google
            </Button>
            <Button
              variant="outline"
              type="button"
              className="flex items-center justify-center"
              onClick={() => handleSocialLogin("facebook")}
              disabled={isLoading}
            >
              <FaFacebook className="mr-2" />
              Facebook
            </Button>
            <Button
              variant="outline"
              type="button"
              className="flex items-center justify-center"
              onClick={() => handleSocialLogin("twitter")}
              disabled={isLoading}
            >
              <FaTwitter className="mr-2" />
              Twitter
            </Button>
          </div>
        </form>
      </TabsContent>
    </Tabs>
  )
}

