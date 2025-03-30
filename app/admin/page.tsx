"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import UserHeader from "@/components/user-header"
import { Loader2, UserCheck } from "lucide-react"
import { getUser } from "@/lib/session"

export default function AdminPage() {
  const router = useRouter()
  const [language, setLanguage] = useState("en")
  const [userRole, setUserRole] = useState("admin") // Set to admin for this page
  const [user, setUser] = useState<any>(null)
  const [includeScrapingData, setIncludeScrapingData] = useState(true)
  const [includeManualData, setIncludeManualData] = useState(true)
  const [pendingAdminCount, setPendingAdminCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const userData = getUser()
      if (!userData) {
        router.push("/")
        return
      }

      // Check if user has admin or root role, if not redirect to dashboard
      if (userData.role !== "admin" && userData.role !== "root") {
        router.push("/dashboard")
        return
      }

      setUser(userData)
      setUserRole(userData.role)

      // If user is root, fetch pending admin count from API
      if (userData.role === "root") {
        try {
          const response = await fetch("/api/admin/pending")
          if (response.ok) {
            const data = await response.json()
            setPendingAdminCount(data.pendingAdmins.length)
          } else {
            console.error("Failed to fetch pending admins")
          }
        } catch (error) {
          console.error("Error fetching pending admins:", error)
        }
      }

      setIsLoading(false)
    }

    loadData()
  }, [router])

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "az" : "en")
  }

  const goToAdminApproval = () => {
    router.push("/admin/approve")
  }

  if (isLoading) {
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
          {/* Root User Admin Approval Section */}
          {userRole === "root" && (
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">{language === "en" ? "Admin Approvals" : "Admin Təsdiqləri"}</h2>
                  <p className="text-muted-foreground mt-1">
                    {language === "en"
                      ? "Review and approve admin registration requests"
                      : "Admin qeydiyyat sorğularını nəzərdən keçirin və təsdiqləyin"}
                  </p>
                </div>
                {pendingAdminCount > 0 && <Badge className="bg-primary text-white">{pendingAdminCount}</Badge>}
              </div>
              <div className="mt-4">
                <Button onClick={goToAdminApproval} className="flex items-center" disabled = {pendingAdminCount == 0}>
                  <UserCheck className="mr-2 h-4 w-4" />
                  {language === "en" ? "Manage Admin Requests" : "Admin Sorğularını İdarə Et"}
                  {pendingAdminCount > 0 && (
                    <Badge variant="outline" className="ml-2 bg-white text-primary">
                      {pendingAdminCount}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Global Settings Section */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-bold mb-4">{language === "en" ? "Global Settings" : "Qlobal Parametrlər"}</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="include-scraping" className="text-base font-medium">
                    {language === "en" ? "Include Scraping Data" : "Məlumat toplama daxil edin"}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {language === "en"
                      ? "When enabled, data from web scraping sources will be included in search results"
                      : "Aktiv olduqda, veb məlumat toplama mənbələrindən məlumatlar axtarış nəticələrinə daxil ediləcək"}
                  </p>
                </div>
                <Switch id="include-scraping" checked={includeScrapingData} onCheckedChange={setIncludeScrapingData} />
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div>
                  <Label htmlFor="include-manual-data" className="text-base font-medium">
                    {language === "en" ? "Include Manual Input Data" : "Əl ilə daxil edilmiş məlumatları daxil edin"}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {language === "en"
                      ? "When enabled, manually entered document data will be included in search results"
                      : "Aktiv olduqda, əl ilə daxil edilmiş sənəd məlumatları axtarış nəticələrinə daxil ediləcək"}
                  </p>
                </div>
                <Switch id="include-manual-data" checked={includeManualData} onCheckedChange={setIncludeManualData} />
              </div>
            </div>
          </div>

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

