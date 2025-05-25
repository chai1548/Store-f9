"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import {
  User,
  MessageCircle,
  UserPlus,
  UserMinus,
  MapPin,
  Calendar,
  LinkIcon,
  Mail,
  Phone,
  MoreHorizontal,
  Camera,
  Heart,
  Flag,
  BlocksIcon as Block,
  Crown,
  Eye,
  Users,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Post from "@/components/post"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UserProfileViewProps {
  userId: string
  onStartChat?: (userId: string, userName: string, userAvatar?: string) => void
}

interface UserProfile {
  uid: string
  displayName: string
  email: string
  bio?: string
  location?: string
  website?: string
  phone?: string
  dateOfBirth?: string
  occupation?: string
  interests?: string
  avatar?: string
  coverImage?: string
  role: "admin" | "user"
  createdAt: any
  lastSeen?: any
  isOnline?: boolean
  stats?: {
    postsCount: number
    followersCount: number
    followingCount: number
    likesReceived: number
  }
  privacySettings?: {
    showEmail: boolean
    showPhone: boolean
    showLocation: boolean
    showBirthDate: boolean
    allowMessages: boolean
    allowFriendRequests: boolean
    profileVisibility: "public" | "friends" | "private"
  }
}

interface UserActivity {
  id: string
  type: "post" | "like" | "comment" | "follow"
  description: string
  timestamp: any
  relatedUser?: string
  relatedPost?: string
}

