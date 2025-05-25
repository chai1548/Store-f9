"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { User, Edit, Save, Camera, Shield, Bell, MapPin, Calendar, LinkIcon, Mail, Phone } from "lucide-react"
import { doc, updateDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
import { formatDistanceToNow } from "date-fns"
import Post from "@/components/post"

export default function ProfilePage() {
  const { userProfile, user } = useAuth()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [userPosts, setUserPosts] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("profile")

  // Profile form data
  const [profileData, setProfileData] = useState({
    displayName: "",
    bio: "",
    location: "",
    website: "",
    phone: "",
    dateOfBirth: "",
    occupation: "",
    interests: "",
    avatar: "",
  })

  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: "public", // public, friends, private
    showEmail: false,
    showPhone: false,
    showLocation: false,
    showBirthDate: false,
    allowMessages: true,
    allowFriendRequests: true,
    showOnlineStatus: true,
  })

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    commentNotifications: true,
    likeNotifications: true,
    messageNotifications: true,
    followNotifications: true,
    marketingEmails: false,
  })

  useEffect(() => {
    if (userProfile) {
      setProfileData({
        displayName: userProfile.displayName || "",
        bio: userProfile.bio || "",
        location: userProfile.location || "",
        website: userProfile.website || "",
        phone: userProfile.phone || "",
        dateOfBirth: userProfile.dateOfBirth || "",
        occupation: userProfile.occupation || "",
        interests: userProfile.interests || "",
        avatar: userProfile.avatar || "",
      })

      // Load privacy settings
      if (userProfile.privacySettings) {
        setPrivacySettings({ ...privacySettings, ...userProfile.privacySettings })
      }

      // Load notification settings
      if (userProfile.notificationSettings) {
        setNotificationSettings({ ...notificationSettings, ...userProfile.notificationSettings })
      }

      loadUserPosts()
    }
  }, [userProfile])

  const loadUserPosts = async () => {
    if (!userProfile) return

    try {
      const q = query(collection(db, "posts"), where("author.uid", "==", userProfile.uid), orderBy("createdAt", "desc"))
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

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !userProfile) return

    setUploadingAvatar(true)

    try {
      const avatarRef = ref(storage, `avatars/${userProfile.uid}_${Date.now()}`)
      await uploadBytes(avatarRef, file)
      const downloadURL = await getDownloadURL(avatarRef)

      await updateDoc(doc(db, "users", userProfile.uid), {
        avatar: downloadURL,
      })

      setProfileData({ ...profileData, avatar: downloadURL })

      toast({
        title: "Avatar updated!",
        description: "Your profile picture has been updated successfully.",
      })
    } catch (error) {
      console.error("Error uploading avatar:", error)
      toast({
        title: "Upload failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      })
    }

    setUploadingAvatar(false)
  }

  const handleSaveProfile = async () => {
    if (!userProfile) return

    setLoading(true)

    try {
      await updateDoc(doc(db, "users", userProfile.uid), {
        ...profileData,
        updatedAt: new Date(),
      })

      toast({
        title: "Profile updated!",
        description: "Your profile has been updated successfully.",
      })

      setIsEditing(false)
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    }

    setLoading(false)
  }

  const handleSavePrivacySettings = async () => {
    if (!userProfile) return

    setLoading(true)

    try {
      await updateDoc(doc(db, "users", userProfile.uid), {
        privacySettings,
        updatedAt: new Date(),
      })

      toast({
        title: "Privacy settings updated!",
        description: "Your privacy settings have been saved.",
      })
    } catch (error) {
      console.error("Error updating privacy settings:", error)
      toast({
        title: "Update failed",
        description: "Failed to update privacy settings.",
        variant: "destructive",
      })
    }

    setLoading(false)
  }

  const handleSaveNotificationSettings = async () => {
    if (!userProfile) return

    setLoading(true)

    try {
      await updateDoc(doc(db, "users", userProfile.uid), {
        notificationSettings,
        updatedAt: new Date(),
      })

      toast({
        title: "Notification settings updated!",
        description: "Your notification preferences have been saved.",
      })
    } catch (error) {
      console.error("Error updating notification settings:", error)
      toast({
        title: "Update failed",
        description: "Failed to update notification settings.",
        variant: "destructive",
      })
    }

    setLoading(false)
  }

  if (!userProfile) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h1 className="text-3xl font-bold mb-4">Please Login</h1>
        <p className="text-muted-foreground">You need to be logged in to view your profile.</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">My Profile</h1>
        <p className="text-muted-foreground">Manage your profile information and settings</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="posts">My Posts</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal information and bio</CardDescription>
                </div>
                <Button
                  variant={isEditing ? "default" : "outline"}
                  onClick={() => (isEditing ? handleSaveProfile() : setIsEditing(true))}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : isEditing ? (
                    <Save className="h-4 w-4 mr-2" />
                  ) : (
                    <Edit className="h-4 w-4 mr-2" />
                  )}
                  {isEditing ? "Save Changes" : "Edit Profile"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={profileData.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="text-2xl">{profileData.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          disabled={uploadingAvatar}
                        />
                        {uploadingAvatar ? (
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <Camera className="h-6 w-6 text-white" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{profileData.displayName}</h3>
                    <p className="text-muted-foreground">{userProfile.email}</p>
                    <Badge variant={userProfile.role === "admin" ? "destructive" : "secondary"} className="mt-2">
                      {userProfile.role}
                    </Badge>
                  </div>
                </div>

                {/* Profile Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={profileData.displayName}
                      onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="occupation">Occupation</Label>
                    <Input
                      id="occupation"
                      value={profileData.occupation}
                      onChange={(e) => setProfileData({ ...profileData, occupation: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Your job title"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="location"
                        value={profileData.location}
                        onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                        disabled={!isEditing}
                        placeholder="City, Country"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="website"
                        value={profileData.website}
                        onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                        disabled={!isEditing}
                        placeholder="https://yourwebsite.com"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        disabled={!isEditing}
                        placeholder="+1 (555) 123-4567"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={profileData.dateOfBirth}
                        onChange={(e) => setProfileData({ ...profileData, dateOfBirth: e.target.value })}
                        disabled={!isEditing}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="interests">Interests</Label>
                    <Input
                      id="interests"
                      value={profileData.interests}
                      onChange={(e) => setProfileData({ ...profileData, interests: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Photography, Travel, Technology..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Posts</span>
                  <span className="font-semibold">{userPosts.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Followers</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Following</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Likes Received</span>
                  <span className="font-semibold">{userPosts.reduce((acc, post) => acc + (post.likes || 0), 0)}</span>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Profile Completion</span>
                    <span className="text-sm font-medium">75%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Member since{" "}
                    {formatDistanceToNow(userProfile.createdAt?.toDate() || new Date(), { addSuffix: true })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="posts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Posts ({userPosts.length})</CardTitle>
              <CardDescription>All your posts and content</CardDescription>
            </CardHeader>
            <CardContent>
              {userPosts.length > 0 ? (
                <div className="space-y-6">
                  {userPosts.map((post) => (
                    <Post key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">No posts yet</p>
                  <p className="text-muted-foreground">Start sharing your thoughts and content!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>Control who can see your information and interact with you</CardDescription>
              </div>
              <Button onClick={handleSavePrivacySettings} disabled={loading}>
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Settings
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Profile Visibility
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Email Address</Label>
                      <p className="text-sm text-muted-foreground">Allow others to see your email</p>
                    </div>
                    <Switch
                      checked={privacySettings.showEmail}
                      onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, showEmail: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Phone Number</Label>
                      <p className="text-sm text-muted-foreground">Allow others to see your phone number</p>
                    </div>
                    <Switch
                      checked={privacySettings.showPhone}
                      onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, showPhone: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Location</Label>
                      <p className="text-sm text-muted-foreground">Allow others to see your location</p>
                    </div>
                    <Switch
                      checked={privacySettings.showLocation}
                      onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, showLocation: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Birth Date</Label>
                      <p className="text-sm text-muted-foreground">Allow others to see your birth date</p>
                    </div>
                    <Switch
                      checked={privacySettings.showBirthDate}
                      onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, showBirthDate: checked })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Interaction Settings
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Messages</Label>
                      <p className="text-sm text-muted-foreground">Let others send you private messages</p>
                    </div>
                    <Switch
                      checked={privacySettings.allowMessages}
                      onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, allowMessages: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Friend Requests</Label>
                      <p className="text-sm text-muted-foreground">Let others send you friend requests</p>
                    </div>
                    <Switch
                      checked={privacySettings.allowFriendRequests}
                      onCheckedChange={(checked) =>
                        setPrivacySettings({ ...privacySettings, allowFriendRequests: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Online Status</Label>
                      <p className="text-sm text-muted-foreground">Let others see when you're online</p>
                    </div>
                    <Switch
                      checked={privacySettings.showOnlineStatus}
                      onCheckedChange={(checked) =>
                        setPrivacySettings({ ...privacySettings, showOnlineStatus: checked })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Choose what notifications you want to receive</CardDescription>
              </div>
              <Button onClick={handleSaveNotificationSettings} disabled={loading}>
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Settings
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium flex items-center">
                  <Bell className="h-4 w-4 mr-2" />
                  General Notifications
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, emailNotifications: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive push notifications in browser</p>
                    </div>
                    <Switch
                      checked={notificationSettings.pushNotifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, pushNotifications: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Activity Notifications
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Comments</Label>
                      <p className="text-sm text-muted-foreground">When someone comments on your posts</p>
                    </div>
                    <Switch
                      checked={notificationSettings.commentNotifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, commentNotifications: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Likes</Label>
                      <p className="text-sm text-muted-foreground">When someone likes your posts</p>
                    </div>
                    <Switch
                      checked={notificationSettings.likeNotifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, likeNotifications: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Messages</Label>
                      <p className="text-sm text-muted-foreground">When you receive new messages</p>
                    </div>
                    <Switch
                      checked={notificationSettings.messageNotifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, messageNotifications: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Follows</Label>
                      <p className="text-sm text-muted-foreground">When someone follows you</p>
                    </div>
                    <Switch
                      checked={notificationSettings.followNotifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, followNotifications: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  Marketing
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Marketing Emails</Label>
                      <p className="text-sm text-muted-foreground">Receive updates about new features and promotions</p>
                    </div>
                    <Switch
                      checked={notificationSettings.marketingEmails}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, marketingEmails: checked })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
