"use client"

import { useEffect, useState } from "react"
import { collection, addDoc, getDocs, query } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Database, CheckCircle } from "lucide-react"

const samplePosts = [
  {
    content: "Welcome to our social media platform! 🎉 This is a demo post to showcase the features.",
    mediaType: "text",
    authorId: "admin",
    authorName: "Admin User",
    likes: 15,
    comments: 3,
    shares: 2,
  },
  {
    content: "Check out this amazing sunset! 🌅 Nature never fails to amaze me.",
    mediaType: "image",
    mediaUrl: "/placeholder.svg?height=400&width=600",
    authorId: "user",
    authorName: "Demo User",
    likes: 8,
    comments: 2,
    shares: 1,
  },
  {
    content: "Just finished reading an amazing book about technology and innovation. Highly recommend! 📚✨",
    mediaType: "text",
    authorId: "user",
    authorName: "Demo User",
    likes: 12,
    comments: 5,
    shares: 3,
  },
]

const sampleQAItems = [
  {
    question: "How do I create a post?",
    answer: "To create a post, click the 'Upload' button in the navigation menu, then add your content and media.",
    keywords: ["post", "create", "upload", "how to post"],
  },
  {
    question: "How do I change my profile?",
    answer: "Go to your Profile page and click 'Edit Profile' to update your information, avatar, and settings.",
    keywords: ["profile", "edit", "change", "update profile"],
  },
  {
    question: "How do notifications work?",
    answer:
      "You'll receive notifications for likes, comments, messages, and follows. Check the bell icon to see all notifications.",
    keywords: ["notifications", "alerts", "bell", "notify"],
  },
  {
    question: "Can I chat with other users?",
    answer: "Yes! Use the Chat feature to send messages to other users. Admins can also moderate chats.",
    keywords: ["chat", "message", "talk", "conversation"],
  },
]

export default function DemoDataSeeder() {
  const [loading, setLoading] = useState(false)
  const [seeded, setSeeded] = useState(false)
  const { userProfile } = useAuth()

  useEffect(() => {
    checkIfSeeded()
  }, [])

  const checkIfSeeded = async () => {
    try {
      const postsQuery = query(collection(db, "posts"))
      const postsSnapshot = await getDocs(postsQuery)
      setSeeded(postsSnapshot.size > 0)
    } catch (error) {
      console.error("Error checking seeded data:", error)
    }
  }

  const seedDemoData = async () => {
    if (!userProfile?.role === "admin") return

    setLoading(true)
    try {
      // Seed posts
      for (const post of samplePosts) {
        await addDoc(collection(db, "posts"), {
          ...post,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }

      // Seed Q&A items
      for (const qa of sampleQAItems) {
        await addDoc(collection(db, "qaItems"), {
          ...qa,
          createdAt: new Date(),
          isActive: true,
        })
      }

      // Seed sample notifications
      await addDoc(collection(db, "notifications"), {
        userId: userProfile.uid,
        type: "system",
        title: "Welcome to SocialApp!",
        message: "Your account has been set up successfully. Start exploring!",
        read: false,
        createdAt: new Date(),
        priority: "high",
      })

      setSeeded(true)
    } catch (error) {
      console.error("Error seeding demo data:", error)
    }
    setLoading(false)
  }

  if (!userProfile?.role === "admin") {
    return null
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Database className="h-5 w-5" />
          <span>Demo Data Setup</span>
        </CardTitle>
        <CardDescription>Populate the app with sample posts, Q&A items, and notifications for testing</CardDescription>
      </CardHeader>
      <CardContent>
        {seeded ? (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Demo data already exists</span>
          </div>
        ) : (
          <Button onClick={seedDemoData} disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Seed Demo Data
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
