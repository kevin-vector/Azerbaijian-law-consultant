"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Label } from "@/components/ui/label"
import UserHeader from "@/components/user-header"
import { Loader2 } from "lucide-react"
import { getUser } from "@/lib/session"

export default function ProfilePage() {
  const router = useRouter()
  const [language, setLanguage] = useState("en")
  const [userRole, setUserRole] = useState("user")
  const [user, setUser] = useState<any>(null)

  // Load user data on component mount
  useEffect(() => {
    const userData = getUser()
    if (!userData) {
      // Redirect to login if no user is found
      router.push("/")
      return
    }

    setUser(userData)
  }, [router])

  // Toggle language
  const toggleLanguage = () => {
    setLanguage(language === "en" ? "az" : "en")
  }

  // If user is not loaded yet, show loading
  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <UserHeader
        userRole={userRole}
        language={language}
        onLanguageToggle={toggleLanguage}
        userEmail={user.email}
        username={user.username}
      />

      <main className="flex-1 p-6">
        <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-2xl font-bold mb-4">{language === "en" ? "User Profile" : "İstifadəçi Profili"}</h2>
          <div className="space-y-4">
            {user.photoURL && (
              <div className="flex justify-center mb-4">
                <img
                  src={user.photoURL || "/placeholder.svg"}
                  alt="Profile"
                  className="h-24 w-24 rounded-full border-2 border-primary"
                />
              </div>
            )}
            <div>
              <Label>{language === "en" ? "Username" : "İstifadəçi adı"}</Label>
              <p className="text-muted-foreground">{user.username}</p>
            </div>
            <div>
              <Label>{language === "en" ? "Email" : "E-poçt"}</Label>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
            <div>
              <Label>{language === "en" ? "Role" : "Rol"}</Label>
              <p className="text-muted-foreground">{language === "en" ? "User" : "İstifadəçi"}</p>
            </div>
            <div>
              <Label>{language === "en" ? "Login Method" : "Giriş Metodu"}</Label>
              <p className="text-muted-foreground">
                {user.provider === "firebase" ? "Google" : language === "en" ? "Email/Password" : "E-poçt/Şifrə"}
              </p>
            </div>
            <div>
              <Label>{language === "en" ? "Account Created" : "Hesab yaradılıb"}</Label>
              <p className="text-muted-foreground">
                {user.created_at ? new Date(user.created_at).toLocaleString() : new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

