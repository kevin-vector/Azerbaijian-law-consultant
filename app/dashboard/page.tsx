"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import FilterPanel from "@/components/filter-panel"
import UserHeader from "@/components/user-header"
import ChatMessage from "@/components/chat-message"
import { Loader2, Filter, ChevronUp, ChevronDown, Send } from "lucide-react"
import { getUser } from "@/lib/session"

export default function Dashboard() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [language, setLanguage] = useState("en")
  const [isDetailed, setIsDetailed] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [userRole, setUserRole] = useState("user")
  const [chatHistory, setChatHistory] = useState<Array<{ type: "user" | "system"; content: string }>>([])
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [user, setUser] = useState<any>(null)

  // Sample query for demonstration
  const sampleQuery =
    language === "en"
      ? "If a branch office of a foreign company receives damages under a court decision and wishes to transfer the amount in USD, what taxes are due?"
      : "Əgər xarici şirkətin filialı məhkəmə qərarı əsasında zərər alırsa və məbləği USD ilə köçürmək istəyirsə, hansı vergilər ödənilməlidir?"

  // Load user data on component mount
  useEffect(() => {
    const userData = getUser()
    if (!userData) {
      // Redirect to login if no user is found
      router.push("/")
      return
    }

    setUser(userData)
    // Set user role from the user object
    setUserRole(userData.role || "user")
  }, [router])

  // Scroll to bottom of chat when history changes
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatHistory])

  // Auto-resize textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to get the correct scrollHeight
      textareaRef.current.style.height = "auto"
      // Set the height to scrollHeight to expand the textarea
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`
    }
  }, [query])

  // Add welcome message on first load
  useEffect(() => {
    if (chatHistory.length === 0 && user) {
      setChatHistory([
        {
          type: "system",
          content:
            language === "en"
              ? `Welcome ${user.username || user.email}! How can I help you today?`
              : `Xoş gəlmisiniz ${user.username || user.email}! Bu gün sizə necə kömək edə bilərəm?`,
        },
      ])
    }
  }, [language, chatHistory.length, user])

  // Handle Enter key to submit form (Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (query.trim()) {
        handleSearch(e as unknown as React.FormEvent)
      }
    }
  }

  // Simulate search functionality
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    // Add user query to chat history
    setChatHistory([...chatHistory, { type: "user", content: query }])
    setIsLoading(true)

    // Simulate API call delay
    setTimeout(() => {
      setIsLoading(false)

      // For demo purposes, if the query contains "tax" or "vergi", use the sample response
      // Otherwise, provide a generic response
      if (query.toLowerCase().includes("tax") || query.toLowerCase().includes("vergi")) {
        setChatHistory((prev) => [
          ...prev,
          {
            type: "system",
            content: sampleQuery,
          },
        ])
      } else {
        setChatHistory((prev) => [
          ...prev,
          {
            type: "system",
            content:
              language === "en"
                ? "I don't have specific information about that query. Could you please provide more details or ask about tax regulations?"
                : "Bu sorğu haqqında xüsusi məlumatım yoxdur. Zəhmət olmasa, daha ətraflı məlumat verin və ya vergi qaydaları haqqında soruşun?",
          },
        ])
      }

      setQuery("")
    }, 1500)
  }

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
    <div className="flex flex-col h-screen bg-gray-50">
      <UserHeader
        userRole={userRole}
        language={language}
        onLanguageToggle={toggleLanguage}
        userEmail={user.email}
        username={user.username}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
          {/* Chat history area */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
            style={{ overflowX: "hidden" }}
          >
            <div className="max-w-3xl mx-auto w-full">
              {chatHistory.map((message, index) => (
                <ChatMessage
                  key={index}
                  type={message.type}
                  content={message.content}
                  language={language}
                  isDetailed={isDetailed}
                />
              ))}

              {isLoading && (
                <div className="flex justify-center items-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}
            </div>
          </div>

          {/* Settings bar */}
          <div className="border-t border-b bg-white">
            <div className="container max-w-2xl mx-auto px-4 py-2 flex justify-between items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1"
              >
                <Filter className="h-4 w-4" />
                {language === "en" ? "Filters" : "Filtrlər"}
                {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>

              <div className="flex items-center space-x-2">
                <Switch id="detail-mode" checked={isDetailed} onCheckedChange={setIsDetailed} />
                <Label htmlFor="detail-mode" className="text-sm">
                  {language === "en" ? (isDetailed ? "Detailed" : "Brief") : isDetailed ? "Ətraflı" : "Qısa"}
                </Label>
              </div>
            </div>

            {showFilters && (
              <div className="container max-w-2xl mx-auto px-4 py-2">
                <FilterPanel language={language} />
              </div>
            )}
          </div>

          {/* Fixed input area at bottom */}
          <div className="border-t bg-white p-4">
            <div className="container max-w-2xl mx-auto">
              <form onSubmit={handleSearch} className="relative">
                <div className="relative rounded-md border shadow-sm focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
                  <textarea
                    ref={textareaRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      language === "en" ? "Type your legal question here..." : "Hüquqi sualınızı buraya yazın..."
                    }
                    rows={1}
                    className="w-full py-3 px-4 pr-12 text-base rounded-md border-0 resize-none focus:outline-none focus:ring-0"
                    disabled={isLoading}
                    style={{ minHeight: "44px", maxHeight: "150px" }}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="absolute right-2 bottom-2 rounded-md h-8 w-8"
                    disabled={isLoading || !query.trim()}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1 ml-1 text-center">
                  {language === "en"
                    ? "Press Enter to send, Shift+Enter for new line"
                    : "Göndərmək üçün Enter, yeni sətir üçün Shift+Enter basın"}
                </p>
              </form>
            </div>
          </div>
      </main>
    </div>
  )
}

