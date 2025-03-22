"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import UserHeader from "@/components/user-header"
import { Loader2 } from "lucide-react"
import { getUser } from "@/lib/session"

export default function AdminPage() {
  const router = useRouter()
  const [language, setLanguage] = useState("en")
  const [userRole, setUserRole] = useState("admin") // Set to admin for this page
  const [user, setUser] = useState<any>(null)

  // Load user data on component mount
  useEffect(() => {
    const userData = getUser()
    if (!userData) {
      // Redirect to login if no user is found
      router.push("/")
      return
    }

    // Check if user has admin role, if not redirect to dashboard
    if (userData.role !== "admin") {
      router.push("/dashboard")
      return
    }

    setUser(userData)
    setUserRole("admin")
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
        <div className="space-y-8 max-w-2xl mx-auto">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-bold mb-4">
              {language === "en" ? "Manual Data Entry" : "Əl ilə məlumat daxil edilməsi"}
            </h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="document-title">{language === "en" ? "Document Title" : "Sənəd başlığı"}</Label>
                <Input id="document-title" className="w-full mt-1" />
              </div>
              <div>
                <Label htmlFor="document-content">{language === "en" ? "Document Content" : "Sənəd məzmunu"}</Label>
                <textarea id="document-content" className="w-full mt-1 min-h-[200px] p-2 border rounded-md" />
              </div>
              <div>
                <Label htmlFor="document-file">{language === "en" ? "Upload Document" : "Sənəd yükləyin"}</Label>
                <Input id="document-file" type="file" className="w-full mt-1" />
              </div>
              <Button className="w-full">{language === "en" ? "Submit Document" : "Sənədi təqdim edin"}</Button>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-bold mb-4">
              {language === "en" ? "Scraping Management" : "Məlumat toplama idarəetməsi"}
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 border rounded-md">
                <span>legislation.az</span>
                <div className="space-x-2">
                  <Button variant="outline" size="sm">
                    {language === "en" ? "Edit" : "Redaktə et"}
                  </Button>
                  <Button size="sm">{language === "en" ? "Update" : "Yenilə"}</Button>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 border rounded-md">
                <span>e-qanun.az</span>
                <div className="space-x-2">
                  <Button variant="outline" size="sm">
                    {language === "en" ? "Edit" : "Redaktə et"}
                  </Button>
                  <Button size="sm">{language === "en" ? "Update" : "Yenilə"}</Button>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 border rounded-md">
                <span>taxes.gov.az</span>
                <div className="space-x-2">
                  <Button variant="outline" size="sm">
                    {language === "en" ? "Edit" : "Redaktə et"}
                  </Button>
                  <Button size="sm">{language === "en" ? "Update" : "Yenilə"}</Button>
                </div>
              </div>
              <Button variant="outline" className="w-full">
                {language === "en" ? "Add New Source" : "Yeni mənbə əlavə edin"}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

