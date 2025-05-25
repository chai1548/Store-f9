"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import AuthModal from "@/components/auth-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, MessageCircle, Bell, Users, TrendingUp } from "lucide-react"
import FirebaseStatus from "@/components/firebase-status"
import Link from "next/link"

export default function HomePage() {
  const { user, userProfile } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="mb-8">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Welcome to SocialApp
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                Connect with friends, share your moments, and discover amazing content in our modern social platform
              </p>
              <Button
                onClick={() => setShowAuthModal(true)}
                size="lg"
                className="text-lg px-8 py-4 h-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Join SocialApp Today
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">Smart Messaging</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  Real-time chat with intelligent auto-responses and seamless communication
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">Rich Content</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  Share photos, videos, and stories with advanced editing tools and filters
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950/50 dark:to-pink-900/50">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">Smart Notifications</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  Stay updated with intelligent notifications and never miss important moments
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">Discover Content</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  Find interesting people and content with our powerful search and recommendation engine
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">Community</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  Build meaningful connections and join communities that share your interests
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/50 dark:to-indigo-900/50">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">Trending</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  Stay on top of trends and see what's popular in your network and beyond
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <Card className="max-w-2xl mx-auto border-0 shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
                <p className="text-xl mb-6 text-blue-100">
                  Join thousands of users who are already connecting and sharing on SocialApp
                </p>
                <Button
                  onClick={() => setShowAuthModal(true)}
                  size="lg"
                  variant="secondary"
                  className="text-lg px-8 py-4 h-auto bg-white text-blue-600 hover:bg-blue-50"
                >
                  Create Your Account
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <FirebaseStatus />
          </div>
        </div>

        <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Welcome back, {userProfile?.displayName}!
        </h1>
        <p className="text-xl text-muted-foreground mb-6">
          {userProfile?.role === "admin"
            ? "👑 Admin Dashboard - Manage your platform"
            : "📱 Your Social Hub - Stay connected"}
        </p>
      </div>

      {/* Quick Actions Dashboard */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold mb-2">Create Post</h3>
            <p className="text-sm text-muted-foreground mb-4">Share your thoughts and media</p>
            <Button asChild className="w-full">
              <Link href="/upload">Create</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold mb-2">Chat</h3>
            <p className="text-sm text-muted-foreground mb-4">Connect with friends</p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/chat">Open Chat</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold mb-2">Search</h3>
            <p className="text-sm text-muted-foreground mb-4">Discover content and people</p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/search">Explore</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold mb-2">Notifications</h3>
            <p className="text-sm text-muted-foreground mb-4">Stay updated</p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/notifications">View All</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Admin Features */}
      {userProfile?.role === "admin" && (
        <Card className="mb-8 border-0 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">👑 Admin Controls</CardTitle>
            <CardDescription>Manage your platform with administrative tools</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Button asChild variant="outline" className="h-auto p-4">
                <Link href="/admin" className="flex flex-col items-center gap-2">
                  <Users className="h-6 w-6" />
                  <span>User Management</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4">
                <Link href="/chat" className="flex flex-col items-center gap-2">
                  <MessageCircle className="h-6 w-6" />
                  <span>Chat Moderation</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4">
                <Link href="/notifications" className="flex flex-col items-center gap-2">
                  <Bell className="h-6 w-6" />
                  <span>System Notifications</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Getting Started Guide */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>🚀 Getting Started</CardTitle>
          <CardDescription>Here's how to make the most of SocialApp</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">📱 For Everyone</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-medium">Create your first post</p>
                    <p className="text-sm text-muted-foreground">Share photos, videos, or thoughts with your network</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-medium">Connect with others</p>
                    <p className="text-sm text-muted-foreground">Use chat to communicate and build relationships</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">3</span>
                  </div>
                  <div>
                    <p className="font-medium">Discover content</p>
                    <p className="text-sm text-muted-foreground">Search for interesting people and trending topics</p>
                  </div>
                </div>
              </div>
            </div>

            {userProfile?.role === "admin" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">👑 Admin Features</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">A</span>
                    </div>
                    <div>
                      <p className="font-medium">Moderate content</p>
                      <p className="text-sm text-muted-foreground">Review and manage user posts and interactions</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">B</span>
                    </div>
                    <div>
                      <p className="font-medium">Manage users</p>
                      <p className="text-sm text-muted-foreground">Control user permissions and platform access</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">C</span>
                    </div>
                    <div>
                      <p className="font-medium">System settings</p>
                      <p className="text-sm text-muted-foreground">Configure platform features and notifications</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Empty State for Posts */}
      <Card className="mt-8 border-0 shadow-lg">
        <CardContent className="p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Plus className="h-10 w-10 text-blue-600" />
          </div>
          <h3 className="text-2xl font-semibold mb-4">Ready to share something amazing?</h3>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Your feed is waiting for your first post. Share a photo, video, or just tell us what's on your mind.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Link href="/upload" className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create Your First Post
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
