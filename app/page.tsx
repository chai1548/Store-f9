"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/contexts/auth-context"
import Post from "@/components/post"
import { Search, Filter, Lock } from "lucide-react"

// Mock data for demonstration
const mockPosts = [
  {
    id: "1",
    author: {
      name: "John Doe",
      username: "johndoe",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    content: {
      text: "Just finished building an amazing social media app! The features include real-time posting, image uploads, and dark mode support. What do you think? 🚀",
      images: ["/placeholder.svg?height=300&width=400"],
    },
    type: "image" as const,
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    likes: 42,
    comments: 8,
    shares: 3,
    isLiked: false,
    isBookmarked: false,
  },
  {
    id: "2",
    author: {
      name: "Jane Smith",
      username: "janesmith",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    content: {
      text: "Beautiful sunset today! Nature never fails to amaze me. 🌅",
      images: ["/placeholder.svg?height=300&width=500", "/placeholder.svg?height=300&width=500"],
    },
    type: "image" as const,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    likes: 128,
    comments: 15,
    shares: 7,
    isLiked: true,
    isBookmarked: true,
  },
  {
    id: "3",
    author: {
      name: "Tech Guru",
      username: "techguru",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    content: {
      text: "Here's a quick tutorial on React hooks! This video covers useState, useEffect, and custom hooks. Perfect for beginners! 📚",
      video: "/placeholder.mp4",
    },
    type: "video" as const,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    likes: 89,
    comments: 23,
    shares: 12,
    isLiked: false,
    isBookmarked: false,
  },
]

export default function HomePage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const { user, userProfile } = useAuth()

  useEffect(() => {
    // Simulate loading posts
    const timer = setTimeout(() => {
      setPosts(mockPosts)
      setLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  const filteredPosts = posts.filter(
    (post) =>
      post.content.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-3xl font-bold mb-4">Welcome to SocialApp</h1>
        <p className="text-muted-foreground mb-6">Please login to access the social media platform</p>
        <p className="text-sm text-muted-foreground">
          Demo accounts: admin@socialapp.com / admin123 or user@socialapp.com / user123
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">
          Welcome back, {userProfile?.displayName}!{userProfile?.role === "admin" && " 👑"}
        </h1>
        <p className="text-muted-foreground mb-6">Discover amazing content from people around the world</p>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts or users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </Button>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="space-y-6">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="w-full max-w-2xl mx-auto">
              <div className="border rounded-lg p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-48 w-full rounded-lg" />
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            </div>
          ))
        ) : filteredPosts.length > 0 ? (
          filteredPosts.map((post) => <Post key={post.id} post={post} />)
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No posts found matching your search.</p>
          </div>
        )}
      </div>

      {/* Load More */}
      {!loading && filteredPosts.length > 0 && (
        <div className="text-center mt-8">
          <Button variant="outline">Load More Posts</Button>
        </div>
      )}
    </div>
  )
}
