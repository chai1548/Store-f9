"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { addSampleData, checkFirebaseConnection } from "@/lib/firebase-utils"
import { Trash2, Plus, RefreshCw, Database } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AdminPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null)
  const { userProfile } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (userProfile?.role === "admin") {
      loadData()
      testConnection()
    }
  }, [userProfile])

  const testConnection = async () => {
    const isConnected = await checkFirebaseConnection()
    setConnectionStatus(isConnected)
  }

  const loadData = async () => {
    setLoading(true)
    try {
      // Load posts
      const postsSnapshot = await getDocs(collection(db, "posts"))
      const postsData = postsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setPosts(postsData)

      // Load users
      const usersSnapshot = await getDocs(collection(db, "users"))
      const usersData = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setUsers(usersData)
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  const handleAddSampleData = async () => {
    try {
      await addSampleData()
      await loadData()
      toast({
        title: "Success",
        description: "Sample data added successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add sample data",
        variant: "destructive",
      })
    }
  }

  const handleDeletePost = async (postId: string) => {
    try {
      await deleteDoc(doc(db, "posts", postId))
      await loadData()
      toast({
        title: "Success",
        description: "Post deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      })
    }
  }

  if (userProfile?.role !== "admin") {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground">You need admin privileges to access this page.</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Admin Dashboard 👑</h1>
        <p className="text-muted-foreground">Manage your social media platform</p>
      </div>

      {/* Connection Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Firebase Connection</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Badge variant={connectionStatus ? "default" : "destructive"}>
              {connectionStatus === null ? "Testing..." : connectionStatus ? "Connected" : "Disconnected"}
            </Badge>
            <Button variant="outline" size="sm" onClick={testConnection}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Posts Management */}
        <Card>
          <CardHeader>
            <CardTitle>Posts Management</CardTitle>
            <CardDescription>Manage all posts in the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Total Posts: {posts.length}</span>
                <div className="space-x-2">
                  <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button size="sm" onClick={handleAddSampleData}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Sample Data
                  </Button>
                </div>
              </div>

              {loading ? (
                <p>Loading posts...</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {posts.map((post) => (
                    <div key={post.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <p className="font-medium">{post.author?.name || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {post.content?.text || "No text content"}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          {post.type}
                        </Badge>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => handleDeletePost(post.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Users Management */}
        <Card>
          <CardHeader>
            <CardTitle>Users Management</CardTitle>
            <CardDescription>Manage all users in the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Total Users: {users.length}</span>
                <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {loading ? (
                <p>Loading users...</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{user.displayName}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <Badge variant={user.role === "admin" ? "destructive" : "secondary"} className="text-xs">
                          {user.role}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
