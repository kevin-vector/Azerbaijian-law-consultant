"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { Globe } from "lucide-react"

interface UserHeaderProps {
  userRole: string
  language: string
  onLanguageToggle: () => void
}

export default function UserHeader({ userRole, language, onLanguageToggle }: UserHeaderProps) {
  const router = useRouter()

  const handleLogout = () => {
    router.push("/")
  }

  return (
    <header className="border-b bg-background sticky top-0 z-10">
      <div className="container max-w-5xl mx-auto flex h-14 items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">{language === "en" ? "Legal Database" : "Hüquq Verilənlər Bazası"}</h1>
          <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs">
            {userRole === "admin" ? "Admin" : "User"}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Button
            className="px-2 gap-0 w-auto"
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
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>{language === "en" ? "Profile" : "Profil"}</DropdownMenuItem>
              <DropdownMenuItem>{language === "en" ? "Settings" : "Parametrlər"}</DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>{language === "en" ? "Logout" : "Çıxış"}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

