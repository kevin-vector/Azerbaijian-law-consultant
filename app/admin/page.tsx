"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import UserHeader from "@/components/user-header"
import { Loader2, UserCheck, Database, Settings, Users, FileText } from "lucide-react"
import { getUser } from "@/lib/session"

export default function AdminPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [language, setLanguage] = useState("en")
  const [userRole, setUserRole] = useState("admin")
  const [user, setUser] = useState<any>(null)
  const [includeScrapingData, setIncludeScrapingData] = useState(true)
  const [includeManualData, setIncludeManualData] = useState(true)
  const [pendingAdminCount, setPendingAdminCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingScrapingSetting, setIsUpdatingScrapingSetting] = useState(false)
  const [isUpdatingManualSetting, setIsUpdatingManualSetting] = useState(false)
  const [error, setError] = useState("")
  const [statusError, setStatusError] = useState("")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [scrape_law, setScrape_law] = useState({status:"running", created_at:""})
  const [scrape_post, setScrape_post] = useState({status:"running", created_at:""})
  const [documentCount, setDocumentCount] = useState(0)

  const getScrapeStatus = async () => {
    try {
      const res = await fetch('/api/scrape-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      // console.log(res)
      setScrape_law(data.law)
      setScrape_post(data.post)
      console.log(data)
    } catch (err: any) {
      setStatusError(err.message);
    } finally {
      setLoading(false)
    }
  }
  useEffect (() => {    
    getScrapeStatus()
  }, [])

  // Load user data and settings on component mount
  useEffect(() => {
    const loadData = async () => {
      const userData = getUser()
      if (!userData) {
        // Redirect to login if no user is found
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

      // Load settings from API
      try {
        const settingsResponse = await fetch("/api/admin/settings")
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json()
          setIncludeScrapingData(settingsData.includeScraping)
          setIncludeManualData(settingsData.includeManual)
        } else {
          console.error("Failed to fetch settings")
          toast({
            title: "Error",
            description: "Failed to load settings. Please try again.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error loading settings:", error)
      }

      // Get document count
      try {
        const documentsResponse = await fetch("/api/admin/documents")
        if (documentsResponse.ok) {
          const documentsData = await documentsResponse.json()
          setDocumentCount(documentsData.documents?.length || 0)
        }
      } catch (error) {
        console.error("Error fetching document count:", error)
      }

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
  }, [router, toast])

  // Toggle language
  const toggleLanguage = () => {
    setLanguage(language === "en" ? "az" : "en")
  }

  // Handle scraping data toggle
  const handleScrapingToggle = async (checked: boolean) => {
    setIsUpdatingScrapingSetting(true)
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "include_scraping",
          value: checked,
        }),
      })

      if (response.ok) {
        setIncludeScrapingData(checked)
        toast({
          title: "Settings updated",
          description:
            language === "en"
              ? `Scraping data is now ${checked ? "included" : "excluded"} from search results.`
              : `Məlumat toplama indi axtarış nəticələrindən ${checked ? "daxil edilib" : "çıxarılıb"}.`,
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to update settings")
      }
    } catch (error: any) {
      console.error("Error updating scraping setting:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update settings. Please try again.",
        variant: "destructive",
      })
      // Revert the UI state since the API call failed
      setIncludeScrapingData(!checked)
    } finally {
      setIsUpdatingScrapingSetting(false)
    }
  }

  // Handle manual data toggle
  const handleManualDataToggle = async (checked: boolean) => {
    setIsUpdatingManualSetting(true)
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "include_manual",
          value: checked,
        }),
      })

      if (response.ok) {
        setIncludeManualData(checked)
        toast({
          title: "Settings updated",
          description:
            language === "en"
              ? `Manual input data is now ${checked ? "included" : "excluded"} from search results.`
              : `Əl ilə daxil edilmiş məlumatlar indi axtarış nəticələrindən ${checked ? "daxil edilib" : "çıxarılıb"}.`,
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to update settings")
      }
    } catch (error: any) {
      console.error("Error updating manual data setting:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update settings. Please try again.",
        variant: "destructive",
      })
      // Revert the UI state since the API call failed
      setIncludeManualData(!checked)
    } finally {
      setIsUpdatingManualSetting(false)
    }
  }
  // Navigate to admin approval page
  const goToAdminApproval = () => {
    router.push("/admin/approve")
  }

  // Navigate to documents management page
  const goToDocumentsPage = () => {
    router.push("/admin/documents")
  }

  // If user is not loaded yet, show loading
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title || !content) {
      setError("Please fill in all required fields");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTitle("");
      setContent("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
}

const scraping_law = async () => {
  setScrape_law({status:"running", created_at:new Date().toISOString()})
  try {
    const res = await fetch("/api/scrape-law", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    setTitle("");
    setContent("");
  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
}

const scraping_post = async () => {
  setScrape_post({status:"running", created_at:new Date().toISOString()})
  try {
    const res = await fetch("/api/scrape-post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    setTitle("");
    setContent("");
  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
}

  // Determine if user is root
  const isRoot = userRole === "root"

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
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">{language === "en" ? "Admin Dashboard" : "Admin Paneli"}</h1>

          {/* Root-specific content */}
          {/* {isRoot && (
            <div className="space-y-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Users className="h-5 w-5 mr-2 text-blue-500" />
                      {language === "en" ? "User Management" : "İstifadəçi İdarəetməsi"}
                    </CardTitle>
                    <CardDescription>
                      {language === "en" ? "Manage users and permissions" : "İstifadəçiləri və icazələri idarə edin"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          {language === "en" ? "Pending Admins" : "Gözləyən Adminlər"}
                        </span>
                        <Badge variant={pendingAdminCount > 0 ? "default" : "outline"}>{pendingAdminCount}</Badge>
                      </div>
                      <Button
                        onClick={goToAdminApproval}
                        variant="outline"
                        className="w-full"
                        disabled={pendingAdminCount === 0}
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        {language === "en" ? "Approve Admins" : "Adminləri Təsdiqlə"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Database className="h-5 w-5 mr-2 text-green-500" />
                      {language === "en" ? "Database" : "Verilənlər Bazası"}
                    </CardTitle>
                    <CardDescription>
                      {language === "en"
                        ? "Database management and backups"
                        : "Verilənlər bazası idarəetməsi və ehtiyat nüsxələri"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          {language === "en" ? "Last Backup" : "Son Ehtiyat Nüsxə"}
                        </span>
                        <span className="text-sm">2 {language === "en" ? "hours ago" : "saat əvvəl"}</span>
                      </div>
                      <Button variant="outline" className="w-full">
                        {language === "en" ? "Create Backup" : "Ehtiyat Nüsxə Yarat"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Settings className="h-5 w-5 mr-2 text-orange-500" />
                      {language === "en" ? "System Settings" : "Sistem Parametrləri"}
                    </CardTitle>
                    <CardDescription>
                      {language === "en" ? "Configure system settings" : "Sistem parametrlərini konfiqurasiya edin"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          {language === "en" ? "System Status" : "Sistem Statusu"}
                        </span>
                        <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                          {language === "en" ? "Online" : "Aktiv"}
                        </Badge>
                      </div>
                      <Button variant="outline" className="w-full">
                        {language === "en" ? "System Settings" : "Sistem Parametrləri"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )} */}

          {/* Root User Admin Approval Section - Shown only for root users */}
          {isRoot && (
            <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
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
                <Button onClick={goToAdminApproval} className="flex items-center" disabled = {pendingAdminCount === 0}>
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

          {/* Document Management Section - Available to all admins */}
          <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">
                  {language === "en" ? "Document Management" : "Sənəd İdarəetməsi"}
                </h2>
                <p className="text-muted-foreground mt-1">
                  {language === "en"
                    ? "Manage manually entered legal documents"
                    : "Əl ilə daxil edilmiş hüquqi sənədləri idarə edin"}
                </p>
              </div>
              <Badge variant="outline">{documentCount}</Badge>
            </div>
            <div className="mt-4">
              <Button onClick={goToDocumentsPage} className="flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                {language === "en" ? "Manage Documents" : "Sənədləri İdarə Et"}
              </Button>
            </div>
          </div>

          {/* Global Settings Section - Available to all admins */}
          <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
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
                <div className="flex items-center">
                  {isUpdatingScrapingSetting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Switch
                    id="include-scraping"
                    checked={includeScrapingData}
                    onCheckedChange={handleScrapingToggle}
                    disabled={isUpdatingScrapingSetting}
                  />
                </div>
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
                <div className="flex items-center">
                  {isUpdatingManualSetting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Switch
                    id="include-manual-data"
                    checked={includeManualData}
                    onCheckedChange={handleManualDataToggle}
                    disabled={isUpdatingManualSetting}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Manual Data Entry Section - Available to all admins */}
          <form className="bg-white rounded-lg p-6 shadow-sm" onSubmit={handleSubmit}>
            <h2 className="text-2xl font-bold mb-4">
              {language === "en" ? "Manual Data Entry" : "Əl ilə məlumat daxil edilməsi"}
            </h2>
            {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4">{error}</div>}
            <div className="space-y-4">
              <div>
                <Label htmlFor="document-title">{language === "en" ? "Document Title" : "Sənəd başlığı"}</Label>
                <Input value = {title} id="document-title" className="w-full mt-1" onChange={(e) => setTitle(e.target.value)}/>
              </div>
              <div>
                <Label htmlFor="document-content">{language === "en" ? "Document Content" : "Sənəd məzmunu"}</Label>
                <textarea value={content} id="document-content" className="w-full mt-1 min-h-[200px] p-2 border rounded-md" onChange={(e) => setContent(e.target.value)}/>
              </div>
              {/* <div>
                <Label htmlFor="document-file">{language === "en" ? "Upload Document" : "Sənəd yükləyin"}</Label>
                <Input id="document-file" type="file" className="w-full mt-1" />
              </div> */}
              <Button className="w-full" type="submit">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : language === "en" ? "Submit Document" : "Sənədi təqdim edin"}</Button>
            </div>
          </form>

          {/* <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-bold mb-4">
              {language === "en" ? "Scraping Management" : "Məlumat toplama idarəetməsi"}
            </h2>
            {statusError && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4">{statusError}</div>}
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 border rounded-md">
                <span>
                  www.muhasibat.az
                  &nbsp;
                  <span className="text-muted-foreground italic mb-4">{scrape_law.created_at === '' ? 'Status reading' : scrape_law.created_at === 'abcd' ? '' : `${scrape_law.created_at.slice(0, 10)} ${scrape_law.status}`}</span>
                </span>
                <div className="space-x-2">
                  <Button 
                    size="sm" 
                    disabled = {scrape_law.status === 'running'}
                    onClick={scraping_law}
                  >
                    {scrape_law.status === 'running' || scrape_law.created_at ==='' ? <Loader2 className="h-8 w-8 animate-spin" /> : language === "en" ? "Update" : "Yenilə"}
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 border rounded-md">
                <span>
                  www.e-qanun.az
                  &nbsp;
                  <span className="text-muted-foreground italic mb-4">{scrape_post.created_at === '' ? 'Status reading' : scrape_post.created_at === 'abcd' ? '' : `${scrape_post.created_at.slice(0, 10)} ${scrape_post.status}`}</span>
                </span>
                <div className="space-x-2">
                  <Button 
                    size="sm" 
                    disabled = {scrape_post.status === 'running'}
                    onClick={scraping_post}
                  >
                    {scrape_post.status === 'running' ? <Loader2 className="h-8 w-8 animate-spin" /> :language === "en" ? "Update" : "Yenilə"}
                  </Button>
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
          </div> */}
        </div>
      </main>
    </div>
  )
}

