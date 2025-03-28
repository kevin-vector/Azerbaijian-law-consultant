"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import UserHeader from "@/components/user-header"
import { Loader2 } from "lucide-react"
import { getUser } from "@/lib/session"
import { set } from "date-fns"

export default function AdminPage() {
  const router = useRouter()
  const [language, setLanguage] = useState("en")
  const [userRole, setUserRole] = useState("admin")
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState("")
  const [statusError, setStatusError] = useState("")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [scrape_law, setScrape_law] = useState({status:"running", created_at:""})
  const [scrape_post, setScrape_post] = useState({status:"running", created_at:""})

  const getScrapeStatus = async () => {
    try {
      const res = await fetch('/api/scrape-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      console.log(res)
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

  useEffect(() => {
    const userData = getUser()
    if (!userData) {
      router.push("/")
      return
    }

    if (userData.role !== "admin") {
      router.push("/dashboard")
      return
    }

    setUser(userData)
    setUserRole("admin")
  }, [router])

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "az" : "en")
  }

  if (!user) {
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

          <div className="bg-white rounded-lg p-6 shadow-sm">
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
              {/* <div className="flex justify-between items-center p-3 border rounded-md">
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
              </Button> */}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

