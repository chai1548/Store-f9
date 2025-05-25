"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Shield,
  MoreHorizontal,
} from "lucide-react"
import { doc, getDoc, collection, query, where, getDocs, orderBy, addDoc, deleteDoc } from "firebase/firestore"
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

interface UserProfileViewProps {
  userId: string
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
  role: "admin" | "user"
  createdAt: any
  privacySettings?: {
    showEmail: boolean
    showPhone: boolean
    showLocation: boolean
    showBirthDate: boolean
    allowMessages: boolean
    allowFriendRequests: boolean
  }
}

export default function UserProfileView({ userId }: UserProfileViewProps) {
  const { userProfile: currentUser } = useAuth()
  const { toast } = useToast()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userPosts, setUserPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)

  useEffect(() => {
    loadUserProfile()
    loadUserPosts()
    checkFollowStatus()
  }, [userId])

  const loadUserProfile = async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId))
      if (userDoc.exists()) {
        setUserProfile({ uid: userDoc.id, ...userDoc.data() } as UserProfile)
      }
    } catch (error) {
      console.error("Error loading user profile:", error)
    }
    setLoading(false)
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

  const checkFollowStatus = async () => {
    if (!currentUser) return

    try {
      // Check if current user is following this user
      const followQuery = query(
        collection(db, "follows"),
        where("followerId", "==", currentUser.uid),
        where("followingId", "==", userId),
      )
      const followSnapshot = await getDocs(followQuery)
      setIsFollowing(!followSnapshot.empty)

      // Get followers count
      const followersQuery = query(collection(db, "follows"), where("followingId", "==", userId))
      const followersSnapshot = await getDocs(followersQuery)
      setFollowersCount(followersSnapshot.size)

      // Get following count
      const followingQuery = query(collection(db, "follows"), where("followerId", "==", userId))
      const followingSnapshot = await getDocs(followingQuery)
      setFollowingCount(followingSnapshot.size)
    } catch (error) {
      console.error("Error checking follow status:", error)
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
        setFollowersCount(followersCount - 1)
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
          createdAt: new Date(),
        })
        setIsFollowing(true)
        setFollowersCount(followersCount + 1)
        toast({
          title: "Following",
          description: `You are now following ${userProfile.displayName}`,
        })
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
    // This would open the chat system with this user
    toast({
      title: "Message",
      description: "Opening chat with " + userProfile?.displayName,
    })
  }

  const handleReport = () => {
    toast({
      title: "Report submitted",
      description: "Thank you for reporting this user. We'll review it shortly.",
    })
  }

  const handleBlock = () => {
    toast({
      title: "User blocked",
      description: "You have blocked this user.",
    })
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-48 bg-muted rounded-lg" />
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <Avatar className="h-32 w-32">
              <AvatarImage src={userProfile.avatar || "/placeholder.svg"} />
              <AvatarFallback className="text-4xl">{userProfile.displayName.charAt(0)}</AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold">{userProfile.displayName}</h1>
                  <Badge variant={userProfile.role === "admin" ? "destructive" : "secondary"}>{userProfile.role}</Badge>
                </div>
                {userProfile.occupation && <p className="text-lg text-muted-foreground">{userProfile.occupation}</p>}
                {userProfile.bio && <p className="text-muted-foreground">{userProfile.bio}</p>}
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {canSeeLocation && userProfile.location && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{userProfile.location}</span>
                  </div>
                )}
                {userProfile.website && (
                  <div className="flex items-center space-x-1">
                    <LinkIcon className="h-4 w-4" />
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
                {canSeeEmail && (
                  <div className="flex items-center space-x-1">
                    <Mail className="h-4 w-4" />
                    <span>{userProfile.email}</span>
                  </div>
                )}
                {canSeePhone && userProfile.phone && (
                  <div className="flex items-center space-x-1">
                    <Phone className="h-4 w-4" />
                    <span>{userProfile.phone}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Joined {formatDistanceToNow(userProfile.createdAt?.toDate() || new Date(), { addSuffix: true })}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-6 text-sm">
                <div>
                  <span className="font-semibold">{userPosts.length}</span>
                  <span className="text-muted-foreground ml-1">Posts</span>
                </div>
                <div>
                  <span className="font-semibold">{followersCount}</span>
                  <span className="text-muted-foreground ml-1">Followers</span>
                </div>
                <div>
                  <span className="font-semibold">{followingCount}</span>
                  <span className="text-muted-foreground ml-1">Following</span>
                </div>
              </div>

              {userProfile.interests && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Interests:</p>
                  <div className="flex flex-wrap gap-2">
                    {userProfile.interests.split(",").map((interest, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {interest.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {!isOwnProfile && currentUser && (
              <div className="flex flex-col space-y-2">
                <Button onClick={handleFollow} variant={isFollowing ? "outline" : "default"}>
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
                {userProfile.privacySettings?.allowMessages !== false && (
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
                      <Shield className="h-4 w-4 mr-2" />
                      Report User
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleBlock} className="text-red-600">
                      <UserMinus className="h-4 w-4 mr-2" />
                      Block User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Posts */}
      <Tabs defaultValue="posts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="posts">Posts ({userPosts.length})</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
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
      </Tabs>
    </div>
  )
}
