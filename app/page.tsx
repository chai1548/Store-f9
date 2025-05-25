"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/contexts/auth-context"
import Post from "@/components/post"
import FirebaseStatus from "@/components/firebase-status"
import { Search, Filter, Lock, Plus } from "lucide-react"
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { addSampleData } from "@/lib/firebase-utils"
import Link from "next/link"

export default function HomePage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const { user, userProfile } = useAuth()

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    console.log("Setting up posts listener...")

    // Listen to posts from Firebase Firestore
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(20))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log("Posts snapshot received:", snapshot.size, "documents")
        const newPosts: any[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          newPosts.push({
            id: doc.id,
            ...data,
            timestamp: data.createdAt?.toDate() || new Date(),
          })
        })
        setPosts(newPosts)
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching posts:", error)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [user])

  const handleAddSampleData = async () => {
    try {
      await addSampleData()
      console.log("Sample data added successfully")
    } catch (error) {
      console.error("Error adding sample data:", error)
    }
  }

  const filteredPosts = posts.filter(
    (post) =>
      post.content?.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <FirebaseStatus />
        <div className="text-center py-12">
          <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-3xl font-bold mb-4">Welcome to SocialApp</h1>
          <p className="text-muted-foreground mb-6">Please login to access the social media platform</p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>Demo Accounts:</strong>
            </p>
            <p>Admin: admin@socialapp.com / admin123</p>
            <p>User: user@socialapp.com / user123</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <FirebaseStatus />

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
          <Button asChild>
            <Link href="/upload" className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Create Post</span>
            </Link>
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
            <div className="mb-4">
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "No posts found matching your search."
                  : "No posts yet. Be the first to share something!"}
              </p>
              {!searchQuery && (
                <div className="space-y-4">
                  <Button asChild>
                    <Link href="/upload">Create Your First Post</Link>
                  </Button>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Or add some sample data:</p>
                    <Button variant="outline" onClick={handleAddSampleData}>
                      Add Sample Posts
                    </Button>
                  </div>
                </div>
              )}
            </div>
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
