"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import FilterPanel from "@/components/filter-panel"
import UserHeader from "@/components/user-header"
import ChatMessage from "@/components/chat-message"
import { Loader2, Filter, ChevronUp, ChevronDown } from "lucide-react"

export default function Dashboard() {
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [language, setLanguage] = useState("en")
  const [isDetailed, setIsDetailed] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [userRole, setUserRole] = useState("user") // In a real app, this would come from auth
  const [chatHistory, setChatHistory] = useState<Array<{ type: "user" | "system"; content: string }>>([])
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Sample query for demonstration
  const sampleQuery =
    language === "en"
      ? "If a branch office of a foreign company receives damages under a court decision and wishes to transfer the amount in USD, what taxes are due?"
      : "Əgər xarici şirkətin filialı məhkəmə qərarı əsasında zərər alırsa və məbləği USD ilə köçürmək istəyirsə, hansı vergilər ödənilməlidir?"

  // Scroll to bottom of chat when history changes
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatHistory])

  // Add welcome message on first load
  useEffect(() => {
    if (chatHistory.length === 0) {
      setChatHistory([
        {
          type: "system",
          content:
            language === "en"
              ? "Welcome to the Legal Database. How can I help you today?"
              : "Hüquq Verilənlər Bazasına xoş gəlmisiniz. Bu gün sizə necə kömək edə bilərəm?",
        },
      ])
    }
  }, [language])

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

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <UserHeader userRole={userRole} language={language} onLanguageToggle={toggleLanguage} />

      <main className="flex-1 flex flex-col overflow-hidden">
        {userRole === "admin" ? (
          <Tabs defaultValue="chat" className="flex-1 flex flex-col">
            <TabsList className="mx-auto my-2">
              <TabsTrigger value="chat">{language === "en" ? "Chat" : "Söhbət"}</TabsTrigger>
              <TabsTrigger value="admin">{language === "en" ? "Admin" : "Admin"}</TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden">
              <ChatInterface
                query={query}
                setQuery={setQuery}
                handleSearch={handleSearch}
                isLoading={isLoading}
                language={language}
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                isDetailed={isDetailed}
                setIsDetailed={setIsDetailed}
                chatHistory={chatHistory}
                chatContainerRef={chatContainerRef}
              />
            </TabsContent>

            <TabsContent value="admin" className="flex-1 overflow-auto p-4">
              <AdminDashboard language={language} />
            </TabsContent>
          </Tabs>
        ) : (
          <ChatInterface
            query={query}
            setQuery={setQuery}
            handleSearch={handleSearch}
            isLoading={isLoading}
            language={language}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            isDetailed={isDetailed}
            setIsDetailed={setIsDetailed}
            chatHistory={chatHistory}
            chatContainerRef={chatContainerRef}
          />
        )}
      </main>
    </div>
  )
}

interface ChatInterfaceProps {
  query: string
  setQuery: (query: string) => void
  handleSearch: (e: React.FormEvent) => void
  isLoading: boolean
  language: string
  showFilters: boolean
  setShowFilters: (show: boolean) => void
  isDetailed: boolean
  setIsDetailed: (detailed: boolean) => void
  chatHistory: Array<{ type: "user" | "system"; content: string }>
  chatContainerRef: React.RefObject<HTMLDivElement | null>
}

function ChatInterface({
  query,
  setQuery,
  handleSearch,
  isLoading,
  language,
  showFilters,
  setShowFilters,
  isDetailed,
  setIsDetailed,
  chatHistory,
  chatContainerRef,
}: ChatInterfaceProps) {
  const placeholder = language === "en" ? "Type your legal question here..." : "Hüquqi sualınızı buraya yazın..."

  return (
    <>
      {/* Chat history area */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-2xl mx-auto w-full"
        style={{ overflowX: "hidden" }}
      >
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
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full py-3 pr-24 text-base rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
              disabled={isLoading}
            />

            <Button
              type="submit"
              className="absolute right-1 top-1 bottom-1 rounded-md"
              disabled={isLoading || !query.trim()}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : language === "en" ? "Send" : "Göndər"}
            </Button>
          </form>
        </div>
      </div>
    </>
  )
}

interface AdminDashboardProps {
  language: string
}

function AdminDashboard({ language }: AdminDashboardProps) {
  return (
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
  )
}

