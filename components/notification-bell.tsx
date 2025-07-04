"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import { Bell, Heart, MessageCircle, UserPlus, Settings } from "lucide-react"
import Link from "next/link"

interface Notification {
  id: string
  type: "like" | "comment" | "follow" | "message" | "share" | "mention" | "system"
  title: string
  message: string
  isRead: boolean
  createdAt: Date
  fromUser?: {
    id: string
    name: string
    avatar?: string
  }
  actionUrl?: string
}

export default function NotificationBell() {
  const { userProfile } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!userProfile) return

    // Create sample notifications without Firebase
    const sampleNotifications: Notification[] = [
      {
        id: "1",
        type: "like",
        title: "New Like",
        message: "John Doe liked your post",
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
        fromUser: {
          id: "user1",
          name: "John Doe",
          avatar: "/placeholder.svg?height=40&width=40",
        },
        actionUrl: "/post/1",
      },
      {
        id: "2",
        type: "comment",
        title: "New Comment",
        message: "Jane Smith commented on your post",
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
        fromUser: {
          id: "user2",
          name: "Jane Smith",
          avatar: "/placeholder.svg?height=40&width=40",
        },
        actionUrl: "/post/2",
      },
      {
        id: "3",
        type: "follow",
        title: "New Follower",
        message: "Alex Johnson started following you",
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        fromUser: {
          id: "user3",
          name: "Alex Johnson",
          avatar: "/placeholder.svg?height=40&width=40",
        },
        actionUrl: "/user/user3",
      },
      {
        id: "4",
        type: "message",
        title: "New Message",
        message: "Sarah Wilson sent you a message",
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        fromUser: {
          id: "user4",
          name: "Sarah Wilson",
          avatar: "/placeholder.svg?height=40&width=40",
        },
        actionUrl: "/chat",
      },
    ]

    setNotifications(sampleNotifications)
    setUnreadCount(sampleNotifications.filter((n) => !n.isRead).length)
  }, [userProfile])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="h-3 w-3 text-red-500" />
      case "comment":
        return <MessageCircle className="h-3 w-3 text-blue-500" />
      case "follow":
        return <UserPlus className="h-3 w-3 text-green-500" />
      case "message":
        return <MessageCircle className="h-3 w-3 text-purple-500" />
      default:
        return <Bell className="h-3 w-3" />
    }
  }

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id)
    }
    setIsOpen(false)
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`

    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  if (!userProfile) return null

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <Link href="/notifications">
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <ScrollArea className="max-h-96">
          {notifications.length > 0 ? (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`p-3 cursor-pointer ${!notification.isRead ? "bg-blue-50 dark:bg-blue-950/20" : ""}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3 w-full">
                    <div className="flex-shrink-0">
                      {notification.fromUser ? (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={notification.fromUser.avatar || "/placeholder.svg"} />
                          <AvatarFallback className="text-xs">{notification.fromUser.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
                          {getNotificationIcon(notification.type)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">{notification.title}</p>
                        {!notification.isRead && (
                          <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 ml-2" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatTimeAgo(notification.createdAt)}</p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Link href="/notifications">
                <Button variant="ghost" className="w-full text-sm">
                  View All Notifications
                </Button>
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
