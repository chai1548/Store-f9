"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Crown, User, HelpCircle, X, ChevronUp, ChevronDown } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function FloatingDemoHelper() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const { user, userProfile } = useAuth()

  useEffect(() => {
    // Show helper after 3 seconds if user is not logged in
    if (!user) {
      const timer = setTimeout(() => {
        setIsOpen(true)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [user])

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-50 shadow-lg animate-bounce"
      >
        <HelpCircle className="h-4 w-4 mr-2" />
        Demo Help
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 left-4 w-80 z-50 shadow-xl border-2 border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">🎯 Demo Helper</CardTitle>
          </div>
          <div className="flex space-x-1">
            <Button variant="ghost" size="sm" onClick={() => setIsMinimized(!isMinimized)}>
              {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {!isMinimized && (
          <CardDescription>
            {user ? `Logged in as ${userProfile?.role || "user"}` : "Quick access to demo accounts"}
          </CardDescription>
        )}
      </CardHeader>

      {!isMinimized && (
        <CardContent className="space-y-3">
          {!user ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 p-2 bg-red-50 dark:bg-red-950/30 rounded border border-red-200">
                  <Crown className="h-4 w-4 text-red-600" />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-red-700">Admin Access</p>
                    <p className="text-xs text-red-600">admin@socialapp.com / admin123</p>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    ADMIN
                  </Badge>
                </div>

                <div className="flex items-center space-x-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200">
                  <User className="h-4 w-4 text-blue-600" />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-blue-700">User Access</p>
                    <p className="text-xs text-blue-600">user@socialapp.com / user123</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    USER
                  </Badge>
                </div>
              </div>

              <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                💡 Click the login button and use demo account buttons for instant access!
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                {userProfile?.role === "admin" ? (
                  <Crown className="h-4 w-4 text-red-600" />
                ) : (
                  <User className="h-4 w-4 text-blue-600" />
                )}
                <span className="font-medium">Welcome, {userProfile?.displayName}!</span>
                <Badge variant={userProfile?.role === "admin" ? "destructive" : "secondary"}>
                  {userProfile?.role?.toUpperCase() || "USER"}
                </Badge>
              </div>

              <div className="text-xs text-muted-foreground">
                {userProfile?.role === "admin" ? (
                  <ul className="space-y-1">
                    <li>• Try chat moderation in Chat page</li>
                    <li>• Manage users in Admin dashboard</li>
                    <li>• Set up Q&A auto-responses</li>
                    <li>• Send system notifications</li>
                  </ul>
                ) : (
                  <ul className="space-y-1">
                    <li>• Create posts in Upload page</li>
                    <li>• Try chat with auto Q&A</li>
                    <li>• Search users and content</li>
                    <li>• Check notifications</li>
                  </ul>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
