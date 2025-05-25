"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Share2,
  Check,
  X,
  Trash2,
  MoreHorizontal,
  Filter,
  BookMarkedIcon as MarkAsUnread,
} from "lucide-react"
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  getDocs,
  writeBatch,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { formatDistanceToNow } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Notification {
  id: string
  type: "like" | "comment" | "follow" | "message" | "share" | "mention" | "system"
  title: string
  message: string
  isRead: boolean
  createdAt: any
  userId: string
  fromUser?: {
    id: string
    name: string
    avatar?: string
  }
  relatedPost?: {
    id: string
    title: string
  }
  actionUrl?: string
  priority: "low" | "medium" | "high"
}

export default function NotificationsPage() {
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    if (!userProfile) return

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userProfile.uid),
      orderBy("createdAt", "desc"),
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationList: Notification[] = []
      snapshot.forEach((doc) => {
        notificationList.push({ id: doc.id, ...doc.data() } as Notification)
      })
      setNotifications(notificationList)
      setLoading(false)
    })

    // Create some sample notifications for demo
    createSampleNotifications()

    return unsubscribe
  }, [userProfile])

  const createSampleNotifications = async () => {
    if (!userProfile) return

    try {
      // Check if notifications already exist
      const existingQuery = query(collection(db, "notifications"), where("userId", "==", userProfile.uid))
      const existingSnapshot = await getDocs(existingQuery)

      if (existingSnapshot.size > 0) return

      const sampleNotifications = [
        {
          type: "like",
          title: "New Like",
          message: "John Doe liked your post",
          isRead: false,
          userId: userProfile.uid,
          fromUser: {
            id: "user1",
            name: "John Doe",
            avatar: "/placeholder.svg?height=40&width=40",
          },
          relatedPost: {
            id: "post1",
            title: "Your amazing photo",
          },
          actionUrl: "/post/post1",
          priority: "medium",
          createdAt: serverTimestamp(),
        },
        {
          type: "comment",
          title: "New Comment",
          message: "Jane Smith commented on your post",
          isRead: false,
          userId: userProfile.uid,
          fromUser: {
            id: "user2",
            name: "Jane Smith",
            avatar: "/placeholder.svg?height=40&width=40",
          },
          relatedPost: {
            id: "post2",
            title: "Your travel story",
          },
          actionUrl: "/post/post2",
          priority: "high",
          createdAt: serverTimestamp(),
        },
        {
          type: "follow",
          title: "New Follower",
          message: "Alex Johnson started following you",
          isRead: true,
          userId: userProfile.uid,
          fromUser: {
            id: "user3",
            name: "Alex Johnson",
            avatar: "/placeholder.svg?height=40&width=40",
          },
          actionUrl: "/user/user3",
          priority: "medium",
          createdAt: serverTimestamp(),
        },
        {
          type: "system",
          title: "Welcome to SocialApp!",
          message: "Complete your profile to get started",
          isRead: false,
          userId: userProfile.uid,
          actionUrl: "/profile",
          priority: "low",
          createdAt: serverTimestamp(),
        },
      ]

      for (const notification of sampleNotifications) {
        await addDoc(collection(db, "notifications"), notification)
      }
    } catch (error) {
      console.error("Error creating sample notifications:", error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="h-4 w-4 text-red-500" />
      case "comment":
        return <MessageCircle className="h-4 w-4 text-blue-500" />
      case "follow":
        return <UserPlus className="h-4 w-4 text-green-500" />
      case "share":
        return <Share2 className="h-4 w-4 text-purple-500" />
      case "message":
        return <MessageCircle className="h-4 w-4 text-blue-500" />
      case "system":
        return <Bell className="h-4 w-4 text-orange-500" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-red-500"
      case "medium":
        return "border-l-yellow-500"
      case "low":
        return "border-l-green-500"
      default:
        return "border-l-gray-300"
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        isRead: true,
      })
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAsUnread = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        isRead: false,
      })
    } catch (error) {
      console.error("Error marking notification as unread:", error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      await deleteDoc(doc(db, "notifications", notificationId))
      toast({
        title: "Notification deleted",
        description: "The notification has been removed.",
      })
    } catch (error) {
      console.error("Error deleting notification:", error)
      toast({
        title: "Error",
        description: "Failed to delete notification.",
        variant: "destructive",
      })
    }
  }

  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db)
      const unreadNotifications = notifications.filter((n) => !n.isRead)

      unreadNotifications.forEach((notification) => {
        const notificationRef = doc(db, "notifications", notification.id)
        batch.update(notificationRef, { isRead: true })
      })

      await batch.commit()

      toast({
        title: "All notifications marked as read",
        description: `${unreadNotifications.length} notifications updated.`,
      })
    } catch (error) {
      console.error("Error marking all as read:", error)
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read.",
        variant: "destructive",
      })
    }
  }

  const deleteAllRead = async () => {
    try {
      const batch = writeBatch(db)
      const readNotifications = notifications.filter((n) => n.isRead)

      readNotifications.forEach((notification) => {
        const notificationRef = doc(db, "notifications", notification.id)
        batch.delete(notificationRef)
      })

      await batch.commit()

      toast({
        title: "Read notifications deleted",
        description: `${readNotifications.length} notifications removed.`,
      })
    } catch (error) {
      console.error("Error deleting read notifications:", error)
      toast({
        title: "Error",
        description: "Failed to delete read notifications.",
        variant: "destructive",
      })
    }
  }

  const deleteSelected = async () => {
    try {
      const batch = writeBatch(db)

      selectedNotifications.forEach((notificationId) => {
        const notificationRef = doc(db, "notifications", notificationId)
        batch.delete(notificationRef)
      })

      await batch.commit()
      setSelectedNotifications([])
      setShowDeleteDialog(false)

      toast({
        title: "Selected notifications deleted",
        description: `${selectedNotifications.length} notifications removed.`,
      })
    } catch (error) {
      console.error("Error deleting selected notifications:", error)
      toast({
        title: "Error",
        description: "Failed to delete selected notifications.",
        variant: "destructive",
      })
    }
  }

  const toggleSelection = (notificationId: string) => {
    setSelectedNotifications((prev) =>
      prev.includes(notificationId) ? prev.filter((id) => id !== notificationId) : [...prev, notificationId],
    )
  }

  const selectAll = () => {
    const filteredNotifications = getFilteredNotifications()
    setSelectedNotifications(filteredNotifications.map((n) => n.id))
  }

  const clearSelection = () => {
    setSelectedNotifications([])
  }

  const getFilteredNotifications = () => {
    switch (activeTab) {
      case "unread":
        return notifications.filter((n) => !n.isRead)
      case "read":
        return notifications.filter((n) => n.isRead)
      case "likes":
        return notifications.filter((n) => n.type === "like")
      case "comments":
        return notifications.filter((n) => n.type === "comment")
      case "follows":
        return notifications.filter((n) => n.type === "follow")
      case "system":
        return notifications.filter((n) => n.type === "system")
      default:
        return notifications
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length
  const filteredNotifications = getFilteredNotifications()

  if (!userProfile) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h1 className="text-3xl font-bold mb-4">Please Login</h1>
        <p className="text-muted-foreground">You need to be logged in to view notifications.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up!"}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {selectedNotifications.length > 0 && (
            <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedNotifications.length})
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={markAllAsRead}>
                <Check className="h-4 w-4 mr-2" />
                Mark all as read
              </DropdownMenuItem>
              <DropdownMenuItem onClick={deleteAllRead}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete all read
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={selectAll}>
                <Filter className="h-4 w-4 mr-2" />
                Select all visible
              </DropdownMenuItem>
              <DropdownMenuItem onClick={clearSelection}>
                <X className="h-4 w-4 mr-2" />
                Clear selection
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread" className="relative">
            Unread
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="likes">Likes</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
          <TabsTrigger value="follows">Follows</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-muted rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="space-y-2">
              {filteredNotifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`transition-all hover:shadow-md cursor-pointer border-l-4 ${getPriorityColor(notification.priority)} ${
                    !notification.isRead ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
                  } ${selectedNotifications.includes(notification.id) ? "ring-2 ring-primary" : ""}`}
                  onClick={() => {
                    if (!notification.isRead) {
                      markAsRead(notification.id)
                    }
                    if (notification.actionUrl) {
                      window.location.href = notification.actionUrl
                    }
                  }}
                >
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedNotifications.includes(notification.id)}
                          onChange={(e) => {
                            e.stopPropagation()
                            toggleSelection(notification.id)
                          }}
                          className="rounded"
                        />
                        <div className="flex-shrink-0">
                          {notification.fromUser ? (
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={notification.fromUser.avatar || "/placeholder.svg"} />
                              <AvatarFallback>{notification.fromUser.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center">
                              {getNotificationIcon(notification.type)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-sm">{notification.title}</p>
                            {!notification.isRead && <div className="h-2 w-2 bg-blue-500 rounded-full" />}
                            <Badge variant="outline" className="text-xs">
                              {notification.type}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(notification.createdAt?.toDate() || new Date(), {
                                addSuffix: true,
                              })}
                            </span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {notification.isRead ? (
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      markAsUnread(notification.id)
                                    }}
                                  >
                                    <MarkAsUnread className="h-4 w-4 mr-2" />
                                    Mark as unread
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      markAsRead(notification.id)
                                    }}
                                  >
                                    <Check className="h-4 w-4 mr-2" />
                                    Mark as read
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteNotification(notification.id)
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                        {notification.relatedPost && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Related to: {notification.relatedPost.title}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No notifications</p>
                <p className="text-muted-foreground">
                  {activeTab === "all"
                    ? "You're all caught up! No new notifications."
                    : `No ${activeTab} notifications found.`}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notifications</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedNotifications.length} selected notification(s)? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteSelected} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