export default function UserProfileView({ userId, onStartChat }: UserProfileViewProps) {
  const { userProfile: currentUser } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userPosts, setUserPosts] = useState<any[]>([])
  const [userActivity, setUserActivity] = useState<UserActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [mutualFriends, setMutualFriends] = useState<any[]>([])
  const [showImageViewer, setShowImageViewer] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string>("")

  useEffect(() => {
    loadUserProfile()
    loadUserPosts()
    loadUserActivity()
    checkRelationships()
    loadMutualFriends()
  }, [userId])

  const loadUserProfile = async () => {
    try {
      // For demo purposes, create sample user data
      const sampleUsers: { [key: string]: UserProfile } = {
        user1: {
          uid: "user1",
          displayName: "John Doe",
          email: "john@example.com",
          bio: "Software developer passionate about creating amazing user experiences. Love coding, coffee, and cats! 🐱",
          location: "San Francisco, CA",
          website: "https://johndoe.dev",
          phone: "+1 (555) 123-4567",
          occupation: "Senior Frontend Developer",
          interests: "JavaScript, React, TypeScript, UI/UX Design, Photography",
          avatar: "/placeholder.svg?height=150&width=150",
          coverImage: "/placeholder.svg?height=300&width=800",
          role: "user",
          createdAt: { toDate: () => new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
          lastSeen: { toDate: () => new Date(Date.now() - 5 * 60 * 1000) },
          isOnline: true,
          stats: {
            postsCount: 42,
            followersCount: 1250,
            followingCount: 380,
            likesReceived: 3420,
          },
          privacySettings: {
            showEmail: true,
            showPhone: false,
            showLocation: true,
            showBirthDate: false,
            allowMessages: true,
            allowFriendRequests: true,
            profileVisibility: "public",
          },
        },
        user2: {
          uid: "user2",
          displayName: "Jane Smith",
          email: "jane@example.com",
          bio: "Digital marketing specialist and content creator. Always exploring new trends and technologies! ✨",
          location: "New York, NY",
          website: "https://janesmith.com",
          occupation: "Digital Marketing Manager",
          interests: "Marketing, Content Creation, Social Media, Travel, Food",
          avatar: "/placeholder.svg?height=150&width=150",
          coverImage: "/placeholder.svg?height=300&width=800",
          role: "user",
          createdAt: { toDate: () => new Date(Date.now() - 200 * 24 * 60 * 60 * 1000) },
          lastSeen: { toDate: () => new Date(Date.now() - 30 * 60 * 1000) },
          isOnline: false,
          stats: {
            postsCount: 89,
            followersCount: 2100,
            followingCount: 450,
            likesReceived: 5670,
          },
          privacySettings: {
            showEmail: false,
            showPhone: false,
            showLocation: true,
            showBirthDate: false,
            allowMessages: true,
            allowFriendRequests: true,
            profileVisibility: "public",
          },
        },
        admin: {
          uid: "admin",
          displayName: "Admin User",
          email: "admin@socialapp.com",
          bio: "Platform administrator ensuring the best experience for all users. Here to help! 🛡️",
          location: "Global",
          occupation: "Platform Administrator",
          interests: "Community Management, Technology, User Experience",
          avatar: "/placeholder.svg?height=150&width=150",
          role: "admin",
          createdAt: { toDate: () => new Date(Date.now() - 500 * 24 * 60 * 60 * 1000) },
          isOnline: true,
          stats: {
            postsCount: 156,
            followersCount: 5000,
            followingCount: 200,
            likesReceived: 12000,
          },
          privacySettings: {
            showEmail: true,
            showPhone: false,
            showLocation: true,
            showBirthDate: false,
            allowMessages: true,
            allowFriendRequests: true,
            profileVisibility: "public",
          },
        },
      }

      const userData = sampleUsers[userId] || sampleUsers["user1"]
      setUserProfile(userData)
    } catch (error) {
      console.error("Error loading user profile:", error)
    }
    setLoading(false)
  }

  const loadUserPosts = async () => {
    try {
      // Sample posts for the user
      const samplePosts = [
        {
          id: "post1",
          author: {
            uid: userId,
            displayName: userProfile?.displayName || "User",
            avatar: userProfile?.avatar || "/placeholder.svg",
          },
          content: {
            text: "Just finished working on an amazing new project! Excited to share more details soon. 🚀",
            images: ["/placeholder.svg?height=400&width=600"],
          },
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          likes: 45,
          comments: 12,
          shares: 8,
          isLiked: false,
          isBookmarked: false,
        },
        {
          id: "post2",
          author: {
            uid: userId,
            displayName: userProfile?.displayName || "User",
            avatar: userProfile?.avatar || "/placeholder.svg",
          },
          content: {
            text: "Beautiful sunset today! Sometimes you need to stop and appreciate the simple things in life. 🌅",
            images: ["/placeholder.svg?height=400&width=600"],
          },
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          likes: 89,
          comments: 23,
          shares: 15,
          isLiked: true,
          isBookmarked: false,
        },
      ]
      setUserPosts(samplePosts)
    } catch (error) {
      console.error("Error loading user posts:", error)
    }
  }

  const loadUserActivity = async () => {
    try {
      const mockActivity: UserActivity[] = [
        {
          id: "1",
          type: "post",
          description: "Created a new post about project updates",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        {
          id: "2",
          type: "like",
          description: "Liked a post by Sarah Wilson",
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        },
        {
          id: "3",
          type: "follow",
          description: "Started following Mike Brown",
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
        {
          id: "4",
          type: "comment",
          description: "Commented on a post about web development",
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      ]
      setUserActivity(mockActivity)
    } catch (error) {
      console.error("Error loading user activity:", error)
    }
  }

  const checkRelationships = async () => {
    if (!currentUser) return

    try {
      // Mock relationship data
      setIsFollowing(Math.random() > 0.5)
      setIsBlocked(false)
    } catch (error) {
      console.error("Error checking relationships:", error)
    }
  }

  const loadMutualFriends = async () => {
    if (!currentUser) return

    try {
      // Mock mutual friends data
      const mutualFriendsData = [
        {
          id: "mutual1",
          displayName: "Alex Johnson",
          avatar: "/placeholder.svg?height=40&width=40",
        },
        {
          id: "mutual2",
          displayName: "Sarah Wilson",
          avatar: "/placeholder.svg?height=40&width=40",
        },
        {
          id: "mutual3",
          displayName: "Mike Brown",
          avatar: "/placeholder.svg?height=40&width=40",
        },
      ]
      setMutualFriends(mutualFriendsData)
    } catch (error) {
      console.error("Error loading mutual friends:", error)
    }
  }

  const handleFollow = async () => {
    if (!currentUser || !userProfile) return

    try {
      setIsFollowing(!isFollowing)

      if (!isFollowing) {
        toast({
          title: "Following",
          description: `You are now following ${userProfile.displayName}`,
        })
      } else {
        toast({
          title: "Unfollowed",
          description: `You are no longer following ${userProfile.displayName}`,
        })
      }

      // Update stats
      if (userProfile.stats) {
        userProfile.stats.followersCount += isFollowing ? -1 : 1
      }
    } catch (error) {
      console.error("Error updating follow status:", error)
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
      })
    }
  }

  const handleMessage = () => {
    if (!currentUser || !userProfile) {
      toast({
        title: "Login Required",
        description: "Please login to send messages",
        variant: "destructive",
      })
      return
    }

    if (userProfile.privacySettings?.allowMessages === false) {
      toast({
        title: "Messages Disabled",
        description: `${userProfile.displayName} has disabled messages`,
        variant: "destructive",
      })
      return
    }

    // If onStartChat callback is provided, use it
    if (onStartChat) {
      onStartChat(userId, userProfile.displayName, userProfile.avatar)
      toast({
        title: "Opening Chat",
        description: `Starting conversation with ${userProfile.displayName}`,
      })
    } else {
      // Navigate to chat page with user info
      const chatUrl = `/chat?user=${encodeURIComponent(userId)}&name=${encodeURIComponent(userProfile.displayName)}&avatar=${encodeURIComponent(userProfile.avatar || "")}`
      router.push(chatUrl)

      toast({
        title: "Opening Chat",
        description: `Starting conversation with ${userProfile.displayName}`,
      })
    }
  }

  const handleBlock = async () => {
    if (!currentUser || !userProfile) return

    try {
      setIsBlocked(!isBlocked)

      if (!isBlocked) {
        toast({
          title: "User Blocked",
          description: `You have blocked ${userProfile.displayName}`,
        })
      } else {
        toast({
          title: "User Unblocked",
          description: `You have unblocked ${userProfile.displayName}`,
        })
      }
    } catch (error) {
      console.error("Error updating block status:", error)
      toast({
        title: "Error",
        description: "Failed to update block status",
        variant: "destructive",
      })
    }
  }

  const handleReport = () => {
    toast({
      title: "Report Submitted",
      description: "Thank you for reporting this user. We'll review it shortly.",
    })
  }

  const promoteToAdmin = async () => {
    if (!currentUser || currentUser.role !== "admin") return

    try {
      toast({
        title: "User Promoted",
        description: `${userProfile?.displayName} is now an admin`,
      })

      if (userProfile) {
        userProfile.role = "admin"
        setUserProfile({ ...userProfile })
      }
    } catch (error) {
      console.error("Error promoting user:", error)
      toast({
        title: "Error",
        description: "Failed to promote user",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-64 bg-muted rounded-lg" />
          <div className="h-32 bg-muted rounded-lg" />
        </div>
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h1 className="text-3xl font-bold mb-4">User Not Found</h1>
        <p className="text-muted-foreground">The user you're looking for doesn't exist.</p>
      </div>
    )
  }

  const isOwnProfile = currentUser?.uid === userId
  const canSeeEmail = userProfile.privacySettings?.showEmail || isOwnProfile
  const canSeePhone = userProfile.privacySettings?.showPhone || isOwnProfile
  const canSeeLocation = userProfile.privacySettings?.showLocation || isOwnProfile
  const canSeeBirthDate = userProfile.privacySettings?.showBirthDate || isOwnProfile
  const isAdmin = currentUser?.role === "admin"

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Cover Image & Profile Header */}
      <Card className="overflow-hidden">
        <div className="relative">
          {/* Cover Image */}
          <div
            className="h-48 md:h-64 bg-gradient-to-r from-blue-500 to-purple-600 cursor-pointer"
            onClick={() => {
              if (userProfile.coverImage) {
                setSelectedImage(userProfile.coverImage)
                setShowImageViewer(true)
              }
            }}
          >
            {userProfile.coverImage && (
              <img
                src={userProfile.coverImage || "/placeholder.svg"}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            )}
            {!userProfile.coverImage && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Camera className="h-12 w-12 text-white/50" />
              </div>
            )}
          </div>

          {/* Profile Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
            <div className="flex flex-col md:flex-row items-start md:items-end space-y-4 md:space-y-0 md:space-x-6">
              <Avatar
                className="h-32 w-32 border-4 border-white cursor-pointer"
                onClick={() => {
                  if (userProfile.avatar) {
                    setSelectedImage(userProfile.avatar)
                    setShowImageViewer(true)
                  }
                }}
              >
                <AvatarImage src={userProfile.avatar || "/placeholder.svg"} />
                <AvatarFallback className="text-4xl">{userProfile.displayName.charAt(0)}</AvatarFallback>
              </Avatar>

              <div className="flex-1 text-white">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold">{userProfile.displayName}</h1>
                  <Badge variant={userProfile.role === "admin" ? "destructive" : "secondary"}>
                    {userProfile.role === "admin" && <Crown className="h-3 w-3 mr-1" />}
                    {userProfile.role}
                  </Badge>
                  {userProfile.isOnline && (
                    <Badge variant="default" className="bg-green-500">
                      Online
                    </Badge>
                  )}
                </div>
                {userProfile.occupation && <p className="text-lg text-white/90">{userProfile.occupation}</p>}
                {userProfile.bio && <p className="text-white/80 max-w-2xl">{userProfile.bio}</p>}
              </div>

              {/* Action Buttons */}
              {!isOwnProfile && currentUser && (
                <div className="flex flex-col space-y-2">
                  <Button onClick={handleFollow} variant={isFollowing ? "outline" : "default"} disabled={isBlocked}>
                    {isFollowing ? (
                      <>
                        <UserMinus className="h-4 w-4 mr-2" />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Follow
                      </>
                    )}
                  </Button>

                  {userProfile.privacySettings?.allowMessages !== false && !isBlocked && (
                    <Button variant="outline" onClick={handleMessage}>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleReport}>
                        <Flag className="h-4 w-4 mr-2" />
                        Report User
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleBlock} className={isBlocked ? "text-green-600" : "text-red-600"}>
                        <Block className="h-4 w-4 mr-2" />
                        {isBlocked ? "Unblock User" : "Block User"}
                      </DropdownMenuItem>
                      {isAdmin && userProfile.role !== "admin" && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={promoteToAdmin}>
                            <Crown className="h-4 w-4 mr-2" />
                            Promote to Admin
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Stats & Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Posts</span>
              <span className="font-semibold">{userProfile.stats?.postsCount || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Followers</span>
              <span className="font-semibold">{userProfile.stats?.followersCount || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Following</span>
              <span className="font-semibold">{userProfile.stats?.followingCount || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Likes</span>
              <span className="font-semibold">{userProfile.stats?.likesReceived || 0}</span>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {canSeeEmail && (
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{userProfile.email}</span>
              </div>
            )}
            {canSeePhone && userProfile.phone && (
              <div className="flex items-center space-x-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{userProfile.phone}</span>
              </div>
            )}
            {canSeeLocation && userProfile.location && (
              <div className="flex items-center space-x-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{userProfile.location}</span>
              </div>
            )}
            {userProfile.website && (
              <div className="flex items-center space-x-2 text-sm">
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                <a
                  href={userProfile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Website
                </a>
              </div>
            )}
            <div className="flex items-center space-x-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                Joined {formatDistanceToNow(userProfile.createdAt?.toDate() || new Date(), { addSuffix: true })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Mutual Friends */}
        {mutualFriends.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Mutual Friends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mutualFriends.slice(0, 3).map((friend) => (
                  <div key={friend.id} className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={friend.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="text-xs">{friend.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{friend.displayName}</span>
                  </div>
                ))}
                {mutualFriends.length > 3 && (
                  <p className="text-xs text-muted-foreground">+{mutualFriends.length - 3} more mutual friends</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userActivity.slice(0, 3).map((activity) => (
                <div key={activity.id} className="text-sm">
                  <p className="text-muted-foreground">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="posts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="posts">Posts ({userPosts.length})</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-6">
          {userPosts.length > 0 ? (
            <div className="space-y-6">
              {userPosts.map((post) => (
                <Post key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No posts yet</p>
                <p className="text-muted-foreground">
                  {isOwnProfile ? "Start sharing your thoughts!" : `${userProfile.displayName} hasn't posted yet.`}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="about" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About {userProfile.displayName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {userProfile.bio && (
                <div>
                  <h4 className="font-medium mb-2">Bio</h4>
                  <p className="text-muted-foreground">{userProfile.bio}</p>
                </div>
              )}
              {userProfile.occupation && (
                <div>
                  <h4 className="font-medium mb-2">Occupation</h4>
                  <p className="text-muted-foreground">{userProfile.occupation}</p>
                </div>
              )}
              {userProfile.interests && (
                <div>
                  <h4 className="font-medium mb-2">Interests</h4>
                  <div className="flex flex-wrap gap-2">
                    {userProfile.interests.split(",").map((interest, index) => (
                      <Badge key={index} variant="outline">
                        {interest.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <h4 className="font-medium mb-2">Member Since</h4>
                <p className="text-muted-foreground">
                  {formatDistanceToNow(userProfile.createdAt?.toDate() || new Date(), { addSuffix: true })}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {userPosts
                  .filter((post) => post.content.images && post.content.images.length > 0)
                  .flatMap((post) => post.content.images)
                  .slice(0, 12)
                  .map((image, index) => (
                    <div
                      key={index}
                      className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => {
                        setSelectedImage(image)
                        setShowImageViewer(true)
                      }}
                    >
                      <img
                        src={image || "/placeholder.svg"}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                      {activity.type === "post" && <Eye className="h-4 w-4 text-primary" />}
                      {activity.type === "like" && <Heart className="h-4 w-4 text-red-500" />}
                      {activity.type === "follow" && <UserPlus className="h-4 w-4 text-green-500" />}
                      {activity.type === "comment" && <MessageCircle className="h-4 w-4 text-blue-500" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Image Viewer Dialog */}
      <Dialog open={showImageViewer} onOpenChange={setShowImageViewer}>
        <DialogContent className="max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle>Image Viewer</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <img src={selectedImage || "/placeholder.svg"} alt="Full size" className="w-full h-auto rounded-lg" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
