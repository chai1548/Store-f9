"use client"

import Link from "next/link"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { useAuth } from "@/contexts/auth-context"
import AuthModal from "@/components/auth-modal"
import Chat from "@/components/chat"
import { Home, Upload, Search, User, Bell, MessageCircle, LogOut, Settings, Menu } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function Navigation() {
  const pathname = usePathname()
  const { user, userProfile, logout } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/upload", icon: Upload, label: "Upload" },
    { href: "/search", icon: Search, label: "Search" },
    { href: "/profile", icon: User, label: "Profile" },
    { href: "/notifications", icon: Bell, label: "Notifications" },
    ...(userProfile?.role === "admin" ? [{ href: "/admin", icon: Settings, label: "Admin" }] : []),
  ]

  const NavItems = ({ mobile = false, onItemClick }: { mobile?: boolean; onItemClick?: () => void }) => (
    <>
      {user &&
        navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Button
              key={item.href}
              variant={isActive ? "default" : "ghost"}
              size={mobile ? "default" : "sm"}
              asChild
              className={mobile ? "w-full justify-start" : ""}
              onClick={onItemClick}
            >
              <Link href={item.href} className="flex items-center space-x-2">
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            </Button>
          )
        })}
    </>
  )

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-14 sm:h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-xl sm:text-2xl font-bold text-primary">
                SocialApp
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
              <NavItems />
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-2">
              {user ? (
                <>
                  {/* Chat button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowChat(true)}
                    className="hidden sm:flex relative"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span className="hidden lg:inline ml-2">Chat</span>
                    {/* Add notification badge */}
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      3
                    </div>
                  </Button>

                  {/* User profile - Desktop */}
                  <div className="hidden sm:flex items-center space-x-2">
                    <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                      <AvatarFallback className="text-xs">{userProfile?.displayName?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="hidden lg:block">
                      <p className="text-sm font-medium">{userProfile?.displayName}</p>
                      <Badge variant={userProfile?.role === "admin" ? "destructive" : "secondary"} className="text-xs">
                        {userProfile?.role}
                      </Badge>
                    </div>
                  </div>

                  {/* Logout - Desktop */}
                  <Button variant="ghost" size="sm" onClick={logout} className="hidden sm:flex">
                    <LogOut className="h-4 w-4" />
                  </Button>

                  {/* Mobile menu trigger */}
                  <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="sm" className="md:hidden">
                        <Menu className="h-4 w-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-64">
                      <div className="flex flex-col space-y-4 mt-6">
                        {/* User info */}
                        <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>{userProfile?.displayName?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{userProfile?.displayName}</p>
                            <Badge
                              variant={userProfile?.role === "admin" ? "destructive" : "secondary"}
                              className="text-xs"
                            >
                              {userProfile?.role}
                            </Badge>
                          </div>
                        </div>

                        {/* Navigation items */}
                        <div className="space-y-2">
                          <NavItems mobile onItemClick={() => setMobileMenuOpen(false)} />
                        </div>

                        {/* Chat button */}
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setShowChat(true)
                            setMobileMenuOpen(false)
                          }}
                          className="justify-start"
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Chat
                        </Button>

                        {/* Logout */}
                        <Button variant="ghost" onClick={logout} className="justify-start text-red-600">
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>
                </>
              ) : (
                <Button onClick={() => setShowAuthModal(true)} size="sm">
                  Login
                </Button>
              )}

              <ModeToggle />
            </div>
          </div>

          {/* Mobile Navigation - Bottom tabs style */}
          {user && (
            <div className="md:hidden flex justify-around py-2 border-t bg-background">
              {navItems.slice(0, 5).map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Button
                    key={item.href}
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    asChild
                    className="flex flex-col items-center space-y-1 h-auto py-2 px-3"
                  >
                    <Link href={item.href}>
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
                className="flex flex-col items-center space-y-1 h-auto py-2 px-3 relative"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="text-xs">Chat</span>
                {/* Add notification badge */}
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  3
                </div>
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
