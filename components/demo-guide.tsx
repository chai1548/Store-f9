"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Crown, User, ChevronRight, X } from "lucide-react"

const demoFeatures = [
  {
    icon: Crown,
    title: "Admin Features",
    description: "Login as admin@socialapp.com to access:",
    features: [
      "User management and promotion",
      "Chat moderation and Q&A setup",
      "Content moderation tools",
      "System notifications",
      "Demo data seeding",
    ],
    badge: "ADMIN",
  },
  {
    icon: User,
    title: "User Features",
    description: "Login as user@socialapp.com to try:",
    features: [
      "Create and share posts",
      "Chat with auto Q&A responses",
      "Search users and content",
      "Manage notifications",
      "Edit profile settings",
    ],
    badge: "USER",
  },
]

export default function DemoGuide() {
  const [isOpen, setIsOpen] = useState(true)

  if (!isOpen) {
    return (
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)} className="fixed bottom-4 right-4 z-50">
        Demo Guide
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">🚀 Demo Guide</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>Explore the platform with these demo accounts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {demoFeatures.map((feature, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center space-x-2">
              <feature.icon className="h-4 w-4" />
              <span className="font-medium">{feature.title}</span>
              <Badge variant={feature.badge === "ADMIN" ? "destructive" : "secondary"}>{feature.badge}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{feature.description}</p>
            <ul className="space-y-1">
              {feature.features.map((item, idx) => (
                <li key={idx} className="flex items-center space-x-2 text-xs">
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Quick Start:</strong> Use the demo login buttons in the auth modal for instant access!
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
