"use client"

import type React from "react"
import bcrypt from 'bcryptjs';
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FaGoogle } from "react-icons/fa"
import { FaFacebook, FaTwitter } from "react-icons/fa"
import { Loader2 } from "lucide-react"
import { getUserByEmail, createUser, verifyCredentials } from "@/lib/supabase"
import { setUser } from "@/lib/session"

interface LoginFormProps {
  disabled?: boolean
}

export default function LoginForm({ disabled = false }: LoginFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, password }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Login failed");
      }

      // Assuming setUser stores user data in session (e.g., localStorage or context)
      setUser(data.user);

      router.push("/dashboard");
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password || !username) {
      setError("Please fill in all required fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {      
      const encryptedPassword = await bcrypt.hash(password, 10);
      console.log("Encrypted password:", encryptedPassword)
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          email,
          username,
          password: encryptedPassword,
          firstName,
          lastName,
        }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Registration failed");
      }

      setUser(data.user);
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError("")

    try {
      // Show a message that Google login is not implemented yet
      setError("Google login is not implemented yet")
      setIsLoading(false)
      return

      // The code below is kept but not executed
      // const { data, error } = await supabase.auth.signInWithOAuth({
      //   provider: "google",
      //   options: {
      //     redirectTo: `${window.location.origin}/auth/callback`,
      //   },
      // })

      // if (error) throw error

      // The redirect will happen automatically
    } catch (err: any) {
      console.error("Google login error:", err)
      setError(err.message || "An error occurred during Google login")
      setIsLoading(false)
    }
  }

  const handleSocialLogin = (provider: string) => {
    setError("")

    if (provider !== "google") {
      setError(`${provider} login is not implemented yet`)
      return
    }

    handleGoogleLogin()
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

          {/* <div className="relative my-6">
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
          </div> */}
        </form>
      </TabsContent>

      <TabsContent value="register">
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first-name">First name</Label>
              <Input id="first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last-name">Last name</Label>
              <Input id="last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
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
            <p className="text-xs text-muted-foreground">Password must be at least 6 characters long</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
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

          {/* <div className="relative my-6">
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
          </div> */}
        </form>
      </TabsContent>
    </Tabs>
  )
}

