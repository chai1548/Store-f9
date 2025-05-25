"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Search, Users, FileText, Hash, TrendingUp, Filter, MapPin, UserPlus, MessageCircle } from "lucide-react"
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  startAfter,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import Link from "next/link"
import Post from "@/components/post"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SearchUser {
  id: string
  displayName: string
  email: string
  bio?: string
  location?: string
  occupation?: string
  avatar?: string
  role: "admin" | "user"
  createdAt: any
  isFollowing?: boolean
}

interface SearchPost {
  id: string
  author: {
    uid: string
    name: string
    username: string
    avatar?: string
  }
  content: {
    text?: string
    images?: string[]
    video?: string
  }
  type: "text" | "image" | "video"
  timestamp: Date
  likes: number
  comments: number
  shares: number
  views?: number
}

interface TrendingTopic {
  tag: string
  count: number
  growth: number
}

export default function SearchPage() {
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null)

  // Search results
  const [users, setUsers] = useState<SearchUser[]>([])
  const [posts, setPosts] = useState<SearchPost[]>([])
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([])

  // Filters
  const [sortBy, setSortBy] = useState("relevance")
  const [dateFilter, setDateFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  // Recent searches
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  useEffect(() => {
    loadTrendingTopics()
    loadRecentSearches()
  }, [])

  useEffect(() => {
    if (searchQuery.trim()) {
      const debounceTimer = setTimeout(() => {
        handleSearch()
      }, 500)
      return () => clearTimeout(debounceTimer)
    } else {
      clearResults()
    }
  }, [searchQuery, sortBy, dateFilter, typeFilter])

  const loadTrendingTopics = async () => {
    try {
      // Mock trending topics - in real app, this would be calculated from post analytics
      const mockTrending: TrendingTopic[] = [
        { tag: "technology", count: 156, growth: 23 },
        { tag: "photography", count: 134, growth: 18 },
        { tag: "travel", count: 98, growth: 15 },
        { tag: "food", count: 87, growth: 12 },
        { tag: "fitness", count: 76, growth: 8 },
        { tag: "music", count: 65, growth: 5 },
        { tag: "art", count: 54, growth: 3 },
        { tag: "coding", count: 43, growth: 2 },
      ]
      setTrendingTopics(mockTrending)
    } catch (error) {
      console.error("Error loading trending topics:", error)
    }
  }

  const loadRecentSearches = () => {
    const saved = localStorage.getItem("recentSearches")
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }

  const saveRecentSearch = (query: string) => {
    const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(0, 10)
    setRecentSearches(updated)
    localStorage.setItem("recentSearches", JSON.stringify(updated))
  }

  const clearResults = () => {
    setUsers([])
    setPosts([])
    setLastDoc(null)
    setHasMore(true)
  }

  const handleSearch = async (loadMore = false) => {
    if (!searchQuery.trim()) return

    setLoading(true)

    try {
      if (!loadMore) {
        clearResults()
        saveRecentSearch(searchQuery.trim())
      }

      await Promise.all([searchUsers(loadMore), searchPosts(loadMore)])
    } catch (error) {
      console.error("Error searching:", error)
      toast({
        title: "Search failed",
        description: "Failed to search. Please try again.",
        variant: "destructive",
      })
    }

    setLoading(false)
  }

  const searchUsers = async (loadMore = false) => {
    try {
      const searchLower = searchQuery.toLowerCase()

      // Search by display name
      const nameQuery = query(
        collection(db, "users"),
        where("displayName", ">=", searchQuery),
        where("displayName", "<=", searchQuery + "\uf8ff"),
        orderBy("displayName"),
        limit(20),
      )

      // Search by email
      const emailQuery = query(
        collection(db, "users"),
        where("email", ">=", searchLower),
        where("email", "<=", searchLower + "\uf8ff"),
        orderBy("email"),
        limit(20),
      )

      const [nameSnapshot, emailSnapshot] = await Promise.all([getDocs(nameQuery), getDocs(emailQuery)])

      const foundUsers = new Map<string, SearchUser>()

      // Process name results
      nameSnapshot.forEach((doc) => {
        const userData = doc.data()
        if (doc.id !== userProfile?.uid) {
          foundUsers.set(doc.id, {
            id: doc.id,
            displayName: userData.displayName,
            email: userData.email,
            bio: userData.bio,
            location: userData.location,
            occupation: userData.occupation,
            avatar: userData.avatar,
            role: userData.role,
            createdAt: userData.createdAt,
          })
        }
      })

      // Process email results
      emailSnapshot.forEach((doc) => {
        const userData = doc.data()
        if (doc.id !== userProfile?.uid && !foundUsers.has(doc.id)) {
          foundUsers.set(doc.id, {
            id: doc.id,
            displayName: userData.displayName,
            email: userData.email,
            bio: userData.bio,
            location: userData.location,
            occupation: userData.occupation,
            avatar: userData.avatar,
            role: userData.role,
            createdAt: userData.createdAt,
          })
        }
      })

      const userResults = Array.from(foundUsers.values())

      if (loadMore) {
        setUsers((prev) => [...prev, ...userResults])
      } else {
        setUsers(userResults)
      }
    } catch (error) {
      console.error("Error searching users:", error)
    }
  }

  const searchPosts = async (loadMore = false) => {
    try {
      let q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(20))

      if (loadMore && lastDoc) {
        q = query(collection(db, "posts"), orderBy("createdAt", "desc"), startAfter(lastDoc), limit(20))
      }

      const snapshot = await getDocs(q)

      if (snapshot.empty) {
        setHasMore(false)
        return
      }

      const searchLower = searchQuery.toLowerCase()
      const postResults: SearchPost[] = []

      snapshot.forEach((doc) => {
        const data = doc.data()
        const postText = data.content?.text?.toLowerCase() || ""
        const authorName = data.author?.name?.toLowerCase() || ""

        // Simple text matching - in production, use full-text search
        if (postText.includes(searchLower) || authorName.includes(searchLower)) {
          postResults.push({
            id: doc.id,
            author: data.author,
            content: data.content,
            type: data.type,
            timestamp: data.createdAt?.toDate() || new Date(),
            likes: data.likes || 0,
            comments: data.comments || 0,
            shares: data.shares || 0,
            views: data.views || 0,
          })
        }
      })

      // Apply filters
      let filteredPosts = postResults

      if (typeFilter !== "all") {
        filteredPosts = filteredPosts.filter((post) => post.type === typeFilter)
      }

      if (dateFilter !== "all") {
        const now = new Date()
        const filterDate = new Date()

        switch (dateFilter) {
          case "today":
            filterDate.setHours(0, 0, 0, 0)
            break
          case "week":
            filterDate.setDate(now.getDate() - 7)
            break
          case "month":
            filterDate.setMonth(now.getMonth() - 1)
            break
          case "year":
            filterDate.setFullYear(now.getFullYear() - 1)
            break
        }

        filteredPosts = filteredPosts.filter((post) => post.timestamp >= filterDate)
      }

      // Apply sorting
      if (sortBy === "recent") {
        filteredPosts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      } else if (sortBy === "popular") {
        filteredPosts.sort((a, b) => b.likes + b.comments - (a.likes + a.comments))
      }

      if (loadMore) {
        setPosts((prev) => [...prev, ...filteredPosts])
      } else {
        setPosts(filteredPosts)
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1])
      setHasMore(snapshot.docs.length === 20)
    } catch (error) {
      console.error("Error searching posts:", error)
    }
  }

  const handleFollowUser = async (userId: string) => {
    // Implementation would be similar to UserProfileView
    toast({
      title: "Follow functionality",
      description: "Follow feature would be implemented here",
    })
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem("recentSearches")
  }

  if (!userProfile) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h1 className="text-3xl font-bold mb-4">Please Login</h1>
        <p className="text-muted-foreground">You need to be logged in to search.</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Search</h1>
        <p className="text-muted-foreground">Discover users, posts, and trending topics</p>
      </div>

      {/* Search Input */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for users, posts, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 text-lg h-12"
            />
          </div>

          {/* Recent Searches */}
          {!searchQuery && recentSearches.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-sm">Recent Searches</h3>
                <Button variant="ghost" size="sm" onClick={clearRecentSearches}>
                  Clear
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchQuery(search)}
                    className="text-xs"
                  >
                    {search}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trending Topics */}
      {!searchQuery && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Trending Topics</span>
            </CardTitle>
            <CardDescription>Popular topics and hashtags</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {trendingTopics.map((topic, index) => (
                <div
                  key={topic.tag}
                  className="p-3 border rounded-lg hover:bg-muted cursor-pointer transition-colors"
                  onClick={() => setSearchQuery(`#${topic.tag}`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Hash className="h-4 w-4 text-primary" />
                    <Badge variant="secondary" className="text-xs">
                      #{index + 1}
                    </Badge>
                  </div>
                  <p className="font-medium">#{topic.tag}</p>
                  <p className="text-sm text-muted-foreground">{topic.count} posts</p>
                  <p className="text-xs text-green-600">+{topic.growth}% growth</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {searchQuery && (
        <div className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4" />
                  <span className="text-sm font-medium">Filters:</span>
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="image">Images</SelectItem>
                    <SelectItem value="video">Videos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Results Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Results</TabsTrigger>
              <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
              <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              {/* Users Section */}
              {users.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5" />
                      <span>Users</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {users.slice(0, 6).map((user) => (
                        <div key={user.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} />
                            <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <Link href={`/user/${user.id}`} className="font-medium hover:underline">
                              {user.displayName}
                            </Link>
                            <p className="text-sm text-muted-foreground truncate">{user.occupation || user.email}</p>
                            {user.location && (
                              <p className="text-xs text-muted-foreground flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {user.location}
                              </p>
                            )}
                          </div>
                          <Button size="sm" variant="outline" onClick={() => handleFollowUser(user.id)}>
                            <UserPlus className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    {users.length > 6 && (
                      <div className="text-center mt-4">
                        <Button variant="outline" onClick={() => setActiveTab("users")}>
                          View All Users ({users.length})
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Posts Section */}
              {posts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5" />
                      <span>Posts</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {posts.slice(0, 3).map((post) => (
                        <Post key={post.id} post={post} compact />
                      ))}
                    </div>
                    {posts.length > 3 && (
                      <div className="text-center mt-4">
                        <Button variant="outline" onClick={() => setActiveTab("posts")}>
                          View All Posts ({posts.length})
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* No Results */}
              {!loading && users.length === 0 && posts.length === 0 && searchQuery && (
                <Card>
                  <CardContent className="text-center py-12">
                    <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">No results found</p>
                    <p className="text-muted-foreground">Try adjusting your search terms or filters</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              {users.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {users.map((user) => (
                    <Card key={user.id}>
                      <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                          <Avatar className="h-16 w-16 mx-auto">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="text-xl">{user.displayName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <Link href={`/user/${user.id}`} className="font-semibold hover:underline">
                              {user.displayName}
                            </Link>
                            <p className="text-sm text-muted-foreground">{user.occupation || user.email}</p>
                            {user.bio && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{user.bio}</p>}
                            {user.location && (
                              <p className="text-xs text-muted-foreground flex items-center justify-center mt-2">
                                <MapPin className="h-3 w-3 mr-1" />
                                {user.location}
                              </p>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Button size="sm" onClick={() => handleFollowUser(user.id)}>
                              <UserPlus className="h-3 w-3 mr-1" />
                              Follow
                            </Button>
                            <Button size="sm" variant="outline">
                              <MessageCircle className="h-3 w-3 mr-1" />
                              Message
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">No users found</p>
                    <p className="text-muted-foreground">Try different search terms</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="posts" className="space-y-6">
              {posts.length > 0 ? (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <Post key={post.id} post={post} />
                  ))}
                  {hasMore && (
                    <div className="text-center">
                      <Button onClick={() => handleSearch(true)} disabled={loading}>
                        {loading ? "Loading..." : "Load More"}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">No posts found</p>
                    <p className="text-muted-foreground">Try different search terms or filters</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {loading && (
            <div className="text-center py-8">
              <div className="inline-flex items-center space-x-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span>Searching...</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
