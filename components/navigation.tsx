"use client"

import Link from "next/link"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { useAuth } from "@/contexts/auth-context"
import AuthModal from "@/components/auth-modal"
import Chat from "@/components/chat"
import { Home, Upload, Search, User, Bell, MessageCircle, LogOut } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export default function Navigation() {
  const pathname = usePathname()
  const { user, userProfile, logout } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showChat, setShowChat] = useState(false)

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/upload", icon: Upload, label: "Upload" },
    { href: "/search", icon: Search, label: "Search" },
    { href: "/profile", icon: User, label: "Profile" },
    { href: "/notifications", icon: Bell, label: "Notifications" },
  ]

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-2xl font-bold text-primary">
                SocialApp
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              {user &&
                navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Button key={item.href} variant={pathname === item.href ? "default" : "ghost"} size="sm" asChild>
                      <Link href={item.href} className="flex items-center space-x-2">
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </Button>
                  )
                })}
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setShowChat(true)}>
                    <MessageCircle className="h-4 w-4" />
                    <span className="hidden sm:inline ml-2">Chat</span>
                  </Button>
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{userProfile?.displayName?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block">
                      <p className="text-sm font-medium">{userProfile?.displayName}</p>
                      <Badge variant={userProfile?.role === "admin" ? "destructive" : "secondary"} className="text-xs">
                        {userProfile?.role}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={logout}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button onClick={() => setShowAuthModal(true)}>Login</Button>
              )}
              <ModeToggle />
            </div>
          </div>

          {/* Mobile Navigation */}
          {user && (
            <div className="md:hidden flex justify-around py-2 border-t">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Button key={item.href} variant={pathname === item.href ? "default" : "ghost"} size="sm" asChild>
                    <Link href={item.href} className="flex flex-col items-center space-y-1">
                      <Icon className="h-4 w-4" />
                      <span className="text-xs">{item.label}</span>
                    </Link>
                  </Button>
                )
              })}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChat(true)}
                className="flex flex-col items-center space-y-1"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="text-xs">Chat</span>
              </Button>
            </div>
          )}
        </div>
      </nav>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      <Chat open={showChat} onOpenChange={setShowChat} />
    </>
  )
}
