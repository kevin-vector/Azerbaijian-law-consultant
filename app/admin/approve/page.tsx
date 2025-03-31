"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import UserHeader from "@/components/user-header"
import { Loader2, CheckCircle, AlertCircle, ArrowLeft, Plus } from "lucide-react"
import { getUser } from "@/lib/session"

export default function AdminApprovePage() {
  const router = useRouter()
  const [language, setLanguage] = useState("en")
  const [userRole, setUserRole] = useState("root") // This page is only for root users
  const [user, setUser] = useState<any>(null)
  const [pendingAdmins, setPendingAdmins] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Load user data and pending admins on component mount
  useEffect(() => {
    const loadData = async () => {
      const userData = getUser()
      if (!userData) {
        // Redirect to login if no user is found
        router.push("/")
        return
      }

      // Check if user has root role, if not redirect to dashboard
      if (userData.role !== "root") {
        router.push("/dashboard")
        return
      }

      setUser(userData)
      setUserRole("root")

      // Load pending admin requests from API
      try {
        const response = await fetch("/api/admin/pending")
        if (response.ok) {
          const data = await response.json()
          setPendingAdmins(data.pendingAdmins)
        } else {
          console.error("Failed to fetch pending admins")
          setMessage({
            type: "error",
            text:
              language === "en"
                ? "Failed to load pending admin requests"
                : "Gözləyən admin sorğularını yükləmək alınmadı",
          })
        }
      } catch (error) {
        console.error("Error loading pending admins:", error)
        setMessage({
          type: "error",
          text:
            language === "en"
              ? "An error occurred while loading admin requests"
              : "Admin sorğularını yükləyərkən xəta baş verdi",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [router, language])

  // Toggle language
  const toggleLanguage = () => {
    setLanguage(language === "en" ? "az" : "en")
  }

  // Handle admin approval via API
  const handleApproveAdmin = async (adminId: string) => {
    setProcessingId(adminId)
    setMessage(null)

    try {
      const response = await fetch("/api/admin/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminId }),
      })

      if (response.ok) {
        // Update the local state to remove the approved admin
        setPendingAdmins(pendingAdmins.filter((admin) => admin.id !== adminId))

        setMessage({
          type: "success",
          text: language === "en" ? "Admin has been approved successfully" : "Admin uğurla təsdiqləndi",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to approve admin")
      }
    } catch (error) {
      console.error("Error approving admin:", error)
      setMessage({
        type: "error",
        text:
          language === "en"
            ? "Failed to approve admin. Please try again."
            : "Admini təsdiqləmək alınmadı. Zəhmət olmasa yenidən cəhd edin.",
      })
    } finally {
      setProcessingId(null)
    }
  }

  // If user is not loaded yet, show loading
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
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => router.push("/admin")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold">
                {language === "en" ? "Admin Approval Requests" : "Admin Təsdiq Sorğuları"}
              </h1>
            </div>
          </div>
          
          {message && (
            <div
              className={`p-4 mb-6 rounded-md flex items-center ${
                message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle className="h-5 w-5 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 mr-2" />
              )}
              {message.text}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : pendingAdmins.length === 0 ? (
            <div className="bg-muted p-8 rounded-lg text-center">
              <p className="text-muted-foreground">
                {language === "en" ? "No pending admin approval requests" : "Gözləyən admin təsdiq sorğusu yoxdur"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingAdmins.map((admin) => (
                <Card key={admin.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{admin.username}</CardTitle>
                        <CardDescription>{admin.email}</CardDescription>
                      </div>
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                        {language === "en" ? "Pending" : "Gözləyir"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {language === "en" ? "Requested Role" : "Tələb olunan Rol"}
                        </p>
                        <p>Admin</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {language === "en" ? "Requested On" : "Sorğu tarixi"}
                        </p>
                        <p>{new Date(admin.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button onClick={() => handleApproveAdmin(admin.id)} disabled={processingId === admin.id}>
                      {processingId === admin.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {language === "en" ? "Processing..." : "İşlənir..."}
                        </>
                      ) : language === "en" ? (
                        "Approve Admin"
                      ) : (
                        "Admini Təsdiqlə"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

