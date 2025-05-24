"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { Home, Upload, Search, User, Bell } from "lucide-react"

export default function Navigation() {
  const pathname = usePathname()

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/upload", icon: Upload, label: "Upload" },
    { href: "/search", icon: Search, label: "Search" },
    { href: "/profile", icon: User, label: "Profile" },
    { href: "/notifications", icon: Bell, label: "Notifications" },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-2xl font-bold text-primary">
              SocialApp
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => {
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
            <ModeToggle />
          </div>
        </div>

        {/* Mobile Navigation */}
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
        </div>
      </div>
    </nav>
  )
}
