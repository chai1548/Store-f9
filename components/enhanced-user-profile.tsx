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
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  addDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { formatDistanceToNow } from "date-fns"
import Post from "@/components/post"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NotificationService } from "@/lib/notification-service"

interface UserProfileViewProps {
  userId: string
  onStartChat?: (userId: string) => void
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

export default function EnhancedUserProfile({ userId, onStartChat }: UserProfileViewProps) {
  const { userProfile: currentUser } = useAuth()
  const { toast } = useToast()
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
      const userDoc = await getDoc(doc(db, "users", userId))
      if (userDoc.exists()) {
        const userData = userDoc.data()

        // Calculate user stats
        const stats = await calculateUserStats(userId)

        setUserProfile({
          uid: userDoc.id,
          ...userData,
          stats,
        } as UserProfile)
      }
    } catch (error) {
      console.error("Error loading user profile:", error)
    }
    setLoading(false)
  }

  const calculateUserStats = async (userId: string) => {
    try {
      // Posts count
      const postsQuery = query(collection(db, "posts"), where("author.uid", "==", userId))
      const postsSnapshot = await getDocs(postsQuery)
      const postsCount = postsSnapshot.size

      // Followers count
      const followersQuery = query(collection(db, "follows"), where("followingId", "==", userId))
      const followersSnapshot = await getDocs(followersQuery)
      const followersCount = followersSnapshot.size

      // Following count
      const followingQuery = query(collection(db, "follows"), where("followerId", "==", userId))
      const followingSnapshot = await getDocs(followingQuery)
      const followingCount = followingSnapshot.size

      // Likes received
      let likesReceived = 0
      postsSnapshot.forEach((doc) => {
        const postData = doc.data()
        likesReceived += postData.likes || 0
      })

      return {
        postsCount,
        followersCount,
        followingCount,
        likesReceived,
      }
    } catch (error) {
      console.error("Error calculating user stats:", error)
      return {
        postsCount: 0,
        followersCount: 0,
        followingCount: 0,
        likesReceived: 0,
      }
    }
  }

  const loadUserPosts = async () => {
    try {
      const q = query(collection(db, "posts"), where("author.uid", "==", userId), orderBy("createdAt", "desc"))
      const snapshot = await getDocs(q)
      const posts: any[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        posts.push({
          id: doc.id,
          ...data,
          timestamp: data.createdAt?.toDate() || new Date(),
        })
      })
      setUserPosts(posts)
    } catch (error) {
      console.error("Error loading user posts:", error)
    }
  }

  const loadUserActivity = async () => {
    try {
      // Mock activity data - in real app, this would come from an activity log
      const mockActivity: UserActivity[] = [
        {
          id: "1",
          type: "post",
          description: "Created a new post",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        },
        {
          id: "2",
          type: "like",
          description: "Liked a post by John Doe",
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        },
        {
          id: "3",
          type: "follow",
          description: "Started following Jane Smith",
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
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
      // Check if following
      const followQuery = query(
        collection(db, "follows"),
        where("followerId", "==", currentUser.uid),
        where("followingId", "==", userId),
      )
      const followSnapshot = await getDocs(followQuery)
      setIsFollowing(!followSnapshot.empty)

      // Check if blocked
      const blockQuery = query(
        collection(db, "blocks"),
        where("blockerId", "==", currentUser.uid),
        where("blockedId", "==", userId),
      )
      const blockSnapshot = await getDocs(blockQuery)
      setIsBlocked(!blockSnapshot.empty)
    } catch (error) {
      console.error("Error checking relationships:", error)
    }
  }

  const loadMutualFriends = async () => {
    if (!currentUser) return

    try {
      // Get current user's following list
      const currentUserFollowingQuery = query(collection(db, "follows"), where("followerId", "==", currentUser.uid))
      const currentUserFollowing = await getDocs(currentUserFollowingQuery)
      const currentUserFollowingIds = currentUserFollowing.docs.map((doc) => doc.data().followingId)

      // Get target user's following list
      const targetUserFollowingQuery = query(collection(db, "follows"), where("followerId", "==", userId))
      const targetUserFollowing = await getDocs(targetUserFollowingQuery)
      const targetUserFollowingIds = targetUserFollowing.docs.map((doc) => doc.data().followingId)

      // Find mutual follows
      const mutualIds = currentUserFollowingIds.filter((id) => targetUserFollowingIds.includes(id))

      // Get mutual friends' details
      const mutualFriendsData = []
      for (const id of mutualIds.slice(0, 5)) {
        // Limit to 5
        const userDoc = await getDoc(doc(db, "users", id))
        if (userDoc.exists()) {
          mutualFriendsData.push({ id: userDoc.id, ...userDoc.data() })
        }
      }

      setMutualFriends(mutualFriendsData)
    } catch (error) {
      console.error("Error loading mutual friends:", error)
    }
  }

  const handleFollow = async () => {
    if (!currentUser || !userProfile) return

    try {
      if (isFollowing) {
        // Unfollow
        const followQuery = query(
          collection(db, "follows"),
          where("followerId", "==", currentUser.uid),
          where("followingId", "==", userId),
        )
        const followSnapshot = await getDocs(followQuery)
        followSnapshot.forEach(async (doc) => {
          await deleteDoc(doc.ref)
        })
        setIsFollowing(false)
        toast({
          title: "Unfollowed",
          description: `You are no longer following ${userProfile.displayName}`,
        })
      } else {
        // Follow
        await addDoc(collection(db, "follows"), {
          followerId: currentUser.uid,
          followerName: currentUser.displayName,
          followingId: userId,
          followingName: userProfile.displayName,
          createdAt: serverTimestamp(),
        })

        // Create notification
        await NotificationService.createFollowNotification(
          userId,
          currentUser.displayName,
          currentUser.uid,
          currentUser.avatar || "",
        )

        setIsFollowing(true)
        toast({
          title: "Following",
          description: `You are now following ${userProfile.displayName}`,
        })
      }

      // Refresh stats
      loadUserProfile()
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
    if (onStartChat) {
      onStartChat(userId)
    } else {
      toast({
        title: "Message",
        description: "Opening chat with " + userProfile?.displayName,
      })
    }
  }

  const handleBlock = async () => {
    if (!currentUser || !userProfile) return

    try {
      if (isBlocked) {
        // Unblock
        const blockQuery = query(
          collection(db, "blocks"),
          where("blockerId", "==", currentUser.uid),
          where("blockedId", "==", userId),
        )
        const blockSnapshot = await getDocs(blockQuery)
        blockSnapshot.forEach(async (doc) => {
          await deleteDoc(doc.ref)
        })
        setIsBlocked(false)
        toast({
          title: "Unblocked",
          description: `You have unblocked ${userProfile.displayName}`,
        })
      } else {
        // Block
        await addDoc(collection(db, "blocks"), {
          blockerId: currentUser.uid,
          blockedId: userId,
          createdAt: serverTimestamp(),
        })
        setIsBlocked(true)
        toast({
          title: "Blocked",
          description: `You have blocked ${userProfile.displayName}`,
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
      title: "Report submitted",
      description: "Thank you for reporting this user. We'll review it shortly.",
    })
  }

  const promoteToAdmin = async () => {
    if (!currentUser || currentUser.role !== "admin") return

    try {
      await updateDoc(doc(db, "users", userId), {
        role: "admin",
      })

      // Create notification
      await NotificationService.createSystemNotification(
        userId,
        "Congratulations! 🎉",
        "You have been promoted to admin. You now have access to admin features.",
        "/admin",
        "high",
      )

      toast({
        title: "User promoted",
        description: `${userProfile?.displayName} is now an admin`,
      })

      loadUserProfile()
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
