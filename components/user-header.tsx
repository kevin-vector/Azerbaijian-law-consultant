"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useRouter, usePathname } from "next/navigation"
import { Globe, LogOut, ShieldCheck, MessageSquare } from "lucide-react"
import { clearUser } from "@/lib/session"
import Link from "next/link"

interface UserHeaderProps {
  userRole: string
  language: string
  onLanguageToggle: () => void
  userEmail?: string
  username?: string
}

export default function UserHeader({ userRole, language, onLanguageToggle, userEmail, username }: UserHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = () => {
    clearUser()
    router.push("/")
  }

  // Get display name - prefer username if available
  const displayName = username || userEmail || "User"
  const displayInitial = username ? username[0].toUpperCase() : userEmail ? userEmail[0].toUpperCase() : "U"

  const isAdmin = userRole === "admin"
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/")

  return (
    <header className="border-b bg-background sticky top-0 z-10">
      <div className="container max-w-5xl mx-auto flex h-14 items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">
            <Link href="/dashboard">{language === "en" ? "Legal Database" : "Hüquq Verilənlər Bazası"}</Link>
          </h1>
          {isAdmin && <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs">Admin</span>}
        </div>

        {/* Admin Navigation - toggle between Dashboard and Admin based on current page */}
        {isAdmin && (
          <div className="flex items-center">
            {isAdminPage ? (
              <Link
                href="/dashboard"
                className="flex items-center text-sm font-medium transition-colors hover:text-primary"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {language === "en" ? "Dashboard" : "Əsas Panel"}
              </Link>
            ) : (
              <Link
                href="/admin"
                className="flex items-center text-sm font-medium transition-colors hover:text-primary"
              >
                <ShieldCheck className="h-4 w-4 mr-2" />
                {language === "en" ? "Admin Dashboard" : "Admin Paneli"}
              </Link>
            )}
          </div>
        )}

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onLanguageToggle}
            title={language === "en" ? "Switch to Azerbaijani" : "Switch to English"}
          >
            <Globe className="h-5 w-5" />
            <span className="ml-2 font-bold">{language.toUpperCase()}</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                  <AvatarFallback>{displayInitial}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">{displayName}</div>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                {language === "en" ? "Sign Out" : "Çıxış"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

